/** Block progress readout: ▮▮▮▮▯▯ 4/6 */
export function Meter({ done, total, cells = 12 }: { done: number; total: number; cells?: number }) {
  const filled = total > 0 ? Math.min(cells, Math.round((done / total) * cells)) : 0;
  return (
    <span className="mono" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
      <span className="signal" style={{ letterSpacing: '0.1em' }}>
        {'▮'.repeat(filled)}
      </span>
      <span style={{ color: 'var(--rule)', letterSpacing: '0.1em' }}>{'▮'.repeat(cells - filled)}</span>{' '}
      {done}/{total}
    </span>
  );
}
