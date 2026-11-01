import Link from 'next/link';
import { safeNavigationURL } from '../../validation/navigation.mjs';
import { LiveRegistration, type RegistrationState } from './LiveRegistration';

type Section = { blockType: string; heading: string; description?: string | null; summary?: string | null; history?: string | null; vision?: string | null; mission?: string | null; label?: string | null; url?: string | null };
export function PageSections({ sections, registration }: { sections: Section[]; registration?: (RegistrationState & { slug: string }) | null }) {
  return sections.map((section, index) => <section className="cms-section" key={index}>
    <h2>{section.heading}</h2>
    {(section.description || section.summary) && <p>{section.description || section.summary}</p>}
    {section.blockType === 'profile' && (['history', 'vision', 'mission'] as const).map((key, i) => section[key] && <div key={key}><h3>{['Sejarah', 'Visi', 'Misi'][i]}</h3><p>{section[key]}</p></div>)}
    {section.blockType === 'cta' && section.url && safeNavigationURL(section.url) && (section.url === '/rekrutmen'
      ? registration && <p><LiveRegistration initial={registration} endpoint={`/api/public/recruitment/${registration.slug}`} linkOnly linkLabel={`${section.label} →`} linkHref="/rekrutmen" /></p>
      : <p>{section.url.startsWith('/') ? <Link prefetch={false} href={section.url}>{section.label} →</Link> : <a href={section.url} rel="noopener noreferrer">{section.label} ↗</a>}</p>)}
  </section>);
}
