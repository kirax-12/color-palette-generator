// Color Palette Generator — palet harmonis dari teori warna (HSL),
// bukan asal acak. Semua jalan lokal di browser.

const HISTORY_KEY = "palette-history-v1";
const HISTORY_MAX = 8;
const SLOT_COUNT = 5;

const paletteEl = document.getElementById("palette");
const schemeSelect = document.getElementById("scheme-select");
const schemeNameEl = document.getElementById("scheme-name");
const generateBtn = document.getElementById("generate-btn");
const copyCssBtn = document.getElementById("copy-css-btn");
const globalMsg = document.getElementById("global-msg");
const historyGrid = document.getElementById("history-grid");
const historyEmpty = document.getElementById("history-empty");

// ---------- Util warna ----------

function wrapHue(h) {
  return ((h % 360) + 360) % 360;
}
function clampPct(v) {
  return Math.min(100, Math.max(0, v));
}
function jitter(v, amt) {
  return v + (Math.random() * 2 - 1) * amt;
}
function randHue() {
  return Math.floor(Math.random() * 360);
}

function hslToHex(h, s, l) {
  h = wrapHue(h);
  s = clampPct(s) / 100;
  l = clampPct(l) / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const to255 = (v) => Math.round((v + m) * 255);
  const toHex = (v) => to255(v).toString(16).padStart(2, "0").toUpperCase();
  return { hex: `#${toHex(r)}${toHex(g)}${toHex(b)}`, rgb: [to255(r), to255(g), to255(b)] };
}

function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// ---------- Skema warna ----------
// Tiap skema: satu hue dasar, lalu 5 warna diturunkan dari
// [offsetHue, saturasi, lightness] supaya hasilnya tetap harmonis.

const SCHEMES = {
  analogous: {
    label: "Analogous",
    build(base) {
      const offsets = [-44, -22, 0, 22, 44];
      const lights = [58, 42, 68, 50, 62];
      return offsets.map((off, i) => ({
        h: base + off,
        s: clampPct(jitter(72, 10)),
        l: clampPct(jitter(lights[i], 5)),
      }));
    },
  },
  komplementer: {
    label: "Komplementer",
    build(base) {
      const parts = [
        [0, 78, 55],
        [6, 62, 36],
        [180, 78, 55],
        [186, 62, 72],
        [180, 88, 44],
      ];
      return parts.map(([off, s, l]) => ({
        h: base + off,
        s: clampPct(jitter(s, 7)),
        l: clampPct(jitter(l, 5)),
      }));
    },
  },
  triadic: {
    label: "Triadic",
    build(base) {
      const parts = [
        [0, 74, 55],
        [120, 74, 50],
        [240, 74, 58],
        [0, 66, 36],
        [120, 66, 70],
      ];
      return parts.map(([off, s, l]) => ({
        h: base + off,
        s: clampPct(jitter(s, 7)),
        l: clampPct(jitter(l, 5)),
      }));
    },
  },
  pastel: {
    label: "Pastel",
    build(base) {
      const offsets = [-50, -25, 0, 25, 50];
      const lights = [80, 76, 84, 78, 82];
      return offsets.map((off, i) => ({
        h: base + off,
        s: clampPct(jitter(62, 8)),
        l: clampPct(jitter(lights[i], 3)),
      }));
    },
  },
  vibrant: {
    label: "Vibrant",
    build(base) {
      const offsets = [0, 45, 160, 205, 320];
      const lights = [52, 48, 56, 50, 58];
      return offsets.map((off, i) => ({
        h: base + off,
        s: clampPct(jitter(92, 6)),
        l: clampPct(jitter(lights[i], 4)),
      }));
    },
  },
};
const SCHEME_KEYS = Object.keys(SCHEMES);

// ---------- State ----------

let slots = Array.from({ length: SLOT_COUNT }, () => ({ h: 0, s: 0, l: 0, locked: false }));
let history = loadHistory();

function slotHex(slot) {
  return hslToHex(slot.h, slot.s, slot.l).hex;
}
function currentHexes() {
  return slots.map(slotHex);
}

// ---------- Clipboard ----------

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  ta.remove();
}

let msgTimer = null;
function showMsg(text, ok = true) {
  globalMsg.textContent = text;
  globalMsg.className = "msg " + (ok ? "ok" : "err");
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => {
    globalMsg.textContent = "";
    globalMsg.className = "msg";
  }, 2600);
}

// ---------- Render palet ----------

