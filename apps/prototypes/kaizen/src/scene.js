import { createInitialGarden, ESTABLISHED_GROWTH_POINTS, FAMILIES, reduceGarden } from './state.js';

export const ZONES = [
  { id: 'greenhouse', label: 'Invernadero', subtitle: 'Un lugar para empezar pequeño.', viewBox: '0 0 3 2' },
  { id: 'balcony', label: 'Balcón', subtitle: 'Un respiro entre una idea y la siguiente.', viewBox: '3 0 3 2' },
  { id: 'reading', label: 'Rincón de lectura', subtitle: 'Deja que las ideas echen raíces.', viewBox: '0 2 3 2' },
  { id: 'workspace', label: 'Zona de trabajo', subtitle: 'El progreso también vive en lo cotidiano.', viewBox: '3 2 3 2' },
];
const validZone = (id) => ZONES.some((zone) => zone.id === id);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function radicalInverse(index, base) {
  let value = 0;
  let place = 1 / base;
  while (index > 0) {
    value += (index % base) * place;
    index = Math.floor(index / base);
    place /= base;
  }
  return value;
}

export function getSeedOptions() {
  return FAMILIES.map((family) => {
    const approach = family.approaches[0];
    return {
      familyId: family.id,
      approachId: approach.id,
      name: approach.starterName,
      action: approach.starterAction,
      frequency: 'daily',
      cue: { moment: '', place: '' },
    };
  });
}

export function getPlantGrowthStage(growthPoints) {
  const growth = Number.isFinite(growthPoints) ? Math.max(0, growthPoints) : 0;
  if (growth < 1) return { id: 'incubating', label: 'Semilla · incubación' };
  if (growth < 7) return { id: 'germinating', label: 'Germinando' };
  if (growth < ESTABLISHED_GROWTH_POINTS) return { id: 'seedling', label: 'Brote joven' };
  return { id: 'established', label: 'Planta establecida' };
}

export function getPlantStageScale(growthPoints) {
  const growth = Number.isFinite(growthPoints) ? Math.max(0, growthPoints) : 0;
  if (growth >= 1 && growth < 7) return 0.62 + ((Math.min(growth, 6) - 1) / 5) * 0.16;
  if (growth >= 7 && growth < ESTABLISHED_GROWTH_POINTS) return 0.78 + ((Math.min(growth, ESTABLISHED_GROWTH_POINTS - 1) - 7) / 13) * 0.18;
  return 1;
}

export function beginZoneSwipe(target, pointerId, startX, startY) {
  const plant = target?.closest?.('.spatial-plant');
  const control = target?.closest?.('button,select,a,input,[role="button"]');
  if (control && !plant) return null;
  return { kind: 'zone-swipe', pointerId, startX, startY, plantId: plant?.dataset?.plantId ?? null };
}

export function hasZoneSwipeMoved(gesture, event, threshold = 8) {
  if (gesture?.kind !== 'zone-swipe' || gesture.pointerId !== event.pointerId) return false;
  const horizontalMovement = Math.abs(event.clientX - gesture.startX);
  const verticalMovement = Math.abs(event.clientY - gesture.startY);
  return horizontalMovement > threshold && horizontalMovement > verticalMovement * 1.5;
}

export function getZoneSwipeDirection(gesture, event) {
  if (gesture?.kind !== 'zone-swipe' || event.pointerId !== gesture.pointerId) return 0;
  const dx = event.clientX - gesture.startX;
  const dy = event.clientY - gesture.startY;
  if (Math.abs(dx) <= 65 || Math.abs(dx) <= Math.abs(dy) * 1.5) return 0;
  return dx < 0 ? 1 : -1;
}

export function getZoneSwipeOutsideEnd(gesture, event, isInsideStage) {
  if (isInsideStage || !['pointerup', 'pointercancel'].includes(event.type)
    || gesture?.kind !== 'zone-swipe' || event.pointerId !== gesture.pointerId) return null;
  return {
    offset: event.type === 'pointerup' ? getZoneSwipeDirection(gesture, event) : 0,
    plantId: gesture.plantId ?? null,
  };
}

export function cancelPointerGesture(gesture, pointerId) {
  return gesture?.pointerId === pointerId ? null : gesture;
}

export function createPlantDrag(plantId, pointerId, position, startX, startY) {
  return {
    kind: 'plant-drag', plantId, pointerId,
    zoneId: position.zoneId, x: position.x, y: position.y, startX, startY,
  };
}

export function hasPlantDragMoved(gesture, event, threshold = 4) {
  if (gesture?.kind !== 'plant-drag' || gesture.pointerId !== event.pointerId) return false;
  return Math.abs(event.clientX - gesture.startX) > threshold || Math.abs(event.clientY - gesture.startY) > threshold;
}

