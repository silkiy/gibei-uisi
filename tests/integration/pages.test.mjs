import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { fixtureAccounts, authenticate, httpClient } from '../support/http.mjs';

let admin, mediaA, mediaB, anonymous, homepage, about;
const sections = [
  { blockType: 'hero', heading: 'Welcome to GIBEI', summary: 'Learn about the capital market.' },
  { blockType: 'profile', heading: 'About us', description: 'A campus investment gallery.\nA place to learn together.',
    history: 'Founded on campus.\r\nGrowing through education.', vision: 'Learn responsibly.\nShare knowledge.', mission: 'Education.\nCollaboration.' },
  { blockType: 'program', heading: 'Education', description: 'Public learning programs.' },
  { blockType: 'cta', heading: 'Read more', label: 'Our story', url: '/tentang' },
];
const command = (actor, doc, action, extra = {}) => actor.request(`/api/editorial/pages/${doc.id}/${action}`, {
  method: 'POST',
  data: {
    expectedLockVersion: doc.lockVersion,
    expectedRevisionId: action === 'withdraw-publication' ? doc.publicRevision : doc.workingRevision || doc.publicRevision || doc.expectedRevisionId,
    ...extra,
  },
});
const page = async (actor, id) => {
  const response = await actor.request(`/api/pages/${id}`);
  assert.equal(response.status, 200);
  return response.json();
};

before(async () => {
  const accounts = fixtureAccounts();
  admin = await authenticate(accounts.admin);
  mediaA = await authenticate(accounts.mediaA);
  mediaB = await authenticate(accounts.mediaB);
  anonymous = { request: httpClient(process.env.SERVER_URL) };
  for (const [key, assignee] of [['homepage', mediaB], ['about', mediaA]]) {
    const response = await admin.request('/api/pages', { method: 'POST', data: {
      pageKey: key, owner: admin.user.id, assignedTo: [assignee.user.id],
      title: `Draft ${key}`, seoTitle: `SEO ${key}`, seoDescription: `Description ${key}`, sections,
    } });
    assert.equal(response.status, 201, `${key} is created by Admin`);
    const doc = (await response.json()).doc;
    if (key === 'homepage') homepage = doc;
    else about = doc;
  }
});

test('Admin creates one homepage and one about page with distinct fixed identities', async () => {
  assert.notEqual(homepage.id, about.id);
  assert.equal(homepage.pageKey, 'homepage');
  assert.equal(about.pageKey, 'about');
  for (const doc of [homepage, about]) {
    assert.equal(doc.state, 'draft');
    assert.equal(doc.createdBy, admin.user.id);
    assert.equal(doc.owner, admin.user.id);
    assert.ok(doc.workingRevision);
    assert.equal(doc.publicRevision, null);
    assert.equal(doc.sections.length, 4);
    assert.equal(doc.sections[1].description, sections[1].description);
    assert.equal(doc.sections[1].history, sections[1].history);
    const duplicate = await admin.request('/api/pages', { method: 'POST', data: { pageKey: doc.pageKey, title: 'Duplicate', sections: [] } });
    assert.ok([400, 409].includes(duplicate.status), 'A pageKey cannot be created twice');
  }
  const list = await admin.request('/api/pages?pagination=false');
  assert.equal(list.status, 200);
  const docs = (await list.json()).docs;
  assert.equal(docs.filter(doc => doc.pageKey === 'homepage').length, 1);
  assert.equal(docs.filter(doc => doc.pageKey === 'about').length, 1);
  assert.equal((await mediaA.request('/api/pages', { method: 'POST', data: { pageKey: 'homepage' } })).status, 403);
});

