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
- Preliminar **30×40 cm** + proeminență locală **10 cm** spre interior.
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
- `grinda_X320`: nu pe fală compartimentare
- `pereți_structurali_P_E`: respins — doar cadre
- `20x40_in_20cm_leaf`: nu demonstrăm încadrarea în banda de 20 cm

## Tabel stâlpi

| ID | Poziție (cm) | Secțiune + proem. | Niveluri | Reazem inferior | Conflicte |
|----|--------------|-------------------|----------|-----------------|-----------|
| C_NW | X10.5–50.5 Y9.2–39.2 | 40×30 (proem. 10) | S–P–E | fundație_N/W | duș decupat local în frame — nu micșorăm stâlpul |
| C_N_MID | X321.3–361.3 Y9.2–39.2 | 40×30 (proem. 10) | S–P–E | fundație_N | alternativă: fără C_N_MID (doar NW+NE) — comparație |
| C_NE | X641.3–671.3 Y9.2–49.2 | 30×40 (proem. 10) | S–P–E | fundație_E | proeminență în capăt blat_tail_p — capăt mobilier adaptat |
| C_W_MID | X10.5–40.5 Y400–440 | 30×40 (proem. 10) | S–P–E | fundație_W | pat x≥45 în frame — rezervă montaj/tăblie |
| C_W_DORM | X10.5–50.5 Y635.8–665.8 | 40×30 (proem. 9.200000000000045) | S–P–E | fundație_S | gol terasă X120–270 |
| C_S_DORM_E | X331.3–361.3 Y635.8–665.8 | 30×30 (proem. 9.200000000000045) | S–P–E | fundație_S | proximitate circulație / ușă terasă |
| C_E_GEAM_S | X641.3–671.3 Y310–350 | 30×40 (proem. 10) | S–P–E | fundație_E | — |
| C_E_PAL | X641.3–671.3 Y449–489 | 30×40 (proem. 10) | S–P–E | fundație_E continuu — NU pe placă 15 | proeminență pe palier etaj Y470–489 — recalcul lățime utilă |
| C_CASA_SCARA | X536.3–566.3 Y610–650 | 30×40 (proem. 0) | S–P–E | fundație X535 | — |
| C_SHAFT_E_PIER | X666.3–681.3 Y575–590 | 15×15 (proem. 0) | S | diafragmă est puț | — |
| C_S_INTRARE_W | X361.3–401.3 Y820.8–850.8 | 40×30 (proem. 9.200000000000045) | S–P–E | fundație_S_intrare (bandă dedicată) | — |
| C_S_INTRARE_E | X536.3–566.3 Y820.8–850.8 | 30×30 (proem. 9.200000000000045) | S–P–E | fundație_S | — |

## Cote etaj / planșeu
Placă +293→+308; grindă +273; FF +320; buildup 12. Stâlpi P+E = continui prin nod (beton până la FF etaj / mai sus); pardoseala se decupează.

| Cotă | cm |
|------|---:|
| FF etaj | 320 |
| Față sup. placă | 308 |
| Intrados placă | 293 |
| Intrados grindă (h total 35) | 273 |
| Clear P sub grindă | 241 |

## Tabel grinzi

