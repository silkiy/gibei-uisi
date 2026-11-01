import { publicPageData } from '../../../content/public-pages';
import { publicSettings } from '../../../content/site-settings';
import { ContactLinks } from '../../../components/public/ContactLinks';
export default async function Contact() {
  const settings=await publicPageData(publicSettings);
  return <main id="main-content" tabIndex={-1} className="page-width publication-main"><p className="section-label">Tetap terhubung / {settings.siteName}</p><h1>Kontak</h1><div className="cms-content"><p>Hubungi kami melalui kanal resmi yang telah dikonfirmasi.</p><ContactLinks settings={settings}/></div></main>;
}
