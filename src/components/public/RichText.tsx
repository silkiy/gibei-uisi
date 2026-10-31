import { Fragment, type ReactNode } from 'react';
import Image from 'next/image';
import { publicBody } from '../../content/serialization';
import { safeExternalURL } from '../../content/links.mjs';

export type ReaderAsset = { id: number; mime: string; alt: string; caption?: string | null; width?: number | null; height?: number | null; available: boolean; url: string | null; fallback?: string | null };
export function RichText({ body, assets = [] }: { body: unknown; assets?: ReaderAsset[] }) {
  const used = new Set<number>();
  function media(asset: ReaderAsset, key: string, inline = false) {
    used.add(asset.id);
    const Container = inline ? 'span' : 'figure';
    return <Container key={key} className={inline ? 'inline-media' : undefined}>
      {!asset.available || !asset.url ? <span className="asset-fallback">Media tidak tersedia: {asset.alt}</span> : asset.mime.startsWith('image/')
        ? <Image src={asset.url} unoptimized alt={asset.alt} width={asset.width || 1200} height={asset.height || 800} />
        : <a href={asset.url} target="_blank" rel="noopener noreferrer">Unduh PDF: {asset.alt}</a>}
      {asset.caption && (inline ? <span className="media-caption">{asset.caption}</span> : <figcaption>{asset.caption}</figcaption>)}
    </Container>;
  }
  function render(node: Record<string, unknown>, key: number): ReactNode {
    const children = Array.isArray(node.children) ? node.children.map((child, index) => render(child, index)) : null;
    if (node.type === 'text') {
      let text: ReactNode = String(node.text || '');
      if (Number(node.format) & 1) text = <strong>{text}</strong>;
      if (Number(node.format) & 2) text = <em>{text}</em>;
      return <Fragment key={key}>{text}</Fragment>;
    }
    switch (node.type) {
      case 'paragraph': return <p key={key}>{children}</p>;
      case 'heading': return node.tag === 'h2' ? <h2 key={key}>{children}</h2> : <h3 key={key}>{children}</h3>;
      case 'linebreak': return <br key={key} />;
      case 'list': return node.tag === 'ol' ? <ol key={key}>{children}</ol> : <ul key={key}>{children}</ul>;
      case 'listitem': return <li key={key}>{children}</li>;
      case 'link': {
        const fields = node.fields as { assetId?: number; url?: string; newTab?: boolean };
        const asset = assets.find(asset => asset.id === fields?.assetId);
        if (asset) return media(asset, `inline-${key}-${asset.id}`, true);
        const url = safeExternalURL(fields?.url);
        return url ? <a key={key} href={url} target={fields.newTab ? '_blank' : undefined} rel="noopener noreferrer">{children}</a> : <Fragment key={key}>{children}</Fragment>;
      }
      default: return <Fragment key={key}>{children}</Fragment>;
    }
  }
  const serialized = publicBody(body, assets.map(asset => asset.id));
  const content = serialized?.root ? render(serialized.root, 0) : null;
  return <div className="article-body">{content}{assets.filter(asset => !used.has(asset.id)).map(asset => media(asset, `attachment-${asset.id}`))}</div>;
}
