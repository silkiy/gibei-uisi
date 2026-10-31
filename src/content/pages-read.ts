import type { PayloadRequest } from 'payload';
import type { PageKey } from '../editorial/page-policy';
import { validatePageDraft } from '../editorial/page-policy';
import { relationId } from '../editorial/policy';
import type { Page, PageRevision } from '../payload-types';

export async function publishedPage(req: PayloadRequest, pageKey: PageKey) {
  const page = await req.payload.db.findOne({ collection: 'pages', where: { pageKey: { equals: pageKey } }, req }) as Page | null;
  if (!page?.publicRevision) return null;
  const revision = await req.payload.db.findOne({ collection: 'page-revisions', where: { id: { equals: relationId(page.publicRevision) } }, req }) as PageRevision | null;
  if (!revision || relationId(revision.page) !== page.id || revision.state !== 'published') return null;
  const decision = await req.payload.db.findOne({ collection: 'page-reviews', where: { and: [{ page: { equals: page.id } }, { revision: { equals: revision.id } }, { editVersion: { equals: revision.editVersion } }, { status: { equals: 'approved' } }, { resolvedAt: { exists: true } }] }, req });
  if (!decision) return null;
  validatePageDraft(revision, true);
  return { title: revision.title || '', sections: revision.sections || [] };
}
