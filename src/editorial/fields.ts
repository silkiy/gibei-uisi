import type { Field } from 'payload';
import { lexicalEditor, ParagraphFeature, BoldFeature, ItalicFeature, HeadingFeature, OrderedListFeature, UnorderedListFeature, FixedToolbarFeature } from '@payloadcms/richtext-lexical';
import { isActiveAdmin } from '../auth/policy';

const editor = lexicalEditor({ features: () => [ParagraphFeature(), BoldFeature(), ItalicFeature(), HeadingFeature({ enabledHeadingSizes: ['h2', 'h3'] }), OrderedListFeature(), UnorderedListFeature(), FixedToolbarFeature()] });
export function draftFields(virtual = false): Field[] {
  return [
    // Payload defaults virtual fields to read-only; these fields proxy the guarded working revision.
    { name: 'title', type: 'text', maxLength: 240, virtual, admin: { readOnly: false, disableListColumn: virtual } },
    { name: 'excerpt', type: 'textarea', maxLength: 600, virtual, admin: { readOnly: false } },
    { name: 'body', type: 'richText', editor, virtual, admin: { readOnly: false } },
    { name: 'category', type: 'relationship', relationTo: 'article-categories', virtual, maxDepth: 0, admin: { readOnly: false },
      ...(virtual ? { access: { create: ({ req }) => isActiveAdmin(req.user), update: ({ req }) => isActiveAdmin(req.user) } } : {}) },
    { name: 'publicAuthor', type: 'text', maxLength: 160, virtual, admin: { readOnly: false, description: 'Nama penulis publik atau tim; terpisah dari akun CMS.' } },
    { name: 'sources', type: 'array', virtual, maxRows: 30, admin: { readOnly: false }, fields: [{ name: 'title', type: 'text', maxLength: 200 }, { name: 'url', type: 'text', maxLength: 2048 }] },
    { name: 'assets', type: 'array', virtual, maxRows: 30, admin: { readOnly: false }, fields: [
      { name: 'asset', type: 'relationship', relationTo: 'media', required: true, maxDepth: 0 },
      { name: 'alt', type: 'text', maxLength: 300 }, { name: 'caption', type: 'text', maxLength: 600 },
      { name: 'fileVersion', type: 'text', admin: { readOnly: true } }, { name: 'checksum', type: 'text', admin: { readOnly: true } },
    ] },
    { name: 'related', type: 'array', virtual, maxRows: 20, admin: { readOnly: false }, fields: [
      { name: 'target', type: 'relationship', relationTo: 'articles', required: true, maxDepth: 0 },
      { name: 'required', type: 'checkbox', defaultValue: false },
    ] },
  ];
}
