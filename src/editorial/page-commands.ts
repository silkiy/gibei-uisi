import { randomUUID } from 'node:crypto';
import { APIError, Forbidden, NotFound, type PayloadRequest } from 'payload';
import { atomic } from '../server/request';
import { isActiveAdmin } from '../auth/policy';
import { articleLock, currentActor, editorialWrite } from './internal';
import { editorialLock } from '../media/access';
import { snapshotDigest } from './review-policy';
import { pageCollection } from './pages';
import { canEditDraft, pageDraftKeys, pageNote, relationId, validatePageDraft, type PageDoc, type PageRevisionDoc, type PageReviewDoc } from './page-policy';

const options = (req: PayloadRequest) => ({ req, overrideAccess: true, context: { [editorialWrite]: true } });
const manifest = (revision: PageRevisionDoc) => ({ revisionId: revision.id, editVersion: revision.editVersion, ...Object.fromEntries(pageDraftKeys.map(key => [key, revision[key]])) });
const revisionByID = (req: PayloadRequest, id: number) => req.payload.findByID({ collection: pageCollection('page-revisions'), id, req, overrideAccess: true, depth: 0 }) as unknown as Promise<PageRevisionDoc>;
async function audit(req: PayloadRequest, page: PageDoc, revision: PageRevisionDoc, action: string, before: string, after: string, extra: Record<string, unknown> = {}) {
  await req.payload.create({ collection: pageCollection('page-audit'), ...options(req), data: { page: page.id, revisionId: revision.id, actorId: req.user!.id, editVersion: revision.editVersion, action,
    before: { state: before, lockVersion: page.lockVersion }, after: { state: after, lockVersion: page.lockVersion + 1, ...extra }, correlationId: randomUUID() } as never });
}
function assertPending(revision: PageRevisionDoc, pending: PageReviewDoc | undefined, submissionId: unknown): asserts pending is PageReviewDoc {
  if (!pending || pending.status !== 'pending' || pending.id !== submissionId || pending.revision !== revision.id || pending.editVersion !== revision.editVersion || pending.manifestDigest !== snapshotDigest(manifest(revision)) || revision.state !== 'in_review') throw new APIError('Submission is no longer current', 409);
}
export async function pageCommand(req: PayloadRequest, id: number, action: string, input: Record<string, unknown>) {
  if (!['submit', 'withdraw-submission', 'request-revision', 'publish', 'create-revision', 'withdraw-publication'].includes(action)) throw new APIError('Unknown page action', 400);
  const allowed = ['expectedLockVersion', 'expectedRevisionId', 'submissionId', ...(['request-revision', 'withdraw-publication'].includes(action) ? ['note'] : [])];
  if (Object.keys(input).some(key => !allowed.includes(key))) throw new APIError('Unsupported command field', 400);
  if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(input.expectedLockVersion) || !Number.isSafeInteger(input.expectedRevisionId)) throw new APIError('Lock version and revision required', 400);
  try { return await atomic(req, async () => {
    await editorialLock(req); await currentActor(req); await articleLock(req, id);
    if (['request-revision', 'publish', 'withdraw-publication'].includes(action) && !isActiveAdmin(req.user)) throw new Forbidden();
    const page = await req.payload.db.findOne({ collection: pageCollection('pages'), where: { id: { equals: id } }, req }) as unknown as PageDoc | null;
    if (!page || !canEditDraft(req.user, page)) throw new NotFound();
    const publicId = relationId(page.publicRevision);
    const pointer = action === 'create-revision' || action === 'withdraw-publication' ? publicId : relationId(page.workingRevision);
    const archived = action === 'create-revision' && !publicId && !page.workingRevision
      ? (await req.payload.find({ collection: pageCollection('page-revisions'), req, overrideAccess: true, depth: 0, limit: 1, pagination: false, sort: '-number', where: { page: { equals: id } } })).docs[0] as unknown as PageRevisionDoc | undefined : undefined;
    const sourceId = pointer ?? archived?.id;
    if (page.lockVersion !== input.expectedLockVersion || !sourceId || sourceId !== input.expectedRevisionId) throw new APIError('Page changed; reload before continuing', 409);
    const revision = await revisionByID(req, Number(sourceId));
    if (relationId(revision.page) !== page.id) throw new Forbidden();
    const pending = (await req.payload.find({ collection: pageCollection('page-reviews'), req, overrideAccess: true, depth: 0, limit: 1, pagination: false,
      where: { and: [{ page: { equals: id } }, { status: { equals: 'pending' } }] } })).docs[0] as unknown as PageReviewDoc | undefined;
    let submission: unknown;
    let updates: Partial<PageDoc> = {};
    if (action === 'create-revision') {
      if (page.workingRevision || pending || (publicId ? revision.state !== 'published' : revision.state !== 'archived')) throw new APIError('Working revision already exists or source unavailable', 409);
      const latest = (await req.payload.find({ collection: pageCollection('page-revisions'), req, overrideAccess: true, depth: 0, limit: 1, pagination: false, sort: '-number', where: { page: { equals: id } } })).docs[0] as unknown as PageRevisionDoc | undefined;
      const draft = structuredClone(Object.fromEntries(pageDraftKeys.map(key => [key, revision[key]])));
      if (Array.isArray(draft.sections)) draft.sections = draft.sections.map(section => { const copy = { ...(section as Record<string, unknown>) }; delete copy.id; return copy; });
      const created = await req.payload.create({ collection: pageCollection('page-revisions'), ...options(req), data: { ...draft, page: id, number: (latest?.number ?? 0) + 1, editVersion: page.lockVersion + 1, state: 'draft' } as never }) as unknown as PageRevisionDoc;
      updates = { workingRevision: created.id };
      await audit(req, page, created, 'revision_created', revision.state, 'draft', { sourceRevisionId: revision.id });
    } else if (action === 'withdraw-publication') {
      if (revision.state !== 'published') throw new APIError('There is no current publication', 409);
      const note = pageNote(input.note);
      if (page.workingRevision) {
        const working = await revisionByID(req, Number(relationId(page.workingRevision)));
        if (working.page !== id || working.id === revision.id || !['draft', 'revision_required', 'in_review'].includes(working.state)) throw new APIError('Invalid working revision', 409);
        if (pending) {
          if (pending.revision !== working.id) throw new APIError('Pending review changed', 409);
          await req.payload.update({ collection: pageCollection('page-reviews'), id: pending.id, ...options(req), data: { status: 'cancelled', resolvedAt: new Date().toISOString() } as never });
        }
        if (working.state === 'in_review') await req.payload.update({ collection: pageCollection('page-revisions'), id: working.id, ...options(req), data: { state: 'draft' } as never });
      } else if (pending) throw new APIError('Pending review changed', 409);
      await req.payload.update({ collection: pageCollection('page-revisions'), id: revision.id, ...options(req), data: { state: 'archived' } as never });
      updates = { publicRevision: null };
      await audit(req, page, revision, 'publication_withdrawn', 'published', 'archived', { note, cancelledSubmissionId: pending?.id ?? null });
    } else if (action === 'submit') {
      if (pending || !['draft', 'revision_required'].includes(revision.state)) throw new APIError('Revision cannot be submitted', 409);
      validatePageDraft(revision, true);
      const snapshot = manifest(revision);
      submission = await req.payload.create({ collection: pageCollection('page-reviews'), ...options(req), data: { page: id, revision: revision.id, editVersion: revision.editVersion,
        manifest: snapshot, manifestDigest: snapshotDigest(snapshot), status: 'pending', submittedBy: req.user!.id } as never });
      await req.payload.update({ collection: pageCollection('page-revisions'), id: revision.id, ...options(req), data: { state: 'in_review' } as never });
      await audit(req, page, revision, 'submitted', revision.state, 'in_review', { submissionId: (submission as { id: number }).id });
    } else {
      assertPending(revision, pending, input.submissionId);
      if (action === 'withdraw-submission') {
        submission = await req.payload.update({ collection: pageCollection('page-reviews'), id: pending.id, ...options(req), data: { status: 'cancelled', resolvedAt: new Date().toISOString() } as never });
        await req.payload.update({ collection: pageCollection('page-revisions'), id: revision.id, ...options(req), data: { state: 'draft' } as never });
        await audit(req, page, revision, 'submission_withdrawn', 'in_review', 'draft', { submissionId: pending.id });
      } else if (action === 'request-revision') {
        const note = pageNote(input.note);
        submission = await req.payload.update({ collection: pageCollection('page-reviews'), id: pending.id, ...options(req), data: { status: 'changes_requested', reviewerId: req.user!.id, note, resolvedAt: new Date().toISOString() } as never });
        await req.payload.update({ collection: pageCollection('page-revisions'), id: revision.id, ...options(req), data: { state: 'revision_required' } as never });
        await audit(req, page, revision, 'revision_requested', 'in_review', 'revision_required', { submissionId: pending.id, note });
      } else {
        validatePageDraft(revision, true);
        const previousId = relationId(page.publicRevision);
        if (previousId) {
          const previous = await revisionByID(req, Number(previousId));
          if (previous.page !== id || previous.state !== 'published') throw new APIError('Public revision changed', 409);
          await req.payload.update({ collection: pageCollection('page-revisions'), id: previous.id, ...options(req), data: { state: 'archived' } as never });
        }
        await req.payload.update({ collection: pageCollection('page-revisions'), id: revision.id, ...options(req), data: { state: 'published' } as never });
        submission = await req.payload.update({ collection: pageCollection('page-reviews'), id: pending.id, ...options(req), data: { status: 'approved', reviewerId: req.user!.id, resolvedAt: new Date().toISOString() } as never });
        updates = { publicRevision: revision.id, workingRevision: null };
        await audit(req, page, revision, 'published', 'in_review', 'published', { submissionId: pending.id, replacedRevisionId: previousId ?? null });
      }
    }
    await req.payload.db.updateOne({ collection: pageCollection('pages'), id, req, data: { ...updates, lockVersion: page.lockVersion + 1, updatedAt: new Date().toISOString() } });
    return { doc: await req.payload.findByID({ collection: pageCollection('pages'), id, req, overrideAccess: true, depth: 0 }), submission };
  }); } finally { Reflect.deleteProperty(req.context, editorialWrite); }
}
