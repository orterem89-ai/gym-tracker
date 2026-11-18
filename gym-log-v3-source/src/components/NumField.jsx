import { useEffect, useState } from 'react';
import { num } from '../lib/utils';

export default function NumField({ label, value, onChange, mode = 'numeric', step = 1 }) {
  const [txt, setTxt] = useState(value ? String(value) : '');
  // keep the text in sync when the value changes from the +/- buttons
  useEffect(() => { if (num(txt) !== value) setTxt(value ? String(value) : ''); }, [value]); // eslint-disable-line
  const bump = d => onChange(Math.max(0, Math.round((value + step * d) * 100) / 100));
  return (
    <div className="st">
      <label>{label}</label>
      <input inputMode={mode} value={txt} placeholder="0"
        onChange={e => { setTxt(e.target.value); onChange(num(e.target.value)); }} />
      <div className="pm">
        <button onClick={() => bump(-1)} aria-label="הפחת">−</button>
        <button onClick={() => bump(1)} aria-label="הוסף">+</button>
      </div>
    </div>
  );
}
