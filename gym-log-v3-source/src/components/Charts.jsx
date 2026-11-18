import { nf } from '../lib/utils';

export function VolumeBars({ data }) {
  if (!data.length) return <p className="empty">אין אימונים בחודש הזה.</p>;
  const max = data[0][1] || 1;
  return (
    <div className="bars">
      {data.map(([m, v]) => (
        <div className="br" key={m}>
          <span>{m}</span>
          <div className="trk"><div className="fil" style={{ width: Math.max(2, v / max * 100) + '%' }} /><i>{nf(v)}</i></div>
        </div>
      ))}
    </div>
  );
}

export function MaxLine({ points, dim }) {
  if (!points.length) return <p className="empty">אין נתונים לתצוגה.</p>;
  const W = 340, H = 180, L = 34, R = 12, T = 18, B = 24;
  const max = Math.max(...points.map(p => p[1]), 1);
  const X = d => L + (dim > 1 ? (d - 1) / (dim - 1) : 0) * (W - L - R);
  const Y = v => T + (1 - v / max) * (H - T - B);
  const ticks = [1, Math.ceil(dim / 4), Math.ceil(dim / 2), Math.ceil(dim * 3 / 4), dim].filter((v, i, a) => a.indexOf(v) === i);
  return (
    <svg className="ln" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="גרף משקל מקסימלי לפי יום">
      <line className="g" x1={L} x2={W - R} y1={Y(0)} y2={Y(0)} />
      <line className="g" x1={L} x2={W - R} y1={Y(max)} y2={Y(max)} />
      <text x={L - 6} y={Y(max) + 3} textAnchor="end">{max}</text>
      <text x={L - 6} y={Y(0) + 3} textAnchor="end">0</text>
      {ticks.map(d => <text key={d} x={X(d)} y={H - 6} textAnchor="middle">{d}</text>)}
      <polyline className="p" points={points.map(p => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' ')} />
      {points.map(p => (
        <g key={p[0]}>
          <circle className="d" cx={X(p[0])} cy={Y(p[1])} r="4" />
          {points.length <= 9 && <text className="v" x={X(p[0])} y={Y(p[1]) - 9} textAnchor="middle">{p[1]}</text>}
        </g>
      ))}
    </svg>
  );
}
