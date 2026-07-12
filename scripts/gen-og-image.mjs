// Gera a imagem de Open Graph / Twitter Card (1200x630) para o site,
// reaproveitando os mesmos tokens visuais e helpers dos outros geradores.
import sharp from 'sharp';

const OUT = 'c:/Dev/agrupador/docs/og-image.png';
const FONT = "Arial, 'Segoe UI', sans-serif";

const BACKDROP = '#0a0a0c';
const WHITE = '#f5f5f7';
const MUTED = '#9a9aa2';
const ACCENT = '#34d071';

const CHROME_BG = '#e8e8ea';
const CHROME_BAR = '#f7f7f8';
const TAB_INACTIVE = '#dfdfe2';
const PAGE_BG = '#ffffff';
const TEXT_DARK = '#1d1d1f';
const MUTED_DARK = '#6e6e73';
const BORDER_DARK = 'rgba(0,0,0,0.10)';
const GREEN = '#16a34a';
const GROUP_BLUE = '#4285f4';

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function rr(x, y, w, h, r, fill, extra = '') { return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" ${extra}/>`; }
function circle(cx, cy, r, fill, extra = '') { return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`; }
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
    { pad: 26, dy: 30, op: 0.05 }, { pad: 17, dy: 22, op: 0.08 },
    { pad: 9, dy: 14, op: 0.12 }, { pad: 3, dy: 6, op: 0.16 }
  ];
  return layers.map((l) => rr(x - l.pad, y - l.pad + l.dy, w + l.pad * 2, h + l.pad * 2, r + l.pad, '#000000', `opacity="${l.op * opacity}"`)).join('\n');
}
function mark(x, y, s) {
  const r = s * 0.227;
  const u = s / 64;
  return `<g>
    <rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${r}" fill="url(#lg-mark)"/>
    <rect x="${x + 14 * u}" y="${y + 16.5 * u}" width="${10 * u}" height="${12 * u}" rx="${3 * u}" fill="#fff"/>
    <rect x="${x + 27 * u}" y="${y + 16.5 * u}" width="${10 * u}" height="${12 * u}" rx="${3 * u}" fill="#fff"/>
    <rect x="${x + 40 * u}" y="${y + 16.5 * u}" width="${10 * u}" height="${12 * u}" rx="${3 * u}" fill="#fff"/>
    <rect x="${x + 14 * u}" y="${y + 36 * u}" width="${36 * u}" height="${12.5 * u}" rx="${6.25 * u}" fill="#fff"/>
  </g>`;
}
const DEFS = `<defs>
  <linearGradient id="lg-mark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1fb85c"/><stop offset="1" stop-color="#128a3e"/></linearGradient>
  <radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${ACCENT}" stop-opacity="0.20"/><stop offset="1" stop-color="${ACCENT}" stop-opacity="0"/></radialGradient>
</defs>`;

function browserMockup(x, y, w, h, { tabs, activeUrl, popover, badge }) {
  const s = w / 900;
  const r = 16 * s;
  const titlebarH = 30 * s, tabstripH = 40 * s, toolbarH = 48 * s;
  const bodyY = y + titlebarH + tabstripH + toolbarH;
  const bodyH = h - titlebarH - tabstripH - toolbarH;

  let out = shadow(x, y, w, h, r);
  out += rr(x, y, w, h, r, CHROME_BG);
  const dotR = 5.5 * s, dotY = y + titlebarH / 2 + 2 * s;
  out += circle(x + 18 * s, dotY, dotR, '#ff5f57');
  out += circle(x + 34 * s, dotY, dotR, '#febc2e');
  out += circle(x + 50 * s, dotY, dotR, '#28c840');

  let tx = x + 8 * s;
  const ty = y + titlebarH + 6 * s, th = tabstripH - 6 * s;
  tabs.forEach((t) => {
    const tw = (t.w || 150) * s;
    out += rr(tx, ty, tw, th, 8 * s, t.active ? '#ffffff' : TAB_INACTIVE);
    if (t.flagged) out += rr(tx, ty, tw, th, 8 * s, 'none', `stroke="${GREEN}" stroke-width="${2 * s}"`);
    out += circle(tx + 12 * s, ty + th / 2, 3 * s, t.flagged ? GREEN : MUTED_DARK, t.flagged ? '' : 'opacity="0.55"');
    out += txt(tx + 22 * s, ty + th * 0.63, t.label, { size: 11 * s, weight: 500, fill: t.active ? TEXT_DARK : MUTED_DARK });
    tx += tw + 2 * s;
  });

  const toolY = y + titlebarH + tabstripH;
  out += rr(x, toolY, w, toolbarH, 0, CHROME_BAR);
  out += txt(x + 16 * s, toolY + toolbarH * 0.63, '←  →  ↻', { size: 13 * s, fill: MUTED_DARK });
  const abX = x + 66 * s, abW = w - 66 * s - 70 * s;
  out += rr(abX, toolY + 9 * s, abW, toolbarH - 18 * s, 8 * s, TAB_INACTIVE);
  out += txt(abX + 12 * s, toolY + toolbarH * 0.63, '🔒  ' + activeUrl, { size: 12 * s, fill: MUTED_DARK });
  const extX = x + w - 46 * s, extY = toolY + toolbarH / 2 - 11 * s;
  out += mark(extX, extY, 22 * s);
  if (badge) {
    out += circle(extX + 20 * s, extY - 2 * s, 7 * s, '#ff453a');
    out += txt(extX + 20 * s, extY + 1.5 * s, String(badge), { size: 8.5 * s, weight: 700, fill: '#fff', anchor: 'middle' });
  }

  out += rr(x, bodyY, w, bodyH, 0, PAGE_BG);
  const padX = x + 40 * s, padY = bodyY + 40 * s;
  out += rr(padX, padY, 220 * s, 16 * s, 6 * s, '#f2f2f4');
  out += rr(padX, padY + 32 * s, 300 * s, 10 * s, 5 * s, '#f2f2f4');
  out += rr(padX, padY + 52 * s, 300 * s, 10 * s, 5 * s, '#f2f2f4');

  if (popover) {
    const pw = 280 * s, ph = popover.rows.length * 19 * s + 110 * s;
    const px = x + w - pw - 24 * s, py = bodyY + 20 * s;
    out += shadow(px, py, pw, ph, 14 * s, 0.7);
    out += rr(px, py, pw, ph, 14 * s, '#ffffff', `stroke="${BORDER_DARK}" stroke-width="1"`);
    out += txt(px + 16 * s, py + 24 * s, 'SUGESTÃO DE GRUPO', { size: 10 * s, weight: 700, fill: MUTED_DARK, spacing: '0.04em' });
    out += circle(px + 20 * s, py + 41 * s, 5 * s, GROUP_BLUE);
    out += txt(px + 32 * s, py + 45 * s, popover.title, { size: 13 * s, weight: 700, fill: TEXT_DARK });
    popover.rows.forEach((rlabel, i) => {
      const ry = py + 64 * s + i * 18 * s;
      out += circle(px + 20 * s, ry - 4 * s, 3 * s, GREEN);
      out += txt(px + 30 * s, ry, rlabel, { size: 11 * s, fill: MUTED_DARK });
    });
    const btnY = py + ph - 38 * s, btnW = (pw - 32 * s - 8 * s) / 2;
    out += rr(px + 16 * s, btnY, btnW, 28 * s, 8 * s, '#f2f2f4');
    out += txt(px + 16 * s + btnW / 2, btnY + 18 * s, 'Ignorar', { size: 11.5 * s, weight: 600, fill: TEXT_DARK, anchor: 'middle' });
    out += rr(px + 16 * s + btnW + 8 * s, btnY, btnW, 28 * s, 8 * s, GREEN);
    out += txt(px + 16 * s + btnW + 8 * s + btnW / 2, btnY + 18 * s, 'Agrupar', { size: 11.5 * s, weight: 600, fill: '#fff', anchor: 'middle' });
  }
  return out;
}

const W = 1200, H = 630;
let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`;
s += DEFS;
s += rr(0, 0, W, H, 0, BACKDROP);
s += circle(880, 260, 380, 'url(#glow)');

s += mark(64, 56, 40);
s += txt(116, 82, 'Semantic Tab Grouper', { size: 15.5, weight: 700, fill: WHITE });

s += txt(64, 178, 'PARA CHROME · EDGE · BRAVE · OPERA · VIVALDI', { size: 12, weight: 700, fill: ACCENT, spacing: '0.06em' });
s += lines(62, 230, ['Suas abas.'], { size: 40, weight: 700, fill: WHITE });
s += lines(62, 280, ['Organizadas sozinhas.'], { size: 38, weight: 700, fill: ACCENT });
s += lines(64, 336, ['Detecta o assunto de cada aba e sugere', 'agrupar as parecidas — tudo on-device.'], { size: 17, fill: MUTED, lh: 27 });

const bw = 520, bh = 380;
s += browserMockup(620, 130, bw, bh, {
  tabs: [
    { label: 'latam.com/reservas', flagged: true, active: true, w: 145 },
    { label: 'skyscanner.com.br', flagged: true, w: 145 }
  ],
  activeUrl: 'latam.com/reservas',
  badge: 1,
  popover: { title: 'Passagens · voos', rows: ['latam.com/reservas', 'skyscanner.com.br', 'google.com/flights'] }
});

s += '</svg>';

await sharp(Buffer.from(s)).png().toFile(OUT);
console.log('og-image.png ok');
