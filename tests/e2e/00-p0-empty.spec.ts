import { test,expect } from './fixtures';
test('P0 routes have useful empty states without inventing official content',async({page})=>{
  await page.goto('/');await expect(page.getByRole('heading',{name:'Belum ada artikel terbit.'})).toBeVisible();await expect(page.getByRole('heading',{name:'Belum ada riset terbit.'})).toBeVisible();await expect(page.getByRole('link',{name:/Daftar sekarang/})).toHaveCount(0);
  for(const [path,text] of [['/publikasi','Belum ada artikel terbit.'],['/rekrutmen','Informasi rekrutmen belum tersedia.'],['/kegiatan','Belum ada kegiatan yang sesuai.'],['/kontak','Kontak dan kanal resmi sedang dikonfirmasi.']]) {
    const response=await page.goto(path);expect(response?.status()).toBe(200);await expect(page.getByRole('main').getByText(text,{exact:true})).toBeVisible();
  }
});
