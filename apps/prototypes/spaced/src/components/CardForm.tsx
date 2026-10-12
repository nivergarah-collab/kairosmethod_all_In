import { useEffect, useState, type RefObject } from 'react';
import { useStore } from '../state/StoreContext';
import { playSound } from '../lib/sound';
import { todayKey } from '../lib/dates';

interface Props {
  /** id de la ficha en edición, o null para crear una nueva. */
  editingId: string | null;
  questionRef: RefObject<HTMLInputElement | null>;
  onStopEdit: () => void;
}

export function CardForm({ editingId, questionRef, onStopEdit }: Props) {
  const { state, dispatch } = useStore();
  const editing = editingId ? state.cards.find((c) => c.id === editingId) : undefined;

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    if (editing) {
      setQuestion(editing.question);
      setAnswer(editing.answer);
    } else {
      setQuestion('');
      setAnswer('');
    }
    // Re-sincroniza solo cuando cambia la ficha en edición.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    const payload = { question: question.trim(), answer: answer.trim() };
    if (editing) {
      dispatch({ type: 'updateCard', id: editing.id, ...payload });
      onStopEdit();
    } else {
      dispatch({ type: 'addCard', ...payload, today: todayKey() });
      playSound('file', state.settings.sound);
      setQuestion('');
      setAnswer('');
      questionRef.current?.focus();
    }
  }

  return (
    <aside className="nueva-ficha" aria-label="Agregar ficha" data-tour="card-form">
      <div className="ficha-head">
        <span className="ficha-title">{editing ? 'Editar ficha' : 'Ficha nueva'}</span>
        <span className="ficha-hint">
          {editing ? 'Cambia la pregunta o tu respuesta' : 'Una pregunta, una respuesta'}
        </span>
      </div>
      <form className="ficha-form" onSubmit={submit}>
        <label className="ficha-label" htmlFor="card-question">Pregunta</label>
        <input
          id="card-question"
          ref={questionRef}
          className="ficha-input"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="¿Qué quieres recordar?"
          required
        />

        <label className="ficha-label" htmlFor="card-answer">Tu respuesta (opcional)</label>
        <textarea
          id="card-answer"
          className="ficha-input ficha-textarea"
          rows={2}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Escríbela como la recordarás, o déjala en blanco para repasar en voz alta"
        />

        {editing ? (
          <div className="ficha-actions">
            <button className="btn-file" type="submit">Guardar cambios</button>
            <button className="btn-soft" type="button" onClick={onStopEdit}>Cancelar</button>
          </div>
        ) : (
          <button className="btn-file" type="submit">Archivar ficha</button>
        )}
      </form>
    </aside>
  );
}