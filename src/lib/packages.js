const PACKAGE_TYPE = "reminiscence-content-pack";

const toBase64 = async (url) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export async function exportContentPack(library, plans) {
  const files = {};
  for (const item of library) {
    const urls = [item.mediaUrl, item.coverUrl, item.posterUrl].filter(Boolean);
    for (const url of urls) {
      if (url.startsWith("blob:") || url.startsWith("data:")) continue;
      const name = url.split("/").pop();
      if (!files[`${item.id}:${name}`]) {
        try {
          const data = await toBase64(url);
          files[`${item.id}:${name}`] = {
            name,
            data
          };
        } catch {
          // The file may be unavailable; metadata still exports.
        }
      }
    }
  }
  const pack = {
    type: PACKAGE_TYPE,
    version: 1,
    exportedAt: new Date().toISOString(),
    library,
    plans,
    files
  };
  const blob = new Blob([JSON.stringify(pack, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `憶當年內容包-${new Date().toISOString().slice(0, 10)}.rempack.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export async function importContentPack(file, extraFiles = []) {
  const text = await file.text();
  const pack = JSON.parse(text);
  if (pack.type !== PACKAGE_TYPE) {
    throw new Error("這個檔案不是有效的憶當年內容包。");
  }
  const fileMap = new Map();
  for (const fileEntry of extraFiles) {
    fileMap.set(fileEntry.name, fileEntry);
  }
  const localize = async (url, id) => {
    if (!url || url.startsWith("blob:") || url.startsWith("data:")) return url;
    const name = url.split("/").pop();
    const entry = pack.files?.[`${id}:${name}`] || pack.files?.[name];
    if (entry?.data) {
      const bytes = Uint8Array.from(atob(entry.data), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes]);
      return URL.createObjectURL(blob);
    }
    const external = fileMap.get(name) || fileMap.get(url.split("/").pop());
    if (external) {
      return URL.createObjectURL(external);
    }
    return url;
  };
  const library = await Promise.all(
    pack.library.map(async (item) => ({
      ...item,
      mediaUrl: await localize(item.mediaUrl, item.id),
      coverUrl: item.coverUrl
        ? await localize(item.coverUrl, item.id)
        : undefined,
      posterUrl: item.posterUrl
        ? await localize(item.posterUrl, item.id)
        : undefined
    }))
  );
  return { library, plans: pack.plans || [] };
}
