export const MAX_PROFILE_NAME_LENGTH = 50;

const graphemeSegmenter = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
  ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  : null;

/** Límite de entrada sin quitar espacios mientras el usuario está escribiendo. */
export function limitProfileName(name) {
  const value = String(name ?? '');
  const characters = graphemeSegmenter
    ? Array.from(graphemeSegmenter.segment(value), (part) => part.segment)
    : Array.from(value);
  return characters.length > MAX_PROFILE_NAME_LENGTH
    ? characters.slice(0, MAX_PROFILE_NAME_LENGTH).join('')
    : value;
}

/** Forma canónica que se guarda en el perfil y en la base local. */
export function normalizeProfileName(name) {
  return limitProfileName(String(name ?? '').trim());
}
