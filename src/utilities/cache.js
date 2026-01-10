const cacheStore = new Map();

export function setCache(key, value, ttlSeconds = 60) {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  cacheStore.set(key, { value, expiresAt });
}

export function getCache(key) {
  const entry = cacheStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return entry.value;
}

export function delCache(key) {
  cacheStore.delete(key);
}

export function clearCache() {
  cacheStore.clear();
}

export default { setCache, getCache, delCache, clearCache };