function render() {
  paletteEl.innerHTML = "";
  slots.forEach((slot, i) => {
    const { hex, rgb } = hslToHex(slot.h, slot.s, slot.l);

    const wrap = document.createElement("article");
    wrap.className = "swatch";

    const colorDiv = document.createElement("div");
    colorDiv.className = "swatch-color";
    colorDiv.style.background = hex;

    const info = document.createElement("div");
    info.className = "swatch-info";

    const hexEl = document.createElement("p");
    hexEl.className = "swatch-hex";
    hexEl.textContent = hex;

    const rgbEl = document.createElement("p");
    rgbEl.className = "swatch-rgb";
    rgbEl.textContent = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;

    const actions = document.createElement("div");
    actions.className = "swatch-actions";

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "chip-btn";
    copyBtn.textContent = "Salin";
    copyBtn.setAttribute("aria-label", `Salin kode warna ${hex}`);
    copyBtn.addEventListener("click", async () => {
      try {
        await copyText(hex);
        copyBtn.textContent = "Tersalin!";
        copyBtn.classList.add("copied");
        setTimeout(() => {
          copyBtn.textContent = "Salin";
          copyBtn.classList.remove("copied");
        }, 1200);
      } catch {
        showMsg("Gagal menyalin — salin manual ya: " + hex, false);
      }
    });

    const lockBtn = document.createElement("button");
    lockBtn.type = "button";
    lockBtn.className = "chip-btn" + (slot.locked ? " is-locked" : "");
    lockBtn.textContent = slot.locked ? "Terkunci ✓" : "Kunci";
    lockBtn.setAttribute("aria-pressed", String(slot.locked));
    lockBtn.setAttribute("aria-label", slot.locked ? `Buka kunci warna ${hex}` : `Kunci warna ${hex} supaya tidak ikut diganti`);
    lockBtn.addEventListener("click", () => {
      slots[i].locked = !slots[i].locked;
      render();
    });

    actions.append(copyBtn, lockBtn);
    info.append(hexEl, rgbEl, actions);
    wrap.append(colorDiv, info);
    paletteEl.appendChild(wrap);
  });
}

// ---------- Generate ----------

function pickSchemeKey() {
  const chosen = schemeSelect.value;
  if (chosen === "acak") {
    return SCHEME_KEYS[Math.floor(Math.random() * SCHEME_KEYS.length)];
  }
  return chosen;
}

function generate() {
  const key = pickSchemeKey();
  const scheme = SCHEMES[key];
  const fresh = scheme.build(randHue());
  slots = slots.map((slot, i) =>
    slot.locked ? slot : { ...fresh[i], locked: false }
  );
  schemeNameEl.textContent = scheme.label + (schemeSelect.value === "acak" ? " (dari mode Acak)" : "");
  render();
  pushHistory();
}

// ---------- Riwayat ----------

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p) => Array.isArray(p) && p.length === SLOT_COUNT && p.every((c) => /^#[0-9A-Fa-f]{6}$/.test(c)))
      .slice(0, HISTORY_MAX);
  } catch {
    return [];
  }
}

function saveHistory() {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // localStorage penuh/diblokir — riwayat sesi ini tetap jalan di memori.
  }
}

function pushHistory() {
  const hexes = currentHexes();
  const last = history[0];
  if (last && last.join() === hexes.join()) {
    renderHistory();
    return;
  }
  history.unshift(hexes);
  history = history.slice(0, HISTORY_MAX);
  saveHistory();
  renderHistory();
}

function renderHistory() {
  historyGrid.innerHTML = "";
  historyEmpty.hidden = history.length > 0;
  history.forEach((hexes) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "history-item";
    btn.title = hexes.join(" · ");
    btn.setAttribute("aria-label", "Pakai lagi palet " + hexes.join(", "));
    hexes.forEach((hex) => {
      const strip = document.createElement("span");
      strip.style.background = hex;
      btn.appendChild(strip);
    });
    btn.addEventListener("click", () => {
      slots = hexes.map((hex) => ({ ...hexToHsl(hex), locked: false }));
      render();
      showMsg("Palet dari riwayat dipasang lagi.");
    });
    historyGrid.appendChild(btn);
  });
}

// ---------- Event ----------

generateBtn.addEventListener("click", generate);

copyCssBtn.addEventListener("click", async () => {
  const css =
    ":root {\n" +
    currentHexes().map((hex, i) => `  --warna-${i + 1}: ${hex};`).join("\n") +
    "\n}";
  try {
    await copyText(css);
    const original = copyCssBtn.textContent;
    copyCssBtn.textContent = "Tersalin! ✓";
    setTimeout(() => { copyCssBtn.textContent = original; }, 1400);
    showMsg("Variabel CSS tersalin — tinggal tempel di stylesheet.");
  } catch {
    showMsg("Gagal menyalin CSS.", false);
  }
});

// Spasi = generate, tapi jangan ganggu orang yang lagi fokus
// di input/select/tombol (spasi di sana punya fungsi sendiri).
document.addEventListener("keydown", (e) => {
  if (e.code !== "Space" && e.key !== " ") return;
  const target = e.target;
  if (target.closest("input, textarea, select, button, [contenteditable]")) return;
  e.preventDefault();
  generate();
});

// ---------- Init ----------

renderHistory();
generate();
