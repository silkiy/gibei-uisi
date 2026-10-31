import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { connection } from 'next/server';
import { editorialLock } from '../../../../../media/access';
import { pageCollection } from '../../../../../editorial/pages';
import { pageKeyIsValid, type PageDoc, type PageDraft } from '../../../../../editorial/page-policy';
import { atomic, requestContext } from '../../../../../server/request';

export const dynamic = 'force-dynamic';

type PreviewPage = PageDoc & PageDraft & { state?: string };
const text = (value: unknown) => typeof value === 'string' ? value : '';

function PreviewSection({ section }: { section: unknown }) {
  if (!section || typeof section !== 'object' || Array.isArray(section)) return null;
  const block = section as Record<string, unknown>;
  switch (block.blockType) {
    case 'hero': return <section><h2>{text(block.heading)}</h2><p>{text(block.summary)}</p></section>;
    case 'profile': return <section>
      <h2>{text(block.heading)}</h2><p>{text(block.description)}</p>
      {text(block.history) && <><h3>Sejarah</h3><p>{text(block.history)}</p></>}
      {text(block.vision) && <><h3>Visi</h3><p>{text(block.vision)}</p></>}
      {text(block.mission) && <><h3>Misi</h3><p>{text(block.mission)}</p></>}
    </section>;
    case 'program': return <section><h2>{text(block.heading)}</h2><p>{text(block.description)}</p></section>;
    case 'cta': return <section>
      <h2>{text(block.heading)}</h2><p>{text(block.description)}</p>
      <p>{text(block.label)}{text(block.url) && ` · ${text(block.url)}`}</p>
    </section>;
    default: return null;
  }
}

export default async function PrivatePagePreview({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const req = await requestContext(new Request('http://localhost/editorial/pages', { headers: await headers() }));
  if (!req.user) redirect('/admin/login');
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const doc = await atomic(req, async () => {
    await editorialLock(req, true);
    return req.payload.findByID({ collection: pageCollection('pages'), id, req, depth: 0, overrideAccess: false, disableErrors: true });
  }) as PreviewPage | null;
  if (!doc || !pageKeyIsValid(doc.pageKey)) notFound();

  return <main id="main-content" tabIndex={-1} className="page-width" style={{ paddingBlock: 48 }}>
    <p className="section-label">Preview privat · {doc.pageKey === 'homepage' ? 'Beranda' : 'Tentang'} · {doc.state} · versi {doc.lockVersion}</p>
    <a href={`/admin/collections/pages/${id}`}>Kembali ke editor</a>
    <h1>{text(doc.title) || 'Draft tanpa judul'}</h1>
    <p>Judul SEO: {text(doc.seoTitle)}</p><p>Deskripsi SEO: {text(doc.seoDescription)}</p>
    {Array.isArray(doc.sections) && doc.sections.map((section, index) => <PreviewSection key={index} section={section} />)}
    <p>Preview ini hanya menampilkan versi tersimpan dan tidak memberikan izin publik.</p>
  </main>;
}
