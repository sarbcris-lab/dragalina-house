/**
 * S1 — pachet input FE pe schema A1 (nu FRAME V47).
 * + predimensionare ordin 2.1 stâlpi (N trib / Nrd C25/30 — NU proiect semnat).
 *
 * Rulează: node src/export_a1_fe_pack.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const a1 = JSON.parse(fs.readFileSync(path.join(root, "data/building/a1_architecture.json"), "utf8"));
const st = a1.structure_a1_study_cm;
if (!st?.columns?.length) {
  throw new Error("Rulează mai întâi: npm run structure:a1");
}

const cols = st.columns;
const beams = st.beams || [];
const box = st.structure_box_cm;
const pit = st.pit_cm;
const lv = st.levels_cm || {};
const stairFit = a1.basement_cm?.stair?.fit || {};

const Q_ED_FLOOR = 11.78;
const Q_ED_ROOF_LIGHT = 4.5;
const FCD = 25 / 1.5;

function nrdKn(dx, dy) {
  return 0.8 * (dx / 100) * (dy / 100) * FCD * 1000;
}

/** Half-span tributar din vecini pe grilă (m²) — ordin, nu FE. */
function tribFloor(c) {
  const others = cols.filter((o) => o.id !== c.id);
  const cx = c.x + c.dx / 2;
  const cy = c.y + c.dy / 2;
  let halfX = 2.5;
  let halfY = 2.5;
  const sameRow = others.filter((o) => Math.abs(o.y + o.dy / 2 - cy) < 80);
  const sameCol = others.filter((o) => Math.abs(o.x + o.dx / 2 - cx) < 80);
  if (sameRow.length) {
    const dists = sameRow.map((o) => Math.abs(o.x + o.dx / 2 - cx) / 100);
    halfX = Math.min(...dists) / 2;
  }
  if (sameCol.length) {
    const dists = sameCol.map((o) => Math.abs(o.y + o.dy / 2 - cy) / 100);
    halfY = Math.min(...dists) / 2;
  }
  halfX = Math.max(0.8, Math.min(halfX, 4));
  halfY = Math.max(0.8, Math.min(halfY, 4));
  return +(halfX * 2 * (halfY * 2)).toFixed(2);
}

function colPrelim(c) {
  const minSide = Math.min(c.dx, c.dy);
  const p100 = minSide >= 30;
  const floors = (c.levels || []).includes("E") ? 2 : (c.levels || []).includes("P") ? 1 : 0;
  const A = tribFloor(c);
  const self = 25 * (c.dx / 100) * (c.dy / 100) * 9;
  const N = floors * A * Q_ED_FLOOR + ((c.levels || []).includes("E") ? A * Q_ED_ROOF_LIGHT : 0) + self;
  const Nrd = nrdKn(c.dx, c.dy);
  const util = N / Nrd;
  return {
    id: c.id,
    section: `${c.dx}×${c.dy}`,
    min_side: minSide,
    p100_ok: p100,
    trib_m2: A,
    N_kN: +N.toFixed(1),
    Nrd_kN: +Nrd.toFixed(1),
    util_Nrd: +util.toFixed(3),
    flag:
      !p100
        ? "P100_FAIL_min30"
        : util > 0.55
          ? "REVIEW_FE_high_util_axial"
          : util > 0.35
            ? "OK_ordin_axial"
            : "OK_light_axial",
  };
}

const prelim = cols.filter((c) => (c.levels || []).includes("P")).map(colPrelim);

/** Span grinzi (cm) pe axa lungă — între supports. */
function beamSpans(b) {
  const alongX = b.dx >= b.dy;
  const supports = (b.supports || []).map((id) => cols.find((c) => c.id === id)).filter(Boolean);
  if (supports.length < 2) return { L_max_cm: alongX ? b.dx : b.dy, spans: [] };
  const key = alongX ? "x" : "y";
  const size = alongX ? "dx" : "dy";
  const sorted = [...supports].sort((a, b) => a[key] - b[key]);
  const spans = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const c = sorted[i + 1];
    const L = c[key] - (a[key] + a[size]);
    spans.push({ from: a.id, to: c.id, clear_cm: +L.toFixed(1) });
  }
  const Lmax = spans.length ? Math.max(...spans.map((s) => s.clear_cm)) : alongX ? b.dx : b.dy;
  return { L_max_cm: Lmax, spans };
}