| ID | Poziție (cm) | Niveluri | Reazeme | Note / traseu |
|----|--------------|----------|---------|---------------|
| B_N | X10.5–681.3 Y9.2–39.2 | P,E | C_NW, C_N_MID, C_NE | centură N — 3 reazeme (fără C_N_BUC); deschideri de dimensionat |
| B_W | X10.5–40.5 Y9.2–665.8 | P,E | C_NW, C_W_MID, C_W_DORM | centură W prin nodul C_W_DORM (nu se oprește la fața nord a stâlpului) |
| B_E | X641.3–671.3 Y9.2–590 | P,E | C_NE, C_E_GEAM_S, C_E_PAL | centură E prin C_E_PAL + consolă sud până Y590 (muchie S palier etaj). Fără stâlp. Nu intră în rampă2 Y590+. Decisive: torsiune/nod — calcul lipsă |
| B_CASA_SCARA | X536.3–566.3 Y610–860 | S,P,E | C_CASA_SCARA, C_S_INTRARE_E | separator Y610→sud; nod cu B_Y830 |
| B_Y590_EDGE_INVERTED | X566.3–681.3 Y575–590 | S_inverted | C_SHAFT_E_PIER, placa_parter_span_to_sep, B_SEP_AFTER_DOOR | E→C_SHAFT_E_PIER (zid est); W→placă parter (întoarsă) → diafragmă/separator S de ușă (B_SEP_AFTER_DOOR+C_CASA_SCARA). Ușă Y500–600 și palier Y490–600 fără stâlp. |
| B_SEP_AFTER_DOOR | X536.3–566.3 Y600–610 | S,P | zid_separator, C_CASA_SCARA | buiandrug/centură S de ușă Y600–610 — preia traseul de la placa peste palier către C_CASA_SCARA; nu blochează golul |
| B_Y645 | X10.5–361.3 Y645–675 | P,E | C_W_DORM, C_S_DORM_E | sud dorm — prin secțiunile stâlpilor de capăt |
| B_X360_DORM_INTRARE | X331.3–401.3 Y645–850.8 | P,E | C_S_DORM_E, C_S_INTRARE_W | STUDIU: dx=70 = pad prin C_S_DORM_E + C_S_INTRARE_W nealiniați; lățime structurală tip 30 — conflict geometric / soluție explicită |
| B_Y830 | X361.3–566.3 Y830–860 | P,E | C_S_INTRARE_W, C_S_INTRARE_E | sud intrare prin secțiunea C_S_INTRARE_E (X535–565), nod cu B_CASA_SCARA |
| B_Y470_PALIER_EDGE | X536.3–681.3 Y470–500 | P | C_E_PAL, B_E | bordură N placă palier la PLANȘEU (levels P = intrados etaj, nu streșină). Capăt V fără stâlp — calcul lipsă. NU vestibul. |

## Tabel elemente (stâlpi + grinzi)

