import { APIError, Forbidden, NotFound, type PayloadRequest } from 'payload';
import { sql } from '@payloadcms/db-postgres';
import { isActiveAdmin } from '../auth/policy';
import { currentActor, editorialWrite, transaction } from './internal';
import { editorialLock } from '../media/access';
import { atomic } from '../server/request';
import { snapshotDigest } from './review-policy';
import { canEditDraft } from './policy';
import { pageNote } from './page-policy';
import { editorialModel, validateDraft, type EditorialKind, type EditorialDoc, type EditorialRevision } from './reviewed-model';
import { orgOptions, orgRevision, orgAudit, verifyPeriod, verifyDraftFiles } from './reviewed-hooks';
import { clearWithdrawnCampaign } from '../recruitment/activation';
import { clearWithdrawnActivePeriod } from '../organization/active-period';

export async function organizationReferences(req: PayloadRequest, id: number, publicOnly = false) {
  const schema = sql.identifier(req.payload.db.schemaName || 'payload');
  const result = await (await transaction(req)).execute<{ id: number; slug: string }>(sql`SELECT DISTINCT d.id,d.slug::text FROM ${schema}.divisions d
    JOIN ${schema}.division_revisions r ON r.entity_id=d.id WHERE r.period_id=${id}
    ${publicOnly ? sql`AND d.public_revision_id=r.id AND r.state='published' AND d.deleted_at IS NULL` : sql``}
    UNION SELECT DISTINCT m.id,m.slug::text FROM ${schema}.members m JOIN ${schema}.member_revisions r ON r.entity_id=m.id
      WHERE r.period_id=${id} ${publicOnly ? sql`AND m.public_revision_id=r.id AND r.state='published' AND m.deleted_at IS NULL` : sql``}
    UNION SELECT DISTINCT c.id,c.slug::text FROM ${schema}.recruitment_periods c JOIN ${schema}.recruitment_revisions r ON r.entity_id=c.id WHERE r.period_id=${id} ${publicOnly ? sql`AND c.public_revision_id=r.id AND r.state='published' AND c.deleted_at IS NULL` : sql``}`);
  return result.rows;
}
async function recruitmentDivisionReferences(req:PayloadRequest,id:number) {
  const schema=sql.identifier(req.payload.db.schemaName || 'payload');
  return (await (await transaction(req)).execute<{id:number;slug:string}>(sql`SELECT DISTINCT c.id,c.slug FROM ${schema}.recruitment_periods c JOIN ${schema}.recruitment_revisions r ON r.id=c.public_revision_id AND r.entity_id=c.id AND r.state='published' JOIN ${schema}.recruitment_revisions_positions p ON p._parent_id=r.id WHERE p.division_id=${id} AND c.deleted_at IS NULL`)).rows;
}
export async function reviewedCommand(req: PayloadRequest, kind: EditorialKind, id: number, action: string, input: Record<string, unknown>) {
  if (!['submit', 'withdraw-submission', 'request-revision', 'publish', 'create-revision', 'withdraw-publication', 'delete-draft'].includes(action)) throw new APIError('Unknown organization action', 400);
  if (Object.keys(input).some(key => !['expectedLockVersion', 'expectedRevisionId', 'submissionId', 'note'].includes(key)) || !Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(input.expectedLockVersion) || !Number.isSafeInteger(input.expectedRevisionId)) throw new APIError('Expected entity version and revision required', 400);
  const model = editorialModel(kind);
  try { return await atomic(req, async () => {
    await editorialLock(req); await currentActor(req);
    if (['publish', 'request-revision', 'withdraw-publication', 'delete-draft'].includes(action) && !isActiveAdmin(req.user)) throw new Forbidden();
    const root = await req.payload.db.findOne({ collection: model.root, req, where: { id: { equals: id } } }) as unknown as EditorialDoc | null;
    if (!root || root.deletedAt || !canEditDraft(req.user, root)) throw new NotFound();
    const latest = action === 'create-revision' && !root.publicRevision && !root.workingRevision
      ? (await req.payload.find({ collection: model.revisions, req, overrideAccess: true, depth: 0, limit: 1, sort: '-number', where: { entity: { equals: id } } })).docs[0] as unknown as EditorialRevision | undefined : undefined;
    const pointer = ['create-revision', 'withdraw-publication'].includes(action) ? root.publicRevision || latest?.id : root.workingRevision;
    if (root.lockVersion !== input.expectedLockVersion || !pointer || pointer !== input.expectedRevisionId) throw new APIError('Entity changed; reload before continuing', 409);
    const revision = await orgRevision(req, kind, pointer);
    if (revision.entity !== id) throw new APIError('Revision mismatch', 409);
    const pending = (await req.payload.find({ collection: 'organization-reviews', req, overrideAccess: true, depth: 0, limit: 1, where: { and: [{ kind: { equals: kind } }, { entityId: { equals: id } }, { status: { equals: 'pending' } }] } })).docs[0];
    const manifest = () => ({ kind, entityId: id, revisionId: revision.id, editVersion: revision.editVersion, [model.identity]: root[model.identity], ...Object.fromEntries(model.keys.map(key => [key, revision[key]])) });
    let updates: Partial<EditorialDoc> = {}, submission: unknown;
    const options = orgOptions(req);
    const updateRevision = (target: EditorialRevision, state: string) => req.payload.update({ collection: model.revisions, id: target.id, ...options, data: { state } as never });
    if (action === 'create-revision') {
      if (root.workingRevision || pending || !['published', 'archived'].includes(revision.state)) throw new APIError('Working revision already exists', 409);
      const last = (await req.payload.find({ collection: model.revisions, req, overrideAccess: true, depth: 0, limit: 1, sort: '-number', where: { entity: { equals: id } } })).docs[0] as unknown as EditorialRevision;
      const draft = structuredClone(Object.fromEntries(model.keys.map(key => [key, revision[key]])));
      for (const key of model.keys) if (Array.isArray(draft[key])) draft[key] = draft[key].map((row: Record<string, unknown>) => { const copy = { ...row }; delete copy.id; return copy; });
      const created = await req.payload.create({ collection: model.revisions, ...options, data: { ...draft, entity: id, number: last.number + 1, editVersion: root.lockVersion + 1, state: 'draft' } as never }) as unknown as EditorialRevision;
      updates.workingRevision = created.id;
      await orgAudit(req, kind, root, created, 'revision_created', { state: revision.state }, { state: 'draft', sourceRevisionId: revision.id });
    } else if (action === 'withdraw-publication') {
      const note = pageNote(input.note);
      const references = kind === 'periods' ? await organizationReferences(req, id, true) : kind === 'divisions' ? await recruitmentDivisionReferences(req,id) : [];
      if (references.length) throw new APIError('Period still has published dependents', 409, { references });
      if (revision.state !== 'published') throw new APIError('No publication available', 409);
      if (pending) await req.payload.update({ collection: 'organization-reviews', id: pending.id, ...options, data: { status: 'cancelled', resolvedAt: new Date().toISOString() } });
      if (root.workingRevision) { const working = await orgRevision(req, kind, root.workingRevision); if (working.state === 'in_review') await updateRevision(working, 'draft'); }
      await updateRevision(revision, 'archived'); updates.publicRevision = null;
      if (kind === 'periods') await clearWithdrawnActivePeriod(req, id);
      if (kind === 'recruitment') await clearWithdrawnCampaign(req,id);
      await orgAudit(req, kind, root, revision, 'publication_withdrawn', { state: revision.state }, { state: 'archived', note });
    } else if (action === 'delete-draft') {
      const note = pageNote(input.note);
      const references = kind === 'periods' ? await organizationReferences(req, id) : [];
      const approved = await req.payload.find({ collection: 'organization-reviews', req, overrideAccess: true, limit: 1, where: { and: [{ kind: { equals: kind } }, { entityId: { equals: id } }, { status: { equals: 'approved' } }] } });
      if (kind === 'divisions' || root.publicRevision || pending || approved.totalDocs || references.length || !['draft', 'revision_required'].includes(revision.state)) throw new APIError('Entity history or references must be preserved', 409, { references });
      updates.deletedAt = new Date().toISOString(); updates[model.identity] = `deleted-${id}-${root[model.identity]}`.slice(0, 120);
      await orgAudit(req, kind, root, revision, 'draft_deleted', { [model.identity]: root[model.identity] }, { note, deletedAt: updates.deletedAt });
    } else if (action === 'submit') {
      if (pending || !['draft', 'revision_required'].includes(revision.state)) throw new APIError('Revision cannot be submitted', 409);
      validateDraft(kind, revision, true); await verifyPeriod(req, kind, revision); await verifyDraftFiles(req, revision);
      const frozen = manifest();
      submission = await req.payload.create({ collection: 'organization-reviews', ...options, data: { kind, entityId: id, [model.reference]: id, revisionId: revision.id, editVersion: revision.editVersion, status: 'pending', manifest: frozen, manifestDigest: snapshotDigest(frozen), submittedBy: req.user!.id } as never });
      await updateRevision(revision, 'in_review');
      await orgAudit(req, kind, root, revision, 'submitted', { state: revision.state }, { state: 'in_review' });
    } else {
      if (!pending || pending.id !== input.submissionId || pending.revisionId !== revision.id || pending.editVersion !== revision.editVersion || pending.manifestDigest !== snapshotDigest(manifest()) || revision.state !== 'in_review') throw new APIError('Submission is no longer current', 409);
      const state = action === 'publish' ? 'published' : action === 'request-revision' ? 'revision_required' : 'draft';
      const note = action === 'request-revision' ? pageNote(input.note) : null;
      if (action === 'publish') {
        validateDraft(kind, revision, true); await verifyPeriod(req, kind, revision); await verifyDraftFiles(req, revision);
        if (root.publicRevision) { const previous = await orgRevision(req, kind, root.publicRevision); if (previous.entity !== id || previous.state !== 'published') throw new APIError('Previous publication changed', 409); await updateRevision(previous, 'archived'); }
        updates = { publicRevision: revision.id, workingRevision: null };
      }
      await updateRevision(revision, state);
      submission = await req.payload.update({ collection: 'organization-reviews', id: pending.id, ...options, data: { status: action === 'publish' ? 'approved' : action === 'request-revision' ? 'changes_requested' : 'cancelled', reviewerId: action === 'withdraw-submission' ? null : req.user!.id, note, resolvedAt: new Date().toISOString() } });
      await orgAudit(req, kind, root, revision, action === 'publish' ? 'published' : action === 'request-revision' ? 'revision_requested' : 'submission_withdrawn', { state: 'in_review' }, { state, note, submissionId: pending.id });
    }
    await req.payload.db.updateOne({ collection: model.root, id, req, data: { ...updates, lockVersion: root.lockVersion + 1, updatedAt: new Date().toISOString() } });
    return { doc: updates.deletedAt ? { id, deletedAt: updates.deletedAt } : await req.payload.findByID({ collection: model.root, id, req, depth: 0, overrideAccess: true }), submission };
  }); } finally { Reflect.deleteProperty(req.context, editorialWrite); }
}
