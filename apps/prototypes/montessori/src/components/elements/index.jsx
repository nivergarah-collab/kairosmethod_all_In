import TimerLive from './TimerLive.jsx';
import LampLive from './LampLive.jsx';
import WaterLive from './WaterLive.jsx';
import NotesLive from './NotesLive.jsx';
import MusicLive from './MusicLive.jsx';
import FileLive from './FileLive.jsx';
import DeviceLive from './DeviceLive.jsx';

// Un componente de vista por tipo de elemento (un archivo cada uno). ItemCard solo
// conoce `Live`, `Named` e `Icon`.
export { Icon, Named } from './Basic.jsx';

const LIVE = {
  timer: TimerLive,
  lamp: LampLive,
  water: WaterLive,
  notes: NotesLive,
  music: MusicLive,
  file: FileLive,
  device: DeviceLive,
};

export function Live({ item, timer, dispatch }) {
  const Cmp = LIVE[item.type];
  return Cmp ? <Cmp item={item} timer={timer} dispatch={dispatch} /> : null;
}

// Tamaño de cada combinación (en em: el tamaño principal/secundario cambia el font-size).
const LIVE_DIMS = {
  timer: [14, 15.5],
  lamp: [10, 13],
  water: [9.5, 12.5],
  notes: [14, 12],
  music: [15, 8],
  file: [14, 8.5],
  device: [14, 12.5],
};
export function dims(item) {
  if (item.view === 'icon') return [6, 6];
  if (item.view === 'named') return [14, 5];
  return LIVE_DIMS[item.type] ?? [12, 10];
}
