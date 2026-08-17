const MEDIA_CACHE = "reminiscence-media";

const planMediaUrls = (plan, mediaById) => {
  const urls = new Set();
  for (const phase of plan.phases || []) {
    for (const id of phase.mediaIds || []) {
      const item = mediaById.get(id);
      if (!item) continue;
      if (item.mediaUrl) urls.add(item.mediaUrl);
      if (item.coverUrl) urls.add(item.coverUrl);
      if (item.posterUrl) urls.add(item.posterUrl);
    }
  }
  return [...urls];
};

export async function cacheUrl(url) {
  if (!("caches" in window)) return false;
  const cache = await caches.open(MEDIA_CACHE);
  const existing = await cache.match(url);
  if (existing) return true;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`載入失敗：${url}`);
  await cache.put(url, response.clone());
  return true;
}

export async function prepareSessionOffline(plan, mediaById, onProgress) {
  const urls = planMediaUrls(plan, mediaById);
  let done = 0;
  for (const url of urls) {
    await cacheUrl(url);
    done += 1;
    onProgress?.(done, urls.length);
  }
  return urls.length;
}

export async function sessionIsPrepared(plan, mediaById) {
  if (!("caches" in window)) return false;
  const urls = planMediaUrls(plan, mediaById);
  if (!urls.length) return true;
  const cache = await caches.open(MEDIA_CACHE);
  const results = await Promise.all(urls.map((url) => cache.match(url)));
  return results.every(Boolean);
}

export function clearPreparedFlags(preparedIds, mediaById) {
  // Kept for future maintenance; offline flags are per-session metadata.
  return preparedIds;
}
