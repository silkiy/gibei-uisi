import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { atomic, requestContext } from '../../../../../../server/request';
import { editorialLock } from '../../../../../../media/access';
import { editorialKind, editorialModel, editorialKinds } from '../../../../../../editorial/reviewed-model';
import { RichText } from '../../../../../../components/public/RichText';
import { previewAssets } from '../../../../../../media/references';
import type { ArticleRevision } from '../../../../../../payload-types';
import { safeExternalURL } from '../../../../../../content/links.mjs';

export default async function OrganizationPreview({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const values = await params;
  if (!editorialKinds.some(kind => kind === values.kind) || !/^[1-9]\d*$/.test(values.id)) notFound();
  const kind = editorialKind(values.kind), model = editorialModel(kind);
  const req = await requestContext(new Request('http://localhost/editorial/organization', { headers: await headers() }));
  if (!req.user) redirect('/admin/login');
  const result = await atomic(req, async () => {
    await editorialLock(req, true);
    const doc = await req.payload.findByID({ collection: model.root, id: Number(values.id), req, overrideAccess: false, disableErrors: true, depth: 0 }) as Record<string, unknown> | null;
    return { doc, assets: doc ? await previewAssets(req, doc.assets as ArticleRevision['assets']) : [] };
  });
  const { doc, assets } = result;
  if (!doc) notFound();
  return <main id="main-content" tabIndex={-1} className="page-width cms-page">
    <p className="section-label">Preview privat · {String(doc.state)}</p><h1>{String(doc[model.identity])}</h1>
    {model.keys.filter(key => !['period', 'body', 'assets', 'sources', 'positions', 'selectionStages'].includes(key)).map(key => <section className="cms-section" key={key}><h2>{key}</h2><p>{String(doc[key] ?? '')}</p></section>)}
    {['positions','selectionStages'].map(key=>Array.isArray(doc[key]) && <section className="cms-section" key={key}><h2>{key==='positions'?'Posisi & persyaratan':'Tahapan seleksi'}</h2><ol>{doc[key].map((row:Record<string,unknown>,i:number)=><li key={i}><h3>{String(row.title || '')}</h3><p>{String(row.requirements || row.description || '')}</p>{row.division!=null && <p>Divisi: {String(row.division)}</p>}</li>)}</ol></section>)}
    <div className="article-body"><RichText body={doc.body} assets={assets} /></div>
    {Array.isArray(doc.sources) && !!doc.sources.length && <section className="cms-section"><h2>Sumber</h2><ul>{doc.sources.map((source, i) => {
      const url = safeExternalURL(source.url);
      return url ? <li key={i}><a href={url} rel="noopener noreferrer">{String(source.title || 'Sumber')}</a></li> : null;
    })}</ul></section>}
  </main>;
}
