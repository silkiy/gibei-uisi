import { editorialFixture } from '../support/editorial.mjs';
import { test,expect } from './fixtures';
import { reviewedFixture } from '../support/reviewed.mjs';

test('gallery, partner permission and achievements work on mobile and in CMS',async({page,adminPage,mediaAPage})=>{
 const f=await reviewedFixture('p1-browser'),image=await f.upload(f.a);
 const album=await f.publishReviewed('galleries',await f.create('galleries','p1-browser-album',{title:'Album browser contoh',description:'Dokumentasi contoh.',date:'2026-12-31',example:true,photos:[{asset:image.id,alt:'Diskusi contoh',caption:'Caption disetujui'}],videoURL:'https://example.com/video'}));
 await page.setViewportSize({width:375,height:812});await page.goto('/galeri');await page.getByRole('link',{name:'Album browser contoh →'}).click();
 await expect(page.getByRole('img',{name:'Diskusi contoh'})).toBeVisible();await expect(page.getByText('Caption disetujui',{exact:true})).toBeVisible();
 const video=page.getByRole('link',{name:'Tonton video eksternal ↗'});await video.focus();await expect(video).toBeFocused();await expect(video).toHaveAttribute('rel','noopener noreferrer');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:'artifacts/T044-mobile.png',fullPage:true});
 let partner=await f.publishReviewed('partners',await f.create('partners','p1-browser-partner',{title:'Mitra browser fiktif',description:'Bukan mitra resmi.',collaboration:'Simulasi edukasi',logo:image.id,showOnHomepage:true,example:true}));
 await page.goto('/partnership');await expect(page.getByRole('heading',{name:'Mitra browser fiktif'})).toBeVisible();await expect(page.getByRole('main').getByRole('img')).toHaveCount(0);
 await mediaAPage.goto(`/admin/collections/partners/${partner.id}`);await expect(mediaAPage.getByRole('button',{name:'Catat izin logo'})).toHaveCount(0);
 await adminPage.goto(`/admin/collections/partners/${partner.id}`);await adminPage.getByRole('textbox',{name:'Alasan editorial',exact:true}).fill('Izin contoh untuk pengujian, bukan kemitraan resmi');await adminPage.getByRole('button',{name:'Catat izin logo'}).click();await expect(adminPage.getByRole('textbox',{name:'Alasan editorial',exact:true})).toHaveValue('');
 await page.reload();await expect(page.getByRole('main').getByRole('img')).toHaveCount(1);
 await f.publishReviewed('achievements',await f.create('achievements','p1-browser-achievement',{title:'Prestasi browser fiktif',description:'Contoh saja.',date:'2024-12-31',category:'Edukasi',example:true}));
 await page.goto('/prestasi');await page.getByLabel('Tahun').selectOption('2024');await page.getByRole('button',{name:'Terapkan'}).click();await expect(page.getByRole('heading',{name:'Prestasi browser fiktif'})).toBeVisible();
 await page.goto('/');await expect(page.getByRole('heading',{name:'Mitra browser fiktif'})).toBeVisible();
 partner=await f.read('partners',partner);expect((await f.admin.request(`/api/editorial/partners/${partner.id}/logo-permission`,{method:'POST',data:{expectedLockVersion:partner.lockVersion,allowed:false,note:'Cabut izin contoh'}})).status).toBe(200);
 await page.reload();await expect(page.getByRole('heading',{name:'Mitra browser fiktif'}).locator('..').getByRole('img')).toHaveCount(0);
 expect((await f.admin.request(`/api/media/${image.key}/manage`,{method:'POST',data:{action:'delete',note:'Still retained'}})).status).toBe(409);
 expect((await f.admin.request(`/api/media/${image.key}/manage`,{method:'POST',data:{action:'revoke',note:'Emergency test'}})).status).toBe(200);
 await page.goto(`/galeri/${album.slug}`);await expect(page.getByText('Gambar tidak tersedia.',{exact:true})).toBeVisible();
});

test('metadata, sitemap and structured data use approved snapshots and remove warmed withdrawals',async({page,baseURL})=>{
 const f=await editorialFixture('seo-browser'),g=await reviewedFixture('seo-gallery');
 const privateDoc=await f.draft(f.a,'seo-private',{title:'RAHASIA SEO PRIVATE'});
 let doc=await f.publish(await f.submit(f.a,await f.draft(f.a,'seo-public',{title:'Artikel SEO contoh',excerpt:'Ringkasan SEO contoh.'})));
 for(const route of ['/','/tentang','/tentang/struktur','/tentang/divisi','/publikasi','/publikasi/artikel','/publikasi/riset','/kegiatan','/galeri','/partnership','/prestasi','/rekrutmen','/kontak']){
  await page.goto(route);await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',`${baseURL}${route==='/'?'/':route}`);await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content',/Contoh \/ Pratinjau/);
 }
 await page.goto(`/publikasi/artikel/${doc.slug}`);await expect(page).toHaveTitle(/Artikel SEO contoh/);
 const ld=await page.locator('script[type="application/ld+json"]').textContent();expect(JSON.parse(ld!).name).toContain('Contoh / Pratinjau');expect(JSON.parse(ld!)['@type']).toBe('Article');
 const gallery=await g.publishReviewed('galleries',await g.create('galleries','seo-gallery',{title:'Album SEO contoh',description:'Album kosong yang telah disetujui.',date:'2026-12-31',example:true,photos:[]}));
 await page.goto(`/galeri/${gallery.slug}`);await expect(page).toHaveTitle(/Album SEO contoh/);
 let xml=await (await page.request.get('/sitemap.xml')).text();expect(xml).toContain(`/publikasi/artikel/${doc.slug}`);expect(xml).not.toContain(privateDoc.slug);expect(xml).toContain(`/galeri/${gallery.slug}`);expect(xml).not.toContain('/editorial');
 const robots=await (await page.request.get('/robots.txt')).text();expect(robots).toContain('Disallow: /');
 let response=await f.command(f.a,doc,'create-revision');expect(response.status).toBe(200);doc=(await response.json()).doc;
 response=await f.a.request(`/api/articles/${doc.id}`,{method:'PATCH',data:{expectedLockVersion:doc.lockVersion,title:'RAHASIA SEO REVISI'}});expect(response.status).toBe(200);doc=(await response.json()).doc;
 await page.goto(`/publikasi/artikel/${doc.slug}`);await expect(page).toHaveTitle(/Artikel SEO contoh/);expect(await page.content()).not.toContain('RAHASIA SEO REVISI');
 expect((await f.command(f.admin,doc,'withdraw-publication',{note:'Withdraw warmed SEO'})).status).toBe(200);
 xml=await (await page.request.get('/sitemap.xml')).text();expect(xml).not.toContain(`/publikasi/artikel/${doc.slug}`);
 expect((await g.command('galleries',gallery,'withdraw-publication',{note:'Withdraw warmed gallery SEO'})).status).toBe(200);
 xml=await (await page.request.get('/sitemap.xml')).text();expect(xml).not.toContain(`/galeri/${gallery.slug}`);expect((await page.goto(`/galeri/${gallery.slug}`))?.status()).toBe(404);await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
 for(const slug of [doc.slug,privateDoc.slug]){expect((await page.goto(`/publikasi/artikel/${slug}`))?.status()).toBe(404);expect(await page.content()).not.toContain('RAHASIA SEO');await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);}
});
