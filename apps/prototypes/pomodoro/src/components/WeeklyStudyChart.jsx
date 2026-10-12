// Port de ui/components/WeeklyStudyChart.kt
import React, { useMemo, useState } from 'react';
import { Icon, IconButton, Surface, Card, T, alpha } from '../m3.jsx';

const f32 = Math.fround;

/** Float.toString de Kotlin/Java (forma decimal más corta que ida y vuelta en float32). */
export function floatToString(value) {
  const f = f32(value);
  if (Number.isInteger(f)) return f.toFixed(1);
  for (let p = 1; p <= 9; p++) {
    const candidate = Number(f.toPrecision(p));
    if (f32(candidate) === f) return String(candidate);
  }
  return String(f);
}

/** String.format(Locale("es","CL"), "%.1f", v): redondeo HALF_UP sobre la representación decimal más corta y coma decimal. */
export function format1(value) {
  const s = String(value);
  let out;
  if (/e/i.test(s) || value < 0) {
    out = value.toFixed(1);
  } else {
    const [intPart, frac = ''] = s.split('.');
    const digits = BigInt(intPart + (frac[0] ?? '0')) + (frac[1] !== undefined && frac[1] >= '5' ? 1n : 0n);
    const str = digits.toString().padStart(2, '0');
    out = `${str.slice(0, -1)}.${str.slice(-1)}`;
  }
  return out.replace('.', ',');
}

const MONTHS_ABBR = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sept.', 'oct.', 'nov.', 'dic.'];
const pad2 = (n) => String(n).padStart(2, '0');

/** SimpleDateFormat("dd MMM", es-CL) */
export function formatDayMonth(date) {
  return `${pad2(date.getDate())} ${MONTHS_ABBR[date.getMonth()]}`;
}

