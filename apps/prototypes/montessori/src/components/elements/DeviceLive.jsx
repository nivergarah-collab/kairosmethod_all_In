// Vista «en uso» de este tipo de elemento. Reemplazable por una imagen real o una ventana
// flotante sin tocar ItemCard.
export default function DeviceLive({ item }) {
  const { device, role } = item.config;
  const SCREEN = { Estudiar: ['✏️', 'Estudiando'], Consultar: ['🔎', 'Consultando'], Música: ['🎧', 'Música'], Silencio: ['🔕', 'En silencio'] };
  const [screenIcon, screenLabel] = SCREEN[role];
  return (
    <div className={`v-live v-device d-${device}`}>
      <div className="dev-body" role="img" aria-label={`${device} para ${role.toLowerCase()}`}>
        <div className="dev-screen">
          <span>
            <b aria-hidden="true">{screenIcon}</b> {screenLabel}
          </span>
        </div>
        {device === 'PC' && <div className="dev-stand" />}
        {device === 'Celular' && <i className="dev-notch" />}
      </div>
      <span className="v-caption">
        {device} · {role}
      </span>
    </div>
  );
}
