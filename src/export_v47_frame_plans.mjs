/**
 * Planuri + secțiuni FRAME din v47_a1_frame_study.json (aceeași sursă ca volumul).
 * Nu citește v47_exact.json.
 *
 * 38 — plan parter (pereți, goluri, stâlpi, grinzi P, scară, podest, contur placă)
 * 39 — plan etaj (idem + palier + gol placă)
 * 40 — secțiuni longitudinale rampă 1, nod podest, rampă 2
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { computeInteriorFreeSpaces } from "./interior_free_spaces_v01.mjs";

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
const st = study.stair_cm || {};
const ew = study.envelope_cm?.ew || 682.6;
const ns = study.envelope_cm?.ns || 861.3;
const ht = study.heights_cm || {};
const riser = st.riser_cm || ht.riser_cm || 16;
const tread = st.tread_cm || 30;
const n180 = st.risers_flight_180 || 8;
const n330 = st.risers_flight_330 || 10;
const nTread180 = n180 - 1;
const nTread330 = n330 - 1;
const floorBuild = ht.floor_buildup_below_ff_cm || 12;
const podSlab = fr?.stair_structure_system?.podest_ba_cm || 15;
const rampPlate = fr?.stair_structure_system?.ramp_plate_cm || st.ramp2_structure_cm || 20;
const zParter = (ht.entry_steps_to_terrace || 2) * (ht.entry_step_riser_cm || riser);
const zPod = zParter + riser * n180;
const zPodConcTop = zPod - floorBuild;
const zPodConcBot = zPodConcTop - podSlab;
const treadTh = Math.min(riser, 6);

function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function planSvg(levelLabel, opts = {}) {
  const pad = opts.showInteriorDims ? 72 : 40;
  const scale = 0.85;
  const W = ew * scale + pad * 2 + (opts.showInteriorDims ? 36 : 0);
  const H = ns * scale + pad * 2 + 48 + (opts.showInteriorDims ? 28 : 0);
  const sx = (x) => pad + x * scale;
  const sy = (y) => pad + 28 + y * scale;
  const parts = [];
  /** Cotă lungime: linie + ticks + text cm. */
  function dimH(x0, x1, y, label, offset = -14) {
    const a = sx(x0);
    const b = sx(x1);
    const yy = sy(y) + offset;
    const mid = (a + b) / 2;
    const L = Math.round(Math.abs(x1 - x0));
    parts.push(`<line x1="${a}" y1="${yy}" x2="${b}" y2="${yy}" stroke="#c44" stroke-width="0.9"/>`);
    parts.push(`<line x1="${a}" y1="${yy - 4}" x2="${a}" y2="${yy + 4}" stroke="#c44" stroke-width="0.9"/>`);
    parts.push(`<line x1="${b}" y1="${yy - 4}" x2="${b}" y2="${yy + 4}" stroke="#c44" stroke-width="0.9"/>`);
    parts.push(
      `<text x="${mid}" y="${yy - 3}" text-anchor="middle" font-size="9" font-weight="600" fill="#c44" font-family="IBM Plex Sans,Segoe UI,sans-serif">${label || L}</text>`
    );
  }
  function dimV(y0, y1, x, label, offset = -14) {
    const a = sy(y0);
    const b = sy(y1);
    const xx = sx(x) + offset;
    const mid = (a + b) / 2;
    const L = Math.round(Math.abs(y1 - y0));
    parts.push(`<line x1="${xx}" y1="${a}" x2="${xx}" y2="${b}" stroke="#c44" stroke-width="0.9"/>`);
    parts.push(`<line x1="${xx - 4}" y1="${a}" x2="${xx + 4}" y2="${a}" stroke="#c44" stroke-width="0.9"/>`);
    parts.push(`<line x1="${xx - 4}" y1="${b}" x2="${xx + 4}" y2="${b}" stroke="#c44" stroke-width="0.9"/>`);
    parts.push(
      `<text x="${xx - 5}" y="${mid + 3}" text-anchor="end" font-size="9" font-weight="600" fill="#c44" font-family="IBM Plex Sans,Segoe UI,sans-serif">${label || L}</text>`
    );
  }
  parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(0)}" height="${H.toFixed(0)}" viewBox="0 0 ${W} ${H}">`
  );
  parts.push(`<rect width="100%" height="100%" fill="#f7f4ef"/>`);
  parts.push(
    `<text x="${pad}" y="22" font-size="14" font-weight="600" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(levelLabel)}</text>`
  );
  const sfp = fr?.structural_footprint_cm;
  parts.push(
    `<text x="${pad}" y="40" font-size="11" font-weight="600" fill="#111" font-family="IBM Plex Sans,Segoe UI,sans-serif">finit ${ew}×${ns} cm${sfp ? ` · placă BA ${sfp.ew}×${sfp.ns} (N/V pe muchie · E/S −A2)` : ""}</text>`
  );
  parts.push(
    `<text x="${pad}" y="${H - 12}" font-size="9" fill="#555" font-family="IBM Plex Sans,Segoe UI,sans-serif">sursa: v47_a1_frame_study.json · GEO_X0=${fr?.axes_cm?.GEO_X0 ?? "?"} · scară=${fr?.stair_structure_system?.system ?? "?"} · neconstruibil</text>`
  );

  parts.push(
    `<rect x="${sx(0)}" y="${sy(0)}" width="${ew * scale}" height="${ns * scale}" fill="none" stroke="#111" stroke-width="1.4"/>`
  );
  // placă structurală CONC (pilastru N/V = pe muchie finit; E/S retras)
  if (sfp) {
    parts.push(
      `<rect x="${sx(sfp.x0 ?? 0)}" y="${sy(sfp.y0 ?? 0)}" width="${sfp.ew * scale}" height="${sfp.ns * scale}" fill="#8b8680" fill-opacity="0.1" stroke="#5a554e" stroke-width="1.1" stroke-dasharray="6 3"/>`
    );
  }
  // cote gabarit finit
  dimH(0, ew, -18, `${ew}`);
  dimV(0, ns, ew, `${ns}`, 16);

  // Contur placă etaj (envelope minus goluri scară/palier) — pe E
  if (opts.showSlab) {
    const pal = st.palier_superior;
    const r2 = st.ramp2;
    parts.push(
      `<rect x="${sx(0)}" y="${sy(0)}" width="${ew * scale}" height="${ns * scale}" fill="#8b8680" fill-opacity="0.12" stroke="#5a554e" stroke-width="0.8" stroke-dasharray="6 3"/>`
    );
    if (r2) {
      parts.push(
        `<rect x="${sx(r2.x)}" y="${sy(r2.y)}" width="${r2.dx * scale}" height="${r2.dy * scale}" fill="#f7f4ef" stroke="#c44" stroke-width="1.2"/>`
      );
      parts.push(
        `<text x="${sx(r2.x + r2.dx / 2)}" y="${sy(r2.y + r2.dy / 2)}" text-anchor="middle" font-size="8" fill="#a33" font-family="IBM Plex Sans,Segoe UI,sans-serif">gol rampă2</text>`
      );
    }
    if (pal) {
      parts.push(
        `<rect x="${sx(pal.x)}" y="${sy(pal.y)}" width="${pal.dx * scale}" height="${pal.dy * scale}" fill="#8b8680" fill-opacity="0.35" stroke="#333" stroke-width="1"/>`
      );
      parts.push(
        `<text x="${sx(pal.x + pal.dx / 2)}" y="${sy(pal.y + pal.dy / 2)}" text-anchor="middle" font-size="8" fill="#222" font-family="IBM Plex Sans,Segoe UI,sans-serif">palier placă</text>`
      );
    }
  }

  for (const w of study.walls_cm || []) {
    if (w.removed) continue;
    if (w.levels && opts.level != null && !w.levels.includes(opts.level) && !w.levels.includes(opts.levelIdx))
      continue;
    const col = w.kind === "ext" ? "#c4a882" : "#ddd6c8";
    parts.push(
      `<rect x="${sx(w.x)}" y="${sy(w.y)}" width="${w.dx * scale}" height="${w.dy * scale}" fill="${col}" fill-opacity="0.55" stroke="#666" stroke-width="0.4"/>`
    );
  }

  // Goluri uși/ferestre
  for (const o of study.openings_cm || []) {
    if (o.removed) continue;
    if (o.levels && opts.level != null && !o.levels.includes(opts.level) && !o.levels.includes(opts.levelIdx))
      continue;
    const isDoor = /door|usa|ușă|usa/i.test(o.kind || o.type || o.id || "");
    parts.push(
      `<rect x="${sx(o.x)}" y="${sy(o.y)}" width="${(o.dx || o.w || 10) * scale}" height="${(o.dy || o.h_plan || 10) * scale}" fill="${isDoor ? "#fff" : "#cfe8ff"}" fill-opacity="0.9" stroke="${isDoor ? "#333" : "#4a7ab0"}" stroke-width="0.8"/>`
    );
  }

  // Scară + podest
  const f180 = st.flight_180;
  const pod = st.podest_se;
  const r2 = st.ramp2;
  if (f180) {
    parts.push(
      `<rect x="${sx(f180.x)}" y="${sy(f180.y)}" width="${f180.dx * scale}" height="${f180.dy * scale}" fill="#6a8498" fill-opacity="0.35" stroke="#3a5060" stroke-width="0.8"/>`
    );
    for (let i = 0; i < nTread180; i++) {
      const x = f180.x + i * tread;
      parts.push(
        `<line x1="${sx(x)}" y1="${sy(f180.y)}" x2="${sx(x)}" y2="${sy(f180.y + f180.dy)}" stroke="#3a5060" stroke-width="0.4"/>`
      );
    }
    parts.push(
      `<text x="${sx(f180.x + f180.dx / 2)}" y="${sy(f180.y - 4)}" text-anchor="middle" font-size="8" fill="#3a5060" font-family="IBM Plex Sans,Segoe UI,sans-serif">rampă 1</text>`
    );
  }
  if (pod) {
    parts.push(
      `<rect x="${sx(pod.x)}" y="${sy(pod.y)}" width="${pod.dx * scale}" height="${pod.dy * scale}" fill="#8b8680" fill-opacity="0.5" stroke="#333" stroke-width="1"/>`
    );
    parts.push(
      `<text x="${sx(pod.x + pod.dx / 2)}" y="${sy(pod.y + pod.dy / 2)}" text-anchor="middle" font-size="8" fill="#222" font-family="IBM Plex Sans,Segoe UI,sans-serif">podest BA ${podSlab}</text>`
    );
  }
  if (r2 && opts.level !== 0) {
    parts.push(
      `<rect x="${sx(r2.x)}" y="${sy(r2.y)}" width="${r2.dx * scale}" height="${r2.dy * scale}" fill="#7a8390" fill-opacity="0.3" stroke="#3a5060" stroke-width="0.8"/>`
    );
    for (let i = 0; i < nTread330; i++) {
      const y = r2.y + r2.dy - (i + 1) * tread;
      parts.push(
        `<line x1="${sx(r2.x)}" y1="${sy(y)}" x2="${sx(r2.x + r2.dx)}" y2="${sy(y)}" stroke="#3a5060" stroke-width="0.4"/>`
      );
    }
    parts.push(
      `<text x="${sx(r2.x + r2.dx / 2)}" y="${sy(r2.y + 12)}" text-anchor="middle" font-size="8" fill="#3a5060" font-family="IBM Plex Sans,Segoe UI,sans-serif">rampă 2</text>`
    );
  } else if (r2 && opts.level === 0) {
    // pe parter: contur puț / poziție rampă
    parts.push(
      `<rect x="${sx(r2.x)}" y="${sy(r2.y)}" width="${r2.dx * scale}" height="${r2.dy * scale}" fill="none" stroke="#a33" stroke-width="1" stroke-dasharray="4 3"/>`
    );
    parts.push(
      `<text x="${sx(r2.x + r2.dx / 2)}" y="${sy(r2.y + r2.dy / 2)}" text-anchor="middle" font-size="8" fill="#a33" font-family="IBM Plex Sans,Segoe UI,sans-serif">puț scară (P)</text>`
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

  // Dimensiuni + m² din contururi libere (fețe pereți), nu rooms_cm brute
  if (opts.showInteriorDims) {
    const isEtaj = opts.level === 1 || opts.levelIdx === 1;
    const free = computeInteriorFreeSpaces(study, isEtaj ? "E" : "P");
    for (const L of free.spaces) {
      const name = String(L.id).replace(/_/g, " ");
      const cx = sx(L.cx);
      const cy = sy(L.cy);
      parts.push(
        `<text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="9" font-weight="600" fill="#1a1a1a" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(name)}</text>`
      );
      if (L.label_m2 != null) {
        parts.push(
          `<text x="${cx}" y="${cy + 8}" text-anchor="middle" font-size="8" fill="#222" font-family="IBM Plex Sans,Segoe UI,sans-serif">${L.label_m2.toFixed(2)} m² liber</text>`
        );
      }
      if (L.dim_note) {
        parts.push(
          `<text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="6.5" fill="#666" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(L.dim_note)}</text>`
        );
      }
      if (L.note) {
        parts.push(
          `<text x="${cx}" y="${cy + (L.label_m2 != null ? 18 : 8)}" text-anchor="middle" font-size="6.5" fill="#888" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(L.note)}</text>`
        );
      }
      for (const d of L.dims || []) {
        if (d.type === "H") dimH(d.x0, d.x1, d.y, `${+(Math.abs(d.x1 - d.x0)).toFixed(1)}`, d.offset ?? -12);
        if (d.type === "V") dimV(d.y0, d.y1, d.x, `${+(Math.abs(d.y1 - d.y0)).toFixed(1)}`, d.offset ?? -12);
      }
    }
    const polyKey = isEtaj ? "poly_etaj_cm" : "poly_parter_cm";
    const poly = study.areas_cm?.useful_by_level?.[polyKey];
    if (Array.isArray(poly) && poly.length >= 2) {
      const xs = poly.map((p) => p[0]);
      const ys = poly.map((p) => p[1]);
      const xMin = Math.min(...xs);
      const xMax = Math.max(...xs);
      const yMin = Math.min(...ys);
      const yMax = Math.max(...ys);
      dimH(xMin, xMax, yMin, `${Math.round(xMax - xMin)}`, -28);
      dimV(yMin, yMax, xMin, `${Math.round(yMax - yMin)}`, -28);
    }
    const u = free.totals.useful_etaj_studio_m2;
    const note = isEtaj
      ? `UTIL E = ${u ?? "—"} m² = suma etichetelor (baie ${free.totals.bath_free_m2} + nișă ${free.totals.nisa_free_m2} + dorm ${free.totals.dorm_free_m2} + living + buc + circulație) · palier rece exclus · scară ≠ util`
      : `cote din fețe pereți · util P vezi frame_study_areas`;
    parts.push(
      `<text x="${pad}" y="${H - 28}" font-size="7.5" fill="#444" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(note)}</text>`
    );
  }

  parts.push(`</svg>`);
  return parts.join("\n");
}

/** Secțiuni longitudinale scară — cote în cm pe desen. */
function stairSectionsSvg() {
  const f180 = st.flight_180 || { x: 355, y: 860, dx: 210, dy: 115 };
  const pod = st.podest_se || { x: 565, y: 860, dx: 115, dy: 115 };
  const sc = 1.1;
  const pad = 50;
  const panelW = 420;
  const panelH = 280;
  const W = pad * 2 + panelW * 2 + 40;
  const H = pad * 2 + panelH * 2 + 60;

  const parts = [];
  parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`
  );
  parts.push(`<rect width="100%" height="100%" fill="#f7f4ef"/>`);
  parts.push(
    `<text x="${pad}" y="28" font-size="14" font-weight="600" font-family="IBM Plex Sans,Segoe UI,sans-serif">FRAME · Secțiuni scară — noduri rampă↔podest</text>`
  );
  parts.push(
    `<text x="${pad}" y="46" font-size="9" fill="#555" font-family="IBM Plex Sans,Segoe UI,sans-serif">sistem: ${esc(fr?.stair_structure_system?.system)} · podest BA ${podSlab} cm (+${zPodConcBot}→+${zPodConcTop}) · pachet ${floorBuild} cm · plăci treaptă ${rampPlate} cm · neconstruibil</text>`
  );

  function panel(ox, oy, title, draw) {
    parts.push(`<g transform="translate(${ox},${oy})">`);
    parts.push(`<rect width="${panelW}" height="${panelH}" fill="#fff" stroke="#ccc"/>`);
    parts.push(
      `<text x="12" y="18" font-size="11" font-weight="600" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(title)}</text>`
    );
    draw((xCm, zCm) => ({ x: 30 + xCm * sc, y: panelH - 30 - zCm * sc }));
    parts.push(`</g>`);
  }

  // A — rampă 1 longitudinal (X), Z vertical
  panel(pad, pad + 20, "A — Rampă 1 (X) → reazem podest", (pt) => {
    const x0 = f180.x;
    for (let i = 0; i < nTread180; i++) {
      const x = i * tread;
      const zTop = zParter + riser * (i + 1);
      const zSof = zTop - treadTh;
      const zBot = zSof - rampPlate;
      const a = pt(x, zBot);
      const b = pt(x + tread, zTop);
      parts.push(
        `<rect x="${a.x}" y="${pt(x, zTop).y}" width="${tread * sc}" height="${treadTh * sc}" fill="#6a8498"/>`
      );
      parts.push(
        `<rect x="${a.x}" y="${pt(x, zSof).y}" width="${tread * sc}" height="${rampPlate * sc}" fill="#5a6570" fill-opacity="0.85"/>`
      );
      void b;
    }
    // podest
    const podX0 = f180.dx;
    const p0 = pt(podX0, zPodConcBot);
    parts.push(
      `<rect x="${p0.x}" y="${pt(podX0, zPodConcTop).y}" width="${pod.dx * sc}" height="${podSlab * sc}" fill="#8b8680"/>`
    );
    parts.push(
      `<rect x="${p0.x}" y="${pt(podX0, zPod).y}" width="${pod.dx * sc}" height="${floorBuild * sc}" fill="#c4b496"/>`
    );
    // vang reazem
    const bear = 15;
    const v0 = pt(podX0, zPodConcBot);
    parts.push(
      `<rect x="${v0.x}" y="${pt(podX0, zPodConcTop).y}" width="${bear * sc}" height="${podSlab * sc}" fill="#4a5560" fill-opacity="0.7" stroke="#222"/>`
    );
    parts.push(
      `<text x="${pt(0, 0).x}" y="${panelH - 8}" font-size="8" fill="#444" font-family="IBM Plex Sans,Segoe UI,sans-serif">rampă1 X${x0}–${x0 + f180.dx} + podest →X${x0 + f180.dx + pod.dx} · FF +${zPod} · BA +${zPodConcBot}→+${zPodConcTop}</text>`
    );
  });

  // B — nod podest (detaliu)
  panel(pad + panelW + 40, pad + 20, "B — Nod podest SE (grosimi)", (pt) => {
    const x0 = 0;
    parts.push(
      `<rect x="${pt(x0, zPodConcBot).x}" y="${pt(x0, zPodConcTop).y}" width="${80 * sc}" height="${podSlab * sc}" fill="#8b8680"/>`
    );
    parts.push(
      `<rect x="${pt(x0, zPodConcTop).x}" y="${pt(x0, zPod).y}" width="${80 * sc}" height="${floorBuild * sc}" fill="#c4b496"/>`
    );
    // cotă BA
    parts.push(
      `<line x1="${pt(85, zPodConcBot).x}" y1="${pt(85, zPodConcBot).y}" x2="${pt(85, zPodConcTop).x}" y2="${pt(85, zPodConcTop).y}" stroke="#c44" stroke-width="1.5"/>`
    );
    parts.push(
      `<text x="${pt(88, (zPodConcBot + zPodConcTop) / 2).x}" y="${pt(88, (zPodConcBot + zPodConcTop) / 2).y}" font-size="9" fill="#c44" font-family="IBM Plex Sans,Segoe UI,sans-serif">${podSlab} cm BA</text>`
    );
    parts.push(
      `<text x="${pt(88, (zPodConcTop + zPod) / 2).x}" y="${pt(88, (zPodConcTop + zPod) / 2).y}" font-size="9" fill="#666" font-family="IBM Plex Sans,Segoe UI,sans-serif">${floorBuild} cm finisaj</text>`
    );
    parts.push(
      `<text x="${pt(0, zPodConcBot - 8).x}" y="${pt(0, zPodConcBot - 8).y}" font-size="8" fill="#333" font-family="IBM Plex Sans,Segoe UI,sans-serif">+${zPodConcBot} (intrados) · +${zPodConcTop} (față BA) · +${zPod} (FF)</text>`
    );
    // rampă 1 sosire
    parts.push(
      `<rect x="${pt(-40, zPodConcBot - 5).x}" y="${pt(-40, zParter + riser * nTread180 - treadTh).y}" width="${40 * sc}" height="${rampPlate * sc}" fill="#5a6570"/>`
    );
    parts.push(
      `<text x="${pt(-38, zParter + 40).x}" y="${pt(-38, zParter + 40).y}" font-size="8" fill="#333" font-family="IBM Plex Sans,Segoe UI,sans-serif">← r1</text>`
    );
    // rampă 2 plecare
    const z1sof = zPod + riser - treadTh;
    parts.push(
      `<rect x="${pt(80, zPodConcTop).x}" y="${pt(80, z1sof).y}" width="${40 * sc}" height="${(z1sof - zPodConcTop) * sc}" fill="#4a5560" fill-opacity="0.5"/>`
    );
    parts.push(
      `<text x="${pt(82, zPod + 30).x}" y="${pt(82, zPod + 30).y}" font-size="8" fill="#333" font-family="IBM Plex Sans,Segoe UI,sans-serif">r2 →</text>`
    );
  });

  // C — rampă 2 longitudinal (Y)
  panel(pad, pad + 20 + panelH + 20, "C — Rampă 2 (Y) din podest → palier", (pt) => {
    // podest la stânga (sud)
    parts.push(
      `<rect x="${pt(0, zPodConcBot).x}" y="${pt(0, zPodConcTop).y}" width="${40 * sc}" height="${podSlab * sc}" fill="#8b8680"/>`
    );
    parts.push(
      `<rect x="${pt(0, zPodConcTop).x}" y="${pt(0, zPod).y}" width="${40 * sc}" height="${floorBuild * sc}" fill="#c4b496"/>`
    );
    const y0 = 40;
    for (let i = 0; i < nTread330; i++) {
      const y = y0 + i * tread;
      const zTop = zPod + riser * (i + 1);
      const zSof = zTop - treadTh;
      parts.push(
        `<rect x="${pt(y, zTop).x}" y="${pt(y, zTop).y}" width="${tread * sc}" height="${treadTh * sc}" fill="#8a93a0"/>`
      );
      parts.push(
        `<rect x="${pt(y, zSof).x}" y="${pt(y, zSof).y}" width="${tread * sc}" height="${rampPlate * sc}" fill="#5a6570" fill-opacity="0.85"/>`
      );
    }
    // vang linie reazem → sus
    const zTopN = zPod + riser * nTread330 - treadTh;
    const a = pt(40, zPodConcTop);
    const b = pt(y0 + nTread330 * tread, zTopN);
    parts.push(
      `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#4a5560" stroke-width="3"/>`
    );
    parts.push(
      `<text x="${pt(0, 0).x}" y="${panelH - 8}" font-size="8" fill="#444" font-family="IBM Plex Sans,Segoe UI,sans-serif">contact trepte = plăci BA pe intrados; vang = colector pe muchie + reazem podest</text>`
    );
  });

  // D — legendă / sistem
  panel(pad + panelW + 40, pad + 20 + panelH + 20, "D — Sistem structural declarat", () => {
    const lines = [
      "1. Trepte pe plăci BA individuale (20 cm sub intrados)",
      "2. Vanguri pe muchii — colectori; reazem 15 cm în placa podest",
      "3. Podest: BA 15 cm (+133→+148) + pachet 12 cm (nu 3 cm)",
      "4. Grosimi = model geometric; rezistență = calcul ulterior",
      "5. Palier rece: XPS 5 + impact 1 + șapă 4 + finisaj 2",
      "6. Cote FF / compartimentare neschimbate",
    ];
    lines.forEach((t, i) => {
      parts.push(
        `<text x="16" y="${40 + i * 22}" font-size="10" fill="#222" font-family="IBM Plex Sans,Segoe UI,sans-serif">${esc(t)}</text>`
      );
    });
  });

  parts.push(
    `<text x="${pad}" y="${H - 16}" font-size="8" fill="#555" font-family="IBM Plex Sans,Segoe UI,sans-serif">40_v47_a1_frame_stair_sections.svg · din frame study · nu demonstrază rezistență</text>`
  );
  parts.push(`</svg>`);
  return parts.join("\n");
}