| Tip | ID | Reazeme / sprijin | Niveluri | Conflict amenajare | Soluție propusă |
|-----|----|-------------------|----------|--------------------|-----------------|
| stalp | C_NW | fundație_N/W | S/P/E | duș decupat local în frame — nu micșorăm stâlpul | dus x≥50 |
| stalp | C_N_MID | fundație_N | S/P/E | alternativă: fără C_N_MID (doar NW+NE) — comparație | nord X320–360 — rost vest de frigider_p@X360 |
| stalp | C_NE | fundație_E | S/P/E | proeminență în capăt blat_tail_p — capăt mobilier adaptat | est N de geam |
| stalp | C_W_MID | fundație_W | S/P/E | pat x≥45 în frame — rezervă montaj/tăblie | pat x≥45 |
| stalp | C_W_DORM | fundație_S | S/P/E | gol terasă X120–270 | sud dorm W — ETICS Y665.8–675 continuă peste stâlp |
| stalp | C_S_DORM_E | fundație_S | S/P/E | proximitate circulație / ușă terasă | capăt E sud dorm @ X360 — ETICS continuă afară |
| stalp | C_E_GEAM_S | fundație_E | S/P/E | — | est S de geam |
| stalp | C_E_PAL | fundație_E continuu — NU pe placă 15 | S/P/E | proeminență pe palier etaj Y470–489 — recalcul lățime utilă | est sub palier scară / N de palier inferior |
| stalp | C_CASA_SCARA | fundație X535 | S/P/E | — | separator X535–565; fără proeminență vest (eliberează frigider/MSV etaj) |
| stalp | C_SHAFT_E_PIER | diafragmă est puț | S | — | pier sub capăt E grindă întoarsă — în zid, nu în clar X565–665 |
| stalp | C_S_INTRARE_W | fundație_S_intrare (bandă dedicată) | S/P/E | — | sud intrare X360–535 — ETICS continuă |
| stalp | C_S_INTRARE_E | fundație_S | S/P/E | — | sud @ X535 — ETICS continuă afară |
| grinda | B_N | C_NW, C_N_MID, C_NE | P/E | — | centură N — 3 reazeme (fără C_N_BUC); deschideri de dimensionat |
| grinda | B_W | C_NW, C_W_MID, C_W_DORM | P/E | — | centură W prin nodul C_W_DORM (nu se oprește la fața nord a stâlpului) |
| grinda | B_E | C_NE, C_E_GEAM_S, C_E_PAL | P/E | — | centură E prin C_E_PAL + consolă sud până Y590 (muchie S palier etaj). Fără stâlp. Nu intră în rampă2 Y590+. Decisive: torsiune/nod — calcul lipsă |
| grinda | B_CASA_SCARA | C_CASA_SCARA, C_S_INTRARE_E | S/P/E | — | separator Y610→sud; nod cu B_Y830 |
| grinda | B_Y590_EDGE_INVERTED | C_SHAFT_E_PIER, placa_parter_span_to_sep, B_SEP_AFTER_DOOR | S_inverted | traseu incarcari — calcul | ansamblu muchie puț — nu etichetă via_slab goală |
| grinda | B_SEP_AFTER_DOOR | zid_separator, C_CASA_SCARA | S/P | — | buiandrug/centură S de ușă Y600–610 — preia traseul de la placa peste palier către C_CASA_SCARA; nu blochează golul |
| grinda | B_Y645 | C_W_DORM, C_S_DORM_E | P/E | — | sud dorm — prin secțiunile stâlpilor de capăt |
| grinda | B_X360_DORM_INTRARE | C_S_DORM_E, C_S_INTRARE_W | P/E | — | STUDIU: dx=70 = pad prin C_S_DORM_E + C_S_INTRARE_W nealiniați; lățime structurală tip 30 — conflict geometric / soluție explicită |
| grinda | B_Y830 | C_S_INTRARE_W, C_S_INTRARE_E | P/E | — | sud intrare prin secțiunea C_S_INTRARE_E (X535–565), nod cu B_CASA_SCARA |
| grinda | B_Y470_PALIER_EDGE | C_E_PAL, B_E | P | — | bordură N placă palier la PLANȘEU (levels P = intrados etaj, nu streșină). Capăt V fără stâlp — calcul lipsă. NU vestibul. |

## Suprafețe utile (P și E separate) — NECONFIRMAT
Metodă: P/E separate: shoelace − pereți − thermal − proem.; E = studio; palier scară rece raportat separat (NU vestibul); NU usefulE=usefulP

| | m² |
|--|---:|
| Util parter (studiu) | 38.505 |
| Util etaj studio | 37.86 |
| Palier scară rece (exclus din util; nu vestibul) | 1.26 |
| Pereți int net P / E | 1.156 / 1.231 |
| Proeminențe stâlpi P / E | 0.369 / 0.369 |
| Thermal P / E | 0.255 / 0.255 |
| Δ vs 37 (informativ) | 1.505 / 0.86 |
| Verdict util | **NECONFIRMAT** (declared_pass=false) |

## Transport palier (stâlpi + finisaje)
Status: **NECONFIRMAT** · declared_pass_access=false
- Niciun stâlp pe AABB palier inferior după mutarea C_E_PAL N de Y490
- Coliziuni: intoarcere_15[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,finisaj_zid_w,treapta_7]; intoarcere_30[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,finisaj_zid_w,treapta_7]; intoarcere_45[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,finisaj_zid_w,zid_put_n,finisaj_zid_n,foaie_deschisa_hol,treapta_7,stalp_C_CASA_SCARA]; intoarcere_60[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,finisaj_zid_w,foaie_deschisa_hol,treapta_7]; intoarcere_75[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,finisaj_zid_w,foaie_deschisa_hol,treapta_7]; intoarcere_90[finisaj_zid_w,foaie_deschisa_hol]; in_gol_usa[finisaj_zid_w,foaie_deschisa_hol]; in_hol[foaie_deschisa_hol]
- TRANSPORT / ACCES = NECONFIRMAT

