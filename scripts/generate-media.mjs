import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artFile = path.join(root, "scripts", "media-art.js");
const publicDir = path.join(root, "public");
const iconsDir = path.join(publicDir, "icons");
const mediaDir = path.join(publicDir, "media");
const photosDir = path.join(mediaDir, "photos");
const coversDir = path.join(mediaDir, "covers");
const songsDir = path.join(mediaDir, "songs");
const videosDir = path.join(mediaDir, "videos");

const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser"
];

function findChrome() {
  return CHROME_CANDIDATES.find((candidate) => fs.existsSync(candidate));
}

function dataUrlToBuffer(dataUrl) {
  const comma = dataUrl.indexOf(",");
  return Buffer.from(dataUrl.slice(comma + 1), "base64");
}

async function ensureDirs() {
  for (const dir of [publicDir, iconsDir, photosDir, coversDir, songsDir, videosDir]) {
    await fs.promises.mkdir(dir, { recursive: true });
  }
}

async function writeDataUrl(file, dataUrl) {
  await fs.promises.writeFile(file, dataUrlToBuffer(dataUrl));
}

const SYNTH_FN = `(spec) => {
  const sampleRate = 22050;
  const length = Math.floor(spec.duration * sampleRate);
  const out = new Float32Array(length);
  const scale = spec.scale.map((n) => 220 * Math.pow(2, n / 12));
  const chord = spec.chord.map((n) => 110 * Math.pow(2, n / 12));
  const events = [];
  let time = 0;
  const beat = 60 / spec.bpm;
  const pattern = spec.pattern.split(" ");
  pattern.forEach((token) => {
    const note = token.match(/^[A-Ga-g][#b]?/);
    const rest = /^_/.test(token);
    let beats = 1;
    const count = token.match(/(\\d+)/);
    if (count) beats = Number(count[1]);
    const dur = beats * beat;
    if (!rest && note) {
      const letter = note[0].toUpperCase();
      const accidental = note[0].length > 1 ? note[0][1] : "";
      const base = ["C", "D", "E", "F", "G", "A", "B"].indexOf(letter);
      const semitone = [0, 2, 4, 5, 7, 9, 11][base] + (accidental === "#" ? 1 : accidental === "b" ? -1 : 0);
      const target = semitone;
      const best = scale
        .map((f, i) => {
          const ratio = Math.round((target - 12 * Math.log2(f / 220)) / 12);
          const approx = 12 * Math.log2(f / 220) + ratio * 12;
          return { i, d: Math.abs(target - approx) };
        })
        .reduce((a, b) => (b.d < a.d ? b : a), { i: 0, d: Infinity });
      const freq = scale[best.i];
      const kind = spec.kind === "pluck" ? "pluck" : "note";
      events.push({ t: time, freq, dur: dur * 0.92, gain: 0.62, kind });
      if (spec.harmony && Math.random() < spec.harmony.chance) {
        const chordFreq = chord[Math.floor(Math.random() * chord.length)];
        events.push({ t: time, freq: chordFreq, dur: dur * 1.1, gain: 0.16, kind: "soft" });
      }
    }
    time += dur;
  });
  if (spec.drum && spec.drum.seed !== undefined) {
    const drumRnd = (() => {
      let s = spec.drum.seed >>> 0;
      return () => {
        s = (s + 0x6d2b79f5) | 0;
        let x = Math.imul(s ^ (s >>> 15), 1 | s);
        x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
        return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
      };
    })();
    let drumTime = 0;
    while (drumTime < spec.duration - 0.2) {
      const step = 0.14 + drumRnd() * 0.2;
      events.push({ t: drumTime, freq: 76 + drumRnd() * 24, dur: 0.09, gain: 0.3 + drumRnd() * 0.16, kind: "drum" });
      if (drumRnd() > 0.55) {
        events.push({ t: drumTime, freq: 148, dur: 0.16, gain: 0.22, kind: "drum" });
      }
      drumTime += step;
    }
  }
  const envelope = (t, dur, attack, release) => {
    if (t < attack) return t / attack;
    if (t > dur - release) return Math.max(0, (dur - t) / release);
    return 1;
  };
  for (const e of events) {
    const start = Math.floor(e.t * sampleRate);
    const samples = Math.floor(e.dur * sampleRate);
    const phi = 0;
    const freq = e.freq;
    const kind = e.kind;
    for (let i = 0; i < samples; i += 1) {
      const idx = start + i;
      if (idx < 0 || idx >= length) continue;
      const t = i / sampleRate;
      const env = envelope(t, e.dur, kind === "drum" ? 0.002 : 0.015, kind === "drum" ? 0.05 : Math.min(0.3, e.dur * 0.35));
      let sample;
      if (kind === "drum") {
        const decay = Math.exp(-t * 38);
        sample = Math.sin(2 * Math.PI * freq * t) * decay + Math.sin(2 * Math.PI * freq * 2.7 * t) * decay * 0.5;
      } else if (kind === "pluck") {
        sample = Math.sin(2 * Math.PI * freq * t);
        sample += 0.32 * Math.sin(2 * Math.PI * freq * 2 * t) * Math.exp(-t * 7);
        sample *= Math.exp(-t * 2.2);
      } else {
        sample = Math.sin(2 * Math.PI * freq * t) * 0.7;
        sample += 0.2 * Math.sin(2 * Math.PI * freq * 2 * t);
        sample += 0.08 * Math.sin(2 * Math.PI * freq * 3 * t);
        sample *= Math.exp(-t * 1.15);
      }
      out[idx] += sample * env * e.gain;
    }
  }
  const echo = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    echo[i] = out[i];
    if (i > sampleRate * 0.34) {
      out[i] += echo[i - Math.floor(sampleRate * 0.34)] * 0.16;
    }
    if (i > sampleRate * 0.62) {
      out[i] += echo[i - Math.floor(sampleRate * 0.62)] * 0.07;
    }
  }
  const fade = Math.min(sampleRate * 1.2, length * 0.5);
  for (let i = 0; i < fade; i += 1) {
    const a = i / fade;
    out[i] *= a * 0.82;
    out[length - 1 - i] *= a * 0.82;
  }
  let peak = 0;
  for (let i = 0; i < length; i += 1) {
    peak = Math.max(peak, Math.abs(out[i]));
  }
  const norm = peak > 0.96 ? 0.96 / peak : 1;
  const bytes = new Uint8Array(44 + length * 2);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x52494646, false);
  view.setUint32(4, 36 + length * 2, true);
  view.setUint32(8, 0x57415645, false);
  view.setUint32(12, 0x666d7420, false);
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  view.setUint32(36, 0x64617461, false);
  view.setUint32(40, length * 2, true);
  for (let i = 0; i < length; i += 1) {
    const v = Math.max(-1, Math.min(1, out[i] * norm));
    view.setInt16(44 + i * 2, v < 0 ? v * 32768 : v * 32767, true);
  }
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return "data:audio/wav;base64," + btoa(binary);
}`;

