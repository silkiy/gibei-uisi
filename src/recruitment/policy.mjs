import { settingsText } from '../validation/navigation.mjs';
import { safeExternalURL } from '../content/links.mjs';
import { utcTimestamp } from '../events/status.mjs';
import { nextBoundary } from '../events/deadline.mjs';

export function validateRecruitment(data, complete=false) {
  if (Object.hasOwn(data,'enabledByAdmin')) throw Error('Aktivasi terpisah dari isi editorial');
  for(const [key,max] of [['title',240],['description',6000]]) if(!settingsText(data[key],max,key==='description') || complete && !data[key]?.trim()) throw Error('Judul/deskripsi rekrutmen wajib');
  if(!Number.isSafeInteger(data.period) || data.period<1) throw Error('Periode terbit wajib');
  for(const key of ['opensAt','closesAt']) { if(data[key]) utcTimestamp(data[key]); else if(complete) throw Error('Waktu buka/tutup wajib'); }
  if(data.opensAt && data.closesAt && Date.parse(utcTimestamp(data.closesAt))<=Date.parse(utcTimestamp(data.opensAt))) throw Error('Tutup harus setelah buka');
  if(typeof data.registrationConfirmed!=='boolean' || data.registrationURL && !safeExternalURL(data.registrationURL) || data.registrationConfirmed && !data.registrationURL) throw Error('Tujuan pendaftaran tidak valid');
  for(const [key,fields] of [['positions',['title','requirements']],['selectionStages',['title','description']]]) {
    const rows=data[key]; if(!Array.isArray(rows)||rows.length>30||complete&&!rows.length) throw Error('Posisi dan tahapan wajib sebelum publikasi');
    for(const row of rows) {
      if(!row||typeof row!=='object'||Object.keys(row).some(field=>!['id',...fields,...(key==='positions'?['division']:[])].includes(field))) throw Error('Field posisi/tahapan tidak valid');
      for(const field of fields) if(!settingsText(row[field],field==='title'?160:3000,field!=='title')||complete&&!row[field]?.trim()) throw Error('Persyaratan/tahapan tidak lengkap');
      if(row.division!=null&&(!Number.isSafeInteger(row.division)||row.division<1)) throw Error('Divisi tidak valid');
    }
  }
}
export function recruitmentStatus(campaign,enabled,now=Date.now()) {
  const start=Date.parse(campaign.opensAt),end=Date.parse(campaign.closesAt),valid=Number.isFinite(start)&&Number.isFinite(end)&&end>start&&Number.isFinite(now);
  const status=!valid?'unavailable':!enabled?'disabled':now<start?'not_open':now<end?'open':'closed';
  const url=safeExternalURL(campaign.registrationURL),canRegister=status==='open'&&campaign.registrationConfirmed===true&&!!url;
  return {status,enabledByAdmin:enabled,canRegister,registrationURL:canRegister?url:null,serverNow:now,refreshAt:nextBoundary([campaign.opensAt,campaign.closesAt],now)};
}
