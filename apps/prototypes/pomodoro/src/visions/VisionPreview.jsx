import React from 'react';

// Vistas previas ligeras (SVG en línea, sin imágenes): una esquematización de cada visión.
// Decorativas: el nombre y la descripción de la opción ya van como texto.
const W = 160;
const H = 100;

function Ring({ c, cx, cy, r, frac = 0.7, sw = 7 }) {
  const len = 2 * Math.PI * r;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={c.ink} strokeOpacity="0.12" strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={c.accent} strokeWidth={sw} strokeLinecap="round" strokeDasharray={`${len * frac} ${len}`} transform={`rotate(-90 ${cx} ${cy})`} />
    </g>
  );
}

const Line = ({ x, y, w, c, o = 0.25, h = 4 }) => <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={c.ink} fillOpacity={o} />;

const layouts = {
  pomodoro: (c) => (
    <>
      <Ring c={c} cx={80} cy={46} r={26} />
      <rect x="66" y="40" width="28" height="9" rx="3" fill={c.ink} fillOpacity="0.8" />
      <circle cx="46" cy="82" r="7" fill={c.accent} fillOpacity="0.25" />
      <circle cx="80" cy="82" r="9" fill={c.accent} />
      <circle cx="114" cy="82" r="7" fill={c.accent} fillOpacity="0.25" />
    </>
  ),
  calma: (c) => (
    <>
      <Line x={18} y={14} w={70} c={c} o={0.7} h={6} />
      <Line x={18} y={26} w={44} c={c} />
      <rect x="18" y="50" width="42" height="14" rx="7" fill={c.accent} />
      <rect x="64" y="55" width="12" height="4" rx="2" fill="none" stroke={c.ink} strokeOpacity="0.4" strokeDasharray="2 2" />
      <rect x="80" y="50" width="30" height="14" rx="7" fill={c.accent} fillOpacity="0.55" />
      <rect x="114" y="55" width="12" height="4" rx="2" fill="none" stroke={c.ink} strokeOpacity="0.4" strokeDasharray="2 2" />
      <rect x="130" y="50" width="14" height="14" rx="7" fill={c.accent2} />
      <Line x={18} y={80} w={90} c={c} o={0.18} />
    </>
  ),
  vision: (c) => (
    <>
      <rect x="14" y="12" width="132" height="34" rx="8" fill={c.surface} stroke={c.accent2} strokeWidth="2" />
      <Line x={22} y={20} w={60} c={c} o={0.8} h={5} />
      <Line x={22} y={31} w={96} c={c} o={0.3} />
      <rect x="14" y="54" width="40" height="32" rx="8" fill={c.accent2} fillOpacity="0.35" />
      <rect x="60" y="54" width="40" height="32" rx="8" fill="none" stroke={c.accent} strokeWidth="1.5" strokeDasharray="3 3" />
      <rect x="106" y="54" width="40" height="32" rx="8" fill={c.ink} fillOpacity="0.08" />
      <circle cx="80" cy="70" r="5" fill={c.accent} />
    </>
  ),
  paridad: (c) => (
    <>
      <rect x="12" y="8" width="136" height="20" rx="8" fill={c.surface} />
      <Line x={20} y={16} w={50} c={c} o={0.7} h={5} />
      <Ring c={c} cx={80} cy={56} r={20} frac={0.6} sw={6} />
      <rect x="69" y="52" width="22" height="7" rx="3" fill={c.ink} fillOpacity="0.8" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={20 + i * 34} y="84" width="28" height="9" rx="4" fill={i < 2 ? c.accent : c.accent2} fillOpacity={i < 2 ? 1 : 0.35} />
      ))}
    </>
  ),
  investigacion: (c) => (
    <>
      <rect x="12" y="10" width="40" height="80" rx="6" fill={c.surface} stroke={c.ink} strokeOpacity="0.15" />
      <Line x={18} y={20} w={26} c={c} o={0.6} />
      <Line x={18} y={32} w={20} c={c} />
      <Line x={18} y={44} w={24} c={c} />
      <rect x="62" y="16" width="86" height="14" rx="4" fill={c.accent} />
      <rect x="62" y="38" width="38" height="20" rx="4" fill={c.surface} stroke={c.ink} strokeOpacity="0.15" />
      <rect x="108" y="38" width="40" height="20" rx="4" fill={c.surface} stroke={c.ink} strokeOpacity="0.15" />
      <Line x={62} y={68} w={86} c={c} o={0.3} />
      <Line x={62} y={78} w={60} c={c} o={0.2} />
    </>
  ),
};

export function VisionPreview({ vision }) {
  const c = vision.preview;
  const draw = layouts[vision.id];
  return (
    <svg className="vp-svg" viewBox={`0 0 ${W} ${H}`} role="presentation" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">
      <rect width={W} height={H} fill={c.bg} />
      {draw ? draw(c) : null}
    </svg>
  );
}
