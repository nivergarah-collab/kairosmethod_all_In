import { memo } from 'react';
// Fondos estáticos dibujados con SVG/CSS propios (sin imágenes externas). Cada fondo es
// la superficie del escritorio; es independiente del aspecto de las tarjetas. Los objetos
// de los bordes son decorativos y no capturan clics.

function Grain({ id, freq, seed = 3, alpha = 0.5, color = '60,40,20' }) {
  return (
    <filter id={id} x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves="3" seed={seed} result="n" />
      <feColorMatrix
        in="n"
        values={`0 0 0 0 ${color.split(',')[0] / 255}  0 0 0 0 ${color.split(',')[1] / 255}  0 0 0 0 ${color.split(',')[2] / 255}  0 0 0 ${alpha * 2} -${alpha * 0.7}`}
      />
    </filter>
  );
}

function Wood() {
  return (
    <>
      <svg className="bd-fill" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id="wd-base" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#d8b988" />
            <stop offset=".25" stopColor="#e0c397" />
            <stop offset=".5" stopColor="#d4b280" />
            <stop offset=".75" stopColor="#dfc193" />
            <stop offset="1" stopColor="#d2ae7b" />
          </linearGradient>
          <Grain id="wd-grain" freq="0.9 0.012" alpha={0.5} />
        </defs>
        <rect width="100" height="100" fill="url(#wd-base)" />
        <rect width="100" height="100" filter="url(#wd-grain)" opacity=".55" />
        {[[9, 22, 1.8], [41, 71, 2.2], [92, 40, 1.5], [67, 12, 1.2]].map(([x, y, r]) => (
          <g key={`${x}-${y}`} opacity=".35">
            <ellipse cx={x} cy={y} rx={r * 0.5} ry={r * 1.7} fill="none" stroke="#6d4a28" strokeWidth=".18" />
            <ellipse cx={x} cy={y} rx={r * 0.3} ry={r} fill="none" stroke="#6d4a28" strokeWidth=".16" />
            <ellipse cx={x} cy={y} rx={r * 0.12} ry={r * 0.45} fill="#6d4a28" opacity=".55" />
          </g>
        ))}
        {[16.6, 33.3, 50, 66.6, 83.3].map((x) => (
          <g key={x}>
            <rect x={x - 0.12} width=".24" height="100" fill="#6d4a28" opacity=".22" />
            <rect x={x + 0.12} width=".22" height="100" fill="#fff4dd" opacity=".25" />
          </g>
        ))}
      </svg>
      <div className="bd-vignette" style={{ '--v': 'rgba(70,40,15,.38)' }} />
      <div className="bd-sheen" />
      <div className="bd-window" />
      {/* Taza con platillo (esquina inferior izquierda) */}
      <svg className="bd-obj" style={{ left: '2.5%', bottom: '4%', width: 'clamp(70px,9vw,128px)' }} viewBox="0 0 120 120" aria-hidden="true">
        <ellipse cx="62" cy="68" rx="46" ry="42" fill="#000" opacity=".16" transform="translate(5 8)" />
        <circle cx="58" cy="60" r="44" fill="#f4efe6" stroke="#d7cdb8" strokeWidth="1.5" />
        <circle cx="58" cy="60" r="34" fill="#e8e1d2" />
        <path d="M92 44 q22 -2 20 16 q-2 14 -22 12" fill="none" stroke="#f1ebdd" strokeWidth="9" strokeLinecap="round" />
        <circle cx="58" cy="60" r="27" fill="#fbf8f0" stroke="#d3c9b3" strokeWidth="2" />
        <circle cx="58" cy="60" r="21" fill="#4a2e1d" />
        <ellipse cx="52" cy="53" rx="9" ry="5" fill="#fff" opacity=".18" transform="rotate(-25 52 53)" />
      </svg>
      {/* Libreta con banda elástica (esquina inferior derecha) */}
      <svg className="bd-obj bd-notebook" style={{ right: '2%', bottom: '3%', width: 'clamp(80px,11vw,150px)' }} viewBox="0 0 130 150" aria-hidden="true">
        <g transform="rotate(7 65 75)">
          <rect x="14" y="14" width="96" height="126" rx="5" fill="#000" opacity=".18" transform="translate(5 7)" />
          <rect x="10" y="8" width="96" height="126" rx="5" fill="#35566a" />
          <rect x="10" y="8" width="8" height="126" fill="#27414f" />
          <rect x="84" y="8" width="7" height="126" fill="#c5503a" />
          <path d="M26 30 H70 M26 40 H60" stroke="#e6d8b5" strokeWidth="2.5" strokeLinecap="round" opacity=".8" />
        </g>
      </svg>
      {/* Lápiz (borde superior izquierdo) */}
      <svg className="bd-obj" style={{ left: '1.5%', top: '5%', width: 'clamp(80px,10vw,140px)' }} viewBox="0 0 140 30" aria-hidden="true">
        <g transform="rotate(-14 70 15)">
          <rect x="6" y="14" width="110" height="9" rx="2" fill="#000" opacity=".15" />
          <rect x="4" y="9" width="104" height="10" rx="2" fill="#e2b12f" />
          <rect x="4" y="9" width="104" height="3" fill="#f3d36a" />
          <path d="M108 9 L128 14 L108 19Z" fill="#e8cfa4" />
          <path d="M122 12.2 L128 14 L122 15.8Z" fill="#3a3a3a" />
          <rect x="2" y="9" width="10" height="10" rx="2" fill="#c96a5a" />
        </g>
      </svg>
      {/* Regla de madera clara en el borde inferior y un clip de papel (decorativos) */}
      <svg className="bd-obj" style={{ left: '40%', bottom: '1.2%', width: 'clamp(150px,24vw,340px)', rotate: '-1.4deg' }} viewBox="0 0 320 34" aria-hidden="true">
        <rect x="4" y="9" width="316" height="22" rx="3" fill="#000" opacity=".16" />
        <rect x="0" y="4" width="316" height="22" rx="3" fill="#efd9a8" stroke="#c9a96c" strokeWidth="1" />
        <rect x="0" y="4" width="316" height="7" rx="3" fill="#fff6dc" opacity=".45" />
        {Array.from({ length: 31 }, (_, i) => (
          <line key={i} x1={8 + i * 10} x2={8 + i * 10} y1="4" y2={i % 5 === 0 ? 17 : 11} stroke="#7a5a2c" strokeWidth={i % 5 === 0 ? 1.1 : 0.7} opacity=".7" />
        ))}
      </svg>
      <svg className="bd-obj" style={{ left: '58%', top: '5%', width: 'clamp(18px,2.2vw,32px)', rotate: '24deg' }} viewBox="0 0 24 56" aria-hidden="true">
        <path d="M7 40 V12 a6 6 0 0 1 12 0 V44 a9 9 0 0 1 -18 0 V16" fill="none" stroke="#000" strokeOpacity=".2" strokeWidth="2.6" strokeLinecap="round" transform="translate(1.5 2)" />
        <path d="M7 40 V12 a6 6 0 0 1 12 0 V44 a9 9 0 0 1 -18 0 V16" fill="none" stroke="#b9bcc2" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    </>
  );
}

