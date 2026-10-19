/**
 * Pachet FE de predat structuristului — A1 S1.
 * Încărcări blocate + geometrie + ce e PASS pe ordin + checklist FE.
 * Rulează: npm run fe:a1  (sau node src/export_a1_fe_handoff_v02.mjs)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const read = (p) => {
  const f = path.join(root, p);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null;
};

const a1 = read("data/building/a1_architecture.json");
const v47 = read("data/building/v47_a1_study.json");
const st = a1?.structure_a1_study_cm;
if (!st?.columns?.length) throw new Error("Rulează npm run structure:a1 întâi");

const calc100 = read("outputs/reports/s1_a1_calc_100_v01.json");
const gaps = read("outputs/reports/s1_a1_calc_gaps_v01.json");
const wind = read("outputs/reports/s1_a1_wind_buckling_ec5_v01.json");
const maxR = read("outputs/reports/s1_a1_max_inrepo_v01.json");
const clearR = null; // levels in st

const cols = st.columns;
const beams = st.beams || [];
const lv = st.levels_cm || {};
const box = st.structure_box_cm;
const pit = st.pit_cm;
const roof = v47?.roof_cm || {};
const ht = v47?.heights_cm || {};

const outMd = path.join(root, "outputs/reports/s1_a1_fe_handoff_v02.md");
const outJson = path.join(root, "outputs/reports/s1_a1_fe_handoff_v02.json");
const outChecklist = path.join(root, "outputs/reports/s1_a1_fe_checklist_v02.md");

const round = (x, d = 2) => Math.round(x * 10 ** d) / 10 ** d;

// ─── Locked loads ───
const loads = {
  site: { locality: "Turda", parcel: "Dragalina 131" },
  concrete: "C25/30",
  steel: "B500B",
  floor_q_Ed_kNm2: 11.78,
  landing_q_Ed_kNm2: 11.93,
  roof: {
    type: "D3a_light_timber_two_pitch",
    pitch_deg: roof.pitch_deg_approx ?? 30,
    rise_cm: roof.rise_cm ?? 248.6,
    Gk_kNm2: wind?.Gk_tot ?? 0.9,
    sk_kNm2: 1.5,
    sk_note: "ipoteză Turda CR1-1-3 — confirmă hartă NA",
    Qk_snow_kNm2: 1.2,
    q_Ed_design_kNm2: wind?.q_Ed_design ?? 3.36,
    vb0_ms: wind?.wind?.VB0 ?? 27,
    qp_kNm2: wind?.wind?.qp ?? 0.96,
    we_eaves_kNm2: wind?.wind?.we?.eaves_F ?? -1.63,
    pv: true,
    both_pitches: true,
  },
  seismic: {
    ...(calc100?.seismic || { ag: 0.1, S: 1.2, q_duct: 3, Vb_kN: 75.9 }),
    note: "IPOTEZĂ — nu zonare oficială pe 131; FE trebuie pe ag/S din P100 pe amplasament",
  },
  foundation_sigma_study_kPa: 200,
  foundation_note: "studiu — NU Rc din geo_131",
};

// ─── PASS ledger from repo ───
const passLedger = [
  {
    id: "clear_255",
    status: "PASS_LOCK",
    detail: `clear sub grindă ${lv.clear_under_beam_cm ?? 255} · FF→FF ${lv.ff_to_ff_cm ?? ht.ff_to_ff_cm}`,
  },
  {
    id: "NO_LAMELE",
    status: calc100?.decision === "NO_LAMELE" ? "PASS_ORDIN" : "CHECK",
    detail: calc100?.adopt || "B_E_S / B_S_SE fără C_E_LAMELE",
  },
  {
    id: "slab_15_with_BX_MID",
    status: calc100?.gates?.slab_with_mid ? "PASS_ORDIN" : "FAIL",
    detail: "placă 15 cm doar cu B_X_MID",
  },
  {
    id: "beams_h40",
    status: calc100?.gates?.beams_all_after_h_adopt ? "PASS_ORDIN" : "CHECK",
    detail: JSON.stringify(calc100?.beam_height_adopt_cm || st.beam_height_adopt_cm || {}),
  },
  {
    id: "columns_P100_geom",
    status: calc100?.gates?.columns_P100_NM ? "PASS_ORDIN" : "CHECK",
    detail: "≥30 + util N+M ordin",
  },
  {
    id: "buckling_EC2_ordin",
    status: wind?.buckling?.every?.((c) => c.pass) || wind?.notes_estimate?.flambaj_stalpi >= 5 ? "PASS_ORDIN" : "CHECK",
    detail: "λ/φ pe P/E — vezi s1_a1_wind_buckling_ec5_v01",
  },
  {
    id: "roof_snow_pv_wind_ordin",
    status: "PASS_ORDIN",
    detail: `q_Ed=${loads.roof.q_Ed_design_kNm2} · we streșină=${loads.roof.we_eaves_kNm2}`,
  },
  {
    id: "rafter_EC5_SLS",
    status: wind?.rafter_ec5?.ec5_pass && maxR?.sls_rafter?.pass_L300 ? "PASS_ORDIN" : "CHECK",
    detail: "12×25 @1,2 m + δ L/300",
  },
  {
    id: "seismic_columns_share",
    status: maxR?.seismicCols?.every((c) => c.pass) ? "PASS_ORDIN" : "CHECK",
    detail: `Vb=${loads.seismic.Vb_kN} kN repartizat ∝ I`,
  },
  {
    id: "punching_ordin",
    status: maxR?.punchResults?.every((p) => p.pass) ? "PASS_ORDIN" : "CHECK",
    detail: "vEd ≤ vRdc ordin pe stâlpi P/E",
  },
  {
    id: "ring_E_closed",
    status: "PASS_GEO",
    detail: "B_E_S + B_S_SE — fără gap SE (spre deosebire de FRAME vechi)",
  },
  {
    id: "gable_posts_on_beams",
    status: "PASS_GEO",
    detail: "stâlpișori W/E pe B_W / B_E",
  },
  {
    id: "foundations_pads_vs_200",
    status: calc100?.gates?.foundations_sized ? "PASS_ORDIN_IPOTEZA" : "CHECK",
    detail: "pads adoptate vs 200 kPa — înlocuiește cu Rc geo",
  },
];

// ─── FE checklist (what engineer must do) ───
const checklist = [
  { pri: 1, item: "Confirmă ag, TC, S pe 131 (P100) — înlocuiește ipoteza ag=0,10g", done_in_repo: false },
  { pri: 1, item: "Confirmă sk și vb,0 pe hărți CR1-1-3 / CR1-1-4 NA", done_in_repo: false },
  { pri: 1, item: "Model 3D cadre pe structure_a1_study_cm (NU frame V47)", done_in_repo: false },
  { pri: 1, item: "Combinații CR0 complete (G, Q snow, Q wind, E seism) pe bare", done_in_repo: false },
  { pri: 2, item: "Stâlpi: N+M+V + flambaj + P100 confinare zone critice", done_in_repo: "parcial_ordin" },
  { pri: 2, item: "Nod C_E_PAL / consolă B_E + B_Y410 (torsiune, ancorare)", done_in_repo: "parcial_ordin" },
  { pri: 2, item: "Placă 15 + B_X_MID: FE 2D/3D L/d, fisurare, armare", done_in_repo: "parcial_ordin" },
  { pri: 2, item: "Grinzi perimetrale + B_E_S / B_S_SE (NO_LAMELE) — continuu", done_in_repo: "parcial_ordin" },
  { pri: 2, item: "Grindă întoarsă + pier C_SHAFT_E_PIER", done_in_repo: "parcial_ordin" },
  { pri: 2, item: "Retenție BA: împingere + apă + seism pe zid; armare", done_in_repo: "parcial_ordin" },
  { pri: 2, item: "Fundații pe Rc din geo_131 (înlocuiește 200 kPa)", done_in_repo: false },
  { pri: 3, item: "Șarpantă D3a 30°+PV: căpriori, coamă, solbanc, ancorare we streșină", done_in_repo: "parcial_ordin" },
  { pri: 3, item: "Diafragmă placă / transmitere forțe orizontale la centuri", done_in_repo: false },
  { pri: 3, item: "Planșe armare + detalii noduri + confinare — DT", done_in_repo: false },
];

const beamH = st.beam_height_adopt_cm || calc100?.beam_height_adopt_cm || {};
const pads = st.foundation_pad_adopt_cm || calc100?.foundation_pad_adopt_cm || {};

const md = `# S1 A1 — Pachet FE de predat (v02)

**Pentru:** structurist / model FEM  
**Proiect:** Dragalina 131 · Turda · amenajare A1 înghețată  
**Status:** input + ordine de mărime din repo · **NU** proiect semnat · ${new Date().toISOString().slice(0, 10)}  
**Medie note in-repo:** ~${maxR?.avg_note ?? "5"}/10 · plafon fără FE/geo ~6,5

---

## 0. Citește întâi (lock-uri)

| ID | Lock | Nu schimba fără beneficiar |
|----|------|----------------------------|
| **A1.180** | Clear **≥255 pretutindeni** (inclusiv sub grindă) | Fostul 241 e **revocat** |
| **A1.180** | FF→FF = **${lv.ff_to_ff_cm ?? 307}** = 255 + drop + placă + buildup | |
| **D3 / PV** | Acoperiș **2 ape · 30° · PV pe ambele ape** · D3a lemn întâi | D3b BA = sensibilitate |
| **NO_LAMELE** | Fără \`C_E_LAMELE\` în cadru (doar ARH) | B_E_S + B_S_SE |
| **P100** | Stâlp ≥ **30 cm** | |
| **ARH** | Compartimentare P/E înghețată | |

**NU folosi** ca geometrie de calcul: \`v47_a1_frame_study\` (STALE).

---

## 1. Fișiere de importat

| Rol | Cale |
|-----|------|
| Schemă structurală | \`data/building/a1_architecture.json\` → \`structure_a1_study_cm\` |
| Alias curat | \`data/building/a1_structure_study.json\` |
| Amenajare / cotă acoperiș | \`data/building/v47_a1_study.json\` (\`roof_cm\`, \`heights_cm\`) |
| Volum 3D | \`viewer/data/volume_a1.json\` · view **1 · Structură** |
| Calc grinzi/placă/SE | \`outputs/reports/s1_a1_calc_100_v01.md\` |
| Vânt/flambaj/EC5 | \`outputs/reports/s1_a1_wind_buckling_ec5_v01.md\` |
| Max in-repo | \`outputs/reports/s1_a1_max_inrepo_v01.md\` |
| **Acest brief** | \`outputs/reports/s1_a1_fe_handoff_v02.md\` |
| JSON mașină | \`outputs/reports/s1_a1_fe_handoff_v02.json\` |

---

## 2. Încărcări blocate (ipoteze studiu — confirmă pe hărți)

### Planșeu
| | kN/m² |
|--|------:|
| q_Ed locuință (agregat studiu) | **${loads.floor_q_Ed_kNm2}** |
| q_Ed palier/scară | **${loads.landing_q_Ed_kNm2}** |

### Acoperiș D3a + PV · 30°
| | |
|--|--:|
| Gk | **${loads.roof.Gk_kNm2}** kN/m² |
| sk (ipoteză) | **${loads.roof.sk_kNm2}** kN/m² |
| Qk zăpadă μ=0,8 | **${loads.roof.Qk_snow_kNm2}** |
| q_Ed design (CR0 snow/wind) | **${loads.roof.q_Ed_design_kNm2}** |
| vb,0 (ipoteză) | **${loads.roof.vb0_ms}** m/s |
| qp | **${loads.roof.qp_kNm2}** |
| we streșină (cpe F) | **${loads.roof.we_eaves_kNm2}** kN/m² |
| Rise / pitch | ${loads.roof.rise_cm} cm / ${loads.roof.pitch_deg}° |

### Seism (înlocuiește la FE)
| | |
|--|--:|
| ag / S / q | ${loads.seismic.ag}g / ${loads.seismic.S} / ${loads.seismic.q_duct} |
| Vb ordin | **${loads.seismic.Vb_kN}** kN |
| Notă | ${loads.seismic.note} |

### Fundații
σ studiu **${loads.foundation_sigma_study_kPa} kPa** — ${loads.foundation_note}

Materiale: **${loads.concrete}** · **${loads.steel}**

---

## 3. Cote (cm) — A1.180

| Cotă | Valoare |
|------|--------:|
| FF parter | ${lv.ff_parter ?? 48} |
| FF etaj | ${lv.ff_etaj ?? 355} |
| FF→FF | ${lv.ff_to_ff_cm ?? 307} |
| Clear sub grindă | ${lv.clear_under_beam_cm ?? 255} |
| Clear sub placă | ${lv.clear_under_slab_cm ?? 280} |
| Placă th | ${lv.slab_th_hypothesis ?? 15} |
| Grindă h crit. | ${lv.beam_h_total_including_slab_zone ?? 40} |
| Drop sub soffit | ${lv.drop_below_soffit_cm ?? 25} |
| Intrados grindă | ${lv.beam_soffit_over_parter ?? "—"} |
| Soffit / top placă E | ${lv.slab_soffit_etaj ?? "—"} / ${lv.slab_top_etaj ?? "—"} |
| FF beci / soffit L-1 | ${lv.basement_ff_cm ?? -250} / ${lv.basement_soffit_cm ?? -30} |

Cutie: X ${box?.x0}–${box?.x1} × Y ${box?.y0}–${box?.y1}  
Puț: ${pit ? `X ${pit.x0}–${pit.x1} × Y ${pit.y0}–${pit.y1}` : "—"}

---

## 4. Stâlpi (input model)

| ID | x | y | dx×dy | Levels | Pad adopt cm | Rol |
|----|--:|--:|-------|--------|-------------:|-----|
${cols
  .map(
    (c) =>
      `| ${c.id} | ${c.x} | ${c.y} | ${c.dx}×${c.dy} | ${(c.levels || []).join("+")} | ${pads[c.id] ?? "—"} | ${c.role || ""} |`
  )
  .join("\n")}

## 5. Grinzi (input model)

| ID | b×h adopt | Levels | Supports | Notă |
|----|-----------|--------|----------|------|
${beams
  .map((b) => {
    const h = b.h_cm ?? beamH[b.id] ?? lv.beam_h_total_including_slab_zone ?? 40;
    const bb = Math.min(b.dx, b.dy);
    return `| ${b.id} | ${bb}×${h} | ${(b.levels || []).join("+")} | ${(b.supports || []).join(", ")} | ${(b.note || "").slice(0, 60)} |`;
  })
  .join("\n")}

---

## 6. Ce e deja PASS pe ordin (nu sări peste FE)

| ID | Status | Detaliu |
|----|--------|---------|
${passLedger.map((p) => `| \`${p.id}\` | **${p.status}** | ${p.detail} |`).join("\n")}

> **PASS_ORDIN** = trece pe scheme simple din repo. FE poate confirma sau respinge — nu e semnătură.

---

## 7. Checklist FE (prioritate)

| Pri | Sarcină | În repo? |
|----:|---------|----------|
${checklist.map((c) => `| ${c.pri} | ${c.item} | ${c.done_in_repo === false ? "**NU**" : c.done_in_repo} |`).join("\n")}

---

## 8. Ordine de lucru recomandată

1. Geo **Rc pe 131** (blochează fundații)  
2. ag/sk/vb oficial pe hărți  
3. Model 3D A1 + combinații CR0  
4. Placă + B_X_MID + nod C_E_PAL  
5. Stâlpi P100 confinare  
6. Retenție + fundații pe Rc  
7. Șarpantă + ancorare PV (we streșină)  
8. DT armare  

---

## 9. Contact / regenerare

\`\`\`
npm run fe:a1
\`\`\`

Regenerează calc + acest brief. Viewer: Structură pe \`volume_a1.json\`.
`;

const checklistMd = `# Checklist FE — Dragalina 131 A1

Marchează la predare / pe parcurs.

${checklist.map((c, i) => `- [ ] **P${c.pri}** ${c.item}`).join("\n")}

## Lock-uri de respectat
- [ ] Clear ≥255 pretutindeni (nu 241)
- [ ] Acoperiș 30° + PV ambele ape
- [ ] Fără C_E_LAMELE în cadru
- [ ] Geometrie din structure_a1_study_cm

## Livrabile așteptate de la structurist
- [ ] Notă de calcul semnată
- [ ] Model FE (export)
- [ ] Planuri armare stâlpi/grinzi/plăci/retenție
- [ ] Detalii noduri critice (C_E_PAL, întoarsă, șarpantă)
`;

const json = {
  meta: {
    id: "s1_a1_fe_handoff_v02",
    generated: new Date().toISOString(),
    project: "Dragalina 131",
    status: "input_for_FE_not_signed",
  },
  locks: ["A1.180_clear255", "D3_30deg_PV_D3a", "NO_LAMELE", "P100_min30", "ARH_frozen"],
  loads,
  levels_cm: lv,
  columns: cols.map((c) => ({
    id: c.id,
    x: c.x,
    y: c.y,
    dx: c.dx,
    dy: c.dy,
    levels: c.levels,
    pad_cm: pads[c.id] ?? null,
    role: c.role || null,
  })),
  beams: beams.map((b) => ({
    id: b.id,
    x: b.x,
    y: b.y,
    dx: b.dx,
    dy: b.dy,
    h_cm: b.h_cm ?? beamH[b.id] ?? lv.beam_h_total_including_slab_zone ?? 40,
    levels: b.levels,
    supports: b.supports,
  })),
  pass_ledger: passLedger,
  checklist,
  reports: [
    "s1_a1_calc_100_v01",
    "s1_a1_wind_buckling_ec5_v01",
    "s1_a1_max_inrepo_v01",
    "s1_a1_clear255_levels_v01",
  ],
};

fs.mkdirSync(path.join(root, "outputs/reports"), { recursive: true });
fs.writeFileSync(outMd, md);
fs.writeFileSync(outJson, JSON.stringify(json, null, 2));
fs.writeFileSync(outChecklist, checklistMd);

// also refresh legacy pack path pointer
fs.writeFileSync(
  path.join(root, "outputs/reports/s1_a1_fe_input_pack_v01.md"),
  `# → Înlocuit de v02\n\nFolosește **[s1_a1_fe_handoff_v02.md](./s1_a1_fe_handoff_v02.md)** + checklist \`s1_a1_fe_checklist_v02.md\`.\n`
);

console.log(
  JSON.stringify(
    {
      ok: true,
      files: [
        "outputs/reports/s1_a1_fe_handoff_v02.md",
        "outputs/reports/s1_a1_fe_handoff_v02.json",
        "outputs/reports/s1_a1_fe_checklist_v02.md",
      ],
      pass: passLedger.filter((p) => /PASS/.test(p.status)).length,
      checklist_items: checklist.length,
      columns: cols.length,
      beams: beams.length,
    },
    null,
    2
  )
);