## Conflicte nerezolvate (păstrate explicit)
- **east_landing_span** (STUDIU_CONSOLA): Placă podest consolă transversală pe B_E (Y489→590). Fără stâlp living/puț. Torsiune, ancorare, nod C_E_PAL, ridicare pe C_E_GEAM_S = de verificat prin calcul — nu demonstrate.
- **palier_plate_support** (STUDIU_CONSOLA): P: living sub podest. E: circulație rece. Reazem consolă + C_E_PAL/B_Y470; pachet termic/acustic distinct — nu dublură beton.
- **slab_span_without_X320** (COMPARATIE_15_20): L/d pe fâșie = semnal de verificare, NU demonstrație SLS fail. Compară 15 vs 20 pe schemă reală (2D, goluri, armare, fisurare, lungă durată) cu săgeți calculate. Nu adopta 25–28 fără impact FF288. Fără grindă A7 ca primă opțiune.
- **inverted_beam_fit** (DESCHIS_CALCUL): Capăt V grindă întoarsă pe buiandrug 15 cm / gap vs B_SEP — nerezolvat complet. E→C_SHAFT_E_PIER OK geometric.
- **basement_retaining** (CRITIC): Pereți retenție = EB20 umplutură în model. Demolare integrală 131 (inclusiv beci/fundații existente). Subsol+pereți BA+fundații NOI. Ipoteză geo vecinătate — decisions/geotech_hypothesis_v01.md.
- **roof_load_path** (DESCHIS): Stâlpișori: contact geometric parțial cu grinzi la +581 — nu „plutitori absenți”. Capacitate/excentricitate nevalidate. Completare căpriori pe E; comparație șarpantă ușoară vs BA. Fără stâlpi noi în camere.
- **foundations_width** (DESCHIS): FG = lățime grindă = preliminar insuficient geometric. Pconv 310 kPa = reper vecinătate 120, nu Rc calcul 131. Nu declara conform/neconform din ~250 kPa ordin.
- **north_three_supports** (COMPARATIE): C_N_BUC eliminat. C_N_MID@X320. B_N pe NW–N_MID–NE. Alternativa: fara N_MID.
- **amenajare_frame_overlays** (FRAME_ONLY): A1 aprobat neatins. In frame: dus x>=50; pat x>=45 — nu micsoram stalpii.
- **column_30_protrusion_vs_37m2** (DESCHIS): Proeminențe locale; util P/E = NECONFIRMAT — nu e rezervă stâlpi.
- **p100_min_section** (IPOTEZĂ): 30 cm transversal = studiu preliminar P100; aplicabilitate pe sistem/ductilitate — nu validat.
- **etics_wrap_verify** (DESCHIS): Grinzi/stâlpi pe banda ETICS (+9,2 pe S) — corecție geometrică necesară; detalii șantier neconfirmate.
- **B_X360_wide_pad** (DESCHIS): dx=70 pentru reazeme decalate — necesită soluție structurală explicită (aliniere sau grindă pe ax).

## Fișiere
- `data/building/v47_a1_frame_study.json`
- `viewer/data/volume_v47_a1_frame.json` → `?v=v47_a1_frame`
- `outputs/plans/36_v47_a1_frame_structure_overlay.svg`
- `outputs/plans/37_v47_a1_frame_sections.svg`
- `outputs/reports/v47_a1_frame_structure.md`

Amenajarea `v47_a1_study` / `?v=v47_a1` rămâne referința aprobată (fără pereți structurali).
