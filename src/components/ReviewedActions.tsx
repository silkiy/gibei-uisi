'use client';

import { useEffect, useState } from 'react';
import { useAuth, useDocumentInfo, useFormModified, useFormProcessing } from '@payloadcms/ui';
import type { User } from '../payload-types';
import type { EditorialDoc, EditorialKind } from '../editorial/reviewed-model';
import { useRouter } from 'next/navigation';
const relationId = (value: number | { id: number } | null | undefined) => typeof value === 'object' && value ? value.id : value;

type EditorPage = EditorialDoc & { state?: string; expectedRevisionId?: number };
type Review = { id: number; status: string; revisionId: number; note?: string | null };

export function ReviewedActions({ kind, collectionSlug }: { kind: EditorialKind; collectionSlug: string }) {
  const router = useRouter();
  const { id, data } = useDocumentInfo();
  const { user } = useAuth<User>();
  const modified = useFormModified(), processing = useFormProcessing();
  const doc = data as EditorPage | undefined;
  const pageId = Number(id);
  const [review, setReview] = useState<Review>();
  const [note, setNote] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isSafeInteger(pageId) || pageId < 1) return;
    let active = true;
    setLoading(true);
    setReview(undefined);
    fetch(`/api/organization-reviews?where[kind][equals]=${kind}&where[entityId][equals]=${pageId}&sort=-id&limit=1&depth=0`, { cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw Error('Riwayat review gagal dimuat. Muat ulang konten.');
        return response.json();
      })
      .then(result => { if (active) { setReview(result.docs[0]); setLoading(false); } })
      .catch(cause => { if (active) { setError((cause as Error).message); setLoading(false); } });
    return () => { active = false; };
  }, [kind, pageId, doc?.lockVersion]);

  if (!Number.isSafeInteger(pageId) || pageId < 1 || !doc) return <p>Simpan konten terlebih dahulu untuk membuka alur editorial.</p>;
  const admin = user?.role === 'admin' && user.status === 'active';
  const workingId = relationId(doc.workingRevision);
  const publicId = relationId(doc.publicRevision);
  const pending = review?.status === 'pending' && review.revisionId === workingId;
  const disabled = busy || loading || !!error || modified || processing;

  async function command(action: string) {
    setBusy(true); setError('');
    try {
      const expectedRevisionId = ['create-revision', 'withdraw-publication'].includes(action)
        ? publicId || (!workingId && action === 'create-revision' ? doc!.expectedRevisionId : undefined)
        : workingId;
      const response = await fetch(`/api/editorial/organization/${kind}/${pageId}/${action}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedLockVersion: doc!.lockVersion, expectedRevisionId,
          ...(['withdraw-submission', 'request-revision', 'publish'].includes(action) ? { submissionId: review?.id } : {}),
          ...(['request-revision', 'archive-revision', 'withdraw-publication', 'delete-draft'].includes(action) ? { note } : {}),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409) throw Error('Konten atau review berubah. Muat ulang dan tinjau versi terbaru sebelum mencoba lagi.');
        throw Error(result.errors?.[0]?.message || 'Tindakan editorial gagal.');
      }
      if (action === 'delete-draft') router.push(`/admin/collections/${collectionSlug}`); else window.location.reload();
    } catch (cause) { setError((cause as Error).message); setBusy(false); }
  }

  const button = (action: string, label: string, reason = false) =>
    <button type="button" disabled={disabled || (reason && !note.trim())} onClick={() => command(action)}>{label}</button>;

  return <section aria-label="Alur editorial konten" style={{ border: '1px solid var(--theme-elevation-200)', padding: 20, marginBottom: 24 }}>
    <h2>Alur editorial konten</h2><p>Status editorial: {doc.state || 'belum tersedia'}</p>
    <p><a href={`/editorial/organization/${kind}/${pageId}`}>Preview privat</a> · <a href={`/admin/collections/organization-reviews?where[kind][equals]=${kind}&where[entityId][equals]=${pageId}`}>Riwayat review</a></p>
    {review?.note && <div><strong>Catatan revisi</strong><p>{review.note}</p></div>}
    {modified && <p role="status">Simpan perubahan terlebih dahulu. Tindakan memakai versi yang sudah tersimpan.</p>}
    {error && <p role="alert">{error}</p>}
    {admin && <label style={{ display: 'grid', gap: 8, marginBlock: 12 }}>Alasan editorial<textarea value={note} maxLength={2000} rows={3} onChange={event => setNote(event.target.value)} /></label>}
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
      {workingId && ['draft', 'revision_required'].includes(doc.state || '') && button('submit', 'Ajukan review')}
      {pending && doc.state === 'in_review' && button('withdraw-submission', 'Tarik pengajuan')}
      {admin && pending && doc.state === 'in_review' && <>{button('request-revision', 'Minta revisi', true)}{button('publish', 'Terbitkan')}</>}
      {!workingId && publicId && button('create-revision', 'Buat revisi baru')}
      {admin && !workingId && !publicId && doc.state === 'archived' && button('create-revision', 'Mulai ulang dari arsip')}
      {admin && workingId && ['draft', 'revision_required'].includes(doc.state || '') && button('archive-revision', 'Arsipkan revisi', true)}
      {admin && publicId && button('withdraw-publication', 'Tarik publikasi', true)}
      {admin && kind !== 'divisions' && !publicId && workingId && ['draft', 'revision_required'].includes(doc.state || '') && button('delete-draft', 'Hapus draft', true)}
    </div>
    <p style={{ marginTop: 12 }}>Perubahan status berlaku setelah server mengonfirmasi. Pengajuan mengunci versi tersimpan.</p>
  </section>;
}
