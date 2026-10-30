export function EmptyState({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="empty-state" role="status"><span className="empty-mark" aria-hidden="true">↗</span><div><h3>{title}</h3><p>{children}</p></div></div>;
}
