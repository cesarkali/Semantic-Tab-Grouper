// Gera os assets promocionais da Chrome Web Store (tiles + screenshots)
// a partir de SVG desenhado à mão, reaproveitando os tokens visuais do
// site/popup/options, rasterizado via sharp (já é dependência transitiva).
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'store-assets');
fs.mkdirSync(OUT_DIR, { recursive: true });

const FONT = "Arial, 'Segoe UI', sans-serif";

// ---------- paleta ----------
const BACKDROP = '#0a0a0c';
const WHITE = '#f5f5f7';
const MUTED = '#9a9aa2';
const ACCENT = '#34d071';
const ACCENT2 = '#2dd4bf';

const CHROME_BG = '#e8e8ea';
const CHROME_BAR = '#f7f7f8';
const TAB_INACTIVE = '#dfdfe2';
const PAGE_BG = '#ffffff';
const TEXT_DARK = '#1d1d1f';
const MUTED_DARK = '#6e6e73';
const BORDER_DARK = 'rgba(0,0,0,0.10)';
const GREEN = '#16a34a';
const GROUP_BLUE = '#4285f4';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function rr(x, y, w, h, r, fill, extra = '') {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`;
}

function circle(cx, cy, r, fill, extra = '') {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`;
}

function txt(x, y, s, { size = 16, weight = 400, fill = WHITE, anchor = 'start', spacing = null, family = FONT } = {}) {
  const ls = spacing ? ` letter-spacing="${spacing}"` : '';
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}"${ls}>${esc(s)}</text>`;
}

function lines(x, y, arr, opts) {
  const lh = opts.lh || Math.round((opts.size || 16) * 1.32);
  return arr.map((l, i) => txt(x, y + i * lh, l, opts)).join('\n');
}

function shadow(x, y, w, h, r, opacity = 1) {
  const layers = [
    { pad: 26, dy: 30, op: 0.05 },
    { pad: 17, dy: 22, op: 0.08 },
    { pad: 9, dy: 14, op: 0.12 },
    { pad: 3, dy: 6, op: 0.16 }
  ];
  return layers
    .map((l) => rr(x - l.pad, y - l.pad + l.dy, w + l.pad * 2, h + l.pad * 2, r + l.pad, '#000000', `opacity="${l.op * opacity}"`))
    .join('\n');
}

// ---------- marca (mesmo desenho do icon/logo) ----------
function mark(x, y, s) {
  // s = tamanho total do quadrado
  const r = s * 0.227;
  const u = s / 64; // fator de unidade (desenho original em grade 64)
  return `
    <g>
      <rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${r}" fill="url(#lg-mark)"/>
      <rect x="${x + 14 * u}" y="${y + 16.5 * u}" width="${10 * u}" height="${12 * u}" rx="${3 * u}" fill="#fff"/>
      <rect x="${x + 27 * u}" y="${y + 16.5 * u}" width="${10 * u}" height="${12 * u}" rx="${3 * u}" fill="#fff"/>
      <rect x="${x + 40 * u}" y="${y + 16.5 * u}" width="${10 * u}" height="${12 * u}" rx="${3 * u}" fill="#fff"/>
      <rect x="${x + 14 * u}" y="${y + 36 * u}" width="${36 * u}" height="${12.5 * u}" rx="${6.25 * u}" fill="#fff"/>
    </g>`;
}

const DEFS = `
  <defs>
    <linearGradient id="lg-mark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1fb85c"/><stop offset="1" stop-color="#128a3e"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="${ACCENT}" stop-opacity="0.20"/>
      <stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>`;

