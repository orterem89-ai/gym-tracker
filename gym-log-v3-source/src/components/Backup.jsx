import { parseImport, saveFile, toCSV } from '../lib/utils';

const stamp = () => new Date().toISOString().slice(0, 10);

export default function Backup({ workouts, setWorkouts, toast }) {
  const onImport = async e => {
    const f = e.target.files[0]; e.target.value = '';
    if (!f) return;
    const r = parseImport(await f.text(), workouts);
    if (r.error) return toast(r.error);
    setWorkouts(ws => [...ws, ...r.added]);
    toast(`יובאו ${r.added.length} אימונים חדשים`);
  };
  return (
    <>
      <h1>גיבוי</h1>
      <p>הנתונים נשמרים רק במכשיר הזה. ייצא קובץ מדי פעם ושמור אותו ב״קבצים״ או ב-iCloud.</p>
      <p style={{ marginTop: 6 }}>נשמרו {workouts.length} אימונים.</p>
      <div className="stack">
        <button className="big go" onClick={() => saveFile(`gym-backup-${stamp()}.json`, 'application/json', JSON.stringify({ version: 1, workouts }, null, 2))}>ייצוא JSON (גיבוי מלא)</button>
        <button className="big ghost" onClick={() => saveFile(`gym-workouts-${stamp()}.csv`, 'text/csv', toCSV(workouts))}>ייצוא CSV (לאקסל)</button>
        <label className="big ghost btn">ייבוא מקובץ JSON<input type="file" accept=".json,application/json" hidden onChange={onImport} /></label>
      </div>
    </>
  );
}
