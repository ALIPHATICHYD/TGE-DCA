import { useEffect, useRef } from 'react';

export type DitherMode = 'accumulation' | 'horizon' | 'flat';

interface DitherFieldProps {
  mode?: DitherMode;
  /** Internal resolution; scaled up with nearest-neighbour so every dot stays square. */
  width?: number;
  height?: number;
  fps?: number;
  className?: string;
}

// 4×4 Bayer threshold matrix.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const INK = [10, 10, 9];
const SIGNAL = [255, 90, 31];
const BONE = [236, 232, 223];

function field(mode: DitherMode, nx: number, ny: number, t: number): number {
  if (mode === 'accumulation') {
    // A rising cost curve with drift: bright just under the line, fading below, a glow above.
    const c = 0.8 - 0.55 * nx + 0.05 * Math.sin(nx * 11 + t * 0.9) + 0.02 * Math.sin(nx * 31 - t * 1.7);
    const dy = ny - c;
    const v = dy > 0 ? 0.98 - dy * 1.7 : Math.exp(dy * 14) * 0.85;
    return v + 0.12 * Math.sin(nx * 6 + ny * 5 - t * 0.6) * (dy > 0 ? 1 : 0.3);
  }
  if (mode === 'horizon') {
    const r = Math.hypot((nx - 0.5) * 1.6, (ny - 1.1) * 1.15);
    return 1.08 - r * 1.15 + 0.07 * Math.sin(nx * 10 - t) + 0.05 * Math.cos(ny * 14 + t * 0.7);
  }
  return 0.35 + 0.25 * Math.sin(nx * 4 + t * 0.4) * Math.cos(ny * 3 - t * 0.3);
}

/**
 * Ordered-dither (Bayer) animated field in ink / signal / bone.
 * Paints a single still frame when the user prefers reduced motion.
 */
export function DitherField({ mode = 'accumulation', width = 240, height = 180, fps = 18, className }: DitherFieldProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const img = ctx.createImageData(width, height);
    const d = img.data;

    const paint = (t: number) => {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const v = field(mode, x / width, y / height, t);
          const th = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
          const c = v > 0.6 + th * 0.4 ? BONE : v > th ? SIGNAL : INK;
          const i = (y * width + x) * 4;
          d[i] = c[0];
          d[i + 1] = c[1];
          d[i + 2] = c[2];
          d[i + 3] = 255;
        }
      }
      ctx.putImageData(img, 0, 0);
    };

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      paint(3);
      return;
    }

    let raf = 0;
    let last = 0;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(cv);
    const loop = (ms: number) => {
      if (visible && ms - last > 1000 / fps) {
        last = ms;
        paint(ms / 1000);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [mode, width, height, fps]);

  return (
    <canvas
      ref={ref}
      width={width}
      height={height}
      className={`pixelated ${className ?? ''}`}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      aria-hidden="true"
    />
  );
}
