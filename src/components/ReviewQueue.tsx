'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@payloadcms/ui';
import type { ContentReview, User } from '../payload-types';

export function ReviewQueue() {
  const { user } = useAuth<User>();
  const [rows, setRows] = useState<ContentReview[]>([]), [error, setError] = useState('');
  const [page, setPage] = useState(1), [pages, setPages] = useState(1);
  useEffect(() => {
    if (user?.role !== 'admin') return;
    let active = true;
    fetch(`/api/content-reviews?where[status][equals]=pending&sort=createdAt&limit=20&page=${page}&depth=0`, { cache: 'no-store' })
      .then(async response => { if (!response.ok) throw Error('Antrean gagal dimuat. Muat ulang halaman.'); return response.json(); })
      .then(result => { if (active) { setRows(result.docs); setPages(result.totalPages || 1); } })
      .catch(error => { if (active) setError(error.message); });
    return () => { active = false; };
  }, [user?.role, page]);
  if (user?.role !== 'admin') return null;
  return <section style={{ marginBottom: 32 }} aria-label="Antrean review"><h2>Antrean review</h2>
    {error && <p role="alert">{error}</p>}
    {!rows.length && !error && <p>Belum ada pengajuan dalam antrean.</p>}
    <ul>{rows.map(row => {
      const manifest = row.manifest as { title?: string };
      return <li key={row.id}><a href={`/admin/collections/articles/${row.article}`}>Tinjau: {manifest.title || `Artikel ${row.article}`}</a> — versi {row.editVersion}</li>;
    })}</ul>
    <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>Antrean sebelumnya</button>{' '}
    <button type="button" disabled={page >= pages} onClick={() => setPage(page + 1)}>Antrean berikutnya</button>
  </section>;
}
