import { useStore } from '../state/StoreContext';
import { queueCount, tomorrowCount } from '../state/selectors';
import { plural, todayKey } from '../lib/dates';

export function TodayStrip() {
  const { state } = useStore();
  const hoy = queueCount(state);
  const manana = tomorrowCount(state);
  const objective = state.settings.periodEnd === todayKey();

  return (
    <p className="today-strip">
      Hoy: {plural(hoy, 'tarjeta')} · Mañana: {manana > 0 ? plural(manana, 'tarjeta') : 'ninguna'}
      {objective ? ' · ¡Hoy es tu fecha objetivo!' : ''}
    </p>
  );
}