test('assigned Media saves, resubmits after a review note, and Admin publishes the reviewed page', async () => {
  assert.equal((await anonymous.request(`/api/pages/${homepage.id}`)).status, 403);
  assert.equal((await mediaA.request(`/api/pages/${homepage.id}`)).status, 404);
  assert.equal((await mediaA.request(`/api/editorial/pages/${homepage.id}/submit`, { method: 'POST', data: {
    expectedLockVersion: homepage.lockVersion, expectedRevisionId: homepage.workingRevision,
  } })).status, 404);

  const save = await mediaB.request(`/api/pages/${homepage.id}`, { method: 'PATCH', data: {
    expectedLockVersion: homepage.lockVersion, title: 'Welcome, reviewed draft', seoTitle: 'GIBEI homepage',
    sections: [...sections.slice(0, 3), { ...sections[3], url: 'https://www.idx.co.id/' }],
  } });
  assert.equal(save.status, 200);
  let working = (await save.json()).doc;
  assert.equal(working.title, 'Welcome, reviewed draft');
  assert.equal(working.sections[3].url, 'https://www.idx.co.id/');
  assert.equal(working.workingRevision, homepage.workingRevision);
  assert.equal((await mediaB.request(`/api/pages/${homepage.id}`, { method: 'PATCH', data: {
    expectedLockVersion: homepage.lockVersion, title: 'Stale edit',
  } })).status, 409);

  const firstSubmit = await command(mediaB, working, 'submit');
  assert.equal(firstSubmit.status, 200);
  const pending = await firstSubmit.json();
  assert.equal(pending.doc.state, 'in_review');
  assert.equal(pending.submission.status, 'pending');
  assert.equal(pending.submission.revision, working.workingRevision);
  assert.equal(pending.submission.manifest.title, working.title);
  assert.equal(pending.submission.manifest.sections[3].url, 'https://www.idx.co.id/');
  assert.equal(pending.submission.manifest.sections[1].mission, sections[1].mission);
  assert.equal(pending.submission.manifestDigest.length, 64);
  assert.equal((await mediaB.request(`/api/pages/${homepage.id}`, { method: 'PATCH', data: {
    expectedLockVersion: pending.doc.lockVersion, title: 'Edit in review',
  } })).status, 409);
  assert.equal((await command(mediaB, pending.doc, 'publish', { submissionId: pending.submission.id })).status, 403);
  assert.equal((await command(mediaB, pending.doc, 'request-revision', { submissionId: pending.submission.id, note: 'Not my decision' })).status, 403);
  assert.equal((await command(admin, pending.doc, 'request-revision', { submissionId: pending.submission.id, note: '' })).status, 400);

  const review = await command(admin, pending.doc, 'request-revision', { submissionId: pending.submission.id, note: 'Clarify the introduction.' });
  assert.equal(review.status, 200);
  const requested = await review.json();
  assert.equal(requested.doc.state, 'revision_required');
  assert.equal(requested.submission.status, 'changes_requested');
  assert.equal(requested.submission.note, 'Clarify the introduction.');
  assert.equal(requested.submission.reviewerId, admin.user.id);
  assert.equal((await (await mediaB.request(`/api/page-reviews/${pending.submission.id}`)).json()).note, 'Clarify the introduction.');
  assert.equal((await mediaA.request(`/api/page-reviews/${pending.submission.id}`)).status, 404);

  const amended = await mediaB.request(`/api/pages/${homepage.id}`, { method: 'PATCH', data: {
    expectedLockVersion: requested.doc.lockVersion, title: 'Welcome to the investment gallery',
  } });
  assert.equal(amended.status, 200);
  working = (await amended.json()).doc;
  assert.equal(working.state, 'revision_required');
  assert.equal(working.sections[3].url, 'https://www.idx.co.id/');
  const resubmission = await command(mediaB, working, 'submit');
  assert.equal(resubmission.status, 200);
  const reviewed = await resubmission.json();
  assert.notEqual(reviewed.submission.id, pending.submission.id);
  assert.equal(reviewed.submission.manifest.title, working.title);
  assert.equal((await command(admin, reviewed.doc, 'publish', { submissionId: pending.submission.id })).status, 409);
  const publication = await command(admin, reviewed.doc, 'publish', { submissionId: reviewed.submission.id });
  assert.equal(publication.status, 200);
  const published = (await publication.json()).doc;
  assert.equal(published.state, 'published');
  assert.equal(published.publicRevision, working.workingRevision);
  assert.equal(published.workingRevision, null);
  assert.equal((await (await admin.request(`/api/page-reviews/${reviewed.submission.id}`)).json()).status, 'approved');

  const next = await command(mediaB, published, 'create-revision');
  assert.equal(next.status, 200);
  const revision = (await next.json()).doc;
  assert.notEqual(revision.workingRevision, published.publicRevision);
  assert.equal(revision.publicRevision, published.publicRevision);
  assert.equal(revision.title, published.title);
  assert.equal(revision.sections[1].description, sections[1].description);
  assert.equal((await command(mediaB, revision, 'create-revision')).status, 409);
  const edited = await mediaB.request(`/api/pages/${homepage.id}`, { method: 'PATCH', data: {
    expectedLockVersion: revision.lockVersion, title: 'Private replacement title',
  } });
  assert.equal(edited.status, 200);
  const privateDraft = (await edited.json()).doc;
  assert.equal(privateDraft.title, 'Private replacement title');
  assert.equal(privateDraft.publicRevision, published.publicRevision, 'A working draft cannot move the public pointer');
  assert.equal((await page(admin, homepage.id)).publicRevision, published.publicRevision);
  const replacement = await command(mediaB, privateDraft, 'submit');
  assert.equal(replacement.status, 200);
  const waiting = await replacement.json();
  assert.equal(waiting.doc.publicRevision, published.publicRevision, 'Review does not publish a replacement');
  assert.equal((await page(admin, homepage.id)).publicRevision, published.publicRevision);
  const replacementPublication = await command(admin, waiting.doc, 'publish', { submissionId: waiting.submission.id });
  assert.equal(replacementPublication.status, 200);
  const current = (await replacementPublication.json()).doc;
  assert.equal(current.publicRevision, privateDraft.workingRevision);
  assert.notEqual(current.publicRevision, published.publicRevision);
  assert.equal(current.workingRevision, null);
  assert.equal(current.title, 'Private replacement title');

  const history = await admin.request('/api/page-audit?pagination=false');
  assert.equal(history.status, 200);
  const entries = (await history.json()).docs.filter(entry => entry.page === homepage.id);
  assert.deepEqual(entries.map(entry => entry.action).sort(), [
    'draft_created', 'draft_saved', 'draft_saved', 'draft_saved', 'published', 'published',
    'revision_created', 'revision_requested', 'submitted', 'submitted', 'submitted',
  ].sort());
  assert.ok(entries.every(entry => entry.correlationId && entry.revisionId && entry.actorId));
  assert.equal(entries.find(entry => entry.action === 'revision_requested').actorId, admin.user.id);
  assert.equal((await mediaB.request('/api/page-audit')).status, 403);
  assert.equal((await anonymous.request('/api/page-audit')).status, 403);
});

