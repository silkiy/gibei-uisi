import type { PublicSettings } from '../../content/site-settings';
export function ContactLinks({settings}:{settings:Pick<PublicSettings,'email'|'location'|'socials'>}) {
  return <>{settings.email && <p><a href={`mailto:${settings.email}`}>{settings.email}</a></p>}
    {settings.location && <p style={{whiteSpace:'pre-line'}}>{settings.location}</p>}
    {settings.socials.map((social,index)=><p key={index}><a href={social.url} rel="noopener noreferrer">{social.label} ↗</a></p>)}
    {!settings.email&&!settings.location&&!settings.socials.length && <p className="contact-pending">Kontak dan kanal resmi sedang dikonfirmasi.</p>}
  </>;
}
