import { headers } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { requestContext, atomic } from '../../../../../server/request';
import { editorialLock } from '../../../../../media/access';
import { RichText } from '../../../../../components/public/RichText';

export default async function PrivatePreview({ params }: { params: Promise<{ id: string }> }) {
  const req = await requestContext(new Request('http://localhost/editorial/preview', { headers: await headers() }));
  if (!req.user) redirect('/admin/login');
  const id = Number((await params).id); if (!Number.isSafeInteger(id) || id < 1) notFound();
  const doc = await atomic(req, async () => {
    await editorialLock(req, true);
    return req.payload.findByID({ collection: 'articles', id, req, depth: 0, overrideAccess: false, disableErrors: true });
  });
  if (!doc) notFound();
  return <main id="main-content" tabIndex={-1} className="page-width" style={{ paddingBlock: 48 }}>
    <p className="section-label">Preview privat · {doc.state} · versi {doc.lockVersion}</p>
    <a href={`/admin/collections/articles/${id}`}>Kembali ke editor</a>
    <h1>{doc.title || 'Draft tanpa judul'}</h1><p>{doc.excerpt}</p>
    <p>Penulis publik: {doc.publicAuthor || 'Belum diisi'}</p>
    <RichText body={doc.body} />
    <p>Preview ini hanya menampilkan versi tersimpan dan tidak memberikan izin publik.</p>
  </main>;
}
