import { APIError, Forbidden, NotFound, type PayloadRequest } from 'payload';
import { randomUUID } from 'node:crypto';
import type { Article, ArticleRevision, EditorialAudit, ContentReview } from '../payload-types';
import { atomic } from '../server/request';
import { articleLock, currentActor, editorialWrite } from './internal';
import { canEditDraft, relationId, validateDraft } from './policy';
import { draftKeys } from './articles';
import { validateComplete, snapshotDigest, revisionNote } from './review-policy';
import { isActiveAdmin } from '../auth/policy';
import { editorialLock } from '../media/access';
import { verifyReferencedFiles } from '../media/references';
import { validateRequiredRelations } from '../content/relations';
import { copyDraftPayload } from './revision-copy';
import { requiredDependents } from '../content/dependencies';
import { assertDeletableDraft } from './delete-draft';

export const internalOptions = (req: PayloadRequest) => ({ req, overrideAccess: true, context: { [editorialWrite]: true } });
export const revisionManifest = (revision: ArticleRevision) => ({ revisionId: revision.id, editVersion: revision.editVersion,
  ...Object.fromEntries(draftKeys.filter(key => key !== 'related' || revision.related?.length).map(key => [key, revision[key]])) });
export function assertPending(revision: ArticleRevision, pending: ContentReview | undefined, submissionId: unknown): asserts pending is ContentReview {
  if (!pending || pending.status !== 'pending' || pending.id !== submissionId || relationId(pending.revision) !== revision.id || pending.editVersion !== revision.editVersion || pending.manifestDigest !== snapshotDigest(revisionManifest(revision)) || revision.state !== 'in_review') throw new APIError('Submission is no longer current', 409);
}
export async function auditCommand(req: PayloadRequest, article: Article, revision: ArticleRevision, action: EditorialAudit['action'], before: string, after: string, extra: Record<string, unknown> = {}) {
  await req.payload.create({ collection: 'editorial-audit', ...internalOptions(req), data: { article: article.id, revisionId: revision.id, actorId: req.user!.id, editVersion: revision.editVersion, action,
    before: { state: before, lockVersion: article.lockVersion }, after: { state: after, lockVersion: article.lockVersion + 1, ...extra }, correlationId: randomUUID() } });
}
export async function advanceArticle(req: PayloadRequest, article: Article, data: Partial<Article> = {}) {
  await req.payload.db.updateOne({ collection: 'articles', id: article.id, req, data: { ...data, lockVersion: article.lockVersion + 1, updatedAt: new Date().toISOString() } });
}
export async function articleCommand(req: PayloadRequest, id: number, action: string, input: Record<string, unknown>) {
  if (!['submit', 'withdraw-submission', 'request-revision', 'publish', 'create-revision', 'archive-revision', 'restart-archived', 'withdraw-publication', 'delete-draft'].includes(action)) throw new APIError('Unknown editorial action', 400);
  const allowed = ['expectedLockVersion', 'expectedRevisionId', 'submissionId', ...(['request-revision', 'archive-revision', 'withdraw-publication', 'delete-draft'].includes(action) ? ['note'] : [])];
  if (Object.keys(input).some(key => !allowed.includes(key))) throw new APIError('Unsupported command field', 400);
  if (!Number.isSafeInteger(id) || !Number.isSafeInteger(input.expectedLockVersion) || !Number.isSafeInteger(input.expectedRevisionId)) throw new APIError('Revision and lock version required', 400);
  try { return await atomic(req, async () => {
    await editorialLock(req); await currentActor(req); await articleLock(req, id);
    if (['request-revision', 'publish', 'archive-revision', 'restart-archived', 'withdraw-publication', 'delete-draft'].includes(action) && !isActiveAdmin(req.user)) throw new Forbidden();
    const article = await req.payload.db.findOne({ collection: 'articles', where: { id: { equals: id } }, req }) as Article | null;
    if (!article || article.deletedAt || !canEditDraft(req.user, article)) throw new NotFound();
    const expectedPointer = ['create-revision', 'withdraw-publication'].includes(action) ? relationId(article.publicRevision) : action === 'restart-archived' ? input.expectedRevisionId : relationId(article.workingRevision);
    if (article.lockVersion !== input.expectedLockVersion || !expectedPointer || expectedPointer !== input.expectedRevisionId) throw new APIError('Article changed; reload before continuing', 409);
    const revision = await req.payload.findByID({ collection: 'article-revisions', id: input.expectedRevisionId as number, req, overrideAccess: true, depth: 0 });
    if (relationId(revision.article) !== article.id) throw new Forbidden();
    const pending = (await req.payload.find({ collection: 'content-reviews', req, overrideAccess: true, depth: 0, limit: 1, pagination: false, where: { and: [{ article: { equals: id } }, { status: { equals: 'pending' } }] } })).docs[0];
    let submission;
    let articleChanges: Partial<Article> = {};
    if (action === 'delete-draft') {
      if (pending || !['draft', 'revision_required'].includes(revision.state)) throw new APIError('Withdraw review before deleting a draft', 409);
      let note: string; try { note = revisionNote(input.note); } catch (error) { throw new APIError((error as Error).message, 400); }
      await assertDeletableDraft(req, article);
      await req.payload.update({ collection: 'article-revisions', id: revision.id, ...internalOptions(req), data: { state: 'archived' } });
      articleChanges = { deletedAt: new Date().toISOString(), workingRevision: null, slug: `deleted-${article.id}-${randomUUID()}` };
      await auditCommand(req, article, revision, 'draft_deleted', revision.state, 'archived', { note, originalSlug: article.slug });
    } else if (action === 'withdraw-publication') {
      if (revision.state !== 'published') throw new APIError('There is no current publication', 409);
      let note: string; try { note = revisionNote(input.note); } catch (error) { throw new APIError((error as Error).message, 400); }
      const references = await requiredDependents(req, id);
      if (references.length) throw new APIError('Public articles require this target', 409, { references });
      if (article.workingRevision) {
        const working = await req.payload.findByID({ collection: 'article-revisions', id: relationId(article.workingRevision)!, req, overrideAccess: true, depth: 0 });
        if (working.id === revision.id || relationId(working.article) !== id || !['draft', 'revision_required', 'in_review'].includes(working.state)) throw new APIError('Invalid working revision', 409);
        if (pending) {
          if (relationId(pending.revision) !== working.id) throw new APIError('Pending review changed', 409);
          await req.payload.update({ collection: 'content-reviews', id: pending.id, ...internalOptions(req), data: { status: 'cancelled', resolvedAt: new Date().toISOString() } });
        }
        if (working.state === 'in_review') await req.payload.update({ collection: 'article-revisions', id: working.id, ...internalOptions(req), data: { state: 'draft' } });
      } else if (pending) throw new APIError('Pending review changed', 409);
      await req.payload.update({ collection: 'article-revisions', id: revision.id, ...internalOptions(req), data: { state: 'archived' } });
      articleChanges = { publicRevision: null };
      await auditCommand(req, article, revision, 'publication_withdrawn', 'published', 'archived', { note, cancelledSubmissionId: pending?.id ?? null });
    } else if (action === 'create-revision' || action === 'restart-archived') {
      if (article.workingRevision || pending || (action === 'create-revision' ? revision.state !== 'published' : article.publicRevision || revision.state !== 'archived')) throw new APIError('A working revision already exists or source is unavailable', 409);
      const latest = (await req.payload.find({ collection: 'article-revisions', req, overrideAccess: true, depth: 0, limit: 1, pagination: false, sort: '-number', where: { article: { equals: id } } })).docs[0];
      const copy = copyDraftPayload(Object.fromEntries(draftKeys.map(key => [key, revision[key]])));
      const created = await req.payload.create({ collection: 'article-revisions', ...internalOptions(req), data: { ...copy, article: id, number: (latest?.number || 0) + 1, editVersion: article.lockVersion + 1, state: 'draft' } });
      articleChanges = { workingRevision: created.id };
      await auditCommand(req, article, created, 'revision_created', revision.state, 'draft', { sourceRevisionId: revision.id });
    } else if (action === 'archive-revision') {
      if (pending || !['draft', 'revision_required'].includes(revision.state)) throw new APIError('Withdraw review before archiving', 409);
      await req.payload.update({ collection: 'article-revisions', id: revision.id, ...internalOptions(req), data: { state: 'archived' } });
      articleChanges = { workingRevision: null };
      await auditCommand(req, article, revision, 'revision_archived', revision.state, 'archived');
    } else if (action === 'submit') {
      if (pending || !['draft', 'revision_required'].includes(revision.state)) throw new APIError('Revision cannot be submitted', 409);
      try { validateDraft(revision); validateComplete(revision); } catch (error) { throw new APIError((error as Error).message, 400); }
      await verifyReferencedFiles(req, revision);
      await validateRequiredRelations(req, revision);
      const manifest = revisionManifest(revision);
      submission = await req.payload.create({ collection: 'content-reviews', ...internalOptions(req), data: { article: id, revision: revision.id, editVersion: revision.editVersion, manifest, manifestDigest: snapshotDigest(manifest), status: 'pending', submittedBy: req.user!.id } });
      await req.payload.update({ collection: 'article-revisions', id: revision.id, ...internalOptions(req), data: { state: 'in_review' } });
      await auditCommand(req, article, revision, 'submitted', revision.state, 'in_review', { submissionId: submission.id });
    } else {
      assertPending(revision, pending, input.submissionId);
      if (action === 'withdraw-submission') {
        submission = await req.payload.update({ collection: 'content-reviews', id: pending.id, ...internalOptions(req), data: { status: 'cancelled', resolvedAt: new Date().toISOString() } });
        await req.payload.update({ collection: 'article-revisions', id: revision.id, ...internalOptions(req), data: { state: 'draft' } });
        await auditCommand(req, article, revision, 'submission_withdrawn', 'in_review', 'draft', { submissionId: submission.id });
      } else if (action === 'request-revision') {
        let note: string; try { note = revisionNote(input.note); } catch (error) { throw new APIError((error as Error).message, 400); }
        submission = await req.payload.update({ collection: 'content-reviews', id: pending.id, ...internalOptions(req), data: { status: 'changes_requested', reviewerId: req.user!.id, note, resolvedAt: new Date().toISOString() } });
        await req.payload.update({ collection: 'article-revisions', id: revision.id, ...internalOptions(req), data: { state: 'revision_required' } });
        await auditCommand(req, article, revision, 'revision_requested', 'in_review', 'revision_required', { submissionId: submission.id, note });
      } else {
        try { validateDraft(revision); validateComplete(revision); } catch (error) { throw new APIError((error as Error).message, 400); }
        await verifyReferencedFiles(req, revision);
        await validateRequiredRelations(req, revision);
        const previousId = relationId(article.publicRevision);
        if (previousId) {
          const previous = await req.payload.findByID({ collection: 'article-revisions', id: previousId, req, overrideAccess: true, depth: 0 });
          if (relationId(previous.article) !== article.id || previous.state !== 'published') throw new APIError('Public revision changed', 409);
          await req.payload.update({ collection: 'article-revisions', id: previous.id, ...internalOptions(req), data: { state: 'archived' } });
        }
        await req.payload.update({ collection: 'article-revisions', id: revision.id, ...internalOptions(req), data: { state: 'published' } });
        submission = await req.payload.update({ collection: 'content-reviews', id: pending.id, ...internalOptions(req), data: { status: 'approved', reviewerId: req.user!.id, resolvedAt: new Date().toISOString() } });
        articleChanges = { publicRevision: revision.id, workingRevision: null };
        await auditCommand(req, article, revision, 'published', 'in_review', 'published', { submissionId: submission.id, replacedRevisionId: previousId ?? null });
      }
    }
    await advanceArticle(req, article, articleChanges);
    if (action === 'delete-draft') return { doc: null, deleted: true };
    return { doc: await req.payload.findByID({ collection: 'articles', id, req, overrideAccess: true, depth: 0 }), submission };
  }); } finally { Reflect.deleteProperty(req.context, editorialWrite); }
}