const SONG_BASES = [
  {
    bpm: 62,
    kind: "note",
    scale: [0, 3, 5, 7, 10, 12, 15],
    chord: [-12, 0, 3],
    pattern: "C2 E2 G2 C3 G2 E2 C2 E2 G2 E2 C3 G2 A2 G2 E2 C2 G2 A2 G2 E2 C2 E2 G2 C3",
    harmony: { chance: 0.3 }
  },
  {
    bpm: 74,
    kind: "note",
    scale: [0, 2, 4, 7, 9, 12, 14],
    chord: [-12, 2, 4],
    pattern: "E2 G2 A2 E3 D3 A2 G2 E2 E2 G2 A2 G2 D3 A2 G2 A2 C3 D3 E3 D3 C3 A2 G2 A2",
    harmony: { chance: 0.5 }
  },
  {
    bpm: 96,
    kind: "pluck",
    scale: [0, 5, 7, 12, 17, 19, 24],
    chord: [0, 5, 7],
    pattern: "C3 G3 C4 G3 C3 G3 C4 G3 C3 G3 C4 G3 D3 A3 D4 A3 G3 C4 G3 C3 G3 C4 G3",
    harmony: { chance: 0.2 }
  },
  {
    bpm: 108,
    kind: "pluck",
    scale: [0, 2, 5, 7, 9, 12, 14, 17],
    chord: [-5, 0, 2],
    pattern: "C3 E3 G3 C4 E3 G3 A3 G3 E3 D3 C3 E3 G3 C4 A3 G3 E3 D3 E3 G3 A3 C4 A3 G3 E3",
    harmony: { chance: 0.3 }
  },
  {
    bpm: 76,
    kind: "pluck",
    scale: [0, 3, 5, 7, 10, 12, 15, 17],
    chord: [0, 3, 7],
    pattern: "C3 E3 G3 A3 C4 G3 E3 C3 D3 E3 G3 E3 D3 C3 E3 G3 A3 G3 E3 D3 C3 E3 G3 A3",
    harmony: { chance: 0.35 }
  },
  {
    bpm: 84,
    kind: "pluck",
    scale: [0, 2, 4, 7, 9, 12, 14],
    chord: [-5, 0, 2],
    pattern: "E3 G3 B3 G3 C4 B3 G3 E3 C3 G3 C4 G3 B3 G3 E3 G3 E3 G3 B3 G3 C4 B3 G3 E3",
    harmony: { chance: 0.25 }
  },
  {
    bpm: 92,
    kind: "note",
    scale: [0, 2, 5, 7, 9, 12, 14],
    chord: [-12, 0, 5],
    pattern: "C3 E3 G3 C4 G3 C4 A3 G3 C3 E3 G3 C4 G3 C4 A3 G3 C3 E3 G3 C4 G3 C4 A3 G3",
    harmony: { chance: 0.2 },
    drum: { seed: 9172 }
  },
  {
    bpm: 68,
    kind: "note",
    scale: [0, 3, 5, 7, 10, 12, 15],
    chord: [-7, 0, 3],
    pattern: "A2 C3 E3 A3 E3 C3 A2 C3 E3 G3 E3 C3 A2 C3 E3 A3 E3 C3 A2 G3 E3 C3 A2 C3 E3",
    harmony: { chance: 0.5 }
  }
];

