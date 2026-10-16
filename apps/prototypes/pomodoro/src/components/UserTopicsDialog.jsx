import React, { useEffect, useRef, useState } from 'react';
import { useVM } from '../useStore.jsx';
import { Button, Dialog, Icon, IconButton, OutlinedButton, T } from '../m3.jsx';
import { normalizeUserTopics } from '../userTopics.js';

export function UserTopicsDialog({ onDismiss }) {
  const { state, vm } = useVM();
  const topics = normalizeUserTopics(state.activeUser?.quickTopics);
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState('');
  const inputRef = useRef(null);
  const dialogRef = useRef(null);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  useEffect(() => {
    const previousFocus = document.activeElement;
    inputRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        dismissRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [...(dialogRef.current?.querySelectorAll('button:not(:disabled), input:not(:disabled)') ?? [])];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus?.();
    };
  }, []);

  const add = (event) => {
    event.preventDefault();
    if (!draft.trim()) {
      setMessage('Escribe un tema antes de guardarlo.');
      inputRef.current?.focus();
      return;
    }
    if (!vm.addQuickTopic(draft)) {
      setMessage('Ese tema ya está guardado.');
      inputRef.current?.focus();
      return;
    }
    setDraft('');
    setMessage('Tema guardado para este perfil.');
    inputRef.current?.focus();
  };

  const remove = (topic) => {
    vm.removeQuickTopic(topic);
    inputRef.current?.focus();
  };

  return (
    <Dialog onDismiss={onDismiss}>
      <section className="sc-topics-dialog" role="dialog" aria-modal="true" aria-labelledby="sc-topics-title" ref={dialogRef}>
        <header className="sc-topics-header">
          <div>
            <h2 className="t-titleLarge w-bold" id="sc-topics-title">Temas guardados</h2>
            <T as="p" v="bodySmall" color="var(--on-surface-variant)">
              Accesos rápidos de {state.activeUser?.name ?? 'este perfil'}. También puedes escribir cualquier tema directamente.
            </T>
          </div>
          <IconButton onClick={onDismiss} label="Cerrar temas guardados">
            <Icon name="Close" />
          </IconButton>
        </header>

        <form className="sc-topics-form" onSubmit={add}>
          <label htmlFor="sc-topic-draft">Agregar tema</label>
          <div className="sc-topics-add-row">
            <input
              id="sc-topic-draft"
              ref={inputRef}
              required
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ej. Biología celular"
              maxLength={80}
            />
            <Button type="submit" icon="Add" disabled={!draft.trim()}>
              Guardar
            </Button>
          </div>
        </form>

        <p className="sc-topics-message" role="status" aria-live="polite">{message}</p>

        <div className="sc-topics-list" aria-label="Temas guardados por perfil">
          {topics.length === 0 ? (
            <p className="sc-topics-empty">Todavía no guardas temas en este perfil.</p>
          ) : topics.map((topic) => (
            <div className="sc-topic-saved" key={topic}>
              <span>{topic}</span>
              <IconButton onClick={() => remove(topic)} label={`Eliminar ${topic}`}>
                <Icon name="DeleteOutline" size={20} />
              </IconButton>
            </div>
          ))}
        </div>

        <footer className="sc-topics-footer">
          <OutlinedButton onClick={onDismiss}>Listo</OutlinedButton>
        </footer>
      </section>
    </Dialog>
  );
}
