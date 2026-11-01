import type { Field } from 'payload';
import { isActiveAdmin } from '../auth/policy';
export function recruitmentFields(virtual:boolean):Field[] {
  const time=(name:string,label:string):Field=>({name,label,type:'text',virtual,admin:{readOnly:false,description:'WIB (Asia/Jakarta), YYYY-MM-DDTHH:mm. Tanpa offset dibaca +07:00; disimpan UTC.'}});
  return [
    {name:'title',type:'text',maxLength:240,virtual,admin:{readOnly:false}}, {name:'description',type:'textarea',maxLength:6000,virtual,admin:{readOnly:false}},
    {name:'period',label:'Periode kepengurusan tujuan (wajib terbit)',type:'relationship',relationTo:'organizational-periods',maxDepth:0,virtual,admin:{readOnly:false}},
    {name:'positions',label:'Posisi dan persyaratan',type:'array',maxRows:30,virtual,admin:{readOnly:false},fields:[{name:'title',type:'text',maxLength:160},{name:'division',type:'relationship',relationTo:'divisions',maxDepth:0},{name:'requirements',type:'textarea',maxLength:3000}]},
    {name:'selectionStages',label:'Tahapan seleksi',type:'array',maxRows:30,virtual,admin:{readOnly:false},fields:[{name:'title',type:'text',maxLength:160},{name:'description',type:'textarea',maxLength:3000}]},
    time('opensAt','Rekrutmen dibuka (WIB)'),time('closesAt','Rekrutmen ditutup (WIB)'),
    {name:'registrationURL',label:'URL pendaftaran HTTPS',type:'text',maxLength:2048,virtual,admin:{readOnly:false}},
    {name:'registrationConfirmed',label:'Tujuan pendaftaran dikonfirmasi Admin',type:'checkbox',defaultValue:false,virtual,admin:{readOnly:false},...(virtual?{access:{create:({req})=>isActiveAdmin(req.user),update:({req})=>isActiveAdmin(req.user)}}:{})},
  ];
}
