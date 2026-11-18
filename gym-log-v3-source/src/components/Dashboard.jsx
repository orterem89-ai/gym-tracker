import { useState } from 'react';
import { MUSCLES, byDateDesc, dLong, monthKey, nf, tFmt } from '../lib/utils';
import { MaxLine, VolumeBars } from './Charts';

export default function Dashboard({ workouts, mon, setMon, onDelete, onEdit }) {
  const [lineM, setLineM] = useState('');
  const [y, mo] = mon.split('-').map(Number);
  const ws = byDateDesc(workouts).filter(w => monthKey(w.startTime) === mon);
  const dim = new Date(y, mo, 0).getDate();
  const now = new Date();
  const cur = monthKey(now.toISOString()) === mon;
  const avg = ws.length / ((cur ? now.getDate() : dim) / 7);

  const vol = {}; let total = 0;
  ws.forEach(w => w.exercises.forEach(e => { const v = e.weightKg * e.sets * e.reps; vol[e.muscleGroup] = (vol[e.muscleGroup] || 0) + v; total += v; }));
  const cardioMin = ws.reduce((t, w) => t + (w.cardio || []).reduce((a, c) => a + c.minutes, 0), 0);
  const volRows = Object.entries(vol).sort((a, b) => b[1] - a[1]);

  const byDay = {};
  ws.forEach(w => { const d = new Date(w.startTime).getDate(); w.exercises.forEach(e => { if (lineM && e.muscleGroup !== lineM) return; byDay[d] = Math.max(byDay[d] || 0, e.weightKg); }); });
  const points = Object.entries(byDay).map(([d, v]) => [+d, v]).sort((a, b) => a[0] - b[0]);

  return (
    <>
      <h1>סיכום חודשי</h1>
      <div className="stack" style={{ marginTop: 6 }}>
        <input type="month" value={mon} onChange={e => e.target.value && setMon(e.target.value)} />
      </div>
      <div className="stats">
        <div className="stat"><b>{ws.length}</b><span>אימונים</span></div>
        <div className="stat"><b>{avg.toFixed(1)}</b><span>אימונים בשבוע</span></div>
        <div className="stat"><b>{nf(total / 1000)}</b><span>טון הורם</span></div>
        <div className="stat"><b>{nf(cardioMin)}</b><span>דק׳ אירובי</span></div>
      </div>
      <h2>נפח עבודה לפי שריר (ק״ג)</h2>
      <VolumeBars data={volRows} />
      <h2>התקדמות במשקל המקסימלי</h2>
      <select value={lineM} onChange={e => setLineM(e.target.value)}>
        <option value="">כל השרירים</option>
        {MUSCLES.map(m => <option key={m}>{m}</option>)}
      </select>
      <div style={{ marginTop: 10 }}><MaxLine points={points} dim={dim} /></div>
      <h2>היסטוריית אימונים</h2>
      {!ws.length && <p className="empty">אין אימונים להצגה.</p>}
      {ws.map(w => (
        <div className="hw" key={w.id}>
          <div className="hh">
            <div><b>{dLong(w.startTime)}</b> <small>{tFmt(w.startTime)}</small></div>
            <div>
              <button className="mini" onClick={() => onEdit(w)} aria-label="ערוך אימון">✎</button>
              <button className="mini" onClick={() => onDelete(w.id)} aria-label="מחק אימון">🗑</button>
            </div>
          </div>
          {MUSCLES.filter(m => w.exercises.some(e => e.muscleGroup === m)).map(m => (
            <div className="hm" key={m}>
              <strong>{m}</strong>
              {w.exercises.filter(e => e.muscleGroup === m).map((e, i) => (
                <div key={i}>{e.exerciseName ? e.exerciseName + ' · ' : ''}{e.weightKg} ק״ג · {e.sets}×{e.reps}</div>
              ))}
            </div>
          ))}
          {(w.cardio || []).length > 0 && (
            <div className="hm">
              <strong>אירובי</strong>
              {w.cardio.map((c, i) => <div key={i}>{c.type} · {c.minutes} דק׳{c.distanceKm ? ` · ${c.distanceKm} ק״מ` : ''}</div>)}
            </div>
          )}
        </div>
      ))}
    </>
  );
}
