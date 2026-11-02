import {writeFileSync} from 'node:fs';
import {test,expect} from './fixtures';
import AxeBuilder from '@axe-core/playwright';
import {seedDemo} from '../../scripts/seed-demo.mjs';
import {withRevokedRead} from '../support/faults.mjs';

const routes=['/','/tentang','/tentang/struktur','/tentang/divisi','/tentang/divisi/strategy','/publikasi','/publikasi/artikel','/publikasi/artikel/demo-artikel-01','/publikasi/riset','/publikasi/riset/demo-riset-1','/kegiatan','/kegiatan/demo-kegiatan-1','/galeri','/galeri/demo-album-1','/rekrutmen?kampanye=demo-rekrutmen-2','/partnership','/prestasi','/kontak'];
test.beforeAll(async()=>{const a=JSON.parse(process.env.GIBEI_TEST_ACCOUNTS!);await seedDemo({adminEmail:a.admin.email,adminPassword:a.admin.password,mediaEmail:a.mediaA.email,mediaPassword:a.mediaA.password,benchmark:true});});
for(const width of [320,375,768,1024,1440])test(`all public families fit ${width}px with one readable main heading`,async({page})=>{
 test.setTimeout(90000);await page.setViewportSize({width,height:900});const errors:string[]=[];page.on('pageerror',()=>errors.push('pageerror'));
 for(const route of routes){expect((await page.goto(route))?.status(),route).toBe(200);await expect(page.getByRole('main').getByRole('heading',{level:1})).toHaveCount(1);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route).toBe(true);}
 writeFileSync(`artifacts/a11y-width-${width}.json`,JSON.stringify({width,routes,pageErrors:errors.length},null,2));
 expect(errors).toEqual([]);if(width===375)await page.screenshot({path:'artifacts/T056-contact-mobile.png',fullPage:true});
});
test('all public families pass automated WCAG A/AA and keyboard/200 percent reflow checks',async({page})=>{
 test.setTimeout(180000);
 const findings:{route:string;violations:unknown[]}[]=[];
 for(const route of routes){
  await page.setViewportSize({width:1024,height:900});await page.goto(route);
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).analyze();findings.push({route,violations:audit.violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)}))});
  await page.keyboard.press('Tab');await expect(page.getByRole('link',{name:'Langsung ke konten'})).toBeFocused();await page.keyboard.press('Enter');await expect(page.getByRole('main')).toBeFocused();
  await page.evaluate(()=>{document.documentElement.style.fontSize='200%';});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),route).toBe(true);
 }
 writeFileSync('artifacts/a11y-final.json',JSON.stringify({routes,zoom:'200%',keyboard:true,findings},null,2));
 expect(findings.filter(row=>row.violations.length)).toEqual([]);
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');expect(await page.locator('html').evaluate(e=>getComputedStyle(e).scrollBehavior)).toBe('auto');
});
test('database failure shows safe recovery UI and returns to normal after permission restoration',async({page})=>{
 await withRevokedRead('site_settings',async()=>{
  await page.goto('/');await expect(page.getByRole('heading',{name:'Informasi sementara tidak tersedia.'})).toBeVisible();await expect(page.getByRole('button',{name:'Coba lagi'})).toBeVisible();expect(await page.content()).not.toMatch(/postgresql:\/\/|SELECT .*site_settings|password=/i);
 });
 await page.getByRole('button',{name:'Coba lagi'}).click();await expect(page.getByRole('heading',{level:1})).not.toHaveText('Informasi sementara tidak tersedia.');
});
