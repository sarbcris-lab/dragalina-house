# V47 A1 FRAME — studiu structural corectat (cadre BA)

## Status
**NECONSTRUIBIL / NEVALIDAT.** Variantă separată față de A1 amenajare aprobată.
Sistem: **cadre beton armat** + **EB20** + **vată 80 mm**. **Nu** pereți structurali P/E.

## Prioritati geometrie (runda audit post-117edb0)
1. **Stalpi continui** prin nod placa/pardoseala; C_NW / C_W_MID restaurate 30x40 (nu reduse pt. mobilier).
2. **C_N_MID@X320** (rost vest de frigider_p); **C_CASA_SCARA@X535** flush (fara proeminenta vest).
3. **Ansamblu muchie put:** B_Y590_EDGE_INVERTED + C_SHAFT_E_PIER + B_SEP_AFTER_DOOR (usa/palier libere).
4. **Noduri:** B_X360 prin C_S_INTRARE_W; B_Y830 prin C_S_INTRARE_E; B_W prin C_W_DORM.
5. **Util E = studio fara vestibul** (vestibul raportat separat); transport/util = NECONFIRMAT — fara PASS.
6. **Amenajare frame-only:** dus x>=50, pat x>=45; A1 aprobat neatins.

## Secțiuni stâlpi
- Preliminar **30×40 cm** + proeminență locală **0 cm** spre interior.
- Perete finit **30 cm**; ETICS continuă **peste** stâlpi (nu înlocuită de beton).
- *De confirmat prin calcul și cerințe normative* (P100 — aplicabilitate pe sistem/ductilitate).

## Eliminat / mutat
- `part_mid`: compartimentare 12,5 — nestructural
- `pal_nw`: etaj-only peste living — interzis
- `pal_ne`: înlocuit de C_E_PAL continuu
- `C_E_PUT@Y590`: îngusta scara — eliminat
- `C_E_SOLID_N@Y550`: intra în palierul inferior; rol pe C_E_PAL N de Y490
- `C_N_BUC@X535`: suprapunere certă plită/cuptor/hotă/chiuvetă P — eliminat din grilă; B_N cu 3 reazeme (NW, N_MID, NE); repoziție în rost real = comparație viitoare
- `C_CASA_SCARA@Y590`: intersecta gol ușă — mutat la Y610+
- `C_L_PAL`: LOCK-1R: retras — pe P cade în living deschis sub/lângă palier (separator abia @ Y590). Palier = consolă pe B_E.
- `grinda_X320`: nu pe fală compartimentare
- `B_BAND_X320`: LOCK 2026-10-17: retras — placă 20 pe L≈6,2 fără bandă (min proeminențe). C_N_MID păstrat până la FE drop.
- `B_Y400_BAND_TIE`: dorm LOCK neatins — retras anterior
- `pereți_structurali_P_E`: respins — doar cadre
- `20x40_in_20cm_leaf`: nu demonstrăm încadrarea în banda de 20 cm

## Tabel stâlpi

| ID | Poziție (cm) | Secțiune + proem. | Niveluri | Reazem inferior | Conflicte |
|----|--------------|-------------------|----------|-----------------|-----------|
| C_NW | X0–30 Y0–30 | 30×30 (proem. 0) | S–P–E | fundație_N/W | duș decupat local în frame — nu micșorăm stâlpul |
| C_N_MID | X321.3–361.3 Y0–30 | 40×30 (proem. 0) | S–P–E | fundație_N | alternativă: fără C_N_MID (doar NW+NE) — comparație |
| C_NE | X642.1–672.1 Y0–30 | 30×30 (proem. 9.2) | S–P–E | fundație_E | — |
| C_W_MID | X0–30 Y400–440 | 30×40 (proem. 0) | S–P–E | fundație_W | pat x≥45 în frame — rezervă montaj/tăblie |
| C_W_DORM | X0–30 Y635.8–665.8 | 30×30 (proem. 9.2) | S–P–E | fundație_S | gol terasă X120–270 |
| C_S_DORM_E | X331.3–361.3 Y635.8–665.8 | 30×30 (proem. 9.2) | S–P–E | fundație_S | proximitate circulație / ușă terasă |
| C_E_GEAM_S | X642.1–672.1 Y310–350 | 30×40 (proem. 9.2) | S–P–E | fundație_E | — |
| C_E_PAL | X642.1–672.1 Y449–489 | 30×40 (proem. 9.2) | S–P–E | fundație_E continuu — NU pe placă | — |
| C_CASA_SCARA | X536.3–566.3 Y610–650 | 30×40 (proem. 0) | S–P–E | fundație X535 | — |
| C_SHAFT_E_PIER | X642.1–672.1 Y575–605 | 30×30 (proem. 9.2) | S | diafragmă est puț | — |
| C_S_INTRARE_W | X361.3–401.3 Y820.8–850.8 | 40×30 (proem. 9.2) | S–P–E | fundație_S_intrare (bandă dedicată) | — |
| C_S_INTRARE_E | X536.3–566.3 Y820.8–850.8 | 30×30 (proem. 9.2) | S–P–E | fundație_S | — |
| C_SE | X642.1–672.1 Y820.8–850.8 | 30×30 (proem. 9.2) | S–P–E | fundație_E | — |

