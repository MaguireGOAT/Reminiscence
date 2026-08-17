// Content module: loads media from the baked-in manifest.json
// and provides question auto-generation for uploads.

export const THEMES = [
  "童年玩具",
  "家居生活",
  "街市與食物",
  "工作與行業",
  "節慶與習俗",
  "交通",
  "校園生活"
];

export const THEME_TOPICS = {
  "童年玩具": "童年玩具與遊戲",
  "家居生活": "家居與日常起居",
  "街市與食物": "街市與飲食",
  "工作與行業": "工作與手藝",
  "節慶與習俗": "節日與習俗",
  "交通": "交通與出行",
  "校園生活": "校園與學習"
};

export const DISCUSSION_BY_THEME = {
  "童年玩具": [
    "你小時候最喜歡玩甚麼玩具？",
    "那時候的玩具是自己做的，還是買回來的？",
    "你會跟誰一起玩這些玩具？",
    "有沒有因為一件玩具而記得的故事？"
  ],
  "家居生活": [
    "你以前的家有幾多個人住？",
    "家裡的日常家務由誰負責？",
    "你記得家中的廚房和現在有甚麼分別？",
    "以前一家人會在甚麼地方吃飯？"
  ],
  "街市與食物": [
    "你以前多數去哪一個街市買餸？",
    "那時候街市的價錢和現在有甚麼分別？",
    "你最記得哪一味家常菜？",
    "買餸時會遇到哪些街坊？"
  ],
  "工作與行業": [
    "你以前做過哪一行？",
    "工作的地方和現在有甚麼不同？",
    "你記得哪位手藝人的故事？",
    "以前返工要搭甚麼交通工具？"
  ],
  "節慶與習俗": [
    "你最記得哪一個節日？",
    "那時候過節會準備甚麼食物？",
    "節日當日會和哪些親友聚會？",
    "以前的節日氣氛和現在有甚麼不同？"
  ],
  "交通": [
    "你以前常搭哪一種交通工具？",
    "搭電車通常去哪裡？",
    "那時候過海用甚麼方法？",
    "有沒有在車上遇過有趣的事？"
  ],
  "校園生活": [
    "你以前在哪一間學校讀書？",
    "小息時最喜歡做甚麼？",
    "你記得哪位老師？",
    "那時候上學要步行多久？"
  ]
};

const nounOf = (type) => {
  if (type === "song") return "歌";
  if (type === "photo") return "相片";
  if (type === "video") return "影片";
  return "內容";
};

export function generateQuestions(item) {
  const noun = nounOf(item.type);
  const title = item.title || `${item.type}內容`;
  const focus = item.focus || THEME_TOPICS[item.theme] || `${item.theme}的回憶`;
  const themeLabel = THEME_TOPICS[item.theme] || item.theme;

  const recall = [
    {
      question: `這${noun}《${title}》主要在講述甚麼？`,
      options: [focus, ...THEMES.filter(t => t !== item.theme).slice(0, 3).map(t => THEME_TOPICS[t])],
      answer: focus
    },
    {
      question: `這${noun}與哪一類童年回憶最有關係？`,
      options: [themeLabel, ...THEMES.filter(t => t !== item.theme).slice(0, 3).map(t => THEME_TOPICS[t])],
      answer: themeLabel
    }
  ];

  const discussion = [
    `「${title}」令你想起甚麼舊日回憶？`,
    `「${item.caption || "這個情景"}」提到的事情，你以前有冇經歷過？`,
    ...(DISCUSSION_BY_THEME[item.theme] || DISCUSSION_BY_THEME["家居生活"]).slice(0, 2)
  ];

  return { recall, discussion };
}

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
    questions: item.questions || generateQuestions(item)
  }));
  return {
    media,
    plans: manifest.plans || [],
    textCards: manifest.textCards || []
  };
}
