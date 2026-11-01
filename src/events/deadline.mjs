export function nextBoundary(values, now) {
  const future = values.filter(Boolean).map(value => Date.parse(value)).filter(time => Number.isFinite(time) && time > now);
  return future.length ? Math.min(...future) : null;
}
