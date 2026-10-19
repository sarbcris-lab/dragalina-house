/**
 * Fundații A1 pe ipoteză teren similar Dragalina 120 (EMDI / memoriu PTH).
 * Rol: studiu de rezistență în repo — NU proiect semnat / NU înlocuiește geo 131.
 *
 * Rulează: node src/calc_a1_foundations_geo120_v01.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const a1p = path.join(root, "data/building/a1_architecture.json");
const a1 = JSON.parse(fs.readFileSync(a1p, "utf8"));
const st = a1.structure_a1_study_cm;
const calc100 = JSON.parse(
  fs.readFileSync(path.join(root, "outputs/reports/s1_a1_calc_100_v01.json"), "utf8")
);

const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

/** Lock geo-studiu din vecinătatea 120 */
const geo = {
  status: "IPOTEZA_STUDIO_120_NU_GEO_131",
  source: "Memoriu structură Dragalina 120 + EMDI Turda 2012 (citat)",
  Pconv_120_kPa: 310,
  D_fund_recom_m: 1.15,
  frost_m: 0.9,
  water_2012: "neîntâlnită — nu elimina hidro pe 131",
  /** Rc de calcul studiu = Pconv/γ; γ=1,4 → ~221 */
  gamma_Rc: 1.4,
  q_allow_kPa: round(310 / 1.4, 0), // 221
  q_allow_note: "310/1,4 — studiu; FE/geo 131 poate micșora",
  strip_under_retaining_cm: 80,
  strip_under_beam_cm: 60,
  stem_note: "elevație = retenție coborâtă pe talpă (zFg1→soffit); fără gol orizontal",
  disclaimer:
    "Studiu AI / ordin — nu semnatură OIS/structurist. De înlocuit cu geo 131 + PT semnat.",
};

const q_allow = geo.q_allow_kPa;

const pads = (calc100.columns || [])
  .filter((c) => c.id !== "C_SHAFT_E_PIER" || true)
  .map((c) => {
    const col = (st.columns || []).find((x) => x.id === c.id);
    if (!col) return null;
    if (!(col.levels || []).some((l) => l === "S" || l === "P")) return null;
    const N = c.N_kN ?? 200;
    const sideMin = Math.ceil((Math.sqrt(N / q_allow) * 100) / 5) * 5;
    const side = Math.max(80, sideMin);
    const sigma = N / (side / 100) ** 2;
    return {
      id: c.id,
      N_kN: N,
      pad_cm: side,
      sigma_kPa: round(sigma, 0),
      pass: sigma <= q_allow + 1,
      vs_old_200: side,
    };
  })
  .filter(Boolean);

const padAdopt = Object.fromEntries(pads.map((p) => [p.id, p.pad_cm]));

/** Încărcare ordin pe ml retenție: împingere + greutate zid + reacție placă fracție */
const H_ret = 2.5;
const N_wall_kN_m = 25 * 0.3 * H_ret + 22.7; // greutate ~ + Pa ordin pe ml
const stripW = geo.strip_under_retaining_cm;
const sigma_strip = N_wall_kN_m / (stripW / 100);
const stripPass = sigma_strip <= q_allow;

const retainingWalls = (a1.basement_cm?.walls || []).filter(
  (w) => w.role === "retaining" || w.role === "stair_pit"
);

const foundations_lock = {
  ...geo,
  generated: new Date().toISOString(),
  pads,
  pad_adopt_cm: padAdopt,
  perimeter_strip: {
    width_cm: stripW,
    N_ordin_kN_m: round(N_wall_kN_m, 1),
    sigma_kPa: round(sigma_strip, 0),
    pass: stripPass,
    walls: retainingWalls.map((w) => w.id),
  },
  beam_strip_cm: geo.strip_under_beam_cm,
};

