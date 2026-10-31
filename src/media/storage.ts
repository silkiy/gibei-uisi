import path from 'node:path';
import { mkdir, writeFile, readFile, rm, lstat, realpath } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export const digest = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
export function storageRoot() {
  const runId = process.env.GIBEI_TEST_RUN_ID;
  if (runId && !/^[a-f0-9]{12}$/.test(runId)) throw Error('Invalid media test run');
  return runId ? path.join(process.cwd(), '.tools', 'test-databases', runId, 'assets') : path.join(process.cwd(), 'storage', 'private');
}
async function directory(key: string) {
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(key)) throw Error('Invalid asset key');
  const root = storageRoot(); await mkdir(root, { recursive: true });
  if ((await lstat(root)).isSymbolicLink()) throw Error('Storage symlinks are not allowed');
  const target = path.join(root, key);
  try { if ((await lstat(target)).isSymbolicLink() || !(await realpath(target)).startsWith(await realpath(root) + path.sep)) throw Error('Invalid asset directory'); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  return target;
}
export async function writeAsset(key: string, original: Buffer, thumbnail: Buffer | null) {
  const target = await directory(key);
  await mkdir(target); // UUID directory must be new; never replace an existing file.
  try {
    await writeFile(path.join(target, 'original'), original, { flag: 'wx' });
    if (thumbnail) await writeFile(path.join(target, 'thumbnail'), thumbnail, { flag: 'wx' });
  } catch (error) { await removeAsset(key); throw error; }
}
export async function readAsset(key: string, variant: 'original' | 'thumbnail') {
  const file = path.join(await directory(key), variant);
  if ((await lstat(file)).isSymbolicLink()) throw Error('Asset symlinks are not allowed');
  return readFile(file);
}
export async function removeAsset(key: string) {
  const target = await directory(key);
  await rm(target, { recursive: true, force: true });
}
export async function assetFilesExist(key: string, size: number, thumbnail: boolean) {
  try {
    const target = await directory(key);
    const original = await lstat(path.join(target, 'original'));
    if (!original.isFile() || original.isSymbolicLink() || original.size !== size) return false;
    if (thumbnail) { const file = await lstat(path.join(target, 'thumbnail')); if (!file.isFile() || file.isSymbolicLink() || !file.size) return false; }
    return true;
  } catch { return false; }
}
