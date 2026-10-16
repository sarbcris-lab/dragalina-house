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

## 2026-10-15 — Țintă stil exterior (Belgian)

- **Locked:** Belgian · Cărămidă + tencuială (nu Industrial dark).
- Corp: cărămidă long-format; nișe/parapete: tencuială deschisă; metal antracit mat; gard la trotuar în același limbaj.
- Nuanță cărămidă: **deschisă sau intermediară**, nu închisă; SKU încă nedecis.
- Detalii + reper: `decisions/style_target_v01.md`, `inputs/references/style_target_belgian_caramida_tencuiala.png`.

## 2026-10-15 — Fațade klinker + alcătuire perete (POT)

- Placaj klinker pe **volumele principale** ale tuturor fațadelor corpului încălzit (E/S/V/N); tencuială pe nișe/retrageri/parapete balcon; gard trotuar = cărămidă.
- Perete P/E: EB20 200 + ISOVER FASSADE 80 + ETICS; finit max 300 mm; anvelopă 680×860 = fața finită.
- +1…2 cm placaj vs tencuială **contează la POT**; pe EST/Dragalina nu se crește în afara anvelopei.
- `decisions/facade_brick_and_wall_v01.md` + `construction_assemblies.facade_cladding` în study JSON.

## 2026-10-15 — Retrageri vecini N/V

- **Nord:** vecin OK inclusiv 0 cm; pe teren există ~20 cm între ziduri; casă vecin recent refăcută.
- **Recomandare locked ca ipoteză:** **nu 0 cm** — păstrează rost **~20 cm**; vest **~1 m**.
- Sub 60 cm față de hotar → acord autentic + verificare RLU; la 20 cm preferabil **tencuială pe N** (klinker greu de montat/întreținut).
- `decisions/setbacks_neighbors_v01.md`.

## 2026-10-15 — Soluție optimă nord

- Pe limită N + rost ~20 cm (terenul nu permite 80–100 cm).
- **Nord = tencuială** (finisaj la ridicare + hidro/drenaj); **klinker pe E/S/V** (vest ~1 m, vecin vest nu e lipit).
- Fără goluri inutile pe N; acord notarial + RLU; nu 0 cm pe casa refăcută a vecinului.

## 2026-10-15 — Vecin N = doar P + 4 ape

- Vecin nord: **parter + acoperiș 4 ape**; noi P+1 → N-jos vs N-sus.
- Atenție apă/zăpadă/incendiu pe învelitoarea lui; fără schelă pe acoperișul vecinului.

## 2026-10-15 — Nord = tencuială (confirmat)

- Beneficiar: **pe tot nordul (N-jos + N-sus) = tencuială**, fără klinker.
- Klinker rămâne pe E / S / V + gard.

## 2026-10-15 — Catalog ansambluri CONFIRMAT

- `decisions/assemblies_catalog_v01.md` OK beneficiar.
- Reguli: A1/A6 ≈300; A2 klinker 312 (vată 80); A7 fono 125 (nu BCA); A8 baie ≈150; A4 scară klinker ext. ≈150.

## 2026-10-15 — Update assemblies_v01 în proiect

- Sursă: `data/building/assemblies_v01.json`; aplicat pe A1 + FRAME.
- 3D: layere pe catalog_id (A1/A2/A4/A6/A7/A8); A2 +13 mm în mesh.
- SVG: `35_…A1` + `35b_…A2_klinker`.

## 2026-10-15 — Geometrie A2/A8

- A2: +1,3 cm exterior E/S/V; envelope **680×860 → 682,6×861,3** cm; amprentă **58,48 → 58,79 m²** (Δ +0,31).
- A8 baie: pereți **15 cm**; util uscat ≈ neschimbat (A2 în afară).
- `src/apply_geometry_assemblies_v01.mjs` + regen volumes.

## 2026-10-15 — Site = doar V47 A1 FRAME

- Viewer + redirect `/` încarcă **doar** `volume_v47_a1_frame.json`.
- Taburi: overlay / secțiuni cadre / A1–A2 wall / util / POT / catalog.
- V47, A1 studiu, V46 **nu** mai apar ca modele principale.
- Continuăm pe FRAME: layere + îmbunătățiri.

## 2026-10-15 — Audit rezistență FRAME v02

