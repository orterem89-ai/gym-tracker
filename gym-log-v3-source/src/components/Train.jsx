import { dLong, uid } from '../lib/utils';
import WorkoutEditor from './WorkoutEditor';

export default function Train({ active, setActive, workouts, onFinish, toast }) {
  if (!active) {
    const last = [...workouts].sort((a, b) => b.startTime.localeCompare(a.startTime))[0];
    const parts = last ? [...new Set([...last.exercises.map(e => e.muscleGroup), ...(last.cardio ? ['אירובי'] : [])])].join(', ') : '';
    return (
      <section className="hero">
        <h1>יומן אימונים</h1>
        <p>{last ? `האימון האחרון: ${dLong(last.startTime)}, ${parts}` : 'עוד אין אימונים. התחל את הראשון.'}</p>
        <button className="big go" onClick={() => setActive({ id: uid(), startTime: new Date().toISOString(), exercises: [], cardio: [] })}>התחל אימון</button>
      </section>
    );
  }
  return (
    <WorkoutEditor live draft={active} setDraft={setActive} history={workouts} toast={toast}
      saveLabel="סיים ושמור אימון" onSave={onFinish}
      cancelLabel="בטל אימון" onCancel={() => { if (confirm('לבטל את האימון הנוכחי? הנתונים לא יישמרו.')) setActive(null); }} />
  );
}
