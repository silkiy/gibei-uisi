import type { Field } from 'payload';
import { revisionAssetsField } from './reviewed-model';

export function p1Fields(kind: string, virtual: boolean): Field[] {
  const text = (name: string, multiline = false): Field => (multiline ? { name, type: 'textarea', maxLength: name === 'caption' ? 600 : 6000, virtual, admin: { readOnly: false } } : { name, type: 'text', maxLength: name === 'date' ? 10 : name === 'videoURL' || name === 'website' ? 2048 : name === 'alt' ? 300 : 240, virtual, admin: { readOnly: false } });
  const image = (name: string): Field => ({ name, type: 'relationship', relationTo: 'media', maxDepth: 0, virtual, admin: { readOnly: false } });
  return [text('title'), text('description', true), { name: 'example', label: 'Data contoh (bukan fakta resmi)', type: 'checkbox', defaultValue: true, virtual, admin: { readOnly: false } },
    ...(kind === 'galleries' ? [text('date'), { name: 'event', type: 'relationship', relationTo: 'events', maxDepth: 0, virtual, admin: { readOnly: false } } as Field,
      { name: 'photos', type: 'array', maxRows: 30, virtual, admin: { readOnly: false }, fields: [image('asset'), text('alt'), text('caption', true)].map(field => ({ ...field, virtual: false })) } as Field, text('videoURL')]
      : kind === 'partners' ? [text('collaboration'), text('website'), image('logo'), { name: 'showOnHomepage', type: 'checkbox', defaultValue: false, virtual, admin: { readOnly: false } } as Field]
      : [text('date'), text('category'), text('recipient'), image('documentation')]), revisionAssetsField(virtual)];
}
