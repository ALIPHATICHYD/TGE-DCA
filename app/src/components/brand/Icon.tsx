import type { SVGProps } from 'react';

/** 16px pixel-grid glyphs, drawn to sit beside dithered surfaces. */
const PATHS = {
  vault: 'M1 2h14v12H1zM3 4v8h10V4zM6 6h4v4H6zM3 14h2v1H3zM11 14h2v1h-2z',
  clock: 'M5 1h6v1h2v2h1v2h1v4h-1v2h-1v2h-2v1H5v-1H3v-2H2v-2H1V6h1V4h1V2h2zM5 3v1H4v2H3v4h1v2h1v1h6v-1h1v-2h1V6h-1V4h-1V3zM7 4h2v4h3v2H7z',
  chart: 'M1 14h14v1H1zM2 9h3v5H2zM6 6h3v8H6zM10 3h3v11h-3z',
  lock: 'M4 7V4h1V2h1V1h4v1h1v2h1v3h2v8H2V7zM6 7h4V4H9V3H7v1H6zM7 9h2v3H7z',
  shield: 'M2 1h12v7h-1v2h-1v2h-2v1H9v1H7v-1H6v-1H4v-2H3V8H2zM4 3v5h1v2h1v1h1v1h2v-1h1v-1h1V8h1V3z',
  key: 'M1 5h6v2h8v3h-2v2h-2v-2H7v2H1zM3 7v3h2V7z',
  user: 'M6 1h4v1h1v4h-1v1H6V6H5V2h1zM3 9h10v1h1v5H2v-5h1z',
  bolt: 'M8 1h4v1h-1v3h3v2h-1v1h-1v1h-1v1H9v1H8v2H7v1H6v-4H3V8h1V6h1V4h1V3h1V2h1z',
  play: 'M4 2h2v1h2v1h2v1h2v2h1v2h-1v2h-2v1H8v1H6v1H4z',
  pause: 'M4 3h3v10H4zM9 3h3v10H9z',
  plus: 'M7 1h2v6h6v2H9v6H7V9H1V7h6z',
  arrowRight: 'M1 7h10V5h1v1h1v1h1v2h-1v1h-1v1h-1V9H1z',
  arrowLeft: 'M15 7H5V5H4v1H3v1H2v2h1v1h1v1h1V9h10z',
  coin: 'M7 1h2v2h1v2h1v2h1v4h-1v2h-1v1H6v-1H5v-2H4V7h1V5h1V3h1z',
  external: 'M8 1h7v7h-2V4.5L7 10.5 5.5 9l6-6H8zM1 3h5v2H3v8h8v-3h2v5H1z',
  copy: 'M5 1h10v10h-3V9h1V3H7v1H5zM1 5h10v10H1zM3 7v6h6V7z',
  power: 'M7 1h2v7H7zM3 3h2v2H4v1H3v4h1v1h1v1h6v-1h1v-1h1V6h-1V5h-1V3h2v1h1v2h1v4h-1v2h-1v1h-2v1H5v-1H3v-1H2v-2H1V6h1V4h1z',
} as const;

export type IconName = keyof typeof PATHS;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
  label?: string;
}

export function Icon({ name, size = 16, label, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ flex: 'none' }}
      {...rest}
    >
      <path fill="currentColor" fillRule="evenodd" d={PATHS[name]} />
    </svg>
  );
}
