# Jurnal decizii

## 2026-10-12 — Organizare + start concept_v01

- Documentele mutate în `inputs/{cadastru,sketches,references}/`.
- CF: 172 din acte, **147 măsurată** (bază), 76 existent C1 (≠ maxim nou).
- Nu se cere alte documente înainte de studiul conceptual.
- Schița 9,30×7,80 = ipoteză clădire, **nu** geometrie parcelă.
- Poligon din 10 segmente: **neinventat** (nedeterminat fără unghiuri).
- Anvelopă teren rectangulară provizorie doar pentru plasare volum.
- Generat: plan situație, parter, etaj, mesh volumetric + viewer.
- **Următorul checkpoint:** verificare planuri cotate + volum înainte de randări realiste.

## 2026-10-12 — Audit fronturi (v01 respins / corectat)

- v01 **NECONFORM**: orientare greșită, fără vecini, fără curte Cloșca, anvelopă ~pătrată inventată.
- Reguli fixate: **pe limita Dragalina**, **aliniere cu doi vecini**, **curte către Cloșca**.

## 2026-10-12 — Contur din CF (corecție)

- Anvelopa rectangulară inventată **abandonată**.

## 2026-10-12 — Plan amplasament (corecție formă)

- Beneficiarul a furnizat **planul de amplasament** (parcela 54602 + C1).
- Imagine: `inputs/cadastru/plan_amplasament_54602.png` (= documentul de cadastru folosit pentru formă).

## 2026-10-12 — Reproducere fidelă din plan

- Motiv eșec: unghiuri inventate + **străzi greșite**.

## 2026-10-12 — Corecție străzi (orientare finală)

- Beneficiar: **Dragalina = DREAPTA**, **Cloșca = JOS**.

## 2026-10-12 — Etapa 2 volumetrie footprint_v01

- Casă nouă **9,30 × 7,80 m** (72,54 m²) pe limita Dragalina (dreapta).
- Amplasată spre N; **curte sud → Cloșca**.
- Bandă scară/terasă 2,40 m pe latura spre Cloșca.
- 9,30 încape pe Dragalina (18,54 m); adâncime 7,80 pe lățime ~8,8 m → ~1 m spre vest.
- STOP pentru confirmare amprentă înainte de planuri detaliate.

## 2026-10-12 — Amprentă pe 3 limite + Etapa 3 propuneri

- Beneficiar: **nord OK**, pe limita vecinului, **practic pe 3 limite**.
- Amprentă v0.2: N (pct 5–7) + Dragalina + Vest · **~73,4 m²** · adâncime ~8,02 m.
- Propuneri compartimentare pe aceeași amprentă:
  - **A** — terasă din dormitor (aproape de schiță)
  - **B** — terasă din living (+ geam spre curte)
- Planuri: `outputs/plans/05_propunere_{A|B}_{parter|etaj}.svg` + comparație.

## 2026-10-12 — 3D din Plan_integrat_poarta_v05

- Sursă: `inputs/Plan_integrat_poarta_v05.png` (poartă culisantă 90° vest + 2 auto pe Cloșca).
- Flux: beneficiarul stabilește în plan → agentul extrudează 3D din poligon CF + program.
- Generare: `npm run volume` → `viewer/data/volume.json`.
- Viewer: toggle poartă închisă / deschisă.

## 2026-10-13 — Layout V43 parametric (iterare cote)

- Sursă: `inputs/Audit_V43_dimensiuni_si_cazare.html` (680×860 cm, pereți 30/15, nivel 304).
- Parametri: `data/building/layout_v43.json` → `tune`.
- Regenerare: `npm run layout` → `outputs/plans/07_layout_v43.svg` + studio HTML.
- Flux: modificăm ușor cotele în `tune` până găsim varianta; lanțuri sud/vest verificate.

## 2026-10-13 — V43 în proiect ca 3D exact

- `data/building/v43_exact.json` = pereți/camere/mobilier/goluri din audit (cm).
- `npm run volume:v43` → viewer 3D pe sit CF; EST pe Dragalina (pct 5); P+1 @ 304 cm.
- Nu e randare foto-reală; este volumetrie exactă din aceleași cote V43.
