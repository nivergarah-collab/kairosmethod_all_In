import type { Phase } from '../types';
import { PHASE_HINT, PHASE_LABEL } from '../lib/scheduler';

const ORDER: Phase[] = ['new', 'learning', 'reviewing', 'mastered'];

export function Ribbons({ counts }: { counts: Record<Phase, number> }) {
  return (
    <div className="ribbons" role="list" aria-label="Fases de las fichas">
      {ORDER.map((phase, i) => (
        <div className={`ribbon ribbon-${i + 1}`} role="listitem" key={phase}>
          <b className="ribbon-count">{counts[phase]}</b>
          <span className="ribbon-label">{PHASE_LABEL[phase]} · {PHASE_HINT[phase]}</span>
        </div>
      ))}
    </div>
  );
}