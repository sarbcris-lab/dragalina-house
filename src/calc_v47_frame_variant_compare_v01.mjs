/**
 * Comparație variante studiu — scor pe brief (nu FE).
 * Rulează: node src/calc_v47_frame_variant_compare_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outMd = path.join(root, "outputs/reports/v47_a1_frame_variant_compare_v01.md");
const outJson = path.join(root, "outputs/reports/v47_a1_frame_variant_compare_v01.json");

const variants = [
  {
    id: "R",
    name: "A + placă15 + B_BAND_X320 + D3a",
    clear: 255,
    util: 37.469,
    slab_sls: "OK_ordin",
    facade_concrete: "pilastri A1/A2",
    calc_risk: "mediu",
    score: 9,
    pick: true,
  },
  {
    id: "1",
    name: "A + placă15 fără bandă",
    clear: 255,
    util: 37.469,
    slab_sls: "FAIL_ordin",
    facade_concrete: "pilastri",
    calc_risk: "ridicat_placa",
    score: 4,
    pick: false,
  },
  {
    id: "2",
    name: "A + placă20 fără bandă",
    clear: 250,
    util: 37.469,
    slab_sls: "marginal",
    facade_concrete: "pilastri",
    calc_risk: "mediu",
    score: 5,
    pick: false,
  },
  {
    id: "3",
    name: "A + placă28",
    clear: 242,
    util: 37.469,
    slab_sls: "OK_ordin",
    facade_concrete: "pilastri",
    calc_risk: "scazut_placa",
    score: 3,
    pick: false,
  },
  {
    id: "4",
    name: "A fără C_N_MID (cu bandă)",
    clear: 255,
    util: 37.469,
    slab_sls: "bandă fără reazem N",
    facade_concrete: "mai puțin pe N",
    calc_risk: "ridicat",
    score: 2,
    pick: false,
  },
  {
    id: "5",
    name: "Along toți → 30×30 acum",
    clear: 255,
    util: 37.469,
    slab_sls: "depinde bandă",
    facade_concrete: "mai puțin",
    calc_risk: "prematur_seism",
    score: 6,
    pick: false,
  },
  {
    id: "6",
    name: "Varianta B diafragme",
    clear: 255,
    util: "necunoscut",
    slab_sls: "alt sistem",
    facade_concrete: "posibil mai curat",
    calc_risk: "studiu_nou",
    score: null,
    pick: false,
  },
];

const result = {
  recommended_id: "R",
  note: "Optimă pe brief studiu — NU validată FE/P100",
  variants,
};

const rows = variants
  .map(
    (v) =>
      `| ${v.pick ? "**" + v.id + "**" : v.id} | ${v.name} | ${v.clear} | ${v.util} | ${v.slab_sls} | ${v.score ?? "—"} | ${v.pick ? "**DA**" : "nu"} |`
  )
  .join("\n");

const md = `# Comparație variante FRAME — studiu

**Recomandat:** **R** = cadre A + placă 15 + \`B_BAND_X320\` + acoperiș D3a  
**Nu e:** optim FE semnat

| ID | Variantă | Clear | Util | SLS placă ordin | Scor | Pick |
|----|----------|------:|-----:|-----------------|-----:|:----:|
${rows}

Detaliu: \`decisions/frame_recommended_variant_v01.md\`
`;

fs.writeFileSync(outMd, md);
fs.writeFileSync(outJson, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ ok: true, recommended: "R", outMd }, null, 2));
