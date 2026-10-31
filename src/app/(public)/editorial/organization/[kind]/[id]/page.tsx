import { headers } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { atomic, requestContext } from '../../../../../../server/request';
import { editorialLock } from '../../../../../../media/access';
import { organizationKind, organizationModel } from '../../../../../../editorial/organization-model';

export default async function OrganizationPreview({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const values = await params;
  if (!['periods', 'divisions'].includes(values.kind) || !/^[1-9]\d*$/.test(values.id)) notFound();
  const kind = organizationKind(values.kind), model = organizationModel(kind);
  const req = await requestContext(new Request('http://localhost/editorial/organization', { headers: await headers() }));
  if (!req.user) redirect('/admin/login');
  const doc = await atomic(req, async () => {
    await editorialLock(req, true);
    return req.payload.findByID({ collection: model.root, id: Number(values.id), req, overrideAccess: false, disableErrors: true, depth: 0 });
  }) as Record<string, unknown> | null;
  if (!doc) notFound();
  return <main id="main-content" tabIndex={-1} className="page-width cms-page">
    <p className="section-label">Preview privat · {String(doc.state)}</p><h1>{String(doc[model.identity])}</h1>
    {model.keys.filter(key => key !== 'period').map(key => <section className="cms-section" key={key}><h2>{key}</h2><p>{String(doc[key] ?? '')}</p></section>)}
  </main>;
}
