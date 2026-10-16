/**
 * Planuri FRAME din aceeași sursă ca volumul (v47_a1_frame_study.json).
 * Nu citește v47_exact.json.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
const write = (rel, text) => {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text);
  return p;
};

const study = read("data/building/v47_a1_frame_study.json");
const fr = study.structure_frame_study_cm;
const ew = study.envelope_cm?.ew || 682.6;
const ns = study.envelope_cm?.ns || 861.3;

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function planSvg(levelLabel, opts = {}) {
  const pad = 40;
  const scale = 0.85;
  const W = ew * scale + pad * 2;
  const H = ns * scale + pad * 2 + 36;
  const sx = (x) => pad + x * scale;
  const sy = (y) => pad + 28 + y * scale;
  const parts = [];
  parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(0)}" height="${H.toFixed(0)}" viewBox="0 0 ${W} ${H}">`
  );
  parts.push(`<rect width="100%" height="100%" fill="#f7f4ef"/>`);
  parts.push(
    `<text x="${pad}" y="22" font-size="14" font-weight="600" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(levelLabel)}</text>`
  );
  parts.push(
    `<text x="${pad}" y="${H - 12}" font-size="9" fill="#555" font-family="IBM Plex Sans,Segoe UI,sans-serif">sursa: v47_a1_frame_study.json · envelope ${ew}×${ns} · GEO_X0=${fr?.axes_cm?.GEO_X0 ?? "?"} · neconstruibil</text>`
  );

  // envelope
  parts.push(
    `<rect x="${sx(0)}" y="${sy(0)}" width="${ew * scale}" height="${ns * scale}" fill="none" stroke="#888" stroke-width="1"/>`
  );

  for (const w of study.walls_cm || []) {
    if (w.removed) continue;
    if (w.levels && opts.level != null && !w.levels.includes(opts.level) && !w.levels.includes(opts.levelIdx))
      continue;
    const col = w.kind === "ext" ? "#c4a882" : "#ddd6c8";
    parts.push(
      `<rect x="${sx(w.x)}" y="${sy(w.y)}" width="${w.dx * scale}" height="${w.dy * scale}" fill="${col}" fill-opacity="0.55" stroke="#666" stroke-width="0.4"/>`
    );
  }

  for (const b of fr?.beams || []) {
    if (opts.beamLevels && !(b.levels || []).some((L) => opts.beamLevels.includes(L))) continue;
    parts.push(
      `<rect x="${sx(b.x)}" y="${sy(b.y)}" width="${b.dx * scale}" height="${b.dy * scale}" fill="#5a554e" fill-opacity="0.85" stroke="#222" stroke-width="0.5"/>`
    );
    parts.push(
      `<text x="${sx(b.x + b.dx / 2)}" y="${sy(b.y + b.dy / 2)}" text-anchor="middle" font-size="7" fill="#fff" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(b.id)}</text>`
    );
  }

  for (const c of fr?.columns || []) {
    if (opts.colLevels && !(c.levels || []).some((L) => opts.colLevels.includes(L))) continue;
    parts.push(
      `<rect x="${sx(c.x)}" y="${sy(c.y)}" width="${c.dx * scale}" height="${c.dy * scale}" fill="#2c2a28" stroke="#111" stroke-width="0.6"/>`
    );
    parts.push(
      `<text x="${sx(c.x + c.dx / 2)}" y="${sy(c.y - 2)}" text-anchor="middle" font-size="6.5" fill="#222" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(c.id)}</text>`
    );
  }

  parts.push(`</svg>`);
  return parts.join("\n");
}

const outP = write(
  "outputs/plans/38_v47_a1_frame_plan_parter.svg",
  planSvg("FRAME · Parter — pereți + stâlpi + grinzi P", {
    level: 0,
    levelIdx: 0,
    beamLevels: ["P", "S"],
    colLevels: ["S", "P", "E"],
  })
);
const outE = write(
  "outputs/plans/39_v47_a1_frame_plan_etaj.svg",
  planSvg("FRAME · Etaj — pereți + stâlpi + grinzi P (planșeu) ", {
    level: 1,
    levelIdx: 1,
    beamLevels: ["P"],
    colLevels: ["S", "P", "E"],
  })
);

console.log(JSON.stringify({ ok: true, plans: [outP, outE] }, null, 2));