## Cote etaj / planșeu
FF P +48 (entry 3×16); scară P→E 18×17=306; clear plafon 268; sub grindă 259.

| Cotă | cm |
|------|---:|
| FF etaj | 354 |
| Față sup. placă | 342 |
| Intrados placă | 322 |
| Intrados grindă (h total 35) | 307 |
| Clear P sub grindă | 259 |

## Tabel grinzi

| ID | Poziție (cm) | Niveluri | Reazeme | Note / traseu |
|----|--------------|----------|---------|---------------|
| B_N | X0–672.1 Y0–30 | P,E | C_NW, C_N_MID, C_NE | centură N — până la față beton E (C_NE); 3 reazeme |
| B_W | X0–30 Y0–665.8 | P,E | C_NW, C_W_MID, C_W_DORM | centură W prin nodul C_W_DORM (pilastru V) |
| B_E | X642.1–672.1 Y0–590 | P,E | C_NE, C_E_GEAM_S, C_E_PAL | centură E pe față beton (finit−A2) + consolă sud Y590. LOCK-1R. Nod C_E_PAL = calcul. |
| B_CASA_SCARA | X536.3–566.3 Y610–861.3 | S,P,E | C_CASA_SCARA, C_S_INTRARE_E | separator Y610→sud; nod cu B_Y830 |
| B_Y590_EDGE_INVERTED | X566.3–681.3 Y575–600 | S_inverted | C_SHAFT_E_PIER, B_SEP_AFTER_DOOR, C_CASA_SCARA | E→C_SHAFT_E_PIER; W→nod B_SEP@Y600→C_CASA_SCARA. Ușă Y500–600 X535–565 liberă (întoarsa începe la X566). |
| B_SEP_AFTER_DOOR | X536.3–566.3 Y600–610 | S,P | zid_separator, C_CASA_SCARA | buiandrug/centură S de ușă Y600–610 — preia traseul de la placa peste palier către C_CASA_SCARA; nu blochează golul |
| B_Y645 | X0–361.3 Y635.8–665.8 | P,E | C_W_DORM, C_S_DORM_E | sud dorm — pe față beton (finit local − A2); prin C_W_DORM / C_S_DORM_E |
| B_X360_DORM_INTRARE | X331.3–401.3 Y645–850.8 | P,E | C_S_DORM_E, C_S_INTRARE_W | STUDIU: dx=70 = pad prin C_S_DORM_E + C_S_INTRARE_W nealiniați; lățime structurală tip 30 — conflict geometric / soluție explicită |
| B_Y830 | X361.3–566.3 Y820.8–850.8 | P,E | C_S_INTRARE_W, C_S_INTRARE_E | sud intrare pe muchie placă (C_S_INTRARE_W/E); nod B_CASA_SCARA · continuă E cu B_S_SE |
| B_E_S | X642.1–672.1 Y590–850.8 | P,E | B_E, C_SE | centură E sud — închide inel Y590→CONC_S pe față beton; reazeme B_E@590 + C_SE. Span ~261 = FE (C_SHAFT rămâne S-only — nu pe palier P). |
| B_S_SE | X536.3–672.0999999999999 Y820.8–850.8 | P,E | C_S_INTRARE_E, C_SE | centură S est — C_S_INTRARE_E→C_SE; închide colț SE pe muchie CONC |
| B_Y470_PALIER_EDGE | X565–670 Y470–500 | P,E | B_E, C_E_PAL | LOCK-1R: bordură N palier X565–670 (P+E). Fără stâlp V (living P). Consolă pe B_E. NU vestibul. |