const beamTable = beams.map((b) => {
  const sp = beamSpans(b);
  return {
    id: b.id,
    b_cm: Math.min(b.dx, b.dy),
    L_max_cm: sp.L_max_cm,
    levels: (b.levels || []).join("+"),
    supports: (b.supports || []).join(", "),
    note: b.note,
    spans: sp.spans,
  };
});

const conflicts = [];
for (const p of prelim) {
  if (!p.p100_ok) conflicts.push({ id: p.id, type: "conflict_geometric", detail: `secțiune ${p.section} — latură mică < 30 (P100)` });
  if (p.flag === "REVIEW_FE_high_util_axial")
    conflicts.push({ id: p.id, type: "calcul_lipsă", detail: `util N/Nrd≈${p.util_Nrd} — FE M+V+P100 obligatoriu` });
}
if (stairFit.riser_vs_brief_16) {
  conflicts.push({ id: "riser_beci", type: "calcul_lipsă", detail: String(stairFit.riser_vs_brief_16) });
}
if (stairFit.pier_warn) {
  conflicts.push({
    id: "pier_clear",
    type: "avertisment",
    detail: `clear@pier ${stairFit.clear_at_pier} < țintă ${stairFit.stair_clear_need}`,
  });
}
const inv = beams.find((b) => /INVERTED|întoars/i.test(b.id + (b.note || "")));
const pier = cols.find((c) => c.id === "C_SHAFT_E_PIER");
if (!pier || !inv) {
  conflicts.push({
    id: "grindă_întoarsă_puț",
    type: pier && inv ? "ok" : "ipoteză",
    detail: pier && inv ? "propuse în structure_a1" : "verifică structure:a1 include pier+întoarsă",
  });
}

