import { useEffect, useRef, useState } from 'react';
import { FAMILIES, getActivePlants, REPOT_READY_GROWTH_POINTS } from '../state.js';
import { beginZoneSwipe, cancelPointerGesture, createPlantDrag, getPlantCaptionHeightPx, getPlantCaptionLayout, getPlantCaptionWidthPercent, getPlantDragCommit, getPlantGrowthStage, getPlantPosition, getPlantStageScale, getSeedOptions, getZoneSwipeDirection, getZoneSwipeOutsideEnd, hasPlantDragMoved, hasZoneSwipeMoved, ZONES } from '../scene.js';
import { DemoControls } from './DemoControls.jsx';
import { HelpButton } from '../tutorial/HelpButton.jsx';

const PLANT_ASSETS = {
  comprender: { current: 'cactus', repotted: 'cactus-repotted' },
  practicar: { current: 'jade', repotted: 'jade-repotted' },
  reflexionar: { current: 'succulent', repotted: 'succulent-repotted' },
};

export function SpatialGarden({ garden, dayKey, notice, storageError, onCare, onSelectPlant, onNavigate, onAddPlant, onDemoAction, onHelp, dispatch }) {
  const [selectedId, setSelectedId] = useState(null);
  const [arranging, setArranging] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const [showDemo, setShowDemo] = useState(false);
  const [showEvolutionSeeds, setShowEvolutionSeeds] = useState(false);
  const [dismissedEvolutionFor, setDismissedEvolutionFor] = useState(null);
  const [dismissedRepotFor, setDismissedRepotFor] = useState(null);
  const [preview, setPreview] = useState(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });
  const stageRef = useRef(null);
  const gesture = useRef(null);
  const outsidePointerEnd = useRef(null);
  const previewRef = useRef(null);
  const suppressPlantClick = useRef(null);
  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', updateViewportWidth);
    return () => window.removeEventListener('resize', updateViewportWidth);
  }, []);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => setStageSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const finishOutsideStage = (event) => {
      if (stageRef.current?.contains(event.target)) return;
      outsidePointerEnd.current?.(event);
    };
    window.addEventListener('pointerup', finishOutsideStage);
    window.addEventListener('pointercancel', finishOutsideStage);
    return () => {
      window.removeEventListener('pointerup', finishOutsideStage);
      window.removeEventListener('pointercancel', finishOutsideStage);
    };
  }, []);
  const plants = getActivePlants(garden);
  const zoneIndex = Math.max(0, ZONES.findIndex(({ id }) => id === garden.preferences.scene.activeZone));
  const zone = ZONES[zoneIndex];
  const selected = plants.find(({ id }) => id === selectedId);
  const selectedMilestone = selected?.history.find((event) => event.type === 'plant-evolved' && event.milestone === 'established');
  const showEvolutionProposal = Boolean(selectedMilestone && dismissedEvolutionFor !== selected.id);
  const repotMilestone = selected?.history.some((event) => event.type === 'plant-repot-ready')
    || selected?.growthPoints >= REPOT_READY_GROWTH_POINTS;
  const showRepotProposal = Boolean(repotMilestone && (selected.potStage ?? 1) < 2 && dismissedRepotFor !== selected.id);
  const visible = plants.filter((plant) => getPlantPosition(garden, plant).zoneId === zone.id);
  const captionStageWidth = stageSize.width || stageRef.current?.clientWidth || window.innerWidth;
  const captionStageHeight = stageSize.height || stageRef.current?.clientHeight || Math.min(window.innerHeight, 800);
  const captionLayouts = getPlantCaptionLayout(visible.map((plant) => {
    const position = preview?.id === plant.id ? preview : getPlantPosition(garden, plant);
    const stageLabel = getPlantGrowthStage(plant.growthPoints).label;
    const width = getPlantCaptionWidthPercent(plant.name, stageLabel, viewportWidth, captionStageWidth) * captionStageWidth / 100;
    return {
      id: plant.id,
      x: position.x,
      y: position.y,
      width: width / captionStageWidth * 100,
      height: getPlantCaptionHeightPx(plant.name, stageLabel, viewportWidth, width),
    };
  }), captionStageWidth, viewportWidth <= 760 ? 60 : 48, captionStageHeight);
  const changeZone = (offset) => {
    setSelectedId(null);
    dispatch({ type: 'SET_ZONE', zoneId: ZONES[(zoneIndex + offset + ZONES.length) % ZONES.length].id });
  };
  const move = (plantId, x, y, zoneId = zone.id) => dispatch({ type: 'MOVE_PLANT', plantId, x, y, zoneId });
  const plantAnotherSeed = (seed) => {
    onAddPlant(seed);
    setSelectedId(null);
    setShowEvolutionSeeds(false);
  };

  const startDrag = (event, plant) => {
    if (!arranging) return;
    event.preventDefault();
    event.stopPropagation();
    if (gesture.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const position = getPlantPosition(garden, plant);
    gesture.current = createPlantDrag(plant.id, event.pointerId, position, event.clientX, event.clientY);
    suppressPlantClick.current = null;
    previewRef.current = null;
    setPreview(null);
  };
  const continueDrag = (event) => {
    const origin = gesture.current;
    if (origin?.kind !== 'plant-drag' || event.pointerId !== origin.pointerId) return;
    if (hasPlantDragMoved(origin, event)) suppressPlantClick.current = origin.plantId;
    const bounds = stageRef.current.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const next = {
      id: origin.plantId,
      x: Math.max(12, Math.min(88, origin.x + (event.clientX - origin.startX) / bounds.width * 100)),
      y: Math.max(48, Math.min(88, origin.y + (event.clientY - origin.startY) / bounds.height * 100)),
    };
    previewRef.current = next;
    setPreview(next);
  };
  const settleDrag = (event) => {
    const current = gesture.current;
    if (current?.kind !== 'plant-drag' || event.pointerId !== current.pointerId) return false;
    const committed = getPlantDragCommit(current, previewRef.current, event);
    if (committed) move(committed.id, committed.x, committed.y, committed.zoneId);
    gesture.current = cancelPointerGesture(current, event.pointerId);
    if (event.type === 'pointercancel' && suppressPlantClick.current === current.plantId) suppressPlantClick.current = null;
    previewRef.current = null;
    setPreview(null);
    event.stopPropagation();
    if (event.type === 'pointerup' && suppressPlantClick.current === current.plantId) {
      const plantId = current.plantId;
      window.setTimeout(() => { if (suppressPlantClick.current === plantId) suppressPlantClick.current = null; }, 0);
    }
    return true;
  };
  const finishZoneSwipe = (event) => {
    const current = gesture.current;
    if (current?.kind !== 'zone-swipe' || current.pointerId !== event.pointerId) return;
    const offset = getZoneSwipeDirection(current, event);
    gesture.current = cancelPointerGesture(current, event.pointerId);
    if (offset) changeZone(offset);
    if (event.type === 'pointerup' && current.plantId && suppressPlantClick.current === current.plantId) {
      const plantId = current.plantId;
      window.setTimeout(() => { if (suppressPlantClick.current === plantId) suppressPlantClick.current = null; }, 0);
    }
  };
  const cancelGesture = (event) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (current.kind === 'plant-drag') settleDrag(event);
    else {
      gesture.current = cancelPointerGesture(current, event.pointerId);
      if (current.plantId && suppressPlantClick.current === current.plantId) suppressPlantClick.current = null;
    }
  };
  const trackZoneSwipe = (event) => {
    const current = gesture.current;
    if (current?.plantId && hasZoneSwipeMoved(current, event)) suppressPlantClick.current = current.plantId;
  };
  outsidePointerEnd.current = (event) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (current.kind === 'plant-drag') {
      settleDrag(event);
      return;
    }
    const ending = getZoneSwipeOutsideEnd(current, event, false);
    if (!ending) return;
    gesture.current = cancelPointerGesture(current, event.pointerId);
    if (ending.offset) changeZone(ending.offset);
    if (event.type === 'pointercancel' && ending.plantId && suppressPlantClick.current === ending.plantId) {
      suppressPlantClick.current = null;
    } else if (event.type === 'pointerup' && ending.plantId && suppressPlantClick.current === ending.plantId) {
      const plantId = ending.plantId;
      window.setTimeout(() => { if (suppressPlantClick.current === plantId) suppressPlantClick.current = null; }, 0);
    }
  };

  return (
    <main className="spatial-shell">
      <header className="spatial-header">
        <a href="#garden-space" className="spatial-brand"><span aria-hidden="true">✳</span> kaizen <small>un jardín para crecer</small></a>
        <nav aria-label="Herramientas del jardín" data-tour="nav">
          <button type="button" className="add-spatial-plant" aria-label="Nueva planta" onClick={() => onNavigate('new')}>＋<span> Nueva planta</span></button>
          <button type="button" onClick={() => onNavigate('nursery')}>Vivero</button>
          <button type="button" onClick={() => onNavigate('herbarium')}>Herbario</button>
          <button type="button" onClick={() => onNavigate('settings')}>Ajustes</button>
        </nav>
      </header>
      <section id="garden-space" data-tour="scene" className={`garden-space ${arranging ? 'is-arranging' : ''} ${showDetails ? 'show-plant-details' : ''}`} ref={stageRef} aria-label={`Jardín: ${zone.label}`}
        onPointerDown={(event) => { if (!gesture.current) gesture.current = beginZoneSwipe(event.target, event.pointerId, event.clientX, event.clientY); }}
        onPointerMove={trackZoneSwipe} onPointerUp={finishZoneSwipe} onPointerCancel={cancelGesture}>
        <svg className="scene-photograph" viewBox={zone.viewBox} preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image href={`${import.meta.env.BASE_URL}assets/garden-zones-v2.webp`} width="6" height="4" /></svg>
        <div className="scene-shade" />
        <div className="zone-heading" data-tour="zone-heading"><p>Tu espacio · {String(zoneIndex + 1).padStart(2, '0')} / 04</p><h1>{zone.label}</h1><span>{zone.subtitle}</span></div>
        <button type="button" data-tour="zone-prev" className="zone-arrow previous" onClick={() => changeZone(-1)} aria-label="Zona anterior">‹</button>
        <button type="button" data-tour="zone-next" className="zone-arrow next" onClick={() => changeZone(1)} aria-label="Zona siguiente">›</button>
        <div className="space-top-tools"><span className="scene-date">{garden.clockMode === 'demo' ? 'Tiempo demo' : 'Hoy'} · {dayKey.split('-').reverse().join('.')}</span><HelpButton onClick={onHelp} /></div>
        {visible.map((plant, plantIndex) => {
          const stored = getPlantPosition(garden, plant);
          const position = preview?.id === plant.id ? preview : stored;
          const cared = plant.lastCareDay === dayKey;
          const growthStage = getPlantGrowthStage(plant.growthPoints);
          const stageScale = getPlantStageScale(plant.growthPoints);
          return <button key={plant.id} type="button" data-plant-id={plant.id} data-tour={plantIndex === 0 ? 'plant' : undefined} data-growth-stage={growthStage.id} data-family={plant.familyId} className={`spatial-plant ${selectedId === plant.id ? 'is-selected' : ''}`} aria-label={`${plant.name}, fase: ${growthStage.label}, ${cared ? 'cuidado completado' : 'ver desafío'}${arranging ? ', usa las flechas para mover' : ''}`}
            style={{ left: `${position.x}%`, top: `${position.y}%`, '--plant-scale': 1 + Math.min(plant.growthPoints, 100) / 400, '--caption-offset': `${captionLayouts[plant.id]?.x ?? 0}px`, '--caption-row-offset': `${captionLayouts[plant.id]?.y ?? 0}px`, zIndex: Math.round(position.y) }}
            onClick={(event) => { if (suppressPlantClick.current === plant.id) { suppressPlantClick.current = null; event.preventDefault(); return; } setSelectedId(plant.id); setShowEvolutionSeeds(false); }} onPointerDown={(event) => startDrag(event, plant)} onPointerMove={continueDrag} onPointerUp={settleDrag} onPointerCancel={cancelGesture}
            onKeyDown={(event) => { if (!arranging || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return; event.preventDefault(); move(plant.id, stored.x + (event.key === 'ArrowRight' ? 2 : event.key === 'ArrowLeft' ? -2 : 0), stored.y + (event.key === 'ArrowDown' ? 2 : event.key === 'ArrowUp' ? -2 : 0)); }}>
            <span className="plant-cutout" style={{ backgroundImage: `url('${import.meta.env.BASE_URL}assets/${PLANT_ASSETS[plant.familyId][(plant.potStage ?? 1) >= 2 ? 'repotted' : 'current']}.webp')` }} aria-hidden="true" />
            {growthStage.id === 'incubating' && <span className="plant-stage-art plant-seed-under-soil" style={{ backgroundImage: `url('${import.meta.env.BASE_URL}assets/seed-under-soil.webp')` }} aria-hidden="true" />}
            {['germinating', 'seedling'].includes(growthStage.id) && <span className="plant-stage-art plant-cotyledon-sprout" style={{ backgroundImage: `url('${import.meta.env.BASE_URL}assets/seedling-cotyledons.webp')`, '--stage-scale': stageScale }} aria-hidden="true" />}
            <span className="plant-ground-shadow" aria-hidden="true" />
            <span className="plant-caption"><span className="plant-caption-name"><span className={cared ? 'care-dot is-cared' : 'care-dot'} />{plant.name}</span><small className="plant-stage-label">{growthStage.label}</small></span>
          </button>;
        })}
        {!visible.length && (plants.length ? <div className="empty-space"><p>Hay espacio para una nueva raíz.</p><button type="button" onClick={() => { const p = getPlantPosition(garden, plants[0]); move(plants[0].id, p.x, p.y); setSelectedId(plants[0].id); }}>{'Traer una planta aquí'}</button></div> : <div className="empty-space seed-picker" data-tour="seed-picker" aria-labelledby="seed-picker-title">
          <p className="seed-picker-eyebrow">Cada hábito empieza en incubación</p><h2 id="seed-picker-title">Elige una semilla para plantar</h2>
          <p className="seed-picker-copy">Puedes ajustar su nombre y acción después.</p>
          <div className="seed-options">{getSeedOptions().map((seed) => {
            const family = FAMILIES.find(({ id }) => id === seed.familyId);
            const approach = family.approaches.find(({ id }) => id === seed.approachId);
            return <button type="button" className={`seed-option family--${family.id}`} key={seed.familyId} aria-label={`Plantar semilla de ${family.label}: ${approach.label}`} onClick={() => onAddPlant(seed)}>
              <span className="seed-option-mark" aria-hidden="true">◌</span><span><strong>{approach.label}</strong><small>{family.label}</small></span>
            </button>;
          })}</div>
          <button className="seed-custom-link" type="button" onClick={() => onNavigate('new')}>Crear mi propia microacción</button>
        </div>)}
        <div className="scene-instruction">{arranging ? 'Arrastra tus plantas · También puedes usar las flechas del teclado' : 'Toca una planta para cuidarla · Cambia de rincón con las flechas'}</div>
      </section>
      <div className="garden-bottom">
        <div className="garden-controls" data-tour="scene-controls" role="group" aria-label="Vistas y modos del jardín">
          <button type="button" aria-pressed={showDetails} onClick={() => setShowDetails(!showDetails)}>{showDetails ? 'Ocultar detalles' : 'Ver detalles'}</button>
          <button type="button" aria-pressed={arranging} onClick={() => setArranging(!arranging)}>{arranging ? '✓ Terminar organización' : '↔ Organizar plantas'}</button>
        </div>
        <section className="care-dock" data-tour="care-dock" aria-label="Cuidado de la planta">
          {selected ? <><div className="care-dock-summary"><div className="care-dock-copy"><p>{FAMILIES.find(({ id }) => id === selected.familyId).label} · {selected.growthPoints} puntos de crecimiento</p><h2>{selected.name}</h2><span>{selected.action}</span></div>{showEvolutionProposal && <aside className="evolution-proposal" aria-live="polite"><div><strong>Hito alcanzado · planta establecida</strong><span>Un hábito ya echó raíces. Cuando quieras, puedes empezar a cultivar otra capacidad.</span></div>{showEvolutionSeeds ? <div className="evolution-seed-picker"><div className="evolution-seed-options">{getSeedOptions().map((seed) => { const family = FAMILIES.find(({ id }) => id === seed.familyId); const approach = family.approaches.find(({ id }) => id === seed.approachId); return <button type="button" className={`seed-option family--${family.id}`} key={seed.familyId} aria-label={`Plantar semilla de ${family.label}: ${approach.label}`} onClick={() => plantAnotherSeed(seed)}><span className="seed-option-mark" aria-hidden="true">◌</span><span><strong>{approach.label}</strong><small>{family.label}</small></span></button>; })}</div><button className="evolution-dismiss" type="button" onClick={() => setShowEvolutionSeeds(false)}>Ahora no</button></div> : <div className="evolution-proposal-actions"><button type="button" onClick={() => setShowEvolutionSeeds(true)}>Cultivar otra capacidad</button><button className="evolution-dismiss" type="button" onClick={() => setDismissedEvolutionFor(selected.id)}>Ahora no</button></div>}</aside>}{showRepotProposal && <aside className="evolution-proposal repot-proposal" aria-live="polite"><div><strong>Tu planta pide más espacio</strong><span>Al llegar al nivel 5, sus raíces necesitan un macetero mayor.</span></div><div className="evolution-proposal-actions"><button type="button" onClick={() => dispatch({ type: 'REPOT_PLANT', plantId: selected.id, dayKey })}>Trasplantar ahora</button><button type="button" className="evolution-dismiss" onClick={() => setDismissedRepotFor(selected.id)}>Ahora no</button></div></aside>}</div><div className="care-dock-actions"><button type="button" className="space-care-button" disabled={selected.lastCareDay === dayKey} onClick={() => onCare(selected.id)}>{selected.lastCareDay === dayKey ? '✓ Cuidado de hoy listo' : '♡ Lo hice · cuidar'}</button><button type="button" onClick={() => onSelectPlant(selected.id)}>Ver desafío</button><label className="move-zone-label">Llevar a<select aria-label="Mover planta a otra zona" value={getPlantPosition(garden, selected).zoneId} onChange={(event) => { const p = getPlantPosition(garden, selected); move(selected.id, p.x, p.y, event.target.value); dispatch({ type: 'SET_ZONE', zoneId: event.target.value }); }}>{ZONES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div></> : <div className="welcome-dock"><span aria-hidden="true">✧</span><div><h2>Crecer a tu ritmo.</h2><p>{plants.length ? 'Tus pequeñas acciones tienen un lugar. Elige una planta y haz suyo el espacio.' : 'Cada hábito empieza en incubación. Elige una semilla para darle espacio.'}</p></div></div>}
        </section>
        <footer className="space-footer"><span role="status">{storageError ? 'No se pudo guardar en este dispositivo. Exporta tu jardín desde Ajustes.' : notice || 'Tu jardín se guarda automáticamente en este dispositivo.'}</span><button type="button" data-tour="demo-toggle" aria-expanded={showDemo} onClick={() => setShowDemo(!showDemo)}>◷ {showDemo ? 'Cerrar demo' : 'Explorar el tiempo'}</button></footer>
        {showDemo && <DemoControls garden={garden} dayKey={dayKey} onAction={onDemoAction} />}
      </div>
    </main>
  );
}
