import { test, expect } from './fixtures';
import { reviewedFixture } from '../support/reviewed.mjs';

test('published event archive and warm detail remove registration at the server deadline', async ({ page }) => {
  test.setTimeout(90000);
  const f=await reviewedFixture('events-public');
  const fields={title:'Kegiatan batas waktu contoh',description:'Diskusi edukasi contoh.',organizer:'Tim Contoh',locationType:'offline',location:'Kampus contoh',startAt:'2099-01-01T09:00+07:00',endAt:'2099-01-01T12:00+07:00'};
  const draft=await f.create('events','event-private-browser',fields);
  expect((await page.goto(`/kegiatan/${draft.slug}`))?.status()).toBe(404);
  const past=await f.publishReviewed('events',await f.create('events','event-archive-browser',{...fields,title:'Arsip kegiatan contoh',startAt:'2020-01-01T09:00+07:00',endAt:'2020-01-01T12:00+07:00'}));
  await page.goto('/kegiatan?status=completed'); await expect(page.getByRole('link',{name:/Arsip kegiatan contoh/})).toBeVisible();
  await page.goto(`/kegiatan/${past.slug}`); await expect(page.getByRole('heading',{name:'Arsip kegiatan contoh'})).toBeVisible(); await expect(page.getByRole('link',{name:/Daftar sekarang/})).toHaveCount(0);
  const close=new Date(Date.now()+15000).toISOString();
  let live=await f.publishReviewed('events',await f.create('events','event-deadline-browser',{...fields,registrationStatus:'open',registrationURL:'https://example.com/register',registrationConfirmed:true,registrationClosesAt:close}));
  await page.goto(`/kegiatan/${live.slug}`);
  await expect(page.getByRole('link',{name:/Daftar sekarang/})).toHaveAttribute('href','https://example.com/register');
  await expect(page.getByRole('link',{name:/Daftar sekarang/})).toHaveCount(0,{timeout:20000});
  expect((await (await page.request.get(`/api/public/events/${live.slug}`)).json()).canRegister).toBe(false);
  live=await f.revision('events',live); live=await f.save('events',live,{cancelled:true,cancellationNote:'Dibatalkan untuk pengujian.'}); live=await f.publishReviewed('events',live);
  await page.reload(); await expect(page.getByText('Kegiatan dibatalkan: Dibatalkan untuk pengujian.')).toBeVisible();
  await page.setViewportSize({width:375,height:812}); await page.screenshot({path:'artifacts/T036-mobile.png',fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
