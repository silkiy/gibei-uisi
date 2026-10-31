'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export function MediaUpload() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('Memvalidasi file…');
    const data = new FormData(event.currentTarget);
    const file = data.get('file') as File;
    try {
      const response = await fetch('/api/media/upload', { method: 'POST', headers: { 'Content-Type': file.type, 'X-Filename': encodeURIComponent(file.name), 'X-Alt': encodeURIComponent(String(data.get('alt'))) }, body: file });
      const result = await response.json();
      if (!response.ok) throw Error(result.errors?.[0]?.message || 'Upload gagal');
      router.push(`/admin/collections/media/${result.doc.id}`);
    } catch (error) { setMessage((error as Error).message); } finally { setBusy(false); }
  }
  return <form onSubmit={upload} style={{ marginBottom: 24, display: 'grid', gap: 12, maxWidth: 620 }}>
    <h2>Upload privat</h2>
    <label>File JPEG/PNG/WebP (5 MiB) atau PDF (15 MiB)<input name="file" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required disabled={busy} /></label>
    <label>Deskripsi alternatif<input name="alt" type="text" maxLength={300} required disabled={busy} /></label>
    <button type="submit" disabled={busy}>Upload file</button>
    <p role="status">{message}</p>
  </form>;
}