const outP = write(
  "outputs/plans/38_v47_a1_frame_plan_parter.svg",
  planSvg("FRAME · Parter — pereți, goluri, stâlpi, grinzi, scară, podest · cote int.", {
    level: 0,
    levelIdx: 0,
    beamLevels: ["P", "S", "S_inverted"],
    colLevels: ["S", "P", "E"],
    showInteriorDims: true,
  })
);
const outE = write(
  "outputs/plans/39_v47_a1_frame_plan_etaj.svg",
  planSvg("FRAME · Etaj — pereți, goluri, planșeu · cote interioare", {
    level: 1,
    levelIdx: 1,
    beamLevels: ["E", "P"],
    colLevels: ["S", "P", "E"],
    showSlab: true,
    showInteriorDims: true,
  })
);
const outS = write("outputs/plans/40_v47_a1_frame_stair_sections.svg", stairSectionsSvg());

// Persist free-space audit + corectare bath_net (nu rooms_cm rect)
const freeE = computeInteriorFreeSpaces(study, "E");
study.interior_free_spaces_cm = { etaj: freeE, generated_by: "interior_free_spaces_v01.mjs" };
if (study.areas_cm) {
  study.areas_cm.bath_free_from_walls_m2 = freeE.totals.bath_free_m2;
  study.areas_cm.nisa_free_from_walls_m2 = freeE.totals.nisa_free_m2;
  study.areas_cm.dorm_free_from_walls_m2 = freeE.totals.dorm_free_m2;
  study.areas_cm.dorm_plus_nisa_free_m2 = freeE.totals.dorm_plus_nisa_m2;
  study.areas_cm.bath_net_m2 = freeE.totals.bath_free_m2;
  study.areas_cm.bath_net_note =
    "liber L din fețe walls_cm (nu rect rooms_cm 7.62); rooms_cm.baie rămâne AABB referință";
  const labels = freeE.totals.useful_etaj_labels_sum_m2;
  if (study.areas_cm.frame_study_areas) {
    study.areas_cm.frame_study_areas.useful_etaj_labels_sum_m2 = labels;
  }
  if (study.areas_cm.useful_by_level) {
    study.areas_cm.useful_by_level.etaj_labels_sum_m2 = labels;
    study.areas_cm.useful_by_level.note =
      "Canonice: parter_m2 / etaj_m2 = geometric. etaj_labels_sum_m2 = informativ.";
  }
}
const baie = (study.rooms_cm || []).find((r) => r.id === "baie");
if (baie) {
  baie.free_m2 = freeE.totals.bath_free_m2;
  baie.area_label_note =
    "AABB 7.62 = înainte de decupaj nișă; util liber ≈ L din pereți (vezi interior_free_spaces)";
}
const nisa = (study.rooms_cm || []).find((r) => r.id === "nisa_dulap");
if (nisa) {
  nisa.free_m2 = freeE.totals.nisa_free_m2;
  nisa.free_dx_cm = freeE.spaces.find((s) => s.id === "nisa_dulap")?.dx;
  nisa.free_dy_cm = freeE.spaces.find((s) => s.id === "nisa_dulap")?.dy;
}
write(
  "data/building/v47_a1_frame_study.json",
  JSON.stringify(study, null, 2) + "\n"
);

console.log(
  JSON.stringify(
    {
      ok: true,
      plans: [outP, outE, outS],
      free_etaj: freeE.totals,
    },
    null,
    2
  )
);
