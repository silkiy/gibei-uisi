import { canonicalURL, jsonLD } from './policy.mjs';
export function StructuredData({path,title,description,type='WebPage'}:{path:string;title:string;description:string;type?:string}) {
 return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLD({'@context':'https://schema.org','@type':type,name:`[Contoh / Pratinjau] ${title}`,description:`Materi contoh, bukan fakta resmi. ${description}`,url:canonicalURL(path)})}}/>;
}
