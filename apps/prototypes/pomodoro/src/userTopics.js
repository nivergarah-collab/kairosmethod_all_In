/** Lista de temas rápidos del perfil activo, compatible con perfiles guardados en versiones previas. */
export function normalizeUserTopics(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.reduce((topics, candidate) => {
    if (typeof candidate !== 'string') return topics;
    const topic = candidate.trim();
    const key = topic.toLocaleLowerCase();
    if (topic && !seen.has(key)) {
      seen.add(key);
      topics.push(topic);
    }
    return topics;
  }, []);
}

export function addUserTopic(topics, candidate) {
  return normalizeUserTopics([...normalizeUserTopics(topics), candidate]);
}

export function removeUserTopic(topics, candidate) {
  const key = typeof candidate === 'string' ? candidate.trim().toLocaleLowerCase() : '';
  return normalizeUserTopics(topics).filter((topic) => topic.toLocaleLowerCase() !== key);
}
