import type { ReactNode } from 'react';

/** Mono price tape. Items are rendered twice so the loop is seamless. */
export function Ticker({ items }: { items: ReactNode[] }) {
  const run = (key: string) => (
    <div key={key}>
      {items.map((item, i) => (
        <span key={i}>{item}</span>
      ))}
    </div>
  );
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">{[run('a'), run('b')]}</div>
    </div>
  );
}