function Dark() {
  return (
    <>
      <svg className="bd-fill" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id="dk-base" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2b2724" />
            <stop offset="1" stopColor="#1c1917" />
          </linearGradient>
          <linearGradient id="dk-mat-sheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity=".07" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <Grain id="dk-grain" freq="0.02 0.6" seed={8} alpha={0.4} color="150,120,90" />
          <Grain id="dk-leather" freq="0.9" seed={4} alpha={0.5} color="255,255,255" />
        </defs>
        <rect width="100" height="100" fill="url(#dk-base)" />
        <rect width="100" height="100" filter="url(#dk-grain)" opacity=".12" />
        {/* tapete de cuero */}
        <rect x="5" y="9" width="90" height="74" rx="1.6" fill="#15130f" opacity=".6" transform="translate(.6 1.2)" />
        <rect x="5" y="9" width="90" height="74" rx="1.6" fill="#3a332c" />
        <rect x="5" y="9" width="90" height="74" rx="1.6" filter="url(#dk-leather)" opacity=".07" />
        <rect x="5" y="9" width="90" height="37" rx="1.6" fill="url(#dk-mat-sheen)" />
        <rect x="6.4" y="11" width="87.2" height="70" rx="1" fill="none" stroke="#a48b66" strokeWidth=".18" strokeDasharray=".9 .7" opacity=".7" />
      </svg>
      <div className="bd-vignette" style={{ '--v': 'rgba(0,0,0,.55)' }} />
      <div className="bd-sheen dark" />
      {/* Teclado cortado por el borde inferior */}
      <svg className="bd-obj" style={{ left: '50%', bottom: '-1.5%', width: 'clamp(280px,40vw,560px)', transform: 'translateX(-50%)' }} viewBox="0 0 400 70" aria-hidden="true">
        <rect x="6" y="14" width="388" height="64" rx="8" fill="#000" opacity=".35" />
        <rect x="2" y="6" width="388" height="64" rx="8" fill="#d9d5cc" />
        {Array.from({ length: 4 }).map((_, r) =>
          Array.from({ length: 14 }).map((__, c) => (
            <rect key={`${r}-${c}`} x={10 + c * 27} y={12 + r * 13.5} width="23" height="10.5" rx="2.2" fill={r === 3 && c > 2 && c < 10 ? '#f2efe8' : '#eceae3'} stroke="#b9b4a8" strokeWidth=".7" />
          )),
        )}
      </svg>
      {/* Ratón */}
      <svg className="bd-obj bd-mouse" style={{ right: '7%', bottom: '3.5%', width: 'clamp(26px,3.4vw,48px)' }} viewBox="0 0 40 60" aria-hidden="true">
        <ellipse cx="22" cy="34" rx="16" ry="23" fill="#000" opacity=".35" />
        <path d="M20 4 C34 4 36 22 36 32 C36 48 30 56 20 56 C10 56 4 48 4 32 C4 22 6 4 20 4Z" fill="#d9d5cc" />
        <path d="M20 4 V28 M4 28 H36" stroke="#b3ad9f" strokeWidth="1.3" fill="none" />
      </svg>
      {/* Libreta y bolígrafo (esquina inferior izquierda) */}
      <svg className="bd-obj" style={{ left: '2%', bottom: '5%', width: 'clamp(70px,9vw,130px)' }} viewBox="0 0 120 110" aria-hidden="true">
        <g transform="rotate(-8 60 55)">
          <rect x="16" y="14" width="80" height="86" rx="4" fill="#000" opacity=".3" transform="translate(4 6)" />
          <rect x="12" y="8" width="80" height="86" rx="4" fill="#e9e1cf" />
          <rect x="12" y="8" width="8" height="86" fill="#c9bfa6" />
          <path d="M28 28 H82 M28 38 H82 M28 48 H82 M28 58 H70" stroke="#9db4c8" strokeWidth="1.2" />
          <rect x="30" y="86" width="74" height="5" rx="2.5" fill="#222" transform="rotate(-18 30 86)" />
          <rect x="30" y="86" width="14" height="5" rx="2.5" fill="#b0894a" transform="rotate(-18 30 86)" />
        </g>
      </svg>
      {/* Planta pequeña en maceta (esquina superior derecha) */}
      <svg className="bd-obj" style={{ right: '1.5%', top: '2.5%', width: 'clamp(54px,7vw,100px)' }} viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="52" cy="54" r="30" fill="#000" opacity=".28" transform="translate(4 6)" />
        {[0, 50, 100, 150, 200, 250, 300].map((a, i) => (
          <ellipse key={a} cx="50" cy="50" rx="9" ry="26" fill={i % 2 ? '#4e7a52' : '#5f9060'} transform={`rotate(${a} 50 50) translate(0 -14)`} />
        ))}
        <circle cx="50" cy="50" r="13" fill="#b8704e" />
        <circle cx="50" cy="50" r="9" fill="#2f2018" />
      </svg>
      {/* Portalápices en la esquina superior izquierda (decorativo) */}
      <svg className="bd-obj" style={{ left: '2.2%', top: '3%', width: 'clamp(40px,5.2vw,76px)' }} viewBox="0 0 70 90" aria-hidden="true">
        <ellipse cx="38" cy="80" rx="26" ry="7" fill="#000" opacity=".3" />
        <path d="M24 14 L18 30" stroke="#d65a4a" strokeWidth="4" strokeLinecap="round" />
        <path d="M34 8 L32 30" stroke="#e8c14a" strokeWidth="4" strokeLinecap="round" />
        <path d="M44 12 L50 30" stroke="#5a8fd0" strokeWidth="4" strokeLinecap="round" />
        <path d="M14 34 H54 L50 76 Q49 80 44 80 H24 Q19 80 18 76 Z" fill="#3b3f46" stroke="#555a63" strokeWidth="1.5" />
        <ellipse cx="34" cy="34" rx="20" ry="5" fill="#2a2d33" stroke="#555a63" strokeWidth="1.2" />
        <path d="M22 40 L25 74" stroke="#fff" strokeOpacity=".14" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </>
  );
}

