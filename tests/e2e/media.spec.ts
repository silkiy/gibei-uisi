import sharp from 'sharp';
import { test, expect } from './fixtures';

test('Media uploads a validated private image through CMS', async ({ mediaAPage }) => {
  const page = mediaAPage;
  await page.goto('/admin/collections/media');
  const bytes = await sharp({ create: { width: 32, height: 24, channels: 3, background: '#123456' } }).png().toBuffer();
  await page.getByLabel(/File JPEG/).setInputFiles({ name: 'browser-upload.png', mimeType: 'image/png', buffer: bytes });
  await page.getByLabel('Deskripsi alternatif').fill('Ilustrasi browser privat');
  await page.getByRole('button', { name: 'Upload file', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/collections\/media\/\d+$/);
  await expect(page.getByLabel(/^Name/)).toHaveValue('browser-upload.png');
  await expect(page.getByLabel(/^Alt/)).toHaveValue('Ilustrasi browser privat');
  await page.reload();
  await expect(page.getByLabel(/^Alt/)).toHaveValue('Ilustrasi browser privat');
});