test('page identity, CTA allowlist, workflow state and ownership cannot be spoofed', async () => {
  for (const url of ['javascript:alert(1)', 'http://example.com/', '//example.com/', 'https://user:pass@example.com/']) {
    const response = await mediaA.request(`/api/pages/${about.id}`, { method: 'PATCH', data: {
      expectedLockVersion: about.lockVersion, sections: [{ blockType: 'cta', heading: 'Bad link', label: 'Click', url }],
    } });
    assert.equal(response.status, 400, `${url} is not an allowed CTA`);
  }
  for (const data of [
    { pageKey: 'homepage' }, { publicRevision: 999 }, { workingRevision: 999 },
    { createdBy: mediaA.user.id }, { state: 'published' }, { owner: mediaA.user.id }, { assignedTo: [mediaB.user.id] },
  ]) {
    const response = await mediaA.request(`/api/pages/${about.id}`, { method: 'PATCH', data: {
      expectedLockVersion: about.lockVersion, ...data,
    } });
    assert.equal(response.status, 403, `Media cannot spoof ${Object.keys(data)[0]}`);
  }
  assert.equal((await mediaB.request(`/api/pages/${about.id}`)).status, 404);
  assert.equal((await mediaB.request(`/api/pages/${about.id}`, { method: 'PATCH', data: {
    expectedLockVersion: about.lockVersion, title: 'Guessed page',
  } })).status, 404);
  assert.equal((await anonymous.request('/api/pages')).status, 403);
  assert.equal((await admin.request(`/api/pages/${about.id}`, { method: 'DELETE' })).status, 403);
  for (const collection of ['page-revisions', 'page-reviews', 'page-audit']) {
    assert.equal((await admin.request(`/api/${collection}`, { method: 'POST', data: {
      page: about.id, state: 'published', status: 'approved', context: { editorialWrite: true },
    } })).status, 403);
  }
  assert.equal((await mediaA.request('/api/page-revisions')).status, 403);
  assert.equal((await page(admin, about.id)).lockVersion, about.lockVersion, 'Denied writes leave the draft unchanged');
});

test('withdrawal archives a published page and cancels a pending replacement without losing its draft', async () => {
  let published = await page(admin, homepage.id);
  const first = await command(admin, published, 'withdraw-publication', { note: 'Perlu pembaruan konten.' });
  assert.equal(first.status, 200);
  const withdrawn = (await first.json()).doc;
  assert.equal(withdrawn.publicRevision, null);
  assert.equal(withdrawn.workingRevision, null);
  assert.equal(withdrawn.state, 'archived');
  assert.equal((await command(admin, published, 'withdraw-publication', { note: 'Stale' })).status, 409);

  const restarted = await command(admin, withdrawn, 'create-revision');
  assert.equal(restarted.status, 200);
  const draft = (await restarted.json()).doc;
  assert.equal(draft.state, 'draft');
  assert.ok(draft.workingRevision);
  const submitted = await (await command(admin, draft, 'submit')).json();
  published = (await (await command(admin, submitted.doc, 'publish', { submissionId: submitted.submission.id })).json()).doc;
  const revision = (await (await command(admin, published, 'create-revision')).json()).doc;
  const pending = await (await command(admin, revision, 'submit')).json();
  const second = await command(admin, pending.doc, 'withdraw-publication', { note: 'Tinjau ulang isi terbit.' });
  assert.equal(second.status, 200);
  const current = (await second.json()).doc;
  assert.equal(current.publicRevision, null);
  assert.equal(current.workingRevision, revision.workingRevision);
  assert.equal(current.state, 'draft');
  assert.equal((await (await admin.request(`/api/page-reviews/${pending.submission.id}`)).json()).status, 'cancelled');
  assert.equal((await command(admin, current, 'publish', { submissionId: pending.submission.id })).status, 409);
  const fresh = await command(admin, current, 'submit');
  assert.equal(fresh.status, 200);
  assert.notEqual((await fresh.json()).submission.id, pending.submission.id);
});
