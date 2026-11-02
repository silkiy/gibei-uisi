'use client';
import Link from 'next/link';
export default function GlobalError({retry}:{error:unknown;retry:()=>void}) {
 return <html lang="id"><body style={{fontFamily:'sans-serif',padding:'2rem',background:'#f7f9f3',color:'#123e32'}}><main id="main-content"><h1>Informasi sementara tidak tersedia.</h1><p>Layanan sedang mengalami kendala. Silakan coba kembali.</p><button onClick={retry}>Coba lagi</button> <Link prefetch={false} href="/">Kembali ke beranda</Link></main></body></html>;
}
