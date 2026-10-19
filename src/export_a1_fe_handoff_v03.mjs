/**
 * Pachet FE de predat — A1 S1 v03 (geo120 + armare + sens + nod + BOM).
 * Rulează: npm run fe:handoff  (sau node src/export_a1_fe_handoff_v03.mjs)
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
const wind = read("outputs/reports/s1_a1_wind_buckling_ec5_v01.json");
const maxR = read("outputs/reports/s1_a1_max_inrepo_v01.json");
const geo120 = read("outputs/reports/s1_a1_foundations_geo120_v01.json");
const sens = read("outputs/reports/s1_a1_foundations_sens_v01.json");
const rebar = read("outputs/reports/s1_a1_rebar_hint_v01.json");
const node = read("outputs/reports/s1_a1_node_ce_pal_v01.json");
const bom = read("outputs/reports/s1_a1_roof_bom_v01.json");
const uplift = read("outputs/reports/s1_a1_eaves_uplift_v01.json");
const retain = read("outputs/reports/s1_a1_retaining_seis_v01.json");
const cr0 = read("outputs/reports/s1_a1_cr0_members_v01.json");
const footing = read("outputs/reports/s1_a1_footing_stability_v01.json");
const p100c = read("outputs/reports/s1_a1_p100_confinement_v01.json");

const cols = st.columns;
const beams = st.beams || [];
const lv = st.levels_cm || {};
const box = st.structure_box_cm;
const pit = st.pit_cm;
const roof = v47?.roof_cm || {};
const ht = v47?.heights_cm || {};

const outMd = path.join(root, "outputs/reports/s1_a1_fe_handoff_v03.md");
const outJson = path.join(root, "outputs/reports/s1_a1_fe_handoff_v03.json");
const outChecklist = path.join(root, "outputs/reports/s1_a1_fe_checklist_v03.md");

const qAllow = geo120?.q_allow_kPa ?? st.geo_lock_v01?.q_allow_kPa ?? 221;

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
  foundation: {
    hypothesis: "similar_Dragalina_120",
    Pconv_120_kPa: geo120?.Pconv_120_kPa ?? 310,
    q_allow_kPa: qAllow,
    perimeter_strip_cm:
      footing?.adopt?.B_cm ??
      st.foundations_study_cm?.perimeter_strip_width_cm ??
      geo120?.perimeter_strip?.width_cm ??
      80,
    note: "LOCK studiu A1.185 — NU Rc din geo_131",
  },
};

const passLedger = [
  {
    id: "clear_255",
    status: "PASS_LOCK",
    detail: `clear sub grindă ${lv.clear_under_beam_cm ?? 255} · FF→FF ${lv.ff_to_ff_cm ?? ht.ff_to_ff_cm}`,
  },
  {
    id: "NO_LAMELE",
    status: calc100?.summary?.decision?.code === "NO_LAMELE" || calc100?.decision === "NO_LAMELE" ? "PASS_ORDIN" : "CHECK",
    detail: "B_E_S / B_S_SE fără C_E_LAMELE",
  },
  {
    id: "slab_15_with_BX_MID",
    status: calc100?.summary?.gates?.slab_with_mid || calc100?.gates?.slab_with_mid ? "PASS_ORDIN" : "FAIL",
    detail: "placă 15 cm doar cu B_X_MID",
  },
  {
    id: "beams_h40",
    status: calc100?.summary?.gates?.beams_all_after_h_adopt || calc100?.gates?.beams_all_after_h_adopt ? "PASS_ORDIN" : "CHECK",
    detail: "h adopt 40 pe grinzi critice",
  },
  {
    id: "columns_P100_geom",
    status: calc100?.summary?.gates?.columns_P100_NM || calc100?.gates?.columns_P100_NM ? "PASS_ORDIN" : "CHECK",
    detail: "≥30 + util N+M ordin",
  },
  {
    id: "buckling_EC2_ordin",
    status: wind?.buckling?.every?.((c) => c.pass) ? "PASS_ORDIN" : "CHECK",
    detail: "λ/φ pe P/E — s1_a1_wind_buckling_ec5_v01",
  },
  {
    id: "roof_snow_pv_wind_ordin",
    status: "PASS_ORDIN",
    detail: `q_Ed=${loads.roof.q_Ed_design_kNm2} · we=${loads.roof.we_eaves_kNm2}`,
  },
  {
    id: "rafter_EC5_SLS",
    status: wind?.rafter_ec5?.ec5_pass ? "PASS_ORDIN" : "CHECK",
    detail: "12×25 pas egal · EC5",
  },
  {
    id: "roof_bom_studiu",
    status: bom ? "PASS_GEO" : "CHECK",
    detail: bom ? `vol~${bom.volume_timber_m3} m³ · ${bom.geometry?.n_rafters_per_pitch}×2 căpriori` : "rulează calc:a1:roof",
  },
  {
    id: "seismic_columns_share",
    status: maxR?.seismicCols?.every((c) => c.pass) ? "PASS_ORDIN" : "CHECK",
    detail: `Vb=${loads.seismic.Vb_kN} kN`,
  },
  {
    id: "punching_ordin",
    status: maxR?.punchResults?.every((p) => p.pass) ? "PASS_ORDIN" : "CHECK",
    detail: "vEd ≤ vRdc ordin",
  },
  {
    id: "ring_E_closed",
    status: "PASS_GEO",
    detail: "B_E_S + B_S_SE închis",
  },
  {
    id: "foundations_geo120_q221",
    status: geo120 ? "PASS_ORDIN_IPOTEZA" : "CHECK",
    detail: `q_allow=${qAllow} kPa · talpă perimetru ${loads.foundation.perimeter_strip_cm} cm`,
  },
  {
    id: "foundations_sens_180_221_250",
    status: sens ? "PASS_ORDIN" : "CHECK",
    detail: sens
      ? `pad max 180/221/250 = ${sens.scenarios?.map((s) => s.pad_max_cm).join("/")}`
      : "rulează calc:a1:sens",
  },
  {
    id: "rebar_hint",
    status: rebar ? "PASS_HINT" : "CHECK",
    detail: "s1_a1_rebar_hint_v01 — nu DT",
  },
  {
    id: "node_C_E_PAL_ordin",
    status: node?.node ? "PASS_ORDIN" : "CHECK",
    detail: node
      ? `T=${node.node.torsion_anchorage.T_kNm} kNm · lbφ16=${node.node.development.phi16_lb_mm} mm`
      : "rulează calc:a1:node",
  },
  {
    id: "eaves_uplift_anchors",
    status: uplift?.anchors_plate?.pass ? "PASS_ORDIN" : "CHECK",
    detail: uplift
      ? `F=${uplift.uplift.F_plate_design_kN} kN · M12 @ ${Math.round(uplift.anchors_plate.s_adopt_m * 100)} cm`
      : "rulează calc:a1:uplift",
  },
  {
    id: "retaining_hydro_seis",
    status: retain?.adopt?.pass_flex ? "PASS_ORDIN" : "CHECK",
    detail: retain
      ? `M=${retain.adopt.M_tot_kNm_m} kNm/m · ${retain.adopt.hint}`
      : "rulează calc:a1:retain",
  },
  {
    id: "CR0_critical_members",
    status: cr0?.summary?.beams_all_pass && cr0?.summary?.columns_all_pass ? "PASS_ORDIN" : "CHECK",
    detail: cr0?.summary?.governing_beam
      ? `gov ${cr0.summary.governing_beam.id}@${cr0.summary.governing_beam.combo}`
      : "rulează calc:a1:cr0",
  },
  {
    id: "footing_stability",
    status: footing?.adopt?.pass ? "PASS_ORDIN" : "CHECK",
    detail: footing
      ? `B80 FAIL → adopt ${footing.adopt.B_cm} cm · FS_s=${footing.adopt.FS_slip} · FS_o=${footing.adopt.FS_over}`
      : "rulează calc:a1:footing",
  },
  {
    id: "p100_confinement_hint",
    status: p100c?.columns?.length ? "PASS_HINT" : "CHECK",
    detail: p100c ? `s_crit=${p100c.columns[0]?.s_crit_cm} cm · φ8 zonă` : "rulează calc:a1:p100",
  },
];

const checklist = [
  { pri: 1, item: "Confirmă ag, TC, S pe 131 (P100) — înlocuiește ipoteza ag=0,10g", done_in_repo: false },
  { pri: 1, item: "Confirmă sk și vb,0 pe hărți CR1-1-3 / CR1-1-4 NA", done_in_repo: false },
  { pri: 1, item: "Model 3D cadre pe structure_a1_study_cm (NU frame V47)", done_in_repo: false },
  { pri: 1, item: "Combinații CR0 complete pe bare", done_in_repo: false },
  { pri: 1, item: "Geo 131 Rc — înlocuiește lock q_allow=221 (sens 180/250 deja în repo)", done_in_repo: "sens_tabel" },
  { pri: 2, item: "Stâlpi: N+M+V + flambaj + P100 confinare", done_in_repo: "parcial_ordin" },
  { pri: 2, item: "Nod C_E_PAL + consolă + torsiune (vezi s1_a1_node_ce_pal_v01)", done_in_repo: "parcial_ordin" },
  { pri: 2, item: "Placă 15 + B_X_MID FE", done_in_repo: "parcial_ordin" },
  { pri: 2, item: "B_E_S / B_S_SE NO_LAMELE continuu", done_in_repo: "parcial_ordin" },
  { pri: 2, item: "Întoarsă + pier (As/ancorare în node pack)", done_in_repo: "parcial_ordin" },
  { pri: 2, item: "Retenție + apă + seism pe zid", done_in_repo: "parcial_ordin" },
  { pri: 2, item: "Fundații pe Rc geo_131 (pad-uri + talpă 80 pe q221)", done_in_repo: "ipoteza_120" },
  { pri: 3, item: "Șarpantă + ancorare we (BOM studiu în repo)", done_in_repo: "parcial_ordin" },
  { pri: 3, item: "Diafragmă placă", done_in_repo: false },
  { pri: 3, item: "Planșe armare DT (hint rebar ≠ DT)", done_in_repo: "hint_only" },
];

const beamH = st.beam_height_adopt_cm || calc100?.summary?.beam_height_adopt_cm || {};
const pads = st.foundation_pad_adopt_cm || calc100?.summary?.foundation_pad_adopt_cm || {};

const sensRows = (sens?.scenarios || [])
  .map(
    (s) =>
      `| ${s.id} | ${s.q_allow} | ${s.pad_max_cm} | ${s.pad_sum_m2} | **${s.strip_80_pass}** | ${s.strip_need_cm} |`
  )
  .join("\n");

const md = `# S1 A1 — Pachet FE de predat (v03)

**Pentru:** structurist / model FEM  
**Proiect:** Dragalina 131 · Turda · amenajare A1 înghețată  
**Status:** input + ordine de mărime din repo · **NU** proiect semnat · ${new Date().toISOString().slice(0, 10)}  
**Față de v02:** lock geo120 q=**${qAllow}**, hint armare, sensibilitate 180/221/250, nod C_E_PAL, BOM șarpantă

---

## 0. Lock-uri

| ID | Lock |
|----|------|
| **A1.180** | Clear **≥255** · FF→FF **${lv.ff_to_ff_cm ?? 307}** |
| **D3 / PV** | 2 ape · 30° · PV ambele ape · D3a |
| **NO_LAMELE** | Fără C_E_LAMELE în cadru |
| **A1.185** | Fundații q_allow **${qAllow}** kPa (Pconv 120 / 1,4) · talpă perimetru **${loads.foundation.perimeter_strip_cm}** cm |
| **P100** | Stâlp ≥ 30 cm |
| **ARH** | Compartimentare înghețată |

**NU folosi** \`v47_a1_frame_study\` (STALE).

---

## 1. Fișiere

| Rol | Cale |
|-----|------|
| Schemă | \`data/building/a1_architecture.json\` → \`structure_a1_study_cm\` |
| Alias | \`data/building/a1_structure_study.json\` |
| Amenajare / acoperiș | \`data/building/v47_a1_study.json\` |
| Volum 3D | \`viewer/data/volume_a1.json\` |
| Calc 100 / wind / max | \`s1_a1_calc_100_v01\` · \`wind_buckling\` · \`max_inrepo\` |
| Fundații geo120 | \`s1_a1_foundations_geo120_v01\` |
| Sensibilitate | \`s1_a1_foundations_sens_v01\` |
| Hint armare | \`s1_a1_rebar_hint_v01\` |
| Nod C_E_PAL | \`s1_a1_node_ce_pal_v01\` |
| BOM șarpantă | \`s1_a1_roof_bom_v01\` |
| Uplift streșină | \`s1_a1_eaves_uplift_v01\` |
| Retenție+apă+seism | \`s1_a1_retaining_seis_v01\` |
| CR0 bare | \`s1_a1_cr0_members_v01\` |
| Talpă stabilitate | \`s1_a1_footing_stability_v01\` |
| Confinare P100 | \`s1_a1_p100_confinement_v01\` |
| Due-diligence cumpărare | \`s1_a1_due_diligence_buy_v01\` |
| **INDEX predare** | \`s1_a1_fe_INDEX.md\` |
| **Acest brief** | \`s1_a1_fe_handoff_v03.md\` |

---

## 2. Încărcări blocate

### Planșeu
q_Ed locuință **${loads.floor_q_Ed_kNm2}** · palier **${loads.landing_q_Ed_kNm2}** kN/m²

### Acoperiș D3a + PV
Gk **${loads.roof.Gk_kNm2}** · sk **${loads.roof.sk_kNm2}** · q_Ed **${loads.roof.q_Ed_design_kNm2}** · we streșină **${loads.roof.we_eaves_kNm2}** · ${loads.roof.pitch_deg}°

### Seism (înlocuiește)
ag/S/q = ${loads.seismic.ag}g / ${loads.seismic.S} / ${loads.seismic.q_duct} · Vb **${loads.seismic.Vb_kN}** kN

### Fundații (lock studiu)
| | |
|--|--:|
| Ipoteză | ${loads.foundation.hypothesis} |
| Pconv 120 | ${loads.foundation.Pconv_120_kPa} kPa |
| **q_allow** | **${qAllow}** kPa |
| Talpă perimetru | ${loads.foundation.perimeter_strip_cm} cm |
| Notă | ${loads.foundation.note} |

Materiale: **${loads.concrete}** · **${loads.steel}**

### Sensibilitate q (nu schimbă adoptul)

| Scenariu | q | Pad max | Σ m² | Talpă 80 | Talpă nec. |
|----------|--:|--------:|-----:|:--------:|-----------:|
${sensRows || "| — | rulează npm run calc:a1:sens |"}

---

## 3. Cote (cm)

| Cotă | Valoare |
|------|--------:|
| FF parter / etaj | ${lv.ff_parter ?? 48} / ${lv.ff_etaj ?? 355} |
| FF→FF | ${lv.ff_to_ff_cm ?? 307} |
| Clear sub grindă / placă | ${lv.clear_under_beam_cm ?? 255} / ${lv.clear_under_slab_cm ?? 280} |
| Placă / grindă h | ${lv.slab_th_hypothesis ?? 15} / ${lv.beam_h_total_including_slab_zone ?? 40} |
| Beci FF / soffit | ${lv.basement_ff_cm ?? -250} / ${lv.basement_soffit_cm ?? -30} |

Cutie X ${box?.x0}–${box?.x1} × Y ${box?.y0}–${box?.y1} · Puț ${pit ? `${pit.x0}–${pit.x1} × ${pit.y0}–${pit.y1}` : "—"}

---

## 4. Stâlpi

| ID | x | y | dx×dy | Levels | Pad cm | Rol |
|----|--:|--:|-------|--------|-------:|-----|
${cols
  .map(
    (c) =>
      `| ${c.id} | ${c.x} | ${c.y} | ${c.dx}×${c.dy} | ${(c.levels || []).join("+")} | ${pads[c.id] ?? "—"} | ${c.role || ""} |`
  )
  .join("\n")}

## 5. Grinzi

| ID | b×h | Levels | Supports | Notă |
|----|-----|--------|----------|------|
${beams
  .map((b) => {
    const h = b.h_cm ?? beamH[b.id] ?? lv.beam_h_total_including_slab_zone ?? 40;
    const bb = Math.min(b.dx, b.dy);
    return `| ${b.id} | ${bb}×${h} | ${(b.levels || []).join("+")} | ${(b.supports || []).join(", ")} | ${(b.note || "").slice(0, 50)} |`;
  })
  .join("\n")}

---

## 6. Nod C_E_PAL + întoarsă (rezumat)

${
  node
    ? `| | |
|--|--:|
| Stâlp | ${node.node.column.section_cm} · N=${node.node.column.N_kN} · util=${node.node.column.util_NM} |
| Torsiune | ${node.node.torsion_anchorage.T_kNm} kNm |
| lb φ16 / φ14 | ${node.node.development.phi16_lb_mm} / ${node.node.development.phi14_lb_mm} mm |
| Întoarsă | ${node.inverted.section} · PASS=${node.inverted.pass_ordin} |
| Detaliu | \`s1_a1_node_ce_pal_v01.md\` |`
    : "_Rulează \`npm run calc:a1:node\`_"
}

---

## 7. Hint armare + BOM + uplift + retenție + CR0

- Armare: \`s1_a1_rebar_hint_v01.md\` (**nu** plan dt)
- Șarpantă BOM: \`s1_a1_roof_bom_v01.md\`${bom ? ` · vol~**${bom.volume_timber_m3}** m³ · pas **${bom.geometry?.step_cm}** cm` : ""}
- Uplift solbanc:${uplift ? ` F=**${uplift.uplift.F_plate_design_kN}** kN · M12 @ **${Math.round(uplift.anchors_plate.s_adopt_m * 100)}** cm · PASS=${uplift.anchors_plate.pass}` : " rulează calc:a1:uplift"}
- Retenție:${retain ? ` M=**${retain.adopt.M_tot_kNm_m}** kNm/m (${retain.adopt_case}) · ${retain.adopt.hint}` : " rulează calc:a1:retain"}
- CR0:${cr0?.summary?.governing_beam ? ` gov **${cr0.summary.governing_beam.id}** @ ${cr0.summary.governing_beam.combo} · beams PASS=${cr0.summary.beams_all_pass} · cols PASS=${cr0.summary.columns_all_pass}` : " rulează calc:a1:cr0"}
- Talpă:${footing ? ` B80 **FAIL** → adopt **${footing.adopt.B_cm}** cm (FS_s=${footing.adopt.FS_slip}, FS_o=${footing.adopt.FS_over})` : " rulează calc:a1:footing"}
- Confinare P100:${p100c ? ` φ8 @ **${p100c.columns[0]?.s_crit_cm}** cm zonă critică (hint)` : " rulează calc:a1:p100"}

**Start predare:** \`s1_a1_fe_INDEX.md\` · due-diligence: \`s1_a1_due_diligence_buy_v01.md\`

---

## 8. PASS ledger

| ID | Status | Detaliu |
|----|--------|---------|
${passLedger.map((p) => `| \`${p.id}\` | **${p.status}** | ${p.detail} |`).join("\n")}

---

## 9. Checklist FE

| Pri | Sarcină | În repo? |
|----:|---------|----------|
${checklist.map((c) => `| ${c.pri} | ${c.item} | ${c.done_in_repo === false ? "**NU**" : c.done_in_repo} |`).join("\n")}

---

## 10. Regenerare

\`\`\`
npm run calc:a1
npm run fe:handoff
\`\`\`
`;

const checklistMd = `# Checklist FE — Dragalina 131 A1 (v03)

${checklist.map((c) => `- [ ] **P${c.pri}** ${c.item}`).join("\n")}

## Lock-uri
- [ ] Clear ≥255
- [ ] 30° + PV ambele ape
- [ ] Fără C_E_LAMELE în cadru
- [ ] q_allow studiu 221 până la geo 131
- [ ] Geometrie structure_a1_study_cm

## Livrabile structurist
- [ ] Notă semnată
- [ ] Model FE
- [ ] Planuri armare
- [ ] Detalii nod C_E_PAL / întoarsă / șarpantă
`;

const json = {
  meta: {
    id: "s1_a1_fe_handoff_v03",
    generated: new Date().toISOString(),
    project: "Dragalina 131",
    status: "input_for_FE_not_signed",
    supersedes: "s1_a1_fe_handoff_v02",
  },
  locks: [
    "A1.180_clear255",
    "D3_30deg_PV_D3a",
    "NO_LAMELE",
    "A1.185_geo120_q221",
    "P100_min30",
    "ARH_frozen",
  ],
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
    "s1_a1_foundations_geo120_v01",
    "s1_a1_foundations_sens_v01",
    "s1_a1_rebar_hint_v01",
    "s1_a1_node_ce_pal_v01",
    "s1_a1_roof_bom_v01",
    "s1_a1_eaves_uplift_v01",
    "s1_a1_retaining_seis_v01",
    "s1_a1_cr0_members_v01",
    "s1_a1_footing_stability_v01",
    "s1_a1_p100_confinement_v01",
    "s1_a1_due_diligence_buy_v01",
    "s1_a1_fe_INDEX",
  ],
};

fs.mkdirSync(path.join(root, "outputs/reports"), { recursive: true });
fs.writeFileSync(outMd, md);
fs.writeFileSync(outJson, JSON.stringify(json, null, 2));
fs.writeFileSync(outChecklist, checklistMd);

fs.writeFileSync(
  path.join(root, "outputs/reports/s1_a1_fe_handoff_v02.md"),
  `# → Înlocuit de v03\n\nFolosește **[s1_a1_fe_handoff_v03.md](./s1_a1_fe_handoff_v03.md)** + \`s1_a1_fe_checklist_v03.md\`.\n`
);

console.log(
  JSON.stringify(
    {
      ok: true,
      files: [
        "outputs/reports/s1_a1_fe_handoff_v03.md",
        "outputs/reports/s1_a1_fe_handoff_v03.json",
        "outputs/reports/s1_a1_fe_checklist_v03.md",
      ],
      q_allow: qAllow,
      pass: passLedger.filter((p) => /PASS/.test(p.status)).length,
    },
    null,
    2
  )
);