function Monitor() {
  return (
    <>
      <svg className="bd-fill" preserveAspectRatio="none" viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id="mn-base" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#1d2347" />
            <stop offset=".55" stopColor="#2c3a78" />
            <stop offset="1" stopColor="#4a4c9c" />
          </linearGradient>
          <radialGradient id="mn-a" cx="25%" cy="20%" r="45%">
            <stop offset="0" stopColor="#6fd3d1" stopOpacity=".5" />
            <stop offset="1" stopColor="#6fd3d1" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="mn-b" cx="80%" cy="75%" r="45%">
            <stop offset="0" stopColor="#d77cc0" stopOpacity=".45" />
            <stop offset="1" stopColor="#d77cc0" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="mn-c" cx="60%" cy="35%" r="35%">
            <stop offset="0" stopColor="#8fa9ff" stopOpacity=".35" />
            <stop offset="1" stopColor="#8fa9ff" stopOpacity="0" />
          </radialGradient>
          <Grain id="mn-grain" freq="0.8" seed={2} alpha={0.35} color="255,255,255" />
        </defs>
        <rect width="100" height="100" fill="url(#mn-base)" />
        <rect width="100" height="100" fill="url(#mn-a)" />
        <rect width="100" height="100" fill="url(#mn-b)" />
        <rect width="100" height="100" fill="url(#mn-c)" />
        <path d="M0 78 C20 66 38 84 62 72 S92 64 100 70 V100 H0Z" fill="#fff" opacity=".05" />
        <path d="M0 88 C25 78 45 92 70 82 S95 80 100 84 V100 H0Z" fill="#fff" opacity=".06" />
        <rect width="100" height="100" filter="url(#mn-grain)" opacity=".12" />
      </svg>
      <div className="bd-vignette" style={{ '--v': 'rgba(5,8,30,.45)' }} />
      <div className="bd-glass" />
      {/* Barra de menú superior */}
      <div className="mn-menubar" aria-hidden="true">
        <span className="dot" /> <span>Estudio</span> <span>Archivo</span> <span>Ver</span>
        <i className="sp" />
        <span className="pill" />
        <span className="pill short" />
      </div>
      {/* Íconos de carpetas en el borde izquierdo de la pantalla (decorativos) */}
      <div className="mn-icons" aria-hidden="true">
        {[['Apuntes', '#f1c35a'], ['Lecturas', '#7fb5e8']].map(([label, c]) => (
          <figure key={label}>
            <svg viewBox="0 0 48 40">
              <path d="M3 8 Q3 5 6 5 H18 L22 10 H42 Q45 10 45 13 V34 Q45 37 42 37 H6 Q3 37 3 34Z" fill={c} />
              <path d="M3 15 H45 V34 Q45 37 42 37 H6 Q3 37 3 34Z" fill="#fff" opacity=".28" />
            </svg>
            <figcaption>{label}</figcaption>
          </figure>
        ))}
      </div>
      {/* Dock inferior */}
      <div className="mn-dock" aria-hidden="true">
        {['#e8a64a', '#58b394', '#6c8ee8', '#d9667d', '#a58be0'].map((c) => (
          <i key={c} style={{ background: c }} />
        ))}
      </div>
    </>
  );
}

function Backdrop({ background }) {
  return (
    <div className="backdrop" aria-hidden="true">
      {background === 'wood' && <Wood />}
      {background === 'dark' && <Dark />}
      {background === 'monitor' && <Monitor />}
    </div>
  );
}

export default memo(Backdrop);
