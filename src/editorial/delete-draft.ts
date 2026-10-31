import { APIError, type PayloadRequest } from 'payload';
import type { Article } from '../payload-types';
import { articleReferences } from '../media/retention';

export async function assertDeletableDraft(req: PayloadRequest, article: Article) {
  const published = await req.payload.count({ collection: 'content-reviews', req, overrideAccess: true,
    where: { and: [{ article: { equals: article.id } }, { status: { equals: 'approved' } }] } });
  if (article.publicRevision || published.totalDocs) throw new APIError('Published content must retain its history', 409);
  const references = await articleReferences(req, article.id);
  if (references.length) throw new APIError('Draft is still referenced', 409, { references });
}
