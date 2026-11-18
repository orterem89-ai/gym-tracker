import { useEffect, useRef, useState } from 'react';
import { load, save } from '../lib/storage';

const PRESETS = [60, 90, 120, 180];
const fmt = s => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
let ctx;
const audio = () => { try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); ctx.resume && ctx.resume(); } catch { /* no audio */ } };
function beep() {
  try {
    audio();
    [0, 0.25, 0.5].forEach(t => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 880; g.gain.value = 0.25; o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + 0.15);
    });
  } catch { /* no audio */ }
  if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
}

export default function RestTimer() {
  const [rest, setRest] = useState(() => {
    const r = load('gym.rest', null);
    return r && r.endAt + 30000 > Date.now() ? r : null;
  });
  const [now, setNow] = useState(Date.now());
  const [last, setLast] = useState(() => load('gym.restSec', 90));
  const fired = useRef(false);
  const left = rest ? Math.max(0, Math.ceil((rest.endAt - now) / 1000)) : 0;
  const done = !!rest && left === 0;

  useEffect(() => {
    if (!rest) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [rest]);
  useEffect(() => { if (done && !fired.current) { fired.current = true; beep(); } }, [done]);
  useEffect(() => { save('gym.rest', rest); }, [rest]);

  const start = s => {
    audio(); fired.current = false; setNow(Date.now());
    setRest({ endAt: Date.now() + s * 1000, total: s });
    setLast(s); save('gym.restSec', s);
  };
  const extend = () => setRest(r => ({ ...r, endAt: r.endAt + 15000, total: r.total + 15 }));

  if (!rest) {
    return (
      <div className="rest">
        <span className="lbl">מנוחה</span>
        <div className="rp">
          {PRESETS.map(s => (
            <button key={s} className={'chip sm' + (s === last ? ' on' : '')} onClick={() => start(s)}>{fmt(s)}</button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div className={'rest run' + (done ? ' done' : '')} role="timer" aria-live="off">
      <div className="rtime">{done ? 'סיימת!' : fmt(left)}</div>
      <div className="prog"><i style={{ width: (done ? 100 : (1 - left / rest.total) * 100) + '%' }} /></div>
      <div className="rbtns">
        {done
          ? <button className="ghost" onClick={() => start(rest.total)}>שוב</button>
          : <button className="ghost" onClick={extend}>+15</button>}
        <button className="ghost" onClick={() => setRest(null)}>{done ? 'סגור' : 'עצור'}</button>
      </div>
    </div>
  );
}
