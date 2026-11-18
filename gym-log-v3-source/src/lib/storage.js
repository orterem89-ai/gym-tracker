import { useEffect, useState } from 'react';

export const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v ?? d; } catch { return d; } };
export const save = (k, v) => {
  try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; }
};

export function useStored(key, initial) {
  const [v, setV] = useState(() => load(key, initial));
  useEffect(() => { save(key, v); }, [key, v]);
  return [v, setV];
}