// ---------- mockup de janela do navegador (tema claro, igual à extensão) ----------
function browserMockup(x, y, w, h, { tabs, groupChip, activeUrl, popover, badge }) {
  const s = w / 900;
  const r = 16 * s;
  const titlebarH = 30 * s;
  const tabstripH = 40 * s;
  const toolbarH = 48 * s;
  const bodyY = y + titlebarH + tabstripH + toolbarH;
  const bodyH = h - titlebarH - tabstripH - toolbarH;

  let out = shadow(x, y, w, h, r);
  out += rr(x, y, w, h, r, CHROME_BG);

  // titlebar dots
  const dotR = 5.5 * s;
  const dotY = y + titlebarH / 2 + 2 * s;
  out += circle(x + 18 * s, dotY, dotR, '#ff5f57');
  out += circle(x + 18 * s + 16 * s, dotY, dotR, '#febc2e');
  out += circle(x + 18 * s + 32 * s, dotY, dotR, '#28c840');

  // tabstrip
  let tx = x + 8 * s;
  const ty = y + titlebarH + 6 * s;
  const th = tabstripH - 6 * s;
  if (groupChip && groupChip.pos === 'start') {
    out += rr(tx, ty, groupChip.w * s, th, 8 * s, groupChip.color);
    out += txt(tx + 12 * s, ty + th * 0.63, groupChip.label, { size: 11.5 * s, weight: 700, fill: '#fff' });
    tx += groupChip.w * s + 2 * s;
  }
  tabs.forEach((t) => {
    const tw = (t.w || 150) * s;
    out += rr(tx, ty, tw, th, 8 * s, t.active ? '#ffffff' : TAB_INACTIVE);
    if (t.flagged) {
      out += rr(tx, ty, tw, th, 8 * s, 'none', `stroke="${GREEN}" stroke-width="${2 * s}"`);
    }
    const dotFill = t.flagged ? GREEN : MUTED_DARK;
    out += circle(tx + 12 * s, ty + th / 2, 3 * s, dotFill, t.flagged ? '' : 'opacity="0.55"');
    out += txt(tx + 22 * s, ty + th * 0.63, t.label, { size: 11 * s, weight: 500, fill: t.active ? TEXT_DARK : MUTED_DARK, family: FONT });
    tx += tw + 2 * s;
  });
  if (groupChip && groupChip.pos === 'end') {
    out += rr(tx, ty, groupChip.w * s, th, 8 * s, groupChip.color);
    out += txt(tx + 12 * s, ty + th * 0.63, groupChip.label, { size: 11.5 * s, weight: 700, fill: '#fff' });
  }

  // toolbar
  const toolY = y + titlebarH + tabstripH;
  out += rr(x, toolY, w, toolbarH, 0, CHROME_BAR);
  out += txt(x + 16 * s, toolY + toolbarH * 0.63, '←  →  ↻', { size: 13 * s, fill: MUTED_DARK });
  const abX = x + 66 * s;
  const abW = w - 66 * s - 70 * s;
  out += rr(abX, toolY + 9 * s, abW, toolbarH - 18 * s, 8 * s, TAB_INACTIVE);
  out += txt(abX + 12 * s, toolY + toolbarH * 0.63, '🔒  ' + activeUrl, { size: 12 * s, fill: MUTED_DARK });
  const extX = x + w - 46 * s;
  const extY = toolY + toolbarH / 2 - 11 * s;
  out += mark(extX, extY, 22 * s);
  if (badge) {
    out += circle(extX + 20 * s, extY - 2 * s, 7 * s, '#ff453a');
    out += txt(extX + 20 * s, extY + 1.5 * s, String(badge), { size: 8.5 * s, weight: 700, fill: '#fff', anchor: 'middle' });
  }

  // page body
  out += rr(x, bodyY, w, bodyH, 0, PAGE_BG);
  const padX = x + 40 * s;
  const padY = bodyY + 40 * s;
  out += rr(padX, padY, 220 * s, 16 * s, 6 * s, '#f2f2f4');
  out += rr(padX, padY + 32 * s, 340 * s, 10 * s, 5 * s, '#f2f2f4');
  out += rr(padX, padY + 52 * s, 340 * s, 10 * s, 5 * s, '#f2f2f4');
  out += rr(padX, padY + 72 * s, 160 * s, 10 * s, 5 * s, '#f2f2f4');

  if (popover) {
    const pw = 300 * s;
    const ph = popover.rows.length * 20 * s + 118 * s;
    const px = x + w - pw - 26 * s;
    const py = bodyY + 20 * s;
    out += shadow(px, py, pw, ph, 14 * s, 0.7);
    out += rr(px, py, pw, ph, 14 * s, '#ffffff', `stroke="${BORDER_DARK}" stroke-width="1"`);
    out += txt(px + 18 * s, py + 26 * s, 'SUGESTÃO DE GRUPO', { size: 10.5 * s, weight: 700, fill: MUTED_DARK, spacing: '0.04em' });
    out += circle(px + 22 * s, py + 44 * s, 5 * s, GROUP_BLUE);
    out += txt(px + 34 * s, py + 48 * s, popover.title, { size: 13.5 * s, weight: 700, fill: TEXT_DARK });
    out += txt(px + pw - 16 * s, py + 48 * s, popover.sim, { size: 10.5 * s, fill: MUTED_DARK, anchor: 'end' });
    popover.rows.forEach((rlabel, i) => {
      const ry = py + 68 * s + i * 19 * s;
      out += circle(px + 22 * s, ry - 4 * s, 3 * s, GREEN);
      out += txt(px + 32 * s, ry, rlabel, { size: 11.5 * s, fill: MUTED_DARK });
    });
    const btnY = py + ph - 42 * s;
    const btnW = (pw - 36 * s - 8 * s) / 2;
    out += rr(px + 18 * s, btnY, btnW, 30 * s, 8 * s, '#f2f2f4');
    out += txt(px + 18 * s + btnW / 2, btnY + 19 * s, 'Ignorar', { size: 12.5 * s, weight: 600, fill: TEXT_DARK, anchor: 'middle' });
    out += rr(px + 18 * s + btnW + 8 * s, btnY, btnW, 30 * s, 8 * s, GREEN);
    out += txt(px + 18 * s + btnW + 8 * s + btnW / 2, btnY + 19 * s, 'Agrupar', { size: 12.5 * s, weight: 600, fill: '#fff', anchor: 'middle' });
  }

  return out;
}