- Raport: `outputs/reports/v47_a1_frame_structure_audit_v02.md`.
- Acoperă: cadre, planșee, grindă întoarsă, scări P/E+L-1, subsol, acoperiș, gard, curte, A1–A12, limite N/E/S/W.
- Verdict: **NECONSTRUIBIL/NEVALIDAT**; top riscuri = east_landing_span, inverted_beam_fit, acoperiș fără structură, A2 vs hotar E.

## 2026-10-15 — FRAME: vizibilitate stâlpi + structură acoperiș

- Bug viewer: `stalp_continuu_*` erau clasificate doar pe zMid → păreau „doar subsol/parter”. Acum pe S+P+E.
- 11 stâlpi continui + 1 pier subsol (C_SHAFT_E_PIER). N = pe limita proprietății (rost ~20 cm până la zidul vecinului).
- Grindă întoarsă: mesh verde `subsol_grinda_y590_inverted` + SVG 37.
- Acoperiș: coamă + solbancuri + căpriori BA (studiu) în 3D.
- Clarificare „72,5 cm”: NU e lățimea scării proiectate (scara beci = clear **100** cm); 72,5 e (a) warn vechi pe ziduri greșite sau (b) culoar living mobilier.

## 2026-10-15 — FRAME: planuri P/E sfinte · beci realiniat · schelet curățat

- **Prioritate:** amenajare P/E = sursă de adevăr; stâlpii nu se elimină; beciul se ghidează pe axe plan.
- Camere beci: CT / depozit / hol pe X360·X535·Y400·Y645; clar ocolește stâlpii (în pereți).
- Schelet: eliminate grinzi/fundații hardcodate pe 650/I (nu închideau nodurile); fg+grinzi din schema stâlpilor.
- Viewer: pe etaj vezi planșeu+stâlpi+schelet acoperiș; `1 · Structură` ascunde țigla ca să apară coama/căpriorii.
- Centură E discontinuă sud de C_E_PAL = **intenție** (gol scară), nu bug.

## 2026-10-15 — Audit proiectare structură v03

- Raport: `outputs/reports/v47_a1_frame_structure_design_audit_v03.md`.
- View Structură: exclus poluare (gard/trepte/teren/țiglă) — doar cadru BA.
- B_SEP overlap în C_CASA; fg doar pe axe S/P.
- Calcule: ordine de mărime (B_W M/Mu≈0,63); P100/zăpadă/fundații = LIPSĂ.

## 2026-10-15 — Soluție east_landing_span (S+P)

- `C_E_LAND_SP` 30×30 @ Y575 — **doar S+P** (nu urcă în etaj scară).
- `B_E` prelungit; `B_LAND_S_EDGE` pe muchia sud palier.
- Raport: `outputs/reports/v47_a1_frame_east_landing_solution_v01.md`.
- Conflict → `STUDIU_SOLUTIE` (NEVALIDAT structurist).

## 2026-10-16 — Materiale + A7 Knauf + retragere landing

- **Retras** `C_E_LAND_SP` + `B_LAND_S_EDGE` (blocau palier/rampă beci); `B_E` din nou până la `C_E_PAL`; east_landing = DESCHIS_REPROIECTARE.
- **A7 = Knauf W112** CW75 · 2×12,5/față · **125 mm**.
- **Klinker:** Ströher Riegel 50 LF 490×40 silver-grau.
- **ETICS:** Weber webertherm CERAMIC PREMIUM (vată) — recomandare locked.
- `terasa_est` → **A1** (nu A5); A6 = **300** exact.
- Generator: fără auto-scale straturi; normală interior corectă (grosime, nu lungime).
- Decizie: `decisions/materials_v01.md`.

## 2026-10-16 — Schemă structură (predimensionare, nu execuție)

- **P ≠ E** la podest: P = living sub placă; E = circulație rece. Fără stâlp în living / acces beci.
- **Podest:** studiu consolă transversală (~1 m) pe B_E scurt din C_E_PAL — nu consolă 3,7 m; nu C_E_LAND_SP.
- **Placă principală:** comparație **15 vs 20 cm** pe 2 direcții; **fără** grindă lungă pe compartimentare A7 ca primă opțiune.
- Punctul care decide casa = placa 15/20, nu umplerea zonei podest cu stâlpi.
- Status conflicts: `east_landing_span` / `palier_plate_support` → STUDIU_CONSOLA; `slab_span_without_X320` → COMPARATIE_15_20.

## 2026-10-16 — Podest consolă + placă 15/20 în geometrie