## Tabel elemente (stâlpi + grinzi)

| Tip | ID | Reazeme / sprijin | Niveluri | Conflict amenajare | Soluție propusă |
|-----|----|-------------------|----------|--------------------|-----------------|
| stalp | C_NW | fundație_N/W | S/P/E | duș decupat local în frame — nu micșorăm stâlpul | dus x≥50 |
| stalp | C_N_MID | fundație_N | S/P/E | alternativă: fără C_N_MID (doar NW+NE) — comparație | nord — pilastru pe finit · baie/living int. la linie |
| stalp | C_NE | fundație_E | S/P/E | — | colț N/E — N pilastru · E plan+ETICS |
| stalp | C_W_MID | fundație_W | S/P/E | pat x≥45 în frame — rezervă montaj/tăblie | pat x≥45 |
| stalp | C_W_DORM | fundație_S | S/P/E | gol terasă X120–270 | colț S/W dorm — W pilastru · S plan+ETICS |
| stalp | C_S_DORM_E | fundație_S | S/P/E | proximitate circulație / ușă terasă | capăt E sud dorm — S plan+ETICS · proem. int. |
| stalp | C_E_GEAM_S | fundație_E | S/P/E | — | est S de geam — plan+ETICS · proem. int. |
| stalp | C_E_PAL | fundație_E continuu — NU pe placă | S/P/E | — | est sub palier — plan+ETICS · proem. int. |
| stalp | C_CASA_SCARA | fundație X535 | S/P/E | — | separator X535–565; fără proeminență vest (eliberează frigider/MSV etaj) |
| stalp | C_SHAFT_E_PIER | diafragmă est puț | S | — | est puț / capăt întoarsă — plan+ETICS |
| stalp | C_S_INTRARE_W | fundație_S_intrare (bandă dedicată) | S/P/E | — | sud intrare/buc — plan+ETICS · proem. int. |
| stalp | C_S_INTRARE_E | fundație_S | S/P/E | — | sud @ X535 intrare — plan+ETICS · proem. int. |
| stalp | C_SE | fundație_E | S/P/E | — | colț S/E — E+S plan+ETICS · închide inel centură |
| grinda | B_N | C_NW, C_N_MID, C_NE | P/E | — | centură N — până la față beton E (C_NE); 3 reazeme |
| grinda | B_W | C_NW, C_W_MID, C_W_DORM | P/E | — | centură W prin nodul C_W_DORM (pilastru V) |
| grinda | B_E | C_NE, C_E_GEAM_S, C_E_PAL | P/E | — | centură E pe față beton (finit−A2) + consolă sud Y590. LOCK-1R. Nod C_E_PAL = calcul. |
| grinda | B_CASA_SCARA | C_CASA_SCARA, C_S_INTRARE_E | S/P/E | — | separator Y610→sud; nod cu B_Y830 |
| grinda | B_Y590_EDGE_INVERTED | C_SHAFT_E_PIER, B_SEP_AFTER_DOOR, C_CASA_SCARA | S_inverted | traseu incarcari — calcul | FORMĂ R: capăt V explicit pe B_SEP; sandwich −30…+32 = detaliu, nu reazem lipsă |
| grinda | B_SEP_AFTER_DOOR | zid_separator, C_CASA_SCARA | S/P | — | buiandrug/centură S de ușă Y600–610 — preia traseul de la placa peste palier către C_CASA_SCARA; nu blochează golul |
| grinda | B_Y645 | C_W_DORM, C_S_DORM_E | P/E | — | sud dorm — pe față beton (finit local − A2); prin C_W_DORM / C_S_DORM_E |
| grinda | B_X360_DORM_INTRARE | C_S_DORM_E, C_S_INTRARE_W | P/E | — | STUDIU: dx=70 = pad prin C_S_DORM_E + C_S_INTRARE_W nealiniați; lățime structurală tip 30 — conflict geometric / soluție explicită |
| grinda | B_Y830 | C_S_INTRARE_W, C_S_INTRARE_E | P/E | — | sud intrare pe muchie placă (C_S_INTRARE_W/E); nod B_CASA_SCARA · continuă E cu B_S_SE |
| grinda | B_E_S | B_E, C_SE | P/E | — | centură E sud — închide inel Y590→CONC_S pe față beton; reazeme B_E@590 + C_SE. Span ~261 = FE (C_SHAFT rămâne S-only — nu pe palier P). |
| grinda | B_S_SE | C_S_INTRARE_E, C_SE | P/E | — | centură S est — C_S_INTRARE_E→C_SE; închide colț SE pe muchie CONC |
| grinda | B_Y470_PALIER_EDGE | B_E, C_E_PAL | P/E | — | LOCK-1R: bordură N palier X565–670 (P+E). Fără stâlp V (living P). Consolă pe B_E. NU vestibul. |

