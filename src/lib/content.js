// Content module: loads media and custom questions from the baked-in manifest.json.

const MANIFEST_PATH = `${import.meta.env.BASE_URL}content/manifest.json`;

let cachedManifest = null;

export async function loadManifest() {
  if (cachedManifest) return cachedManifest;
  try {
    const response = await fetch(MANIFEST_PATH, { cache: "no-cache" });
    if (!response.ok) throw new Error(`Failed to load manifest: ${response.status}`);
    cachedManifest = await response.json();
    return cachedManifest;
  } catch (error) {
    console.error("Failed to load manifest:", error);
    return { version: 0, media: [], plans: [], textCards: [] };
  }
}

export function clearManifestCache() {
  cachedManifest = null;
}

export async function loadContentFromManifest() {
  const manifest = await loadManifest();
  const media = (manifest.media || []).map((item) => ({
    ...item,
    questions: item.questions || { recall: [], discussion: [] }
  }));
  return {
    media,
    plans: manifest.plans || [],
    textCards: manifest.textCards || []
  };
}