- `B_E` prelungit la Y600 (consolă sud **111 cm** din C_E_PAL) — fără stâlp.
- Raport: `outputs/reports/v47_a1_frame_slab_and_landing_v02.md`.
- v01 east_landing cu stâlp = **RESPINS**.
- `heights_cm`: slab 15 (alt 20 → clear 250).

## 2026-10-16 — Audit structură v04 + fix viewer/geo

- Raport: `outputs/reports/v47_a1_frame_structure_design_audit_v04.md`.
- Critice: placă 15/20 insuficientă SLS; acoperiș fără load path; retenție subsol EB20.
- Fix viewer: poartă scoasă din Structură; fără reframing pe tot situl; banner → v04.
- Fix geo: `B_Y470` levels **P** (planșeu); etichete `C_S_DORM_E` / `C_S_INTRARE_E` = 30×30.

## 2026-10-16 — v05: corecție audit + generator regenerabil + geo

- **Nu** adopta placă 25–28: L/d = semnal, nu SLS fail demonstrat.
- Acoperiș: stâlpișori = contact parțial (nu plutitori absenți); căpriori completați pe E.
- Generator `study_v47_frame_schema.mjs`: `B_E`→Y590, `B_Y470` levels P — persistă după regen.
- Fără dublură placă palier; vanguri rampă2 înclinate; Structură include `palier_superior_placa`.
- Vizibilitate P/E: `continuousObjs` o decizie.
- Geo: `decisions/geotech_hypothesis_v01.md` (vecinătate 120; demolare integrală 131).
- Audit: `v47_a1_frame_structure_design_audit_v05.md` + registru status.

## 2026-10-16 — Coordonare geometrie (runda post-v05)

- `GEO_X0=1.3` în generator cadru (= A2 recenter) — C_NE@641.3 etc.
- Palier: izol. 6 + șapă 4 + finisaj 2 cm (nu grosime 0).
- Rampă 1+2: vanguri înclinate sub intrados; capăt superior = nTread (nu nRiser) — aliniază la +298 Intrados / +304 FF.
- `podest_se_placa` în Structură; Viewer `sharedFloorObjs` — grinzi/plăci pe Doar parter.
- Gol placă = contur exact palier; planuri FRAME `38`/`39` din frame study (nu v47_exact).

## 2026-10-16 — Geometrie anvelopă/FF înainte de FE

- Proces: `decisions/roadmap_geometry_then_calc_v01.md` — pereți L + FF locked → apoi calcule (consolă, colțuri, centuri).
- **FF P = +48 cm** — 2 trepte (+16/+32) + a 3-a ridicare pe palier/terasă; beci −250 absolut.

## 2026-10-16 — 2 unități = garsoniere · clear 2,55 m

- Lock: `decisions/legal_height_studios_v01.md` — Legea 114/1996 Anexa 1: **2,55 m** camere de locuit.
- Placă 15 = OK la limită; 20 = 250 (sub lege); sub grindă 241 = conflict de rezolvat.

## 2026-10-16 — Prioritate: legea întâi

- Lock: `decisions/priorities_legal_first_v01.md` — POT ~40%, util ≥37 m², clear ≥255 cm, apoi restul.
- Subsol/terasă/scări = flexibile dacă minimele legale sunt îndeplinite.
- Orice „alege varianta” trebuie cu impact pe aceste praguri (sau explicit: fără impact).

## 2026-10-16 — Audit structură: acord + rezolvări fără impact legal

- Doc: `decisions/conflicts_resolution_v01.md`.
- Fix: B_Y470 exclus din soffit/fg L-1; grindă întoarsă dy=25 (nod B_SEP); B_X360 pad păstrat + calcul.
- Placă: **preferință 15 cm** (clear 255); 20 doar după FE fail + tradeoff explicit. Clear sub grindă **241** = conflict separat de întrebat.

## 2026-10-16 — Închidere geometrie scară (post-78ec6a2)

- Podest BA **15 cm** separat (+133→+148); pachet finisaj 12 cm deasupra — nu 3 cm.
- Sistem: **trepte pe plăci BA** + vanguri pe muchii cu **reazem 15 cm în placa podestului**.
- `B_Y590_EDGE_INVERTED` = `inverted_edge_beam` (aceeași geometrie cu GEO_X0).
- Palier: XPS 300 5 cm + membrană impact 1 cm + șapă 4 + finisaj 2 (ipoteză; Lnw NECONFIRMAT).
- Planuri 38/39: goluri, scară, podest, contur plăci; secțiuni noduri → `40_…_stair_sections.svg`.
