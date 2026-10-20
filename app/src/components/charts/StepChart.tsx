import { useId } from 'react';
import { DitherDefs } from '../brand/DitherDefs';

export interface StepPoint {
  t: number;
  v: number;
}

interface StepChartProps {
  points: StepPoint[];
  /** Extends the last step to this time (usually now). */
  until?: number;
  label: string;
  height?: number;
}

const W = 800;

/** Cumulative step area in dithered signal orange, with a bar for each step. */
export function StepChart({ points, until = Date.now(), label, height = 260 }: StepChartProps) {
  const prefix = useId().replace(/:/g, '');
  const H = height;
  if (points.length === 0) return null;

  const t0 = points[0].t;
  const t1 = Math.max(until, points[points.length - 1].t + 1);
  const vMax = Math.max(...points.map((p) => p.v)) || 1;
  const x = (t: number) => ((t - t0) / (t1 - t0)) * (W - 24) + 12;
  const y = (v: number) => H - 16 - (v / vMax) * (H - 48);

  let line = `M0 ${H - 16}`;
  points.forEach((p) => {
    line += ` H${x(p.t).toFixed(1)} V${y(p.v).toFixed(1)}`;
  });
  line += ` H${W}`;
  const area = `${line} V${H} H0 Z`;

  return (
    <svg className="draw" viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label={label}>
      <DitherDefs prefix={prefix} />
      <rect width={W} height={H} fill={`url(#${prefix}-grid)`} />
      <g shapeRendering="crispEdges">
        <path d={area} fill={`url(#${prefix}-o25)`} />
        {points.map((p, i) => {
          const prev = i === 0 ? 0 : points[i - 1].v;
          const h = Math.max(4, ((p.v - prev) / vMax) * (H - 48));
          return <rect key={i} x={x(p.t) - 5} y={H - 16 - h} width={10} height={h} fill={`url(#${prefix}-o75)`} />;
        })}
      </g>
      <path d={line} fill="none" stroke="#FF5A1F" strokeWidth="2" />
      <rect x={x(points[points.length - 1].t) - 6} y={y(points[points.length - 1].v) - 6} width="12" height="12" fill="#FF5A1F" className="blink" />
    </svg>
  );
}

/** Placeholder panel for charts with no data yet. */
export function EmptyChart({ text, height = 220 }: { text: string; height?: number }) {
  return (
    <div
      className="dither-rule"
      style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}
    >
      <span className="label" style={{ background: 'var(--ink)', padding: '8px 12px' }}>
        {text}
      </span>
    </div>
  );
}
