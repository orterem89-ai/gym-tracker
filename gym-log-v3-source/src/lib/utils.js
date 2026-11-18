export const MUSCLES = ['חזה', 'גב', 'רגליים', 'כתפיים', 'יד קדמית', 'יד אחורית', 'בטן'];
export const pad = n => String(n).padStart(2, '0');
export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 8));
export const norm = s => String(s || '').trim().toLowerCase();
export const monthKey = iso => { const d = new Date(iso); return d.getFullYear() + '-' + pad(d.getMonth() + 1); };
export const dShort = iso => new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' });
export const dLong = iso => new Date(iso).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'numeric' });
export const tFmt = iso => new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
export const toLocalInput = iso => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
export const num = v => { const n = parseFloat(String(v).replace(',', '.')); return isFinite(n) && n >= 0 ? n : 0; };
export const nf = n => Math.round(n).toLocaleString('he-IL');
export const byDateDesc = ws => [...ws].sort((a, b) => b.startTime.localeCompare(a.startTime));

export function prevFor(workouts, m) {
  const w = byDateDesc(workouts).find(w => w.exercises.some(e => e.muscleGroup === m));
  return w ? { w, list: w.exercises.filter(e => e.muscleGroup === m) } : null;
}
export function hintFor(workouts, m, name, pos) {
  const p = prevFor(workouts, m);
  if (!p) return 'אין נתונים מאימון קודם';
  const n = norm(name);
  const e = n ? p.list.find(x => norm(x.exerciseName) === n) : p.list[Math.min(pos, p.list.length - 1)];
  if (!e) return 'תרגיל חדש, אין נתונים קודמים';
  return `קודם (${dShort(p.w.startTime)}): ${e.weightKg} ק״ג · ${e.sets}×${e.reps}`;
}
export const blank = m => ({ _k: uid(), muscleGroup: m, exerciseName: '', weightKg: 0, sets: 3, reps: 10 });

export const CARDIO = ['הליכון', 'ריצה', 'אופניים', 'אליפטית', 'חתירה', 'מדרגות', 'שחייה', 'אחר'];
export const blankCardio = () => ({ _k: uid(), type: 'הליכון', minutes: 20, distanceKm: 0 });
export function lastCardio(workouts, type) {
  const w = byDateDesc(workouts).find(w => (w.cardio || []).some(c => c.type === type));
  if (!w) return null;
  return { w, c: w.cardio.find(c => c.type === type) };
}

export function toCSV(workouts) {
  const q = v => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const rows = ['id,startTime,kind,muscleGroup,exerciseName,weightKg,sets,reps,minutes,distanceKm'];
  byDateDesc(workouts).forEach(w => {
    w.exercises.forEach(e => rows.push([w.id, w.startTime, 'strength', e.muscleGroup, e.exerciseName, e.weightKg, e.sets, e.reps, '', ''].map(q).join(',')));
    (w.cardio || []).forEach(c => rows.push([w.id, w.startTime, 'cardio', 'אירובי', c.type, '', '', '', c.minutes, c.distanceKm || ''].map(q).join(',')));
  });
  return '\ufeff' + rows.join('\n');
}

export async function saveFile(name, type, text) {
  const f = new File([text], name, { type });
  if (navigator.canShare && navigator.canShare({ files: [f] })) {
    try { await navigator.share({ files: [f], title: name }); return; } catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(f); a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

export function parseImport(text, existing) {
  let d; try { d = JSON.parse(text); } catch { return { error: 'הקובץ אינו JSON תקין' }; }
  const list = Array.isArray(d) ? d : d.workouts;
  if (!Array.isArray(list)) return { error: 'מבנה הקובץ לא מוכר' };
  const ids = new Set(existing.map(w => w.id)); const added = [];
  list.forEach(w => {
    if (!w || !w.id || isNaN(new Date(w.startTime)) || !Array.isArray(w.exercises) || ids.has(String(w.id))) return;
    ids.add(String(w.id));
    const item = {
      id: String(w.id), startTime: new Date(w.startTime).toISOString(),
      exercises: w.exercises.map(e => ({
        muscleGroup: String(e.muscleGroup || ''), exerciseName: String(e.exerciseName || ''),
        weightKg: num(e.weightKg), sets: num(e.sets), reps: num(e.reps)
      }))
    };
    if (Array.isArray(w.cardio) && w.cardio.length)
      item.cardio = w.cardio.map(c => ({ type: String(c.type || 'אחר'), minutes: num(c.minutes), distanceKm: num(c.distanceKm) }));
    added.push(item);
  });
  return { added };
}