export function getPlantDragCommit(gesture, preview, event) {
  if (gesture?.kind !== 'plant-drag' || gesture.pointerId !== event.pointerId
    || !['pointerup', 'pointercancel'].includes(event.type) || preview?.id !== gesture.plantId) return null;
  return { id: gesture.plantId, zoneId: gesture.zoneId, x: preview.x, y: preview.y };
}

export function getPlantPosition(garden, plant) {
  const position = garden.preferences.scene?.positions?.[plant.id];
  if (position && validZone(position.zoneId) && Number.isFinite(position.x) && Number.isFinite(position.y)) {
    return { zoneId: position.zoneId, x: clamp(position.x, 12, 88), y: clamp(position.y, 48, 88) };
  }
  const index = Math.max(0, garden.plants.findIndex(({ id }) => id === plant.id));
  const activeZone = garden.preferences.scene?.activeZone;
  const zoneId = validZone(activeZone) ? activeZone : 'greenhouse';
  if (index < 3) return { zoneId, x: 26 + index * 24, y: 88 };
  const sequence = index - 2;
  return {
    zoneId,
    x: Number((14 + radicalInverse(sequence, 2) * 72).toFixed(2)),
    y: Number((72 + radicalInverse(sequence, 3) * 16).toFixed(2)),
  };
}

export function getPlantCaptionWidthPercent(name, stageLabel, viewportWidth, stageWidth = viewportWidth) {
  const mobile = viewportWidth <= 760;
  const fontSize = mobile ? 9 : 11;
  const stageFontSize = mobile ? 7 : 8;
  const padding = mobile ? 14 : 20;
  const maxWidth = Math.min(mobile ? 116 : 205, viewportWidth * 0.22 - 4);
  const widthFactor = 0.52;
  const measure = (text) => String(text).length;
  const nameWidth = measure(name) * fontSize * widthFactor + 15 + padding;
  const stageWidthPx = measure(stageLabel) * stageFontSize * widthFactor + padding;
  const width = Math.min(maxWidth, Math.max(nameWidth, stageWidthPx));
  return width / Math.max(1, stageWidth) * 100;
}

export function getPlantCaptionHeightPx(name, stageLabel, viewportWidth, captionWidthPx) {
  const mobile = viewportWidth <= 760;
  const fontSize = mobile ? 9 : 11;
  const stageFontSize = mobile ? 7 : 8;
  const padding = mobile ? 10 : 14;
  const horizontalPadding = mobile ? 14 : 20;
  const maxWidth = Math.min(mobile ? 116 : 205, viewportWidth * 0.22 - 4);
  const width = Math.max(1, Math.min(maxWidth, captionWidthPx));
  const availableTextWidth = Math.max(1, width - horizontalPadding - 15);
  const nameWidth = String(name).length * fontSize * 0.52;
  const stageWidth = String(stageLabel).length * stageFontSize * 0.52;
  const nameLines = Math.max(1, Math.ceil(nameWidth / availableTextWidth));
  const stageLines = Math.max(1, Math.ceil(stageWidth / Math.max(1, width - horizontalPadding)));
  return Math.ceil(nameLines * fontSize * 1.2 + stageLines * stageFontSize * 1.2 + 2 + padding);
}

