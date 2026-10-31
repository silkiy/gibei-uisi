import { APIError, Forbidden, NotFound, type PayloadRequest } from 'payload';
import { randomUUID } from 'node:crypto';
import type { Article, ArticleRevision, EditorialAudit, ContentReview } from '../payload-types';
import { atomic } from '../server/request';
import { articleLock, currentActor, editorialWrite } from './internal';
import { canEditDraft, relationId } from './policy';
import { draftKeys } from './articles';
import { validateComplete, snapshotDigest, revisionNote } from './review-policy';
import { isActiveAdmin } from '../auth/policy';
import { editorialLock } from '../media/access';
import { verifyReferencedFiles } from '../media/references';

export const internalOptions = (req: PayloadRequest) => ({ req, overrideAccess: true, context: { [editorialWrite]: true } });
export const revisionManifest = (revision: ArticleRevision) => ({ revisionId: revision.id, editVersion: revision.editVersion, ...Object.fromEntries(draftKeys.map(key => [key, revision[key]])) });
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
  if (!['submit', 'withdraw-submission', 'request-revision'].includes(action)) throw new APIError('Unknown editorial action', 400);
  const allowed = ['expectedLockVersion', 'expectedRevisionId', 'submissionId', ...(action === 'request-revision' ? ['note'] : [])];
  if (Object.keys(input).some(key => !allowed.includes(key))) throw new APIError('Unsupported command field', 400);
  if (!Number.isSafeInteger(id) || !Number.isSafeInteger(input.expectedLockVersion) || !Number.isSafeInteger(input.expectedRevisionId)) throw new APIError('Revision and lock version required', 400);
  try { return await atomic(req, async () => {
    await editorialLock(req); await currentActor(req); await articleLock(req, id);
    if (action === 'request-revision' && !isActiveAdmin(req.user)) throw new Forbidden();
    const article = await req.payload.db.findOne({ collection: 'articles', where: { id: { equals: id } }, req }) as Article | null;
    if (!article || !canEditDraft(req.user, article)) throw new NotFound();
    if (article.lockVersion !== input.expectedLockVersion || relationId(article.workingRevision) !== input.expectedRevisionId) throw new APIError('Article changed; reload before continuing', 409);
    const revision = await req.payload.findByID({ collection: 'article-revisions', id: input.expectedRevisionId as number, req, overrideAccess: true, depth: 0 });
    if (relationId(revision.article) !== article.id) throw new Forbidden();
    const pending = (await req.payload.find({ collection: 'content-reviews', req, overrideAccess: true, depth: 0, limit: 1, pagination: false, where: { and: [{ article: { equals: id } }, { status: { equals: 'pending' } }] } })).docs[0];
    let submission;
    if (action === 'submit') {
      if (pending || !['draft', 'revision_required'].includes(revision.state)) throw new APIError('Revision cannot be submitted', 409);
      try { validateComplete(revision); } catch (error) { throw new APIError((error as Error).message, 400); }
      await verifyReferencedFiles(req, revision);
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
      } else {
        let note: string; try { note = revisionNote(input.note); } catch (error) { throw new APIError((error as Error).message, 400); }
        submission = await req.payload.update({ collection: 'content-reviews', id: pending.id, ...internalOptions(req), data: { status: 'changes_requested', reviewerId: req.user!.id, note, resolvedAt: new Date().toISOString() } });
        await req.payload.update({ collection: 'article-revisions', id: revision.id, ...internalOptions(req), data: { state: 'revision_required' } });
        await auditCommand(req, article, revision, 'revision_requested', 'in_review', 'revision_required', { submissionId: submission.id, note });
      }
    }
    await advanceArticle(req, article);
    return { doc: await req.payload.findByID({ collection: 'articles', id, req, overrideAccess: true, depth: 0 }), submission };
  }); } finally { Reflect.deleteProperty(req.context, editorialWrite); }
}