## Suprafețe utile — falie la cheie (NECONFIRMAT)
Metodă: fețe int. = walls (E/S plan, N/V linie): shoelace − pereți int. net − thermal în poly − proem. stâlpi E/S. Fără dublă scădere A6 L exclus din polyE.

Fețe falie: W undefined · N undefined · E undefined · S intrare undefined · S dorm undefined (exces 10 cm).

| Nivel | Util geometric m² | Status |
|-------|------------------:|--------|
| **Parter** | **38.624** | NECONFIRMAT |
| **Etaj (studio, fără palier rece)** | **37.859** | NECONFIRMAT |

| Detaliu | m² |
|---------|---:|
| Brut shoelace P / E | 40.284 / 39.338 |
| Pereți int net P / E | 1.156 / 1.231 |
| Thermal în contur P / E | 0.255 / 0 |
| Thermal E full rects (în afara conturului, **nescăzut**) | 1.515 |
| Proem. stâlpi E/S P / E | 0.248 / 0.248 |
| Palier scară rece (exclus) | 1.26 |
| Etichete libere E (informativ) | — |
| Δ vs 37 (informativ; autorizare = 1 cameră după demontare perete dorm) | 1.624 / 0.859 |

Autorizare: perete dorm↔living jos → o cameră (living deschis). 37 m² = prag informativ 1 cameră; nu PASS. Util geometric NECONFIRMAT.

## POT / amprentă (falie = zidărie)
| Mărime | Valoare |
|--------|---------|
| Amprentă | **58.7923 m²** (682.6×861.3 cm) |
| **POT pe 147 m²** | **39.99%** |
| POT pe 172 m² (acte) | 34.18% |
| vs C1 76 m² | -17.2077 m² |

Amprentă = față finită 682,6×861,3. E/S: beton retras A2, ETICS până la finit (plan). N/V: pilastru pe finit. EST pe limită — fără +cm afară.


## Transport palier (stâlpi + finisaje)
Status: **NECONFIRMAT** · declared_pass_access=false
- Niciun stâlp pe AABB palier inferior după mutarea C_E_PAL N de Y490
- Coliziuni: coborare_t1[stalp_C_SE]; coborare_t7[stalp_C_SHAFT_E_PIER]; coborare_t8[stalp_C_SHAFT_E_PIER]; palier_aliniat_scara[stalp_C_SHAFT_E_PIER]; intoarcere_15[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,finisaj_zid_w,treapta_7,stalp_C_SHAFT_E_PIER]; intoarcere_30[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,finisaj_zid_w,treapta_7,stalp_C_SHAFT_E_PIER]; intoarcere_45[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,finisaj_zid_w,zid_put_n,finisaj_zid_n,foaie_deschisa_hol,treapta_7,stalp_C_CASA_SCARA,stalp_C_SHAFT_E_PIER]; intoarcere_60[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,finisaj_zid_w,foaie_deschisa_hol,treapta_7]; intoarcere_75[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,finisaj_zid_w,foaie_deschisa_hol,treapta_7]; intoarcere_90[finisaj_zid_w,foaie_deschisa_hol]; in_gol_usa[finisaj_zid_w,foaie_deschisa_hol]; in_hol[foaie_deschisa_hol]
- TRANSPORT / ACCES = NECONFIRMAT