// ---------- 1) small promo tile 440x280 ----------
function smallTile() {
  const W = 440, H = 280;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  s += DEFS;
  s += rr(0, 0, W, H, 0, BACKDROP);
  s += circle(360, 40, 220, 'url(#glow)');
  s += mark(26, 24, 40);
  s += txt(78, 52, 'Semantic Tab Grouper', { size: 14.5, weight: 700, fill: WHITE });
  s += lines(26, 100, ['Suas abas.'], { size: 29, weight: 700, fill: WHITE });
  s += lines(26, 134, ['Organizadas sozinhas.'], { size: 29, weight: 700, fill: ACCENT });

  const bw = 388, bh = 102;
  s += browserMockup(26, 168, bw, bh, {
    tabs: [
      { label: 'latam.com', flagged: true, active: true },
      { label: 'skyscanner.com', flagged: true }
    ],
    activeUrl: 'latam.com/reservas',
    badge: 1
  });

  s += '</svg>';
  return s;
}

// ---------- 2) marquee 1400x560 ----------
function marquee() {
  const W = 1400, H = 560;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  s += DEFS;
  s += rr(0, 0, W, H, 0, BACKDROP);
  s += circle(1050, 260, 420, 'url(#glow)');

  s += mark(80, 72, 44);
  s += txt(136, 102, 'Semantic Tab Grouper', { size: 16, weight: 700, fill: WHITE });

  s += txt(80, 190, 'PARA CHROME · EDGE · BRAVE · OPERA · VIVALDI', { size: 13, weight: 700, fill: ACCENT, spacing: '0.08em' });
  s += lines(78, 246, ['Suas abas.'], { size: 48, weight: 700, fill: WHITE });
  s += lines(78, 308, ['Organizadas sozinhas.'], { size: 48, weight: 700, fill: ACCENT });
  s += lines(80, 366, ['Detecta o assunto de cada aba e sugere', 'agrupar as parecidas — tudo on-device.'], { size: 21, fill: MUTED, lh: 32 });

  s += rr(80, 438, 168, 46, 980 / 2, ACCENT);
  s += txt(80 + 84, 438 + 29, 'Ver no GitHub', { size: 15.5, weight: 700, fill: '#06210f', anchor: 'middle' });

  const bw = 620, bh = 400;
  s += browserMockup(700, 80, bw, bh, {
    tabs: [
      { label: 'latam.com/reservas', flagged: true, active: true, w: 170 },
      { label: 'skyscanner.com.br', flagged: true, w: 170 }
    ],
    activeUrl: 'latam.com/reservas',
    badge: 1,
    popover: { title: 'Passagens · voos', sim: 'sim 0.82', rows: ['latam.com/reservas', 'skyscanner.com.br', 'google.com/flights'] }
  });

  s += '</svg>';
  return s;
}

// ---------- screenshots 1280x800 ----------
function captionHeader(W, eyebrow, title) {
  let s = '';
  s += txt(W / 2, 108, eyebrow, { size: 15, weight: 700, fill: ACCENT, anchor: 'middle', spacing: '0.06em' });
  s += txt(W / 2, 156, title, { size: 38, weight: 700, fill: WHITE, anchor: 'middle' });
  return s;
}