const SONGS = Array.from({ length: 30 }, (_, index) => {
  const base = SONG_BASES[index % SONG_BASES.length];
  const octaveShift = Math.floor(index / SONG_BASES.length);
  const bpmShift = octaveShift % 2 === 0 ? octaveShift * 5 : -octaveShift * 4;
  const song = {
    id: `song-${String(index + 1).padStart(3, "0")}`,
    duration: 30 + (index % 4) * 3,
    bpm: Math.max(58, Math.min(112, base.bpm + bpmShift)),
    kind: index % 2 === 0 ? base.kind : base.kind === "pluck" ? "note" : "pluck",
    scale: base.scale.map((n) => n + octaveShift),
    chord: base.chord.map((n) => n + octaveShift),
    pattern: base.pattern,
    harmony: {
      chance: Math.min(0.5, base.harmony.chance + octaveShift * 0.04)
    }
  };
  if ((index + octaveShift) % 5 === 0) {
    song.drum = { seed: 1000 + index * 37 };
  }
  return song;
});

async function generateSongs(page) {
  for (const song of SONGS) {
    const dataUrl = await page.evaluate(
      ([synth, spec]) => {
        const fn = new Function("spec", `"use strict"; return (${synth})(spec);`);
        return fn(spec);
      },
      [SYNTH_FN, song]
    );
    await writeDataUrl(path.join(songsDir, `${song.id}.wav`), dataUrl);
    process.stdout.write(`  wrote ${song.id}.wav\n`);
  }
}

async function generateStills(page) {
  const pad = (n) => String(n).padStart(3, "0");
  for (let i = 1; i <= 120; i += 1) {
    const id = `photo-${pad(i)}`;
    const baseIndex = ((i - 1) % 14) + 1;
    const baseSceneId = `photo-${pad(baseIndex)}`;
    const variant = Math.floor((i - 1) / 14);
    const dataUrl = await page.evaluate(([sceneId, variant]) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 900;
      window.drawScene(canvas, sceneId, { variant });
      return canvas.toDataURL("image/jpeg", 0.88);
    }, [baseSceneId, variant]);
    await writeDataUrl(path.join(photosDir, `${id}.jpg`), dataUrl);
    process.stdout.write(`  wrote ${id}.jpg\n`);
  }
  const covers = [
    ...Array.from({ length: 30 }, (_, i) => `song-${String(i + 1).padStart(3, "0")}`),
    "video-001",
    "video-002",
    "video-003"
  ];
  for (const id of covers) {
    const dataUrl = await page.evaluate((coverId) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      window.drawCover(canvas, coverId);
      return canvas.toDataURL("image/jpeg", 0.9);
    }, id);
    await writeDataUrl(path.join(coversDir, `${id}.jpg`), dataUrl);
    process.stdout.write(`  wrote ${id}.jpg\n`);
  }
}

async function generateIcons(page) {
  const variants = [
    { id: "icon-192", size: 192, variant: "regular" },
    { id: "icon-512", size: 512, variant: "regular" },
    { id: "maskable-512", size: 512, variant: "maskable" },
    { id: "apple-touch-icon", size: 180, variant: "regular" }
  ];
  for (const { id, size, variant } of variants) {
    const dataUrl = await page.evaluate(({ size: s, variant: v }) => {
      const canvas = document.createElement("canvas");
      canvas.width = s;
      canvas.height = s;
      window.drawIcon(canvas, v);
      return canvas.toDataURL("image/png");
    }, { size, variant });
    await writeDataUrl(path.join(iconsDir, `${id}.png`), dataUrl);
    process.stdout.write(`  wrote ${id}.png\n`);
  }
}

async function generateVideos(page) {
  const videos = [
    { id: "video-001", seconds: 36 },
    { id: "video-002", seconds: 42 },
    { id: "video-003", seconds: 48 }
  ];
  for (const { id, seconds } of videos) {
    const dataUrl = await page.evaluate(({ sceneId, secs }) => window.recordScene(sceneId, secs, 1280, 720), {
      sceneId: id,
      secs: seconds
    });
    await writeDataUrl(path.join(videosDir, `${id}.webm`), dataUrl);
    process.stdout.write(`  wrote ${id}.webm\n`);
  }
}

async function main() {
  const executablePath = findChrome();
  if (!executablePath) {
    console.error("Chrome/Edge not found; install a browser to generate media.");
    process.exit(1);
  }
  await ensureDirs();
  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: [
      "--autoplay-policy=no-user-gesture-required",
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream",
      "--no-sandbox"
    ]
  });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });
  const artSource = fs.readFileSync(artFile, "utf8");
  await page.addScriptTag({ content: artSource });
  console.log("Generating media into public/ ...");
  await generateIcons(page);
  await generateStills(page);
  await generateSongs(page);
  await generateVideos(page);
  await browser.close();
  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
