/** 105 -> "1 h 45 min", 60 -> "1 h", 25 -> "25 min", 0 -> "0 min". */
export function formatMinutes(minutes) {
  const m = Math.max(0, Math.round(minutes));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r} min`;
  return r === 0 ? `${h} h` : `${h} h ${r} min`;
}