function screenshot1() {
  const W = 1280, H = 800;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  s += DEFS;
  s += rr(0, 0, W, H, 0, BACKDROP);
  s += circle(W / 2, 120, 480, 'url(#glow)');
  s += mark(W / 2 - 200, 46, 34);
  s += captionHeader(W, 'COMO FUNCIONA', 'Lê o assunto das abas e sugere agrupar');

  const bw = 980, bh = 540;
  s += browserMockup((W - bw) / 2, 210, bw, bh, {
    tabs: [
      { label: 'github.com/pulls', active: true, w: 190 },
      { label: 'latam.com/reservas', flagged: true, w: 190 },
      { label: 'skyscanner.com.br', flagged: true, w: 190 },
      { label: 'google.com/flights', flagged: true, w: 190 }
    ],
    activeUrl: 'github.com/pulls',
    badge: 1,
    popover: { title: 'Passagens · voos', sim: 'sim 0.82', rows: ['latam.com/reservas', 'skyscanner.com.br', 'google.com/flights'] }
  });

  s += '</svg>';
  return s;
}

function popupPanel(x, y, w, h) {
  let s = shadow(x, y, w, h, 18);
  s += rr(x, y, w, h, 18, '#ffffff', `stroke="${BORDER_DARK}" stroke-width="1"`);
  s += mark(x + 20, y + 20, 22);
  s += txt(x + 50, y + 35, 'Semantic Tab Grouper', { size: 14.5, weight: 700, fill: TEXT_DARK });

  // toggle row
  s += txt(x + 20, y + 76, 'Detector ativo', { size: 13, fill: MUTED_DARK, weight: 500 });
  s += rr(x + w - 20 - 40, y + 64, 40, 22, 11, GREEN);
  s += circle(x + w - 20 - 40 + 29, y + 64 + 11, 8, '#fff');

  s += txt(x + 20, y + 108, 'SUGESTÕES', { size: 11, weight: 700, fill: MUTED_DARK, spacing: '0.05em' });

  function card(cy, color, label, count, subs, showEdit) {
    const ch = 96;
    let o = rr(x + 20, cy, w - 40, ch, 12, '#f6f8f7', `stroke="${BORDER_DARK}" stroke-width="1"`);
    o += circle(x + 34, cy + 22, 5, color);
    o += txt(x + 46, cy + 27, label, { size: 13, weight: 700, fill: TEXT_DARK });
    o += txt(x + w - 34, cy + 27, count, { size: 11, fill: MUTED_DARK, anchor: 'end', family: 'ui-monospace, Consolas, monospace' });
    o += txt(x + 34, cy + 44, subs, { size: 11, fill: MUTED_DARK });
    const by = cy + 56;
    const bw3 = (w - 40 - 24 - 16) / 3;
    const labels = showEdit ? ['Ignorar', 'Editar', 'Agrupar'] : ['Ignorar', 'Agrupar'];
    const bw2 = labels.length === 3 ? bw3 : (w - 40 - 24 - 8) / 2;
    let bx = x + 32;
    labels.forEach((lab, i) => {
      const isAccept = lab === 'Agrupar';
      o += rr(bx, by, bw2, 30, 8, isAccept ? GREEN : '#eef1ef');
      o += txt(bx + bw2 / 2, by + 19, lab, { size: 11.5, weight: 600, fill: isAccept ? '#fff' : TEXT_DARK, anchor: 'middle' });
      bx += bw2 + 8;
    });
    return o;
  }

  s += card(y + 122, GROUP_BLUE, 'Passagens · voos', '3 abas', 'latam.com · skyscanner.com · google.com', true);
  s += card(y + 230, '#a855f7', 'Documentação React', '2 abas', 'react.dev · stackoverflow.com', false);

  s += rr(x + 20, y + h - 74, w - 40, 40, 9, '#f6f8f7', `stroke="${BORDER_DARK}" stroke-width="1"`);
  s += txt(x + w / 2, y + h - 49, 'Analisar abas agora', { size: 12.5, weight: 600, fill: TEXT_DARK, anchor: 'middle' });
  s += txt(x + w / 2, y + h - 18, 'Configurações avançadas', { size: 11.5, weight: 600, fill: MUTED_DARK, anchor: 'middle' });

  return s;
}

