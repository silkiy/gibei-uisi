'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useDocumentInfo, useFormModified, useFormProcessing } from '@payloadcms/ui';
import type { Article, ContentReview, User } from '../payload-types';

export function ArticleActions() {
  const router = useRouter();
  const { id, data } = useDocumentInfo();
  const { user } = useAuth<User>();
  const modified = useFormModified(), processing = useFormProcessing();
  const doc = data as Article | undefined;
  const [review, setReview] = useState<ContentReview>();
  const [note, setNote] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!id) return;
    let active = true;
    fetch(`/api/content-reviews?where[article][equals]=${id}&sort=-createdAt&limit=1&depth=0`, { cache: 'no-store' })
      .then(async response => { if (!response.ok) throw Error('Riwayat review gagal dimuat. Muat ulang halaman.'); return response.json(); })
      .then(result => { if (active) { setReview(result.docs[0]); setLoading(false); } })
      .catch(error => { if (active) { setError(error.message); setLoading(false); } });
    return () => { active = false; };
  }, [id, doc?.lockVersion]);
  if (!id || !doc) return <p>Simpan draft terlebih dahulu untuk membuka alur editorial.</p>;
  const admin = user?.role === 'admin', pending = review?.status === 'pending';
  const disabled = busy || loading || modified || processing;
  async function command(action: string) {
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/editorial/articles/${id}/${action}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        expectedLockVersion: doc!.lockVersion,
        expectedRevisionId: ['create-revision', 'withdraw-publication'].includes(action) ? doc!.publicRevision : doc!.workingRevision || doc!.expectedRevisionId,
        ...(['publish', 'request-revision', 'withdraw-submission'].includes(action) ? { submissionId: review?.id } : {}),
        ...(['request-revision', 'withdraw-publication', 'delete-draft'].includes(action) ? { note } : {}),
      }) });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409) throw Error('Konten atau referensi berubah. Muat ulang halaman dan tinjau versi terbaru sebelum mencoba lagi.');
        throw Error(result.errors?.[0]?.message || 'Tindakan editorial gagal.');
      }
      if (action === 'delete-draft') router.push('/admin/collections/articles');
      else window.location.reload();
    } catch (error) { setError((error as Error).message); setBusy(false); }
  }
  const button = (action: string, label: string, reason = false) => <button type="button" disabled={disabled || (reason && !note.trim())} onClick={() => command(action)}>{label}</button>;
  return <section aria-label="Alur editorial" style={{ border: '1px solid var(--theme-elevation-200)', padding: 20, marginBottom: 24 }}>
    <h2>Alur editorial</h2><p>Status editorial: {doc.state}</p>
    <p><a href={`/editorial/preview/${id}`}>Preview privat</a> · <a href={`/admin/collections/content-reviews?where[article][equals]=${id}`}>Riwayat review</a></p>
    {review?.note && <div><strong>Catatan revisi</strong><p>{review.note}</p></div>}
    {modified && <p role="status">Simpan perubahan terlebih dahulu. Tindakan memakai versi yang sudah tersimpan.</p>}
    {error && <p role="alert">{error}</p>}
    {admin && <label style={{ display: 'grid', gap: 8, marginBlock: 12 }}>Alasan editorial<textarea value={note} maxLength={2000} rows={3} onChange={event => setNote(event.target.value)} /></label>}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {doc.workingRevision && ['draft', 'revision_required'].includes(doc.state || '') && button('submit', 'Ajukan review')}
      {pending && doc.state === 'in_review' && button('withdraw-submission', 'Tarik pengajuan')}
      {admin && pending && doc.state === 'in_review' && <>{button('request-revision', 'Minta revisi', true)}{button('publish', 'Terbitkan')}</>}
      {doc.publicRevision && !doc.workingRevision && button('create-revision', 'Buat revisi baru')}
      {admin && doc.workingRevision && ['draft', 'revision_required'].includes(doc.state || '') && button('archive-revision', 'Arsipkan revisi')}
      {admin && doc.publicRevision && button('withdraw-publication', 'Tarik publikasi', true)}
      {admin && !doc.publicRevision && !doc.workingRevision && button('restart-archived', 'Mulai ulang dari arsip')}
      {admin && !doc.publicRevision && doc.workingRevision && ['draft', 'revision_required'].includes(doc.state || '') && button('delete-draft', 'Hapus draft', true)}
    </div>
    <p style={{ marginTop: 12 }}>Perubahan status berlaku setelah server mengonfirmasi. Pengajuan mengunci versi tersimpan beserta asetnya.</p>
  </section>;
}
