import { idbDelete, idbGet, idbPut } from "./idb.js";

const MEDIA_FIELDS = ["mediaUrl", "coverUrl", "posterUrl"];

export async function persistMediaBlobs(item) {
  await Promise.all(
    MEDIA_FIELDS.map(async (field) => {
      const url = item[field];
      if (!url?.startsWith("blob:")) return;
      try {
        const blob = await (await fetch(url)).blob();
        await idbPut("media", { id: `${item.id}:${field}`, blob });
      } catch (error) {
        console.error(error);
      }
    })
  );
}

export async function hydrateMediaUrls(item) {
  const copy = { ...item };
  await Promise.all(
    MEDIA_FIELDS.map(async (field) => {
      const url = copy[field];
      if (!url?.startsWith("blob:")) return;
      try {
        const record = await idbGet("media", `${item.id}:${field}`);
        if (record?.blob) {
          copy[field] = URL.createObjectURL(record.blob);
        }
      } catch (error) {
        console.error(error);
      }
    })
  );
  return copy;
}

export async function deleteMediaBlobs(item) {
  await Promise.all(
    MEDIA_FIELDS.map((field) => {
      const url = item[field];
      if (!url?.startsWith("blob:")) return Promise.resolve();
      return idbDelete("media", `${item.id}:${field}`).catch(() => {});
    })
  );
}
