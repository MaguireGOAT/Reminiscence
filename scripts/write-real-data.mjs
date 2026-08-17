import { existsSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { CONTENT_MANIFEST } from "./content-manifest.mjs";
import { PHOTO_BASES, SONG_CATALOG, VIDEO_CATALOG } from "../src/data/catalog-data.js";

const pad3 = (value) => String(value).padStart(3, "0");
const mediaFile = (file) =>
  fileURLToPath(new URL(`../public/media/${file}`, import.meta.url));
const hasMedia = (file) => existsSync(mediaFile(file));
const pickMedia = (realFile, fallbackFile) =>
  hasMedia(realFile) ? `/media/${realFile}` : `/media/${fallbackFile}`;
const byId = new Map(
  CONTENT_MANIFEST.map((entry) => [
    `${entry.kind}-${entry.localFile
      .replace("real-photos/", "")
      .replace("real-songs/", "")
      .replace("real-videos/", "")
      .replace(/\.\w+$/, "")}`,
    entry
  ])
);

const decadeOf = (year) => {
  const match = String(year || "").match(/(\d{4})年/);
  if (!match) return String(year || "");
  const value = Number(match[1]);
  return `${Math.floor(value / 10) * 10}年代`;
};

const placeOf = (entry) => {
  const title = `${entry.title} ${entry.sourceTitle}`;
  if (/德輔道中/.test(title)) return "中環";
  if (/天星小輪|Star Ferry/.test(title)) return "維多利亞港";
  if (/坪洲/.test(title)) return "坪洲";
  if (/上環|Sheung Wan|西營盤/.test(title)) return "上環";
  if (/中環|Central|威靈頓街/.test(title)) return "中環";
  if (/灣仔|銅鑼灣|Wan Chai/.test(title)) return "灣仔";
  if (/Victoria Park|維多利亞公園/.test(title)) return "銅鑼灣";
  if (/東區|龍舟|Dragon Boat/.test(title)) return "香港";
  if (/培正/.test(title)) return "何文田";
  if (/摩頓臺|Moreton Terrace/.test(title)) return "銅鑼灣";
  if (/上海街|Shang Hai Street/.test(title)) return "油麻地";
  if (/北角|North Point/.test(title)) return "北角";
  return "其他";
};

const PHOTO_PROFILES = {
  "德輔道中 Des Voeux Road Central, 1960s.jpg": {
    theme: "交通",
    focus: "1960年代德輔道中的街景",
    caption: "1960年代的德輔道中，行人、商店和電車路軌擠在同一條街上。",
    notes: "可討論以前搭電車上班和逛街的經歷。"
  },
  "Star Ferry to Hong Kong Island (2886568028).jpg": {
    theme: "交通",
    focus: "天星小輪過海",
    caption: "天星小輪由九龍橫過維多利亞港，駛向香港島。",
    notes: "可討論過海的方法和船費。"
  },
  "Woman working in wet market in Peng Chau, Hong Kong.jpg": {
    theme: "街市與食物",
    focus: "濕貨街市買餸",
    caption: "坪洲海旁的濕貨街市裡，檔主正在準備食物，旁邊有街坊觀看。",
    notes: "可討論買餸和離島街市的生活。"
  },
  "HK 上環 Sheung Wan 歌賦街 Gough Street 美輪街 Mee Lun Street 勝香園 Shing Heung Yuen 大排檔 Dai pai Dong breakfast 早晨 morning February 2025 R12S 03.jpg": {
    theme: "街市與食物",
    focus: "街邊大排檔",
    caption: "上環歌賦街的大排檔在早晨開檔，食客與檔口都忙起來。",
    notes: "可討論街邊吃早餐的經歷。"
  },
  "Hong Kong rooftop vc.jpg": {
    theme: "家居生活",
    focus: "天台晾衫",
    caption: "土瓜灣一帶的天台密密麻麻，衣物晾滿屋頂。",
    notes: "可討論舊式住宅和晾衫的居住環境。"
  },
  "HK Kerosene Stove HuoShuiLu 火水爐 1.JPG": {
    theme: "家居生活",
    focus: "火水爐",
    caption: "火水爐的留影，爐身和油壺佔了畫面大部分。",
    notes: "可討論舊時煮食用的火水爐。"
  },
  "An Old Shanghai Barber Shop in Hong Kong.jpg": {
    theme: "工作與行業",
    focus: "舊式理髮店",
    caption: "舊式上海理髮店的店內陳設，鏡子和理髮椅整齊排列。",
    notes: "可討論舊式理髮店的規矩和街坊閒談。"
  },
  "Lai Afong, Cobbler, Hong Kong, c1870s.jpg": {
    theme: "工作與行業",
    focus: "補鞋工匠",
    caption: "1870年代攝影記錄的補鞋師傅，在鏡頭前展示手藝。",
    notes: "可討論舊時手藝行業和修補鞋履。"
  },
  "Glowing lanterns, Mid-Autumn Lantern Carnival 2012, Victoria Park (Hong Kong).jpg": {
    theme: "節慶與習俗",
    focus: "中秋綵燈",
    caption: "2012年維多利亞公園中秋綵燈會，滿園燈飾亮起。",
    notes: "可討論中秋節的燈籠和賞月習俗。"
  },
  "Eastern District Dragon Boat Race - 2008-06-01 09h52m48s SN201360.jpg": {
    theme: "節慶與習俗",
    focus: "龍舟競渡",
    caption: "2008年灣仔舉行的東區龍舟賽，健兒在海面划槳。",
    notes: "可討論端午節與龍舟競渡。"
  },
  "Pui Ching Middle School White Classroom and bungalow.jpg": {
    theme: "校園生活",
    focus: "培正中學課室",
    caption: "1927年培正中學的白色課室與校舍留影。",
    notes: "可討論以前學校的建築和上課環境。"
  },
  "Moreton Terrace Temporary Playground (Hong Kong).jpg": {
    theme: "童年玩具",
    focus: "臨時遊樂場",
    caption: "摩頓臺臨時遊樂場的舊照，孩子和遊樂設施成為畫面主角。",
    notes: "可討論小時候去過的遊樂場和玩耍回憶。"
  },
  "Chinese top Dagny 1.JPG": {
    theme: "童年玩具",
    focus: "中國陀螺",
    caption: "中國陀螺的實物照片，木製頂身和繩子清楚可見。",
    notes: "可討論陀螺遊戲和自製玩具。"
  },
  "Toy car (AM 1996.165.148-9).jpg": {
    theme: "童年玩具",
    focus: "鐵皮玩具車",
    caption: "橙色鑄鋁玩具車是博物館館藏，造型來自舊時流行的款式。",
    notes: "可討論以前收到的玩具禮物。"
  },
  "CMB Guy Arab UF and Tram.jpg": {
    theme: "交通",
    focus: "巴士與電車",
    caption: "1960年代中巴雙層巴士與電車同在一條街上行駛。",
    notes: "可討論巴士和電車的乘車經驗。"
  },
  "A street in Hong Kong 1972.jpg": {
    theme: "家居生活",
    focus: "1972年舊街頭",
    caption: "1972年石硤尾一帶的街頭景象，樓宇和街道擠在一起。",
    notes: "可討論舊社區的街頭生活。"
  },
  "Shang Hai Street in 1960s.jpg": {
    theme: "街市與食物",
    focus: "上海街舊貌",
    caption: "1960年代油麻地上海街的舊貌，騎樓和招牌沿街而立。",
    notes: "可討論油麻地舊街和逛街的回憶。"
  },
  "Selling Fruits in Hong Kong - panoramio.jpg": {
    theme: "街市與食物",
    focus: "街邊水果檔",
    caption: "街邊水果檔擺滿生果，檔主向途人叫賣。",
    notes: "可討論買水果和街市購物。"
  },
  "HK 中環 Central 威靈頓街 Wellington Street 吉士笠街 Gutzlaff Street 大排檔 Dai Pai Dong May 2024 R12S 01.jpg": {
    theme: "街市與食物",
    focus: "中環大排檔",
    caption: "中環威靈頓街吉士笠街轉角的大排檔，檔口就在馬路邊。",
    notes: "可討論街邊食飯和中環舊區。"
  },
  "HK SYP Queen's Road West Mid-Autumn Festival Lanterns 06.JPG": {
    theme: "節慶與習俗",
    focus: "中秋燈籠",
    caption: "中秋前夕，西營盤皇后大道西的店舖掛滿應節燈籠。",
    notes: "可討論中秋節買燈籠的經歷。"
  },
  "IDBF World Dragon Boat Championships 1997 in Hong Kong, Swedish Team.jpg": {
    theme: "節慶與習俗",
    focus: "國際龍舟錦標賽",
    caption: "1997年香港世界龍舟錦標賽，瑞典代表隊成員留下合照。",
    notes: "可討論龍舟比賽和國際賽事。"
  },
  "SCAD Hong Kong classroom.JPG": {
    theme: "校園生活",
    focus: "SCAD課室",
    caption: "SCAD香港分校的課室，前身是北九龍裁判法院的法庭。",
    notes: "可討論課室環境與上課記憶。"
  },
  "HK 上環 Sheung Wan open day 樂善堂梁銶琚書院 Lok Sin Tong Leung Kau Kui College classroom interior Dec 2016 Lnv2 03.jpg": {
    theme: "校園生活",
    focus: "中學課室內貌",
    caption: "上環樂善堂梁銶琚書院開放日的課室內貌。",
    notes: "可討論舊式學校的書桌和課室。"
  },
  "Nantou County Middle School classroom with Three-Principles-of-the-People slogan 1951.jpg": {
    theme: "校園生活",
    focus: "1951年課室",
    caption: "1951年南投縣立初級中學課室，學生正在接受導師指導。",
    notes: "可討論以前課室的規矩和學習生活。"
  },
  "Wan Chai & Causeway Bay late 1970s.jpg": {
    theme: "交通",
    focus: "灣仔銅鑼灣遠景",
    caption: "1970年代末由高處望向灣仔、銅鑼灣一帶，樓宇密佈。",
    notes: "可討論灣仔和銅鑼灣的變化。"
  },
  "Grocery stores in Hong Kong 1960s.JPG": {
    theme: "街市與食物",
    focus: "雜貨舖",
    caption: "1960年代典型雜貨舖的店內陳設，貨品堆滿貨架。",
    notes: "可討論以前到雜貨舖買東西的經歷。"
  },
  "Central, Hong Kong - panoramio (19).jpg": {
    theme: "交通",
    focus: "中環舊街景",
    caption: "舊照中的中環街景，前方可見舊最高法院大樓。",
    notes: "可討論中環舊貌和社區變化。"
  },
  "HK Kerosene Stove HuoShuiLu 火水爐 2.JPG": {
    theme: "家居生活",
    focus: "火水爐煮食",
    caption: "火水爐正在明火煮食，火焰從爐面升起。",
    notes: "可討論舊時煮食工具和家庭分工。"
  },
  "HK Kerosene Stove HuoShuiLu 火水爐 3.JPG": {
    theme: "家居生活",
    focus: "火水爐煮食",
    caption: "火水爐正在明火煮食，火焰從爐面升起。",
    notes: "可討論舊時煮食工具和家庭分工。"
  },
  "HK Kerosene Stove HuoShuiLu 火水爐 4.JPG": {
    theme: "家居生活",
    focus: "火水爐煮食",
    caption: "火水爐正在明火煮食，火焰從爐面升起。",
    notes: "可討論舊時煮食工具和家庭分工。"
  },
  "HK Kerosene Stove HuoShuiLu 火水爐 5.JPG": {
    theme: "家居生活",
    focus: "火水爐煮食",
    caption: "火水爐正在明火煮食，火焰從爐面升起。",
    notes: "可討論舊時煮食工具和家庭分工。"
  },
  "HK Kerosene Stove HuoShuiLu 火水爐 6.JPG": {
    theme: "家居生活",
    focus: "火水爐煮食",
    caption: "火水爐正在明火煮食，火焰從爐面升起。",
    notes: "可討論舊時煮食工具和家庭分工。"
  },
  "An Old Shanghai Barber Shop in Hong Kong 2.jpg": {
    theme: "工作與行業",
    focus: "理髮店門面",
    caption: "舊式上海理髮店的門面，招牌和紅白藍柱標誌清楚可見。",
    notes: "可討論理髮店的招牌和街坊光顧的經歷。"
  },
  "Hong Kong - panoramio (402).jpg": {
    theme: "交通",
    focus: "舊香港市區街景",
    caption: "舊照記錄了中環海傍一帶的密集樓宇和街道。",
    notes: "可討論中環或灣仔的舊建築。"
  },
  "On the Star Ferry Hong Kong. (9066236142).jpg": {
    theme: "交通",
    focus: "天星小輪船艙",
    caption: "天星小輪在維多利亞港上航行，乘客可以欣賞兩岸景色。",
    notes: "可討論搭小輪過海的經歷。"
  },
  "Star Ferry Hong Kong. (14143932945).jpg": {
    theme: "交通",
    focus: "天星小輪過海",
    caption: "天星小輪橫過維港，這條航線服務香港超過一百年。",
    notes: "可討論小輪甲板和過海風景。"
  }
};

const seenPhotoTitles = new Set();
const photoManifestEntries = CONTENT_MANIFEST.filter((entry) => {
  if (entry.kind !== "photo") return false;
  if (Number.parseInt(entry.year, 10) >= 2000) return false;
  if (seenPhotoTitles.has(entry.sourceTitle)) return false;
  seenPhotoTitles.add(entry.sourceTitle);
  return true;
});
const photos = photoManifestEntries.map((manifestEntry, index) => {
  const id = `photo-${pad3(index + 1)}`;
  const base = PHOTO_BASES[index % PHOTO_BASES.length];
  const variant = Math.floor(index / PHOTO_BASES.length);
  const profile = PHOTO_PROFILES[manifestEntry.sourceTitle];
  const realFile = manifestEntry.localFile;
  const hasReal = hasMedia(realFile);
  return {
    id,
    type: "photo",
    title: manifestEntry.title,
    year: manifestEntry.year,
    decade: decadeOf(manifestEntry.year),
    place: placeOf(manifestEntry),
    theme: profile?.theme || base.theme,
    focus: profile?.focus || base.title,
    caption: profile?.caption || base.captions[variant % base.captions.length],
    notes: profile?.notes || base.notes,
    mediaUrl: pickMedia(realFile, `photos/${id}.jpg`),
    assetSource: hasReal ? "real" : "fallback",
    sourceCredit: manifestEntry.sourceCredit,
    license: manifestEntry.license,
    sourceUrl: manifestEntry.sourceUrl,
    sourceTitle: manifestEntry.sourceTitle
  };
});

const songs = CONTENT_MANIFEST.filter((entry) => entry.kind === "song").map((entry, index) => {
  const id = `song-${pad3(index + 1)}`;
  const catalogEntry = SONG_CATALOG[index];
  const realFile = entry.localFile;
  const hasReal = hasMedia(realFile);
  return {
    id,
    type: "song",
    title: entry.title,
    year: catalogEntry?.year || "",
    decade: catalogEntry?.decade || "",
    place: catalogEntry?.place || "",
    theme: entry.theme,
    focus: catalogEntry?.focus || "",
    caption: catalogEntry?.caption || "",
    notes: "",
    mediaUrl: pickMedia(realFile, `songs/${id}.wav`),
    coverUrl: `/media/covers/${id}.jpg`,
    assetSource: hasReal ? "real" : "fallback",
    duration: entry.duration,
    sourceCredit: entry.sourceCredit,
    license: entry.license,
    sourceUrl: entry.sourceUrl,
    sourceTitle: entry.sourceTitle
  };
});

const VIDEO_CAPTIONS = new Map([
  ["video-001", "1937年的香港街頭影像，電車穿梭街道，岸邊一片忙碌。"],
  ["video-002", "2013年的新填地街街市，行人與檔口來來往往。"],
  ["video-003", "電車沿著北角街市外的路軌駛過。"]
]);

const VIDEO_CATALOG_BY_ID = new Map(VIDEO_CATALOG.map((entry) => [entry.id, entry]));

const videos = CONTENT_MANIFEST.filter((entry) => entry.kind === "video").map((entry, index) => {
  const id = `video-${pad3(index + 1)}`;
  const videoCatalogEntry = VIDEO_CATALOG_BY_ID.get(id);
  const realFile = entry.localFile;
  const hasReal = hasMedia(realFile);
  return {
    id,
    type: "video",
    title: entry.title,
    year: entry.decade || "",
    decade: entry.decade || "",
    place: entry.place,
    theme: entry.theme,
    focus: videoCatalogEntry?.focus || "",
    caption: VIDEO_CAPTIONS.get(id) || "",
    notes: "",
    mediaUrl: pickMedia(realFile, `videos/${id}.webm`),
    posterUrl: `/media/covers/${id}.jpg`,
    assetSource: hasReal ? "real" : "fallback",
    duration: entry.duration,
    sourceCredit: entry.sourceCredit,
    license: entry.license,
    sourceUrl: entry.sourceUrl,
    sourceTitle: entry.sourceTitle
  };
});

const output = `// Generated by scripts/write-real-data.mjs. Source metadata comes from
// scripts/content-manifest.mjs and scripts/resolved-urls.json.
export const REAL_MEDIA = ${JSON.stringify({ photos, songs, videos }, null, 2)};
`;

writeFileSync(new URL("../src/data/real-media-data.js", import.meta.url), output, "utf8");
console.log(
  `Real media data written: ${photos.length} photos, ${songs.length} songs, ${videos.length} videos.`
);
