import { useEffect, useRef, useState } from 'react';
import { useStored } from './lib/storage';
import { monthKey, uid } from './lib/utils';
import Train from './components/Train';
import Dashboard from './components/Dashboard';
import Backup from './components/Backup';
import WorkoutEditor from './components/WorkoutEditor';

const TABS = [['train', 'אימון'], ['dash', 'סיכום'], ['backup', 'גיבוי']];

export default function App() {
  // same storage keys as v1, so existing data carries over on the same address
  const [workouts, setWorkouts] = useStored('gym.workouts', []);
  const [active, setActive] = useStored('gym.active', null);
  const [editing, setEditing] = useState(null); // copy of a saved workout being edited
  const [tab, setTab] = useState('train');
  const [mon, setMon] = useState(monthKey(new Date().toISOString()));
  const [msg, setMsg] = useState('');
  const timer = useRef();
  const toast = t => { setMsg(t); clearTimeout(timer.current); timer.current = setTimeout(() => setMsg(''), 2600); };
  useEffect(() => { window.scrollTo(0, 0); }, [tab, !!editing]);

  const finish = w => {
    setWorkouts(ws => [...ws, w]);
    setMon(monthKey(w.startTime)); setActive(null); setTab('dash'); toast('האימון נשמר');
  };
  const del = id => { if (confirm('למחוק את האימון הזה?')) setWorkouts(ws => ws.filter(w => w.id !== id)); };
  const startEdit = w => setEditing({
    ...w,
    exercises: w.exercises.map(e => ({ ...e, _k: uid() })),
    cardio: (w.cardio || []).map(c => ({ ...c, _k: uid() }))
  });
  const saveEdit = w => {
    setWorkouts(ws => ws.map(x => (x.id === w.id ? w : x)));
    setMon(monthKey(w.startTime)); setEditing(null); setTab('dash'); toast('השינויים נשמרו');
  };
  const goTab = k => {
    if (editing) { if (!confirm('לצאת מהעריכה בלי לשמור?')) return; setEditing(null); }
    setTab(k);
  };

  return (
    <>
      <main id="app">
        {editing ? (
          <WorkoutEditor key={editing.id} draft={editing} setDraft={setEditing} toast={toast}
            history={workouts.filter(w => w.id !== editing.id && w.startTime < editing.startTime)}
            title="עריכת אימון" saveLabel="שמור שינויים" onSave={saveEdit}
            cancelLabel="בטל עריכה" onCancel={() => { if (confirm('לבטל את השינויים?')) setEditing(null); }} />
        ) : (
          <>
            {tab === 'train' && <Train active={active} setActive={setActive} workouts={workouts} onFinish={finish} toast={toast} />}
            {tab === 'dash' && <Dashboard workouts={workouts} mon={mon} setMon={setMon} onDelete={del} onEdit={startEdit} />}
            {tab === 'backup' && <Backup workouts={workouts} setWorkouts={setWorkouts} toast={toast} />}
          </>
        )}
      </main>
      <nav className="tabs" aria-label="ניווט">
        {TABS.map(([k, l]) => <button key={k} className={'tab' + (!editing && tab === k ? ' on' : '')} onClick={() => goTab(k)}>{l}</button>)}
      </nav>
      {msg && <div className="toast" role="status">{msg}</div>}
    </>
  );
}