function screenshot2() {
  const W = 1280, H = 800;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  s += DEFS;
  s += rr(0, 0, W, H, 0, BACKDROP);
  s += circle(W / 2, 120, 480, 'url(#glow)');
  s += captionHeader(W, 'VOCÊ ESTÁ NO CONTROLE', 'Aceite, edite ou ignore cada sugestão');

  const bw = 900, bh = 66;
  const bx = (W - bw) / 2;
  const by = 230;
  s += shadow(bx, by, bw, bh, 12, 0.5);
  s += rr(bx, by, bw, bh, 12, CHROME_BAR);
  s += txt(bx + 24, by + bh / 2 + 5, '←  →  ↻', { size: 15, fill: MUTED_DARK });
  s += rr(bx + 76, by + 13, bw - 76 - 90, 40, 10, TAB_INACTIVE);
  s += txt(bx + 92, by + bh / 2 + 5, '🔒  meusite.com/artigo', { size: 13, fill: MUTED_DARK });
  s += mark(bx + bw - 58, by + bh / 2 - 14, 28);
  s += circle(bx + bw - 34, by + bh / 2 - 16, 9, '#ff453a');
  s += txt(bx + bw - 34, by + bh / 2 - 12, '2', { size: 10.5, weight: 700, fill: '#fff', anchor: 'middle' });

  s += popupPanel(bx + bw - 340, by + bh + 8, 340, 470);

  s += '</svg>';
  return s;
}

function modeCard(x, y, w, selected) {
  let s = `<g>`;
  const items = [
    { key: 'semantic', title: 'Semântico', sub: 'Pelo conteúdo, mesmo em domínios diferentes.' },
    { key: 'domain', title: 'Mesmo domínio', sub: 'Sem IA — agrupa só pelo hostname.' },
    { key: 'hybrid', title: 'Híbrido', sub: 'Mesmo domínio ou conteúdo parecido.' }
  ];
  let iy = y;
  items.forEach((it) => {
    const active = it.key === selected;
    const ih = 78;
    s += rr(x, iy, w, ih, 12, '#ffffff', `stroke="${active ? GREEN : BORDER_DARK}" stroke-width="${active ? 2 : 1}"`);
    if (active) s += rr(x, iy, w, ih, 12, GREEN, 'opacity="0.06"');
    s += circle(x + 30, iy + ih / 2, 10, 'none', `stroke="${active ? GREEN : '#d7dad8'}" stroke-width="2"`);
    if (active) s += circle(x + 30, iy + ih / 2, 5, GREEN);
    s += txt(x + 56, iy + 32, it.title, { size: 15.5, weight: 700, fill: TEXT_DARK });
    s += txt(x + 56, iy + 54, it.sub, { size: 12.5, fill: MUTED_DARK });
    iy += ih + 12;
  });
  s += `</g>`;
  return s;
}

function screenshot3() {
  const W = 1280, H = 800;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
  s += DEFS;
  s += rr(0, 0, W, H, 0, BACKDROP);
  s += circle(W / 2, 120, 480, 'url(#glow)');
  s += captionHeader(W, 'VOCÊ ESCOLHE', 'Semântico, por domínio ou híbrido');

  const cw = 460, ch = 320;
  const cx = (W - cw) / 2;
  const cy = 230;
  s += shadow(cx, cy, cw, ch, 18, 0.6);
  s += rr(cx, cy, cw, ch, 18, '#ffffff', `stroke="${BORDER_DARK}" stroke-width="1"`);
  s += txt(cx + 26, cy + 34, 'Modo de agrupamento', { size: 12, weight: 700, fill: MUTED_DARK, spacing: '0.04em' });
  s += modeCard(cx + 22, cy + 52, cw - 44, 'semantic');

  s += '</svg>';
  return s;
}

const assets = [
  ['small-tile-440x280.png', smallTile()],
  ['marquee-1400x560.png', marquee()],
  ['screenshot-1-hero.png', screenshot1()],
  ['screenshot-2-suggestions.png', screenshot2()],
  ['screenshot-3-modes.png', screenshot3()]
];

for (const [name, svg] of assets) {
  const file = path.join(OUT_DIR, name);
  await sharp(Buffer.from(svg)).png().toFile(file);
  console.log(name, 'ok');
}
