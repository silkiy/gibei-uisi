import { Fragment, type ReactNode } from 'react';
import { publicBody } from '../../content/serialization';

export function RichText({ body }: { body: unknown }) {
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
      default: return <Fragment key={key}>{children}</Fragment>;
    }
  }
  const serialized = publicBody(body);
  return <div className="article-body">{serialized?.root ? render(serialized.root, 0) : null}</div>;
}
