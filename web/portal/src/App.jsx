import { methods, isAvailable, prototypeHref } from './methods.js';

const base = import.meta.env.BASE_URL;

function MethodCard({ method }) {
  const body = (
    <>
      <span className="card-name">{method.name}</span>
      <span className="card-summary">{method.summary}</span>
    </>
  );
  if (isAvailable(method)) {
    return (
      <a className="card is-available" href={prototypeHref(base, method.id)}>
        {body}
        <span className="card-action">Abrir prototipo <span aria-hidden="true">→</span></span>
      </a>
    );
  }
  return (
    <div className="card is-soon">
      {body}
      <span className="card-badge">Próximamente</span>
    </div>
  );
}

export default function App() {
  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">All in Chile 2026</p>
        <h1>KairosMethod</h1>
        <p className="lead">
          Espacio de estudio para enseñanza media, basado en métodos de estudio validados.
          Elige un método para probar su prototipo.
        </p>
      </header>
      <main>
        <h2 className="sr-only">Métodos de estudio</h2>
        <ul className="grid">
          {methods.map((method) => (
            <li key={method.id}>
              <MethodCard method={method} />
            </li>
          ))}
        </ul>
      </main>
      <footer className="foot">
        <a href="https://www.duoc.cl/allinchile2026/">Sitio oficial de All in Chile 2026</a>
      </footer>
    </div>
  );
}
