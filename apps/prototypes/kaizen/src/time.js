const DAY_MS = 24 * 60 * 60 * 1000;
const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDayKey(dayKey) {
  if (typeof dayKey !== 'string') throw new Error('La fecha debe usar el formato AAAA-MM-DD.');
  const match = DAY_KEY_PATTERN.exec(dayKey);
  if (!match) throw new Error('La fecha debe usar el formato AAAA-MM-DD.');
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const timestamp = Date.UTC(year, month - 1, day);
  const parsed = new Date(timestamp);
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    throw new Error(`La fecha ${dayKey} no existe.`);
  }
  return { year, month, day, timestamp };
}

export function localDayKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('La fecha local no es válida.');
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysBetween(dayA, dayB) {
  const first = parseDayKey(dayA);
  const second = parseDayKey(dayB);
  return Math.round((second.timestamp - first.timestamp) / DAY_MS);
}

export function shiftDayKey(dayKey, days) {
  const parsed = parseDayKey(dayKey);
  if (!Number.isInteger(days)) throw new Error('El desplazamiento debe ser un número entero de días.');
  return new Date(parsed.timestamp + days * DAY_MS).toISOString().slice(0, 10);
}

export function dateFromDayKey(dayKey) {
  const { year, month, day } = parseDayKey(dayKey);
  // Noon avoids local midnight gaps when daylight-saving rules change.
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function getGardenDate(state, realNow = new Date()) {
  if (state?.clockMode === 'demo') return dateFromDayKey(state.virtualDate);
  const date = realNow instanceof Date ? new Date(realNow.getTime()) : new Date(realNow);
  if (!Number.isFinite(date.getTime())) throw new Error('La fecha real no es válida.');
  return date;
}
