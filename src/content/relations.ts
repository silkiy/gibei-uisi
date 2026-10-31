import { APIError, NotFound, type PayloadRequest } from 'payload';
import type { Article, ArticleRevision } from '../payload-types';
import { canEditDraft, relationId } from '../editorial/policy';

export async function normalizeRelated(req: PayloadRequest, rows: ArticleRevision['related']) {
  if (!Array.isArray(rows) || rows.length > 20) throw new APIError('Invalid related articles', 400);
  const result = [];
  for (const row of rows) {
    const id = Number(relationId(row.target)); if (!Number.isSafeInteger(id) || id < 1) throw new NotFound();
    const article = await req.payload.db.findOne({ collection: 'articles', where: { id: { equals: id } }, req }) as Article | null;
    if (!article || (!canEditDraft(req.user, article) && !article.publicRevision)) throw new NotFound();
    result.push({ target: article.id, required: row.required === true });
  }
  return result;
}
export async function validateRequiredRelations(req: PayloadRequest, revision: ArticleRevision) {
  for (const reference of revision.related || []) if (reference.required) {
    const article = await req.payload.db.findOne({ collection: 'articles', where: { id: { equals: relationId(reference.target) } }, req }) as Article | null;
    const id = article && relationId(article.publicRevision);
    const target = id ? await req.payload.findByID({ collection: 'article-revisions', id, req, overrideAccess: true, depth: 0 }) : null;
    if (!target || target.state !== 'published' || relationId(target.article) !== article!.id) throw new APIError('A required related article is not public', 409);
  }
}
