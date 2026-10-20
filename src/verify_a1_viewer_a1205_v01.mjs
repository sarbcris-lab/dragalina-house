/**
 * Verificare statică A1.205 — date + invariante viewer (fără WebGL).
 * node src/verify_a1_viewer_a1205_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(root, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(root, rel));

const checks = [];
function ok(id, pass, detail) {
  checks.push({ id, pass: !!pass, detail: detail || "" });
}

const vol = JSON.parse(read("viewer/data/volume_a1.json"));
const meshes = vol.meshes || [];
const viewer = read("viewer/index.html");
const plansIdx = read("outputs/plans/index.html");

// —— Layers
const noLayer = meshes.filter((m) => !m.site_layer || m.site_layer === "necunoscut");
ok("site_layer_complete", noLayer.length === 0, `${noLayer.length} fără site_layer`);
const noLevel = meshes.filter((m) => !m.level);
ok("level_tagged", noLevel.length < meshes.length * 0.05, `${noLevel.length}/${meshes.length} fără level`);

// —— Basement floors classified
const basFloors = meshes.filter((m) => (m.id || "").startsWith("subsol_pardoseala"));
ok("basement_floors_exist", basFloors.length > 0, `${basFloors.length} pardoseli beci`);
ok(
  "basement_floors_level",
  basFloors.every((m) => m.level === "subsol"),
  basFloors.filter((m) => m.level !== "subsol").map((m) => m.id).join(", ") || "all subsol"
);

// —— Viewer buttons / modes
for (const needle of [
  "btnRoofTimber",
  "btnRoofAttic",
  "acoperis_sarpanta",
  "acoperis_pod",
  "rowStructFilters",
  "structFilter",
  "btnProprietate",
  "btnSubsolAcces",
  "section_cap",
  "isBasementAccessId",
]) {
  ok(`viewer_has_${needle}`, viewer.includes(needle), needle);
}

// —— Plans page UX
ok("plans_fit", plansIdx.includes("btnFit") && plansIdx.includes("Încadrează"), "Încadrează");
ok("plans_pan_zoom", plansIdx.includes("wheel") && plansIdx.includes("pointerdown"), "pan/zoom");
ok("plans_fundatii_tab", plansIdx.includes("a1_plan_situatie_fundatii.svg"), "tab fundații");
ok("plans_compact", !plansIdx.includes("max-height: min(78vh"), "fără frame vechi scroll-in-scroll");

// —— Situation SVGs
ok("situatie_arch", exists("outputs/plans/a1_plan_situatie.svg"));
ok("situatie_fund", exists("outputs/plans/a1_plan_situatie_fundatii.svg"));
const sit = read("outputs/plans/a1_plan_situatie.svg");
ok("situatie_north_corner", /id="north"/.test(sit) || sit.includes(">N</text>"), "nord prezent");
ok("situatie_scale_bar", sit.includes("5 m"), "scară 5 m");
ok("situatie_setback_line", sit.includes("#c62828"), "linii retrageri");

// —— Plan labels
const parter = read("outputs/plans/a1_plan_parter.svg");
ok("chairs_rotated", parter.includes("rotate(45)"), "scaune rotite");
ok("terrace_not_util", /terasă \(nu util\)/.test(parter), "terasă ≠ util");
const subsol = read("outputs/plans/a1_plan_subsol.svg");
ok("door_vs_stair_clear", subsol.includes("gol ușă") && subsol.includes("clear scară"), "gol ≠ clear");

// —— Roof meshes
const timber = meshes.filter((m) => /acoperis_caprior_|acoperis_coama_|acoperis_solbanc_/.test(m.id));
const shell = meshes.filter((m) => /acoperis_apa_|acoperis_fronton_|pv_/.test(m.id));
ok("roof_timber", timber.length >= 4, `${timber.length} elemente șarpantă`);
ok("roof_shell", shell.length >= 2, `${shell.length} învelitoare/PV`);

const passed = checks.filter((c) => c.pass).length;
const failed = checks.filter((c) => !c.pass);

const md = `# S1 A1 — Verificare viewer/planuri A1.205

**Status:** verificare **statică** (cod + JSON + SVG) · capturi WebGL = checklist manuală mai jos  
**Rezultat:** **${passed}/${checks.length}** OK${failed.length ? ` · **${failed.length} FAIL**` : ""}

## Checks automate

| ID | OK | Detaliu |
|----|----|---------|
${checks.map((c) => `| \`${c.id}\` | ${c.pass ? "PASS" : "**FAIL**"} | ${c.detail || "—"} |`).join("\n")}

## Checklist manuală (desktop + telefon)

Pentru fiecare view: captură full · elemente obligatorii prezente · străine absente · 2–3 cote pe select.

| # | View / combinație | Desktop | Mobil | Note |
|---|-------------------|---------|-------|------|
| 1 | Casă | ☐ | ☐ | fără gard/teren |
| 2 | Proprietate | ☐ | ☐ | sit + porți |
| 3 | Parter + Plan orto | ☐ | ☐ | rămâne parter |
| 4 | Etaj | ☐ | ☐ | fără șarpantă |
| 5 | Subsol · Camere | ☐ | ☐ | pardoseli vizibile |
| 6 | Subsol · Acces | ☐ | ☐ | put/scară dominante |
| 7 | Structură + filtre categorii | ☐ | ☐ | toggle stâlpi/grinzi |
| 8 | + Pereți | ☐ | ☐ | zid semi-transparent |
| 9 | Acoperiș · Exterior | ☐ | ☐ | PV + țiglă |
| 10 | Acoperiș · Șarpantă | ☐ | ☐ | fără învelitoare |
| 11 | Acoperiș · Pod (+S3) | ☐ | ☐ | tăiere ⊥ |
| 12 | Împrejmuire | ☐ | ☐ | hotar ≠ gard |
| 13 | Curte | ☐ | ☐ | auto/alee/puț |
| 14 | S1 / S2 / S3 + cap | ☐ | ☐ | față umplută |
| 15 | Secțiune → alt nivel | ☐ | ☐ | coerență |
| 16 | Planuri: Încadrează / zoom | ☐ | ☐ | /outputs/plans/ |
| 17 | Situație + Fundații | ☐ | ☐ | retrageri cotate |

## Cum rulezi

\`\`\`
node src/verify_a1_viewer_a1205_v01.mjs
\`\`\`
`;

fs.writeFileSync(path.join(root, "outputs/reports/s1_a1_viewer_a1205_verify_v01.md"), md);
console.log(JSON.stringify({ ok: failed.length === 0, passed, total: checks.length, failed: failed.map((f) => f.id) }, null, 2));
