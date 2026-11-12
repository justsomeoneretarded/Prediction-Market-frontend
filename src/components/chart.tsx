'use client';
import { useMemo, useRef, useState } from 'react';

export interface Pt { t: number; v: number }

/** Lightweight SVG line/area chart with hover crosshair (no chart library = small bundle). */
export function LineChart({
  data, height = 220, domain, format = (v) => v.toFixed(2), color = 'var(--brand)', testId,
}: { data: Pt[]; height?: number; domain?: [number, number]; format?: (v: number) => string; color?: string; testId?: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const W = 800;
  const H = height;
  const pad = { t: 12, b: 22, l: 0, r: 44 };

  const { path, area, x, y, min, max, ticks } = useMemo(() => {
    const pts = data.length === 1 ? [data[0], { t: data[0].t + 1, v: data[0].v }] : data;
    const t0 = pts[0]?.t ?? 0, t1 = pts[pts.length - 1]?.t ?? 1;
    let min = domain?.[0] ?? Math.min(...pts.map((p) => p.v));
    let max = domain?.[1] ?? Math.max(...pts.map((p) => p.v));
    if (min === max) { min -= 1; max += 1; }
    if (!domain) { const padV = (max - min) * 0.1; min -= padV; max += padV; }
    const x = (t: number) => pad.l + ((t - t0) / Math.max(1, t1 - t0)) * (W - pad.l - pad.r);
    const y = (v: number) => pad.t + (1 - (v - min) / (max - min)) * (H - pad.t - pad.b);
    // step-after line: price holds until the next trade
    let d = '';
    pts.forEach((p, i) => {
      d += i === 0 ? `M${x(p.t)},${y(p.v)}` : `H${x(p.t)}V${y(p.v)}`;
    });
    const area = `${d}V${H - pad.b}H${x(pts[0]?.t ?? 0)}Z`;
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => min + f * (max - min));
    return { path: d, area, x, y, min, max, ticks };
  }, [data, domain, H]);

  if (!data.length) return <div className="grid place-items-center text-sm text-muted" style={{ height }}>No data yet</div>;

  const onMove = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    let best = 0;
    for (let i = 0; i < data.length; i++) if (Math.abs(x(data[i].t) - px) < Math.abs(x(data[best].t) - px)) best = i;
    setHover(best);
  };
  const h = hover != null ? data[hover] : data[data.length - 1];

  return (
    <div className="relative select-none" data-testid={testId}>
      <div className="pointer-events-none absolute left-0 top-0 text-xs text-muted">
        <span className="tabular mr-2 text-base font-semibold text-text">{format(h.v)}</span>
        {new Date(h.t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-auto w-full touch-pan-y" style={{ height }} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        <defs>
          <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((v, i) => (
          <g key={i}>
            <line x1={0} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
            <text x={W - pad.r + 6} y={y(v) + 4} fontSize="11" fill="var(--muted)">{format(v)}</text>
          </g>
        ))}
        <path d={area} fill="url(#chart-fill)" />
        <path d={path} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        {hover != null && (
          <>
            <line x1={x(data[hover].t)} x2={x(data[hover].t)} y1={pad.t} y2={H - pad.b} stroke="var(--muted)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
            <circle cx={x(data[hover].t)} cy={y(data[hover].v)} r="4" fill={color} stroke="var(--surface)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>
      <span className="sr-only">Range {format(min)} to {format(max)}</span>
    </div>
  );
}
