import type { MetadataRoute } from 'next';
import { publicPageData } from '../content/public-pages';
import { sitemapEntries } from '../seo/sitemap';
export const dynamic='force-dynamic';
export default async function sitemap():Promise<MetadataRoute.Sitemap> {return publicPageData(sitemapEntries);}
