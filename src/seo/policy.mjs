export function canonicalURL(path, base = process.env.SERVER_URL || 'http://127.0.0.1:3000') {
  const origin=new URL(base);
  if (origin.username || origin.password || origin.pathname!=='/' || origin.search || origin.hash || (origin.protocol!=='https:' && !(origin.protocol==='http:' && ['localhost','127.0.0.1'].includes(origin.hostname)))) throw Error('SERVER_URL must be an HTTPS origin or local HTTP origin');
  if (typeof path!=='string' || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) throw Error('Canonical path must be internal');
  return new URL(path,origin).href;
}
export const jsonLD=value=>JSON.stringify(value).replace(/</g,'\\u003c');