## Conflicte nerezolvate (păstrate explicit)
- **east_landing_span** (STUDIU_CONSOLA): LOCK-1R: palier = consolă pe B_E (sud 101 cm + vest ~105 cm cu B_Y470). Fără stâlp în living P (C_L_PAL retras). Calcul obligatoriu: armare consolă, torsiune/ancorare nod C_E_PAL.
- **palier_plate_support** (STUDIU_CONSOLA): LOCK-1R: placă palier consolă pe B_E + bordură N B_Y470 (P+E). P: living liber sub placă. E: circulație rece. Armare/pachet fono = calcul — schema geometrică asumată.
- **slab_span_without_X320** (LOCK_P_SLAB20): LOCK 2026-10-17: placă 20 fără B_BAND (L≈6,2). Ordin L/d OK @K1,3; FE SLS/ULS încă lipsă. Clear plafon 268 · sub grindă 259. Bandă retrasă (min proem.). C_N_MID păstrat până FE.
- **inverted_beam_fit** (FORM_OK): FORMĂ: capăt V = nod B_SEP@X566/Y600; capăt E = pier. Ușă liberă. Sandwich −30…+32 = detaliu armare (nu lipsește reazem).
- **B_Y470_basement_mirror** (FIX_GENERATOR): LOCK-1R: B_Y470 pe P+E (X565–670) exclude_basement:true. Fără C_L_PAL / B_X535_PAL_N.
- **basement_retaining** (GEO_OK_CALC_OPEN): LOCK 2026-10-16: retenție perim modelată ca BA 20 cm (nu EB20). Mesh site_layer=structura. Partiții int. = umplutură 12,5. Rămâne calcul: împingere, talpă, XPS/hidro, geo 131.
- **roof_load_path** (COMPARATIE_D3): D3a+PV+zăpadă sk1,5: q_Ed~2,85 kN/m² (ordin). Solbanc/stâlpișori pe CONC/B_W·B_E. FE stâlpi+ancorare+inel = lipsă. Vezi roof_pv_snow_bearing.
- **ring_E_SE_gap** (GEO_OK_CALC_OPEN): LOCK 2026-10-17: C_SE @ CONC_E×CONC_S + B_E_S (Y590→S) + B_S_SE (C_S_INTRARE_E→C_SE). Inel E închis geometric. C_SHAFT_E_PIER rămâne S-only (palier). FE pe span B_E_S ~261 cm = calcul_lipsă.
- **foundations_width** (GEO_STUDY): LOCK studiu: talpă 80×80 + FG bandă 60 (nu = grindă 30). EST excentric interior. P_work 200 pe N_ser; Pconv 310 = ref. Rc 131 = calcul_lipsă.
- **north_three_supports** (COMPARATIE): C_N_BUC eliminat. C_N_MID@X320. B_N pe NW–N_MID–NE. Alternativa: fara N_MID.
- **amenajare_frame_overlays** (FRAME_ONLY): A1 aprobat neatins. In frame: dus x>=50; pat x>=45 — nu micsoram stalpii.
- **column_thru_p100_flush** (LOCK): LOCK 2026-10-16: COL_THRU=30 (P100 min) · stâlpi perimetrali pe muchia plăcii (N/V/E/S) · along=40 tip (calcul). Fără flush-int forțat pe beton — falie EB20 = zidărie.
- **p100_min_section** (LOCK): P100-1/2013 §5.3.2.2+§5.4.2.2: dimensiune minimă stâlp cadru ≥300 mm. Varianta A respectă geometric; armare/ductilitate = calcul. Varianta B = pereți structurali (studiu separat).
- **etics_wrap_verify** (LOCK): LOCK 2026-10-17: E/S — ETICS continuu pe stâlpi (beton=finit−A2). N/V — fără wrap (pilastru pe finit). O singură regulă fațadă.
- **facade_slab_edge_masonry** (LOCK): LOCK 2026-10-17: E/S finit plan (proem. int.); N/V int. la linie (pilastru ext. stâlp+placă). Util din fețe walls. Supersede beton-pe-finit E/S.
- **slab_20_no_band** (LOCK): LOCK 2026-10-17: placă structurală 20 cm; B_BAND_X320 retras (min proeminențe). Clear 268/259. FE pe L≈6,2 încă calcul_lipsă. C_N_MID păstrat.
- **B_X360_wide_pad** (LOCK_ACCEPT_PAD): LOCK 2026-10-16: acceptăm pad dx=70 (COL_THRU+COL_ALONG) ca geometrie unică — compensare C_S_DORM_E vs C_S_INTRARE_W nealiniați. Fără aliniere stâlpi în această rundă (Δ util amânat). Armare pad = calcul.

## Fișiere
- `data/building/v47_a1_frame_study.json`
- `viewer/data/volume_v47_a1_frame.json` → `?v=v47_a1_frame`
- `outputs/plans/36_v47_a1_frame_structure_overlay.svg`
- `outputs/plans/37_v47_a1_frame_sections.svg`
- `outputs/reports/v47_a1_frame_structure.md`

Amenajarea `v47_a1_study` / `?v=v47_a1` rămâne referința aprobată (fără pereți structurali).
