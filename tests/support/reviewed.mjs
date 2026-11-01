import assert from 'node:assert/strict';
import { editorialFixture } from './editorial.mjs';

export async function reviewedFixture(prefix) {
  const f = await editorialFixture(prefix);
  const roots = { periods: 'organizational-periods', divisions: 'divisions', members: 'members', research: 'research-publications', events: 'events', recruitment: 'recruitment-periods' };
  async function create(kind, slug, fields = {}, actor = f.admin) {
    const response = await actor.request(`/api/${roots[kind]}`, { method: 'POST', data: { [kind === 'periods' ? 'label' : 'slug']: slug, owner: f.a.user.id, ...fields } });
    assert.equal(response.status, 201, `Create reviewed ${kind}`); return (await response.json()).doc;
  }
  async function read(kind, doc) { const result = await f.admin.request(`/api/${roots[kind]}/${doc.id}`); assert.equal(result.status, 200); return result.json(); }
  async function save(kind, doc, fields, actor = f.a) { const result = await actor.request(`/api/${roots[kind]}/${doc.id}`, { method: 'PATCH', data: { expectedLockVersion: doc.lockVersion, ...fields } }); assert.equal(result.status, 200); return (await result.json()).doc; }
  const command = (kind, doc, action, extra = {}, actor = f.admin) => actor.request(`/api/editorial/organization/${kind}/${doc.id}/${action}`, { method: 'POST', data: {
    expectedLockVersion: doc.lockVersion, expectedRevisionId: ['create-revision', 'withdraw-publication'].includes(action) ? doc.publicRevision || doc.expectedRevisionId : doc.workingRevision, ...extra,
  } });
  async function submit(kind, doc) { const result = await command(kind, doc, 'submit', {}, f.a); assert.equal(result.status, 200); return result.json(); }
  async function publish(kind, doc) { const pending = await submit(kind, doc); const result = await command(kind, pending.doc, 'publish', { submissionId: pending.submission.id }); assert.equal(result.status, 200); return (await result.json()).doc; }
  async function revision(kind, doc) { const result = await command(kind, doc, 'create-revision', {}, f.a); assert.equal(result.status, 200); return (await result.json()).doc; }
  return { ...f, roots, create, read, save, command, submitReviewed: submit, publishReviewed: publish, revision };
}
