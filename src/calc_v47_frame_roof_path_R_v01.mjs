/**
 * D3a load path geo pe varianta R — ce reazemă pe ce.
 * Rulează: node src/calc_v47_frame_roof_path_R_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const study = JSON.parse(fs.readFileSync(path.join(root, "data/building/v47_a1_frame_study.json"), "utf8"));
const fr = study.structure_frame_study_cm;
const outMd = path.join(root, "outputs/reports/v47_a1_frame_roof_path_R_v01.md");
const outJson = path.join(root, "outputs/reports/v47_a1_frame_roof_path_R_v01.json");

const perimeterBeams = (fr.beams || []).filter((b) =>
  ["B_N", "B_W", "B_E", "B_Y645", "B_Y830", "B_CASA_SCARA"].includes(b.id)
);
const roofBeams = (fr.beams || []).filter((b) => (b.levels || []).includes("E"));
const colsTop = (fr.columns || []).filter((c) => (c.levels || []).includes("E"));

const pathRows = [
  {
    from: "învelitoare / căpriori (D3a)",
    to: "centuri perimetrale E (B_N, B_W, B_E, B_Y645…)",
    status: "geo_OK_ipoteză",
    note: "mesh acoperiș există; încărcare pe streșină → grinzi E",
  },
  {
    from: "stâlpișori fronton",
    to: "grinzi @ +581 (contact parțial)",
    status: "geo_partial",
    note: "audit: contact OK geometric; capacitate/excentricitate = FE",
  },
  {
    from: "centuri E",
    to: "stâlpi S–P–E",
    status: "geo_OK",
    note: `${colsTop.length} stâlpi cu nivel E`,
  },
  {
    from: "B_BAND_X320",
    to: "stâlpi (N_MID, S_DORM_E)",
    status: "geo_OK_studiu",
    note: "planșeu E; fără Y400 (dorm LOCK); nu primar pentru acoperiș",
  },
  {
    from: "D3b placă BA acoperiș",
    to: "aceleași stâlpi (+ΔW ~172 kN)",
    status: "sensibilitate",
    note: "nu modelat ca mesh separat acum — FE sensibilitate",
  },
];

const gaps = [
  "Capacitate stâlpișori + excentricitate pe streșină",
  "Detaliu ancorare șarpantă la centură (seism)",
  "Zapadă locală / combinații CR pe acoperiș",
  "D3b doar ca sensibilitate — nu adoptat",
];

const result = {
  prefer: "D3a",
  perimeter_beams_E: perimeterBeams.map((b) => b.id),
  beams_with_E: roofBeams.map((b) => b.id),
  columns_E: colsTop.map((c) => c.id),
  pathRows,
  gaps,
  verdict:
    "Traseul D3a e închis geometric pe cadre (centuri→stâlpi). Rămâne FE pe stâlpișori/ancorare — nu blochează restul R.",
};

const md = `# Varianta R — traseu încărcare acoperiș D3a (geo)

**Status:** verificare geometrică · **NU** FE  
**Preferință:** D3a șarpantă ușoară (D3b = sensibilitate)

## Lanț

| De la | La | Status | Notă |
|-------|-----|--------|------|
${pathRows.map((r) => `| ${r.from} | ${r.to} | ${r.status} | ${r.note} |`).join("\n")}

## Elemente E în model

- Centuri/grinzi cu E: ${roofBeams.map((b) => b.id).join(", ")}
- Stâlpi cu E: ${colsTop.map((c) => c.id).join(", ")}

## Goluri calc

${gaps.map((g) => `- ${g}`).join("\n")}

## Verdict

${result.verdict}

JSON: \`outputs/reports/v47_a1_frame_roof_path_R_v01.json\`
`;

fs.writeFileSync(outMd, md);
fs.writeFileSync(outJson, JSON.stringify(result, null, 2));
console.log(JSON.stringify({ ok: true, nBeamsE: roofBeams.length, nColsE: colsTop.length }, null, 2));
