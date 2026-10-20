/** The stack: three bars, each taller than the last, on a 7×7 grid. */
export function LogoMark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 7 7" shapeRendering="crispEdges" aria-hidden="true">
      <path fill="var(--signal)" d="M0 5h2v2H0zM2.5 2.5h2v4.5h-2zM5 0h2v7H5z" />
    </svg>
  );
}

export function Logo() {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <LogoMark />
      <span style={{ fontWeight: 900, fontStretch: '125%', fontSize: 21, letterSpacing: '-0.02em' }}>TGE</span>
      <span className="mono muted" style={{ fontSize: 13 }}>
        /DCA
      </span>
    </span>
  );
}
