import type { Field } from 'payload';

const blocks: Extract<Field, { type: 'blocks' }>['blocks'] = [
  { slug: 'hero', fields: [
    { name: 'heading', type: 'text', maxLength: 160, required: true },
    { name: 'summary', type: 'textarea', maxLength: 600, required: true },
  ] },
  { slug: 'profile', fields: [
    { name: 'heading', type: 'text', maxLength: 160, required: true },
    { name: 'description', type: 'textarea', maxLength: 3000, required: true },
    { name: 'history', type: 'textarea', maxLength: 3000 },
    { name: 'vision', type: 'textarea', maxLength: 1200 },
    { name: 'mission', type: 'textarea', maxLength: 2000 },
  ] },
  { slug: 'program', fields: [
    { name: 'heading', type: 'text', maxLength: 160, required: true },
    { name: 'description', type: 'textarea', maxLength: 1200, required: true },
  ] },
  { slug: 'cta', fields: [
    { name: 'heading', type: 'text', maxLength: 160, required: true },
    { name: 'description', type: 'textarea', maxLength: 600 },
    { name: 'label', type: 'text', maxLength: 100, required: true },
    { name: 'url', type: 'text', maxLength: 2048, required: true },
  ] },
];

export function pageDraftFields(virtual = false): Field[] {
  return [
    { name: 'title', type: 'text', maxLength: 160, virtual, admin: { readOnly: false } },
    { name: 'seoTitle', type: 'text', maxLength: 160, virtual, admin: { readOnly: false } },
    { name: 'seoDescription', type: 'textarea', maxLength: 300, virtual, admin: { readOnly: false } },
    { name: 'sections', type: 'blocks', blocks, maxRows: 20, virtual, admin: { readOnly: false } },
  ];
}