/** SimpleDateFormat("dd MMM, HH:mm", es-CL) */
export function formatDayMonthTime(date) {
  return `${formatDayMonth(date)}, ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function WeeklyStudyProductivityCard({ sessions, dailyGoalMinutes }) {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.
  const [selectedDayIndex, setSelectedDayIndex] = useState(-1);

  const weeklySummary = useMemo(
    () => computeWeeklySummary(sessions, dailyGoalMinutes, weekOffset),
    [sessions, dailyGoalMinutes, weekOffset],
  );

  const bestDay = weeklySummary.bestDay;
  const meetsSeventy = weeklySummary.goalCompletionPercentage >= 70;

  return (
    <Card
      testId="weekly_productivity_card"
      color="var(--surface)"
      radius={20}
      border={`1px solid ${alpha('var(--outline-variant)', 0.45)}`}
      style={{ width: '100%' }}
    >
      <div style={{ padding: 18 }}>
        {/* Header: Title & Week navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
            <div
              style={{
                width: 38, height: 38, borderRadius: '50%', background: alpha('var(--pomo-primary)', 0.15), flex: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Icon name="CalendarToday" size={20} tint="var(--pomo-primary)" />
            </div>
            <div style={{ width: 10, flex: 'none' }} />
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <T v="titleMedium" w="bold" as="div">Resumen Semanal de Estudio</T>
              <T v="bodySmall" color="var(--on-surface-variant)" as="div">{weeklySummary.weekLabel}</T>
            </div>
          </div>

          {/* Week selector buttons */}
          <div style={{ display: 'flex', alignItems: 'center', flex: 'none' }}>
            <IconButton
              testId="prev_week_button"
              label="Semana anterior"
              style={{ width: 34, height: 34 }}
              onClick={() => {
                setWeekOffset(weekOffset - 1);
                setSelectedDayIndex(-1);
              }}
            >
              <Icon name="ArrowBack" size={18} />
            </IconButton>

            <Surface radius={8} color={alpha('var(--surface-variant)', 0.6)}>
              <T v="labelSmall" w="bold" style={{ display: 'block', padding: '2px 6px' }}>
                {weekOffset === 0 ? 'Actual' : `${weekOffset}s`}
              </T>
            </Surface>

            <IconButton
              testId="next_week_button"
              label="Semana siguiente"
              style={{ width: 34, height: 34, pointerEvents: weekOffset < 0 ? undefined : 'none' }}
              onClick={() => {
                if (weekOffset < 0) {
                  setWeekOffset(weekOffset + 1);
                  setSelectedDayIndex(-1);
                }
              }}
            >
              <Icon name="ArrowForward" size={18} tint={weekOffset < 0 ? 'var(--on-surface)' : 'var(--outline-variant)'} />
            </IconButton>
          </div>
        </div>

        <div style={{ height: 14 }} />

        {/* Main KPI Metrics Banner */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box',
            borderRadius: 14, background: alpha('var(--surface-variant)', 0.45), padding: '10px 14px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <T v="labelSmall" color="var(--on-surface-variant)">Horas Totales</T>
            <T v="headlineSmall" w="extrabold" color="var(--pomo-primary)">{`${format1(weeklySummary.totalHours)} h`}</T>
            <T v="bodySmall" size={11} color="var(--on-surface-variant)">{`${weeklySummary.totalMinutes} min de enfoque`}</T>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <T v="labelSmall" color="var(--on-surface-variant)">Promedio Diario</T>
            <T v="titleLarge" w="bold" color="var(--on-surface)">{`${format1(weeklySummary.averageHoursPerDay)} h`}</T>
            <T v="bodySmall" size={11} color="var(--on-surface-variant)">{`Meta: ${floatToString(dailyGoalMinutes / 60)}h/día`}</T>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <T v="labelSmall" color="var(--on-surface-variant)">Productividad</T>
            <Surface radius={8} color={alpha(meetsSeventy ? 'var(--break-green)' : 'var(--pomo-accent-gold)', 0.15)}>
              <T
                v="labelMedium"
                w="bold"
                color={meetsSeventy ? 'var(--break-green)' : 'var(--pomo-accent-gold)'}
                style={{ display: 'block', padding: '3px 8px' }}
              >
                {`${weeklySummary.goalCompletionPercentage}% meta`}
              </T>
            </Surface>
            <T v="bodySmall" w="semibold" size={11} color="var(--on-surface-variant)">{weeklySummary.productivityLevel}</T>
          </div>
        </div>

        <div style={{ height: 16 }} />

        {/* Interactive Weekly Bar Chart */}
        <T v="labelSmall" color="var(--on-surface-variant)" as="div">
          Distribución por Día de la Semana (toca una barra para ver detalles):
        </T>

        <div style={{ height: 8 }} />

        <WeeklyBarChartInteractive
          days={weeklySummary.days}
          dailyGoalHours={f32(dailyGoalMinutes / 60)}
          selectedIndex={selectedDayIndex}
          onDaySelected={(i) => setSelectedDayIndex(selectedDayIndex === i ? -1 : i)}
        />

        <div style={{ height: 12 }} />

        {/* Selected Day Detail or Best Day Highlight */}
        {selectedDayIndex >= 0 && selectedDayIndex < weeklySummary.days.length ? (
          <DayDetailPanel day={weeklySummary.days[selectedDayIndex]} />
        ) : bestDay != null && bestDay.hours > 0 ? (
          <Surface radius={12} color={alpha('var(--surface-variant)', 0.5)} style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px' }}>
              <Icon name="EmojiEvents" size={18} tint="var(--pomo-accent-gold)" />
              <div style={{ width: 8, flex: 'none' }} />
              <T v="bodySmall" w="semibold" color="var(--on-surface)">
                {`Día más productivo: ${bestDay.dayNameFull} (${format1(bestDay.hours)} h)`}
              </T>
            </div>
          </Surface>
        ) : null}
      </div>
    </Card>
  );
}

const CHART_HEIGHT = 180;
const LABEL_HEIGHT = 16; // labelSmall: lineHeight 16sp

function barBackground(day, isSelected) {
  if (isSelected) return 'linear-gradient(to bottom, var(--pomo-secondary), var(--pomo-primary))';
  if (day.meetsGoal) return 'linear-gradient(to bottom, var(--break-green), #059669)';
  if (day.hours > 0) return 'linear-gradient(to bottom, var(--pomo-primary-dark), var(--pomo-primary))';
  return `linear-gradient(to bottom, var(--surface-variant), ${alpha('var(--surface-variant)', 0.5)})`;
}

export function WeeklyBarChartInteractive({ days, dailyGoalHours, selectedIndex, onDaySelected }) {
  const maxHours = Math.max(Math.max(...days.map((d) => d.hours)), dailyGoalHours, 2.5);

  // Canvas con padding (bottom 28, top 20, start 12, end 12): línea punteada de la meta
  const chartHeight = CHART_HEIGHT - 28 - 20;
  const goalY = chartHeight * (1 - Math.min(1, Math.max(0, dailyGoalHours / maxHours)));

  return (
    <div style={{ position: 'relative', width: '100%', height: CHART_HEIGHT }}>
      {/* Goal line & Bars canvas */}
      <svg
        width="100%"
        height={chartHeight}
        style={{ position: 'absolute', left: 12, top: 20, width: 'calc(100% - 24px)', overflow: 'visible' }}
      >
        <line
          x1={0}
          y1={goalY}
          x2="100%"
          y2={goalY}
          stroke="#F59E0B"
          strokeOpacity={0.5}
          strokeWidth={2}
          strokeDasharray="10 10"
        />
      </svg>

      {/* Days columns */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        {days.map((day, index) => {
          const isSelected = selectedIndex === index;
          const fraction = Math.min(1, Math.max(0, day.hours / maxHours));
          const barHeight = (CHART_HEIGHT - LABEL_HEIGHT) * (0.72 * Math.max(fraction, 0.04));

          return (
            <div
              key={index}
              data-testid={`day_bar_${day.dayNameShort}`}
              className="m3-state"
              onClick={() => onDaySelected(index)}
              style={{
                flex: 1, minWidth: 0, height: '100%', boxSizing: 'border-box', padding: '0 2px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}
            >
              {/* Hours label above bar */}
              <T
                v="labelSmall"
                size={10}
                color={isSelected ? 'var(--pomo-primary)' : 'var(--on-surface-variant)'}
                style={{ fontWeight: isSelected ? 700 : 400, minHeight: LABEL_HEIGHT, whiteSpace: 'nowrap' }}
              >
                {day.hours > 0 ? `${format1(day.hours)}h` : ''}
              </T>

              <div style={{ flex: 1 }} />

              {/* The Bar */}
              <div
                style={{
                  width: '55%',
                  height: barHeight,
                  flex: 'none',
                  boxSizing: 'border-box',
                  borderRadius: '6px 6px 0 0',
                  background: barBackground(day, isSelected),
                  backgroundOrigin: 'border-box',
                  border: isSelected ? '2px solid var(--on-surface)' : '0',
                  transition: 'height 500ms cubic-bezier(0.1, 0.8, 0.2, 1)',
                }}
              />

              <div style={{ height: 6, flex: 'none' }} />

              {/* Day Name Label */}
              <div
                style={{
                  borderRadius: 6,
                  flex: 'none',
                  background: isSelected ? 'var(--pomo-primary)' : day.isToday ? 'var(--primary-container)' : 'transparent',
                }}
              >
                <T
                  v="labelSmall"
                  color={isSelected ? '#FFFFFF' : day.isToday ? 'var(--on-primary-container)' : 'var(--on-surface)'}
                  style={{ display: 'block', padding: '2px 4px', fontWeight: day.isToday || isSelected ? 700 : 400 }}
                >
                  {day.dayNameShort}
                </T>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DayDetailPanel({ day }) {
  return (
    <Card testId="day_detail_panel" color={alpha('var(--surface-variant)', 0.6)} radius={14} style={{ width: '100%' }}>
      <div style={{ padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <T v="titleSmall" w="bold">{`${day.dayNameFull}, ${day.dateString}`}</T>
            {day.isToday && (
              <>
                <span style={{ width: 6, flex: 'none' }} />
                <Surface radius={6} color="var(--pomo-primary)">
                  <T v="labelSmall" w="bold" size={9} color="#FFFFFF" style={{ display: 'block', padding: '2px 5px' }}>HOY</T>
                </Surface>
              </>
            )}
          </div>

          <T v="titleSmall" w="bold" color={day.meetsGoal ? 'var(--break-green)' : 'var(--pomo-primary)'}>
            {`${floatToString(day.hours)} h (${day.minutes} min)`}
          </T>
        </div>

        <div style={{ height: 6 }} />

        <T v="bodySmall" color="var(--on-surface-variant)" as="div">{`${day.sessionsCount} sesiones completadas`}</T>

        {day.topics.length > 0 && (
          <>
            <div style={{ height: 4 }} />
            <T v="bodySmall" size={11} color="var(--on-surface)" as="div">{`Temas estudiados: ${day.topics.join(', ')}`}</T>
          </>
        )}
      </div>
    </Card>
  );
}

const DAY_NAMES_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const DAY_NAMES_FULL = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export function computeWeeklySummary(sessions, dailyGoalMinutes, weekOffset) {
  const now = new Date();
  // Semana con lunes como primer día; Calendar.add(WEEK_OF_YEAR) + set(DAY_OF_WEEK, MONDAY) a las 00:00:00.000
  const daysSinceMonday = (now.getDay() + 6) % 7;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday + 7 * weekOffset, 0, 0, 0, 0);
  const startOfWeekMillis = start.getTime();
  const y = start.getFullYear();
  const m = start.getMonth();
  const d = start.getDate();
  const endOfWeekMillis = new Date(y, m, d + 6, 23, 59, 59, 999).getTime();

  const weekLabel = `Semana del ${formatDayMonth(new Date(startOfWeekMillis))} - ${formatDayMonth(new Date(endOfWeekMillis))}`;

  const weekSessions = sessions.filter((s) => s.endTime >= startOfWeekMillis && s.endTime <= endOfWeekMillis);

  const dailyGoalHours = f32(dailyGoalMinutes / 60);

  const daysData = [0, 1, 2, 3, 4, 5, 6].map((i) => {
    const dayStartDate = new Date(y, m, d + i, 0, 0, 0, 0);
    const dayStart = dayStartDate.getTime();
    // El Kotlin fija hora/minuto/segundo pero no los milisegundos (quedan en 0)
    const dayEnd = new Date(y, m, d + i, 23, 59, 59, 0).getTime();

    const daySessions = weekSessions.filter((s) => s.endTime >= dayStart && s.endTime <= dayEnd);
    const dayFocusSeconds = daySessions.reduce((acc, s) => acc + s.totalFocusSecondsSpent, 0);
    const dayMinutes = Math.floor(dayFocusSeconds / 60);
    const dayHours = f32(dayMinutes / 60);
    const topics = [...new Set(daySessions.map((s) => s.topic.trim()))].filter((t) => t.trim() !== '');

    const isToday =
      dayStartDate.getFullYear() === now.getFullYear() &&
      dayStartDate.getMonth() === now.getMonth() &&
      dayStartDate.getDate() === now.getDate();

    return {
      dayNameShort: DAY_NAMES_SHORT[i],
      dayNameFull: DAY_NAMES_FULL[i],
      dateString: formatDayMonth(dayStartDate),
      hours: dayHours,
      minutes: dayMinutes,
      sessionsCount: daySessions.length,
      topics,
      isToday,
      meetsGoal: dayHours >= dailyGoalHours && dayHours > 0,
    };
  });

  const totalHours = f32(daysData.reduce((acc, day) => acc + day.hours, 0));
  const totalMinutes = daysData.reduce((acc, day) => acc + day.minutes, 0);
  const averageHoursPerDay = f32(totalHours / 7);
  const bestDay = daysData.reduce((best, day) => (best == null || day.hours > best.hours ? day : best), null);
  const weeklyGoalHours = f32((dailyGoalMinutes * 7) / 60);
  const goalCompletionPercentage =
    weeklyGoalHours > 0
      ? Math.min(100, Math.max(0, Math.trunc(f32(f32(totalHours / weeklyGoalHours) * 100))))
      : 0;

  let productivityLevel;
  if (totalHours >= weeklyGoalHours) productivityLevel = 'Excelente meta superada 🚀';
  else if (totalHours >= f32(weeklyGoalHours * f32(0.7))) productivityLevel = 'Muy productivo 🔥';
  else if (totalHours >= f32(weeklyGoalHours * f32(0.4))) productivityLevel = 'Buen ritmo constante ⚡';
  else if (totalHours > 0) productivityLevel = 'En progreso 🌱';
  else productivityLevel = 'Sin registros esta semana';

  return {
    weekLabel,
    days: daysData,
    totalHours,
    totalMinutes,
    averageHoursPerDay,
    bestDay,
    goalHoursWeekly: weeklyGoalHours,
    goalCompletionPercentage,
    productivityLevel,
  };
}
