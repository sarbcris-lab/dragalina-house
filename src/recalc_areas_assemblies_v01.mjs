/**
 * Recalcul util geometric + POT după geometria A2/A8.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function shoelaceCm2(verts) {
  const v0 =
    verts[0][0] === verts[verts.length - 1][0] && verts[0][1] === verts[verts.length - 1][1]
      ? verts.slice(0, -1)
      : verts;
  let sum = 0;
  for (let i = 0; i < v0.length; i++) {
    const [x1, y1] = v0[i];
    const [x2, y2] = v0[(i + 1) % v0.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}
function rectArea(r) {
  return r.dx * r.dy;
}
function rectIntersectArea(a, b) {
  const x0 = Math.max(a.x, b.x);
  const y0 = Math.max(a.y, b.y);
  const x1 = Math.min(a.x + a.dx, b.x + b.dx);
  const y1 = Math.min(a.y + a.dy, b.y + b.dy);
  if (x1 <= x0 || y1 <= y0) return 0;
  return (x1 - x0) * (y1 - y0);
}
function clipIntWall(w) {
  if (w.id === "perete_comun_est") {
    const y2 = Math.min(w.y + w.dy, 646.3);
    return { id: w.id, x: w.x, y: w.y, dx: w.dx, dy: Math.max(0, y2 - w.y) };
  }
  return { id: w.id, x: w.x, y: w.y, dx: w.dx, dy: w.dy };
}

function patch(rel) {
  const p = path.join(ROOT, rel);
  const v = JSON.parse(fs.readFileSync(p, "utf8"));
  const ints = v.walls_cm.filter((w) => w.kind === "int" && !w.removed).map(clipIntWall);
  let gross = 0;
  for (const w of ints) gross += rectArea(w);
  let overlaps = 0;
  for (let i = 0; i < ints.length; i++) {
    for (let j = i + 1; j < ints.length; j++) overlaps += rectIntersectArea(ints[i], ints[j]);
  }
  let voidA = 0;
  for (const o of v.openings_cm || []) {
    if (!["baie_usa", "dorm_usa"].includes(o.id)) continue;
    for (const w of ints) voidA += rectIntersectArea(w, o);
  }
  const wallNet = gross - overlaps - voidA;
  const envCm2 = shoelaceCm2(v.interior_polygon_cm.vertices);
  const useful = (envCm2 - wallNet) / 10000;
  const ew = v.envelope_cm.ew;
  const ns = v.envelope_cm.ns;
  const footprint = (ew * ns) / 10000;
  const uncovered = v.areas_cm?.uncovered_terrace_m2 ?? 4.082;
  const wall_parts_cm2 = {};
  for (const w of ints) wall_parts_cm2[w.id] = +rectArea(w).toFixed(4);

  const pot147 = footprint / 147;
  const pot172 = footprint / 172;
  const cut147 = (2 * footprint) / 147;
  const beforeUseful = 37.87875;

  v.areas_cm = {
    ...v.areas_cm,
    method:
      "shoelace(interior_polygon) − reuniune pereți int (−goluri baie/dorm); post A2/A8 geometry",
    useful_interior_m2: +useful.toFixed(6),
    useful_geometric_m2: +useful.toFixed(6),
    useful_interior_net_m2: +useful.toFixed(6),
    envelope_gross_m2: +footprint.toFixed(4),
    envelope_interior_shoelace_m2: +(envCm2 / 10000).toFixed(6),
    interior_walls_gross_m2: +(gross / 10000).toFixed(6),
    interior_walls_overlaps_m2: +(overlaps / 10000).toFixed(6),
    interior_walls_openings_void_m2: +(voidA / 10000).toFixed(6),
    interior_walls_net_m2: +(wallNet / 10000).toFixed(6),
    decomposition: `${(envCm2 / 10000).toFixed(4)} − ${(wallNet / 10000).toFixed(4)} = ${useful.toFixed(4)} m²`,
    wall_parts_cm2,
    useful_before_A8_m2: beforeUseful,
    useful_delta_vs_before_A8_m2: +(useful - beforeUseful).toFixed(6),
    useful_recalc_a1: {
      envelope_shoelace_m2: +(envCm2 / 10000).toFixed(6),
      walls_net_m2: +(wallNet / 10000).toFixed(6),
      useful_geometric_m2: +useful.toFixed(6),
      method: "shoelace(interior_polygon) − reuniune pereți int (−goluri baie/dorm)",
    },
    pot: {
      amprenta_casa_m2: +footprint.toFixed(4),
      uncovered_terrace_m2: uncovered,
      uncovered_in_pot: false,
      parcel_measured_m2: 147,
      parcel_acts_m2: 172,
      parcel_polygon_m2: 145.741,
      pot_on_147: +pot147.toFixed(4),
      pot_pct_147: +(pot147 * 100).toFixed(2),
      pot_on_172: +pot172.toFixed(4),
      pot_pct_172: +(pot172 * 100).toFixed(2),
      cut_on_147_PxE: +cut147.toFixed(4),
      existing_C1_m2: 76,
      existing_pot_pct_147: 51.7,
      delta_vs_C1_m2: +(footprint - 76).toFixed(4),
      status: "CALCUL_STUDIU — max POT din RLU/CU NECUNOSCUT",
      verdict_vs_existent: "sub amprenta C1 existent (76 m²); pe 147 ≈40%",
    },
    pot_note: `amprentă ${footprint.toFixed(4)} m²; POT 147=${(pot147 * 100).toFixed(2)}% / 172=${(pot172 * 100).toFixed(2)}%; CUT≈${cut147.toFixed(3)}; vs C1 76 m² (−${(76 - footprint).toFixed(2)} m²). Max POT RLU = DE VERIFICAT.`,
  };

  fs.writeFileSync(p, JSON.stringify(v, null, 2) + "\n");
  return v.areas_cm;
}

const a = patch("data/building/v47_a1_study.json");
patch("data/building/v47_a1_frame_study.json");

const report = `# POT + util — post assemblies A2/A8 (2026-10-15)

**Status:** calcul studiu — **nu** autorizare. Max POT din RLU/CU = **necunoscut** (de verificat urbanism Turda).

## Util (geometric / nivel)

| Mărime | Valoare |
|--------|---------|
| Util geometric | **${a.useful_geometric_m2} m²** |
| Înainte (pre-A8) | ${a.useful_before_A8_m2} m² |
| Δ | **${a.useful_delta_vs_before_A8_m2} m²** (A8 baie 15 cm) |
| Interior shoelace | ${a.envelope_interior_shoelace_m2} m² |
| Pereți int. net | ${a.interior_walls_net_m2} m² |
| Metodă | ${a.useful_recalc_a1.method} |

## POT / amprentă

| Mărime | Valoare |
|--------|---------|
| Anvelopă | 682,6 × 861,3 cm |
| Amprentă casă | **${a.envelope_gross_m2} m²** |
| Înainte A2 | ${a.envelope_before_A2_m2 ?? 58.48} m² |
| Δ A2 | +${((a.envelope_gross_m2 || 0) - (a.envelope_before_A2_m2 || 58.48)).toFixed(4)} m² |
| Terasă neacoperită (exclusă POT) | ${a.pot.uncovered_terrace_m2} m² |
| **POT pe 147 m²** | **${a.pot.pot_pct_147}%** (${a.pot.pot_on_147}) |
| POT pe 172 m² (acte) | ${a.pot.pot_pct_172}% |
| CUT P+E pe 147 | ${a.pot.cut_on_147_PxE} |
| C1 existent | 76 m² → POT 147 = 51,7% |
| Vs C1 | **−${(-a.pot.delta_vs_C1_m2).toFixed(2)} m²** (mai mic decât existentul) |

## Verdict

- Față de **casa existentă (76 m²)** — **da, încape mai bine** (−17,2 m² amprentă).
- Față de **plafonul legal POT** — **nu știm încă** (lipsește CU/RLU). Pe 147 suntem la **~40%**. Dacă RLU cere ≤35%, **nu** ne încadrăm fără micșorare; dacă permite ≥40%, ok.
- Utilul a scăzut doar **~0,10 m²** din A8 (baie), nu din A2 (A2 e spre exterior).
`;

fs.writeFileSync(path.join(ROOT, "outputs/reports/v47_pot_util_assemblies.md"), report);
console.log(
  JSON.stringify(
    {
      useful_m2: a.useful_geometric_m2,
      useful_delta: a.useful_delta_vs_before_A8_m2,
      footprint: a.envelope_gross_m2,
      pot_pct_147: a.pot.pot_pct_147,
      pot_pct_172: a.pot.pot_pct_172,
      vs_C1_m2: a.pot.delta_vs_C1_m2,
      report: "outputs/reports/v47_pot_util_assemblies.md",
    },
    null,
    2
  )
);