export function getPlantCaptionLayout(positions, stageWidth = 375, rowStepPx = 48, stageHeightPx = stageWidth) {
  const rowStep = Number.isFinite(rowStepPx) && rowStepPx > 0 ? rowStepPx : 48;
  const ordered = positions
    .filter(({ id, x, y }) => typeof id === 'string' && Number.isFinite(x) && Number.isFinite(y))
    .map((plant) => ({
      ...plant,
      width: Number.isFinite(plant.width) && plant.width > 0 ? plant.width : 22,
      height: Number.isFinite(plant.height) && plant.height > 0 ? plant.height : rowStep,
    }))
    .sort((first, second) => first.x - second.x);
  const layout = Object.fromEntries(ordered.map(({ id }) => [id, { x: 0, y: 0 }]));
  const gap = 8 / Math.max(1, stageWidth) * 100;
  const sceneHeight = Number.isFinite(stageHeightPx) && stageHeightPx > 0 ? stageHeightPx : Math.max(1, stageWidth);
  const close = (first, second) => Math.abs(first.x - second.x) < (first.width + second.width) / 2 + gap
    && Math.abs(first.y - second.y) < 7;

  for (let index = 0; index < ordered.length;) {
    let end = index;
    while (end + 1 < ordered.length && close(ordered[end], ordered[end + 1])) end += 1;
    if (end === index) {
      index += 1;
      continue;
    }

    const group = ordered.slice(index, end + 1);
    const rows = [];
    for (const plant of group) {
      const row = rows.at(-1);
      const span = row
        ? row.reduce((sum, member) => sum + member.width, 0) + gap * row.length + plant.width
        : plant.width;
      if (!row || span > 95) rows.push([plant]);
      else row.push(plant);
    }

    const groupBaseline = group.reduce((sum, plant) => sum + plant.y / 100 * sceneHeight, 0) / group.length;
    let rowOffset = 0;
    rows.forEach((row, rowIndex) => {
      if (rowIndex > 0) rowOffset += Math.max(...rows[rowIndex - 1].map((plant) => plant.height)) + 8;
      const rowBaseline = groupBaseline - rowOffset;
      const widths = row.map(({ width }) => width);
      const span = widths.reduce((sum, width) => sum + width, 0) + gap * (row.length - 1);
      const mean = row.reduce((sum, plant) => sum + plant.x, 0) / row.length;
      const firstCenter = mean - span / 2 + widths[0] / 2;
      const lastCenter = firstCenter + span - widths[0] / 2 - widths.at(-1) / 2;
      const minimum = widths[0] / 2 + 2;
      const maximum = 100 - widths.at(-1) / 2 - 2;
      const minShift = minimum - firstCenter;
      const maxShift = maximum - lastCenter;
      const shift = minShift > maxShift ? 0 : Math.max(minShift, Math.min(0, maxShift));
      let center = firstCenter + shift;

      for (let member = 0; member < row.length; member += 1) {
        if (member > 0) center += widths[member - 1] / 2 + gap + widths[member] / 2;
        layout[row[member].id] = {
          x: Number(((center - row[member].x) * stageWidth / 100).toFixed(2)),
          y: Number((rowBaseline - row[member].y / 100 * sceneHeight).toFixed(2)),
        };
      }
    });
    index = end + 1;
  }
  const placed = [];
  for (const plant of ordered) {
    const placement = layout[plant.id];
    const center = plant.x + placement.x / Math.max(1, stageWidth) * 100;
    let baseline = plant.y / 100 * sceneHeight + placement.y;
    while (true) {
      const colliders = placed.filter((other) => Math.abs(center - other.center)
        < (plant.width + other.width) / 2 + gap
        && baseline < other.baseline + other.height + 8
        && baseline + plant.height + 8 > other.baseline);
      if (!colliders.length) break;
      baseline = Math.min(...colliders.map(({ baseline: otherBaseline }) => otherBaseline)) - plant.height - 8;
    }
    placement.y = Number((baseline - plant.y / 100 * sceneHeight).toFixed(2));
    placed.push({ center, width: plant.width, height: plant.height, baseline });
  }
  return layout;
}

export function getPlantCaptionOffsets(positions, stageWidth = 375) {
  return Object.fromEntries(Object.entries(getPlantCaptionLayout(positions, stageWidth))
    .map(([id, { x }]) => [id, x])
    .filter(([, offset]) => Math.abs(offset) > 0.1));
}

export function prepareGarden(input) {
  const garden = { ...input, onboardingComplete: true };
  const old = garden.preferences.scene;
  const positions = Object.fromEntries(garden.plants.map((plant) => [plant.id, getPlantPosition(garden, plant)]));
  const scene = { activeZone: validZone(old?.activeZone) ? old.activeZone : 'greenhouse', positions };
  return { ...garden, preferences: { ...garden.preferences, pausePolicy: 'keep-progress', scene } };
}

export function reduceSpatialGarden(state, action) {
  if (action.type === 'SET_ZONE') {
    if (!validZone(action.zoneId)) throw new Error('La zona no existe.');
    return { ...state, preferences: { ...state.preferences, scene: { ...state.preferences.scene, activeZone: action.zoneId } } };
  }
  if (action.type === 'MOVE_PLANT') {
    if (!state.plants.some((plant) => plant.id === action.plantId)) return state;
    if (!validZone(action.zoneId) || !Number.isFinite(action.x) || !Number.isFinite(action.y)) throw new Error('La posición no es válida.');
    const position = { zoneId: action.zoneId, x: clamp(action.x, 12, 88), y: clamp(action.y, 48, 88) };
    return { ...state, preferences: { ...state.preferences, scene: { ...state.preferences.scene, positions: { ...state.preferences.scene.positions, [action.plantId]: position } } } };
  }
  if (action.type === 'NEW_GARDEN') return prepareGarden(createInitialGarden({ now: action.now }));
  return prepareGarden(reduceGarden(state, action));
}
