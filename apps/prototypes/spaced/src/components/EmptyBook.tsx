interface Props {
  hasCards: boolean;
  onDefineFirst: () => void;
}

export function EmptyBook({ hasCards, onDefineFirst }: Props) {
  return (
    <section className="book book-empty">
      <div className="closed-book">
        <span className="closed-book-spine"></span>
        <span className="closed-book-band"></span>
      </div>
      {hasCards ? (
        <>
          <h2 className="empty-title">No queda nada por repasar hoy</h2>
          <p className="empty-text">
            Tu fichero está al día. Las fichas vuelven en su fecha programada;
            mira el cajón de la agenda para saber cuándo.
          </p>
        </>
      ) : (
        <>
          <h2 className="empty-title">Empieza con tu primera pregunta</h2>
          <p className="empty-text">
            Esta app no entrega respuestas: tú defines las preguntas que quieres
            dominar y la fecha en que las necesitas. Escribir tu propia pregunta
            ya es parte del aprendizaje.
          </p>
          <button className="btn-soft" type="button" onClick={onDefineFirst}>
            Definir mi primera pregunta
          </button>
        </>
      )}
    </section>
  );
}