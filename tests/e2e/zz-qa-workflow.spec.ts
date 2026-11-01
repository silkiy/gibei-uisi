import { test,expect } from './fixtures';
import { reviewedFixture } from '../support/reviewed.mjs';
test('archive and restart controls follow Admin permissions in both Pages and reviewed CMS',async({adminPage,mediaAPage,page})=>{
  test.setTimeout(120000);adminPage.setDefaultTimeout(10000);mediaAPage.setDefaultTimeout(10000);
  const f=await reviewedFixture('qa-workflow-ui');
  const event=await f.create('events','qa-workflow-ui',{title:'QA workflow event',description:'Isolated regression.',organizer:'QA team',locationType:'offline',location:'QA campus',startAt:'2099-01-01T09:00',endAt:'2099-01-01T11:00'});
  const eventEditor=`/admin/collections/events/${event.id}`;
  await mediaAPage.goto(eventEditor);await expect(mediaAPage.getByRole('button',{name:'Arsipkan revisi',exact:true})).toHaveCount(0);
  await adminPage.goto(eventEditor);await adminPage.getByLabel('Alasan editorial',{exact:true}).fill('Archive QA draft.');await adminPage.getByRole('button',{name:'Arsipkan revisi',exact:true}).click();await expect(adminPage.getByText('Status editorial: archived',{exact:true})).toBeVisible();
  await mediaAPage.reload();await expect(mediaAPage.getByRole('button',{name:'Mulai ulang dari arsip',exact:true})).toHaveCount(0);await expect(mediaAPage.getByRole('button',{name:'Buat revisi baru',exact:true})).toHaveCount(0);
  await adminPage.getByRole('button',{name:'Mulai ulang dari arsip',exact:true}).click();await expect(adminPage.getByText('Status editorial: draft',{exact:true})).toBeVisible();
  await mediaAPage.reload();await mediaAPage.getByRole('button',{name:'Ajukan review',exact:true}).click();await expect(mediaAPage.getByText('Status editorial: in_review',{exact:true})).toBeVisible();
  await adminPage.reload();await adminPage.getByRole('button',{name:'Terbitkan',exact:true}).click();await expect(adminPage.getByText('Status editorial: published',{exact:true})).toBeVisible();
  await mediaAPage.reload();await mediaAPage.getByRole('button',{name:'Buat revisi baru',exact:true}).click();await expect(mediaAPage.getByText('Status editorial: draft',{exact:true})).toBeVisible();
  await adminPage.reload();await adminPage.getByLabel('Alasan editorial',{exact:true}).fill('Keep approved publication.');await adminPage.getByRole('button',{name:'Arsipkan revisi',exact:true}).click();await expect(adminPage.getByText('Status editorial: published',{exact:true})).toBeVisible();
  expect((await page.request.get('/api/public/events/qa-workflow-ui')).status()).toBe(200);
  let home=(await (await f.admin.request('/api/pages?where[pageKey][equals]=homepage&depth=0')).json()).docs[0];
  if(!home){const result=await f.admin.request('/api/pages',{method:'POST',data:{pageKey:'homepage',owner:f.a.user.id,title:'QA page',seoTitle:'QA page',seoDescription:'QA page description',sections:[]}});expect(result.status).toBe(201);home=(await result.json()).doc;}
  const editor=`/admin/collections/pages/${home.id}`;
  await adminPage.goto(editor);await adminPage.getByLabel('Alasan editorial',{exact:true}).fill('Archive QA page revision.');await adminPage.getByRole('button',{name:'Arsipkan revisi',exact:true}).click();
  await expect(adminPage.getByText(`Status editorial: ${home.publicRevision?'published':'archived'}`,{exact:true})).toBeVisible();
  if(home.publicRevision){await adminPage.getByLabel('Alasan editorial',{exact:true}).fill('Withdraw QA page publication.');await adminPage.getByRole('button',{name:'Tarik publikasi',exact:true}).click();await expect(adminPage.getByText('Status editorial: archived',{exact:true})).toBeVisible();}
  await mediaAPage.goto(editor);await expect(mediaAPage.getByRole('button',{name:'Mulai ulang dari arsip',exact:true})).toHaveCount(0);await expect(mediaAPage.getByRole('button',{name:'Buat revisi baru',exact:true})).toHaveCount(0);
  await adminPage.getByRole('button',{name:'Mulai ulang dari arsip',exact:true}).click();await expect(adminPage.getByText('Status editorial: draft',{exact:true})).toBeVisible();
});
