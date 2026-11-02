import type { MetadataRoute } from 'next';
import { canonicalURL } from '../seo/policy.mjs';
export const dynamic='force-dynamic';
export default function robots():MetadataRoute.Robots {return {rules:{userAgent:'*',disallow:'/'},sitemap:canonicalURL('/sitemap.xml')};}
