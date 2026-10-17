/**
 * B_Y400_BAND_TIE — RETRAS (dorm LOCK). Păstrat ca istoric + checklist R.
 * Rulează: node src/calc_v47_frame_y400_tie_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outMd = path.join(root, "outputs/reports/v47_a1_frame_y400_tie_and_R_status_v01.md");
const outJson = path.join(root, "outputs/reports/v47_a1_frame_y400_tie_and_R_status_v01.json");

const y400 = {
  id: "B_Y400_BAND_TIE",
  status: "RETRAS",
  reason: "beneficiar: în dormitor nu modificăm — grindă @Y400 trecea peste dorm",
  path_was: "C_W_MID → B_BAND_X320 (~X361)",
  replacement: "B_BAND_X320 pe C_N_MID–C_S_DORM_E; FE țintă 2-way (caz B)",
};

const checklist = {
  closed_geo: [
    "cadre A · stâlpi ≥30 flush · ETICS pe stâlp",
    "placă 15 + B_BAND_X320 (fără Y400 — dorm LOCK)",
    "consolă LOCK-1R",
    "retenție BA 20",
    "FG 80+60",
    "pad B_X360 acceptat",
    "util E 37,469",
    "D1/D2",
    "dormitor neatins (fără grindă transversală)",
  ],
  open_calc: [
    "FE placă+bandă 2-way (fără Y400)",
    "FE nod C_E_PAL",
    "P100 stâlpi along→30",
    "grinzi perimetrale pe eforturi FE",
    "împingere retenție + hidro geo 131",
    "Rc fundații 131",
    "D3a vs D3b pe FE",
    "întoarsă capăt V",
  ],
  variant_R: "țintă studiu — dorm LOCK · nu autorizabil",
};

const result = { y400, checklist };

const md = `# B_Y400_BAND_TIE — RETRAS (dorm LOCK)

**Dată:** 2026-10-16 · **status: RETRAS**

## Decizie amenajare

Beneficiar: **în dormitor nu modificăm**.  
\`B_Y400_BAND_TIE\` trecea peste dorm @Y400 → **retras** din schema R.

| | |
|--|--|
| Era | ${y400.path_was} |
| Acum | ${y400.replacement} |

## Checklist variantă R

### Închis geometric
${checklist.closed_geo.map((x) => `- [x] ${x}`).join("\n")}

### Deschis (FE / geo 131)
${checklist.open_calc.map((x) => `- [ ] ${x}`).join("\n")}

**Status:** ${checklist.variant_R}

JSON: \`outputs/reports/v47_a1_frame_y400_tie_and_R_status_v01.json\`
`;

fs.writeFileSync(outMd, md);
fs.writeFileSync(outJson, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ ok: true, status: "RETRAS", dorm_lock: true }, null, 2));
