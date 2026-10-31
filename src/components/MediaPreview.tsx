import type { Media } from '../payload-types';

export function MediaPreview({ data }: { data?: Partial<Media> }) {
  if (!data?.key || data.state !== 'ready') return <p>File tidak tersedia.</p>;
  const base = `/api/media/${encodeURIComponent(data.key)}`;
  return <p>
    <a href={`${base}/original`} target="_blank" rel="noopener noreferrer">Buka file privat</a>
    {data.hasThumbnail && <> · <a href={`${base}/thumbnail`} target="_blank" rel="noopener noreferrer">Buka thumbnail privat</a></>}
  </p>;
}