const md = `# S1 A1 — pachet input FE (v01)

**Status:** Faza FE pe schema A1 · **neconstruibil** · ${new Date().toISOString().slice(0, 10)}  
**Sistem:** cadre BA pe \`structure_a1_study_cm\`  
**NU folosi:** \`v47_a1_frame_study\` / FRAME STALE ca geometrie de calcul  
**Amenajare:** înghețată · \`declared_buildable = false\`

## 0. Lock-uri (neschimbate)

| ID | Lock |
|----|------|
| D1 | Clear 255 sub placă; 241 OK sub grindă h35 |
| D2 | Pilastri / ETICS pe regulă fațadă A1 |
| D3 | Acoperiș: compară ușoară vs BA la FE |
| P100 | Stâlp thru **≥ 30** |
| ARH | Nu muta compartimentare P/E |

## 1. Fișiere

| Rol | Cale |
|-----|------|
| Schemă | \`data/building/a1_architecture.json\` → \`structure_a1_study_cm\` |
| Alias | \`data/building/a1_structure_study.json\` |
| Geometrie | \`outputs/reports/s1_structure_a1_geometry_v01.md\` |
| Acest pachet | \`outputs/reports/s1_a1_fe_input_pack_v01.md\` |
| Prelim 2.1 JSON | \`outputs/reports/s1_a1_calc_2_1_columns_v01.json\` |
| Viewer | \`npm run volume:a1\` → Structură |

## 2. Levels (cm)

| Cotă | Valoare |
|------|--------:|
| FF parter | ${lv.ff_parter ?? "—"} |
| FF etaj | ${lv.ff_etaj ?? "—"} |
| Placă th | ${lv.slab_th_hypothesis ?? 15} |
| Soffit placă E | ${lv.slab_soffit_etaj ?? "—"} |
| Top placă E | ${lv.slab_top_etaj ?? "—"} |
| Grindă h total | ${lv.beam_h_total_including_slab_zone ?? 35} |
| Intrados grindă P | ${lv.beam_soffit_over_parter ?? "—"} |
| FF beci | ${lv.basement_ff_cm ?? -250} |
| Soffit L-1 | ${lv.basement_soffit_cm ?? -30} |

## 3. Envelope retenție / puț

| | cm |
|--|-----|
| Cutie | X ${box?.x0}–${box?.x1} × Y ${box?.y0}–${box?.y1} |
| Puț | ${pit ? `X ${pit.x0}–${pit.x1} × Y ${pit.y0}–${pit.y1}` : "—"} |

## 4. Stâlpi — input FE

| ID | x | y | dx×dy | Levels | pe cutie | Notă |
|----|--:|--:|-------|--------|----------|------|
${cols
  .map(
    (c) =>
      `| ${c.id} | ${c.x} | ${c.y} | ${c.dx}×${c.dy} | ${(c.levels || []).join("+")} | ${c.on_heated_box ? "da" : "nu"} | ${c.role || c.note?.slice(0, 40) || ""} |`
  )
  .join("\n")}

## 5. Grinzi — input FE + deschideri clare

| ID | b | L_max clear | Levels | Supports | Note |
|----|--:|----------:|--------|----------|------|
${beamTable
  .map(
    (b) =>
      `| ${b.id} | ${b.b_cm} | ${b.L_max_cm} | ${b.levels} | ${b.supports} | ${b.note || ""} |`
  )
  .join("\n")}

## 6. Predimensionare 2.1 (ordin — fără M/V/P100)

Ipoteze: q_Ed planșeu **${Q_ED_FLOOR}** kN/m² · acoperiș ușor **${Q_ED_ROOF_LIGHT}** · C25/30 Nrd≈0,8·Ac·fcd · **fără flambaj**.

| ID | Secțiune | Trib m² | N kN | Nrd kN | N/Nrd | Flag |
|----|----------|--------:|-----:|------:|------:|------|
${prelim
  .map(
    (p) =>
      `| ${p.id} | ${p.section} | ${p.trib_m2} | ${p.N_kN} | ${p.Nrd_kN} | ${p.util_Nrd} | ${p.flag} |`
  )
  .join("\n")}

**Verdict 2.1 ordin:** axial ușor pe majoritate; **nu înlocuiește FE**. Flaguri P100 / util mare = obligatoriu în model.

## 7. Ordine calc (aceeași ca frame_calc_package)

1. Stâlpi N/M/V + P100 pe schema **A1**  
2. Nod C_E_PAL / B_E (+ B_Y410)  
3. Placă living + gol puț  
4. Grinzi perimetrale + B_X_MID / B_CASA_SCARA  
5. Grindă întoarsă + pier pe puț  
6. Fundații / retenție — **geo_131** (nu 310 kPa vecin)  
7. Acoperiș D3a vs D3b  

## 8. Registru (la export)

| ID | Tip | Detaliu |
|----|-----|---------|
${conflicts.map((c) => `| ${c.id} | ${c.type} | ${c.detail} |`).join("\n")}

## 9. Ce nu e în acest pachet

- Semnătură proiectant / autorizare  
- Model FEM numeric (Robot/Axis/etc.) — doar geometrie + ordin  
- Mutare amenajare A1  
`;

const json21 = {
  meta: {
    id: "s1_a1_calc_2_1_columns_v01",
    generated: new Date().toISOString(),
    status: "ordin_nu_proiect",
    source: "structure_a1_study_cm",
  },
  hypotheses: { Q_ED_FLOOR, Q_ED_ROOF_LIGHT, concrete: "C25/30", alpha: 0.8 },
  columns: prelim,
  beams: beamTable,
  conflicts,
};

fs.mkdirSync(path.join(root, "outputs/reports"), { recursive: true });
fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_fe_input_pack_v01.md"), md);
fs.writeFileSync(
  path.join(root, "outputs/reports/s1_a1_calc_2_1_columns_v01.json"),
  JSON.stringify(json21, null, 2) + "\n"
);
fs.writeFileSync(
  path.join(root, "outputs/reports/s1_a1_calc_2_1_columns_v01.md"),
  `# S1 A1 — calc 2.1 stâlpi (ordin)\n\nVezi tabelul din \`s1_a1_fe_input_pack_v01.md\` §6.\n\n` +
    prelim.map((p) => `- **${p.id}** ${p.section}: N=${p.N_kN} / Nrd=${p.Nrd_kN} → ${p.flag}`).join("\n") +
    "\n"
);

console.log(
  JSON.stringify(
    {
      ok: true,
      columns: cols.length,
      beams: beams.length,
      prelim_flags: prelim.map((p) => [p.id, p.flag]),
      conflicts: conflicts.length,
      files: [
        "outputs/reports/s1_a1_fe_input_pack_v01.md",
        "outputs/reports/s1_a1_calc_2_1_columns_v01.json",
      ],
    },
    null,
    2
  )
);