// Scrie în structure_a1_study_cm
st.foundations_study_cm = {
  ...(st.foundations_study_cm || {}),
  pad_side_cm: Math.max(...pads.map((p) => p.pad_cm), 80),
  strip_width_cm: geo.strip_under_beam_cm,
  perimeter_strip_width_cm: stripW,
  east_eccentric_inward: true,
  status: "ipoteza_geo120_studiu",
  q_allow_kPa: q_allow,
  Pconv_ref_120_kPa: 310,
  note: "Pad-uri vs q_allow=310/1,4; talpă perimetru 80 sub retenție; geo_131 încă deschis",
  pad_by_column_cm: padAdopt,
};
st.foundation_pad_adopt_cm = padAdopt;
st.geo_lock_v01 = {
  hypothesis: "similar_Dragalina_120",
  q_allow_kPa: q_allow,
  Pconv_120_kPa: 310,
  not_official_geo_131: true,
};

a1.structure_a1_study_cm = st;
fs.writeFileSync(a1p, JSON.stringify(a1, null, 2));
fs.writeFileSync(
  path.join(root, "data/building/a1_structure_study.json"),
  JSON.stringify(st, null, 2)
);

const outMd = path.join(root, "outputs/reports/s1_a1_foundations_geo120_v01.md");
const outJson = path.join(root, "outputs/reports/s1_a1_foundations_geo120_v01.json");
fs.writeFileSync(outJson, JSON.stringify(foundations_lock, null, 2));

const md = `# S1 A1 — Fundații pe ipoteză teren tip Dragalina 120

**Status:** studiu de rezistență în repo · **NU** semnat · **NU** geo 131  
**Rol agent:** continuă dimensionarea ordin până la structurist / geo oficial  
**Generat:** ${foundations_lock.generated.slice(0, 16)}

## Lock geo-studiu

| | |
|--|--:|
| Sursă | Memoriu 120 / EMDI 2012 (citat) |
| Pconv 120 | **${geo.Pconv_120_kPa}** kPa |
| γ | ${geo.gamma_Rc} |
| **q_allow studiu** | **${q_allow}** kPa |
| Adâncime recom. 120 | ${geo.D_fund_recom_m} m (beciul nostru e mai adânc → talpa la ≈−3,10) |
| Apă | ${geo.water_2012} |

> ${geo.disclaimer}

## Pad-uri stâlpi (σ ≤ ${q_allow} kPa)

| ID | N kN | Pad cm | σ kPa | PASS |
|----|-----:|-------:|------:|:----:|
${pads.map((p) => `| ${p.id} | ${p.N_kN} | ${p.pad_cm}×${p.pad_cm} | ${p.sigma_kPa} | **${p.pass}** |`).join("\n")}

## Talpă perimetru retenție

| | |
|--|--:|
| Lățime | **${stripW}** cm |
| N ordin | ${round(N_wall_kN_m, 1)} kN/m |
| σ | ${round(sigma_strip, 0)} kPa |
| PASS | **${stripPass}** |
| Pereți | ${retainingWalls.map((w) => w.id).join(", ")} |

## Elevație

Retenția coboară pe **fața superioară a tălpii** (fără gol orizontal talpă↔zid).  
Mesh: \`subsol_fg_perim_*\` + zid retenție \`z0 = top talpă\`.

## Următor (tot fără structurist extern)

1. ~~Talpă+elevație în 3D~~ (acest pachet + volume:a1)  
2. Sensibilitate q_allow 180 / 221 / 250  
3. Armare min hint elevație / talpă  
4. Când există: **geo 131** înlocuiește acest lock

JSON: \`s1_a1_foundations_geo120_v01.json\`
`;
fs.writeFileSync(outMd, md);

console.log(
  JSON.stringify(
    {
      ok: true,
      q_allow_kPa: q_allow,
      pads: pads.length,
      pad_max: Math.max(...pads.map((p) => p.pad_cm)),
      strip_pass: stripPass,
      sigma_strip: round(sigma_strip, 0),
    },
    null,
    2
  )
);
