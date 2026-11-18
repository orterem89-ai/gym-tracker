import { useEffect, useState } from 'react';
import { CARDIO, MUSCLES, blank, blankCardio, dShort, hintFor, lastCardio, pad, prevFor, toLocalInput, uid } from '../lib/utils';
import NumField from './NumField';
import RestTimer from './RestTimer';

function Elapsed({ since }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const s = Math.max(0, Math.floor((now - new Date(since)) / 1000));
  return <div className="timer">{Math.floor(s / 3600)}:{pad(Math.floor(s % 3600 / 60))}:{pad(s % 60)}</div>;
}

/* One editor for both a live workout and editing a saved one.
   history = earlier workouts used for the "previous" hints and prefill. */
export default function WorkoutEditor({ draft, setDraft, history, live, title, saveLabel, onSave, onCancel, cancelLabel, toast }) {
  // keep the screen on during a live workout (iOS 16.4+)
  useEffect(() => {
    if (!live || !navigator.wakeLock) return;
    let lock;
    const get = () => navigator.wakeLock.request('screen').then(l => { lock = l; }).catch(() => {});
    const vis = () => { if (document.visibilityState === 'visible') get(); };
    get(); document.addEventListener('visibilitychange', vis);
    return () => { document.removeEventListener('visibilitychange', vis); lock && lock.release().catch(() => {}); };
  }, [live]);

  const ex = draft.exercises;
  const cardio = draft.cardio || [];
  const sel = MUSCLES.filter(m => ex.some(e => e.muscleGroup === m));

  const upd = (i, patch) => setDraft(a => ({ ...a, exercises: a.exercises.map((e, j) => (j === i ? { ...e, ...patch } : e)) }));
  const rm = i => setDraft(a => ({ ...a, exercises: a.exercises.filter((_, j) => j !== i) }));
  const add = m => setDraft(a => ({ ...a, exercises: [...a.exercises, blank(m)] }));
  const updC = (i, patch) => setDraft(a => ({ ...a, cardio: (a.cardio || []).map((c, j) => (j === i ? { ...c, ...patch } : c)) }));
  const rmC = i => setDraft(a => ({ ...a, cardio: (a.cardio || []).filter((_, j) => j !== i) }));
  const addC = () => setDraft(a => ({ ...a, cardio: [...(a.cardio || []), blankCardio()] }));

  const toggle = m => {
    if (sel.includes(m)) {
      if (ex.some(e => e.muscleGroup === m && e.weightKg > 0) && !confirm(`להסיר את ${m} מהאימון?`)) return;
      setDraft(a => ({ ...a, exercises: a.exercises.filter(e => e.muscleGroup !== m) }));
      return;
    }
    const p = prevFor(history, m);
    const rows = p
      ? p.list.slice(0, 8).map(e => ({ _k: uid(), muscleGroup: m, exerciseName: e.exerciseName, weightKg: e.weightKg, sets: e.sets, reps: e.reps }))
      : [blank(m)];
    setDraft(a => ({ ...a, exercises: [...a.exercises, ...rows] }));
  };

  const save = () => {
    const strength = ex.filter(e => e.sets > 0 && e.reps > 0)
      .map(e => ({ muscleGroup: e.muscleGroup, exerciseName: e.exerciseName.trim(), weightKg: e.weightKg, sets: e.sets, reps: e.reps }));
    const cc = cardio.filter(c => c.minutes > 0).map(c => ({ type: c.type, minutes: c.minutes, distanceKm: c.distanceKm || 0 }));
    if (!strength.length && !cc.length) return toast('הוסף תרגיל או אירובי עם נתונים');
    const w = { id: draft.id, startTime: draft.startTime, exercises: strength };
    if (cc.length) w.cardio = cc;
    onSave(w);
  };

  const cHint = type => {
    const l = lastCardio(history, type);
    return l ? `קודם (${dShort(l.w.startTime)}): ${l.c.minutes} דק׳${l.c.distanceKm ? ` · ${l.c.distanceKm} ק״מ` : ''}` : 'אין נתונים קודמים לסוג הזה';
  };

  return (
    <>
      {live ? <RestTimer /> : <h1>{title}</h1>}
      <div className="bar">
        <div>
          <div className="lbl">התחלה</div>
          <input type="datetime-local" value={toLocalInput(draft.startTime)}
            onChange={e => { const d = new Date(e.target.value); if (!isNaN(d)) setDraft(a => ({ ...a, startTime: d.toISOString() })); }} />
        </div>
        {live && <Elapsed since={draft.startTime} />}
      </div>

      <div className="chips">
        {MUSCLES.map(m => (
          <button key={m} className={'chip' + (sel.includes(m) ? ' on' : '')} aria-pressed={sel.includes(m)} onClick={() => toggle(m)}>{m}</button>
        ))}
      </div>
      {!sel.length && !cardio.length && <p className="empty">בחר קבוצת שריר או הוסף אירובי כדי להתחיל לתעד.</p>}

      {sel.map(m => {
        let pos = 0;
        return (
          <div className="card" key={m}>
            <div className="ch"><h3>{m}</h3><button className="ghost" onClick={() => add(m)}>+ תרגיל</button></div>
            {ex.map((e, i) => e.muscleGroup !== m ? null : (
              <div className="row" key={e._k || i}>
                <div className="rt">
                  <input placeholder="שם תרגיל (אופציונלי)" value={e.exerciseName} enterKeyHint="done"
                    onChange={ev => upd(i, { exerciseName: ev.target.value })} />
                  <button className="x" onClick={() => rm(i)} aria-label="מחק תרגיל">×</button>
                </div>
                <div className="hint">{hintFor(history, m, e.exerciseName, pos++)}</div>
                <div className="st3">
                  <NumField label="משקל (ק״ג)" mode="decimal" step={2.5} value={e.weightKg} onChange={v => upd(i, { weightKg: v })} />
                  <NumField label="סטים" value={e.sets} onChange={v => upd(i, { sets: v })} />
                  <NumField label="חזרות" value={e.reps} onChange={v => upd(i, { reps: v })} />
                </div>
              </div>
            ))}
          </div>
        );
      })}

      <div className="card">
        <div className="ch"><h3>אירובי</h3><button className="ghost" onClick={addC}>+ אירובי</button></div>
        {!cardio.length && <p className="hint" style={{ margin: 0 }}>אפשר להוסיף אירובי בכל שלב באימון.</p>}
        {cardio.map((c, i) => (
          <div className="row" key={c._k || i}>
            <div className="rt">
              <select value={c.type} onChange={e => updC(i, { type: e.target.value })} aria-label="סוג אירובי">
                {CARDIO.map(t => <option key={t}>{t}</option>)}
              </select>
              <button className="x" onClick={() => rmC(i)} aria-label="מחק אירובי">×</button>
            </div>
            <div className="hint">{cHint(c.type)}</div>
            <div className="st2">
              <NumField label="דקות" step={5} value={c.minutes} onChange={v => updC(i, { minutes: v })} />
              <NumField label="ק״מ (אופציונלי)" mode="decimal" step={0.5} value={c.distanceKm || 0} onChange={v => updC(i, { distanceKm: v })} />
            </div>
          </div>
        ))}
      </div>

      <div className="dock"><button className="big go" onClick={save}>{saveLabel}</button></div>
      <button className="link danger" onClick={onCancel}>{cancelLabel}</button>
    </>
  );
}
