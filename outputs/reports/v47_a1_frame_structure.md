# V47 A1 FRAME — studiu structural corectat (cadre BA)

## Status
**NECONSTRUIBIL / NEVALIDAT.** Variantă separată față de A1 amenajare aprobată.
Sistem: **cadre beton armat** + **EB20** + **vată 80 mm**. **Nu** pereți structurali P/E.

## Priorități geometrie (implementate din audit confirmat)
1. **Stâlpi continui** prin nod placă/pardoseală (fără gap +293…+320); pardoseala decupată la stâlpi.
2. **C_N_BUC eliminat** (aparete bucătărie); B_N pe 3 reazeme; C_N_MID mutat X370 (în afara blatului baie).
3. **C_NW** redus ca să elibereze dușul; **C_CASA_SCARA** beton spre încălzit + vată pe fața rece.
4. **Noduri:** B_Y830 prin C_S_INTRARE_E; B_X360_DORM_INTRARE; B_LINK_INVERTED_W; B_W prin C_W_DORM.
5. **Fundație S intrare** + benzi pe schema stâlpilor.
6. **Util / transport = NECONFIRMAT** — fără PASS.

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
| C_NW | X9.2–30 Y9.2–30 | 20.8×20.8 (proem. 0) | S–P–E | fundație_N/W | secțiune < 30×40 la colț — IPOTEZĂ amenajare |
| C_N_MID | X370–410 Y9.2–39.2 | 40×30 (proem. 10) | S–P–E | fundație_N | verificare goluri/ferestre nord living |
| C_NE | X640–670 Y9.2–49.2 | 30×40 (proem. 10) | S–P–E | fundație_E | proeminență în capăt blat_tail_p — integrare mobilier |
| C_W_MID | X9.2–37.2 Y400–440 | 28×40 (proem. 7.2) | S–P–E | fundație_W | gap beton→pat ~2,8 cm înainte de finisaj — verifică tăblia |
| C_W_DORM | X9.2–49.2 Y635.8–665.8 | 40×30 (proem. 9.200000000000045) | S–P–E | fundație_S | gol terasă X120–270 |
| C_S_DORM_E | X330–360 Y635.8–665.8 | 30×30 (proem. 9.200000000000045) | S–P–E | fundație_S | proximitate circulație / ușă terasă |
| C_E_GEAM_S | X640–670 Y310–350 | 30×40 (proem. 10) | S–P–E | fundație_E | — |
| C_E_PAL | X640–670 Y449–489 | 30×40 (proem. 10) | S–P–E | fundație_E continuu — NU pe placă 15 | proeminență pe palier etaj Y470–489 — recalcul lățime utilă |
| C_CASA_SCARA | X525–555 Y610–650 | 30×40 (proem. 10) | S–P–E | fundație X535 | verifică frigider/front bucătărie E față de X525 |
| C_S_INTRARE_W | X360–400 Y820.8–850.8 | 40×30 (proem. 9.200000000000045) | S–P–E | fundație_S_intrare (bandă dedicată) | — |
| C_S_INTRARE_E | X535–565 Y820.8–850.8 | 30×30 (proem. 9.200000000000045) | S–P–E | fundație_S | — |

## Cote etaj / planșeu
Placă +293→+308; grindă +273; FF +320; buildup 12. Stâlpi P+E = continui prin nod (beton până la FF etaj / mai sus); pardoseala se decupează.

| Cotă | cm |
|------|---:|
| FF etaj | 320 |
| Față sup. placă | 308 |
| Intrados placă | 293 |
| Intrados grindă (h total 35) | 273 |
| Clear P sub grindă | 241 |

## Suprafețe utile (P și E separate) — NECONFIRMAT
Metodă: P/E separate: shoelace(poly nivel) − pereți_int ai nivelului − thermal pe nivel − proeminențe stâlpi; fără terasă/acces exterior; NU usefulE=usefulP

| | m² |
|--|---:|
| Util parter (studiu) | 38.616 |
| Util etaj (studiu) | 38.991 |
| Pereți int net P / E | 1.056 / 1.131 |
| Proeminențe stâlpi P / E | 0.358 / 0.358 |
| Thermal P / E | 0.255 / 0.255 |
| Δ vs 37 (informativ) | 1.616 / 1.991 |
| Verdict util | **NECONFIRMAT** (declared_pass=false) |

## Transport palier (stâlpi + finisaje)
Status: **NECONFIRMAT** · declared_pass_access=false
- Niciun stâlp pe AABB palier inferior după mutarea C_E_PAL N de Y490
- Coliziuni: intoarcere_15[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,finisaj_zid_w,treapta_7]; intoarcere_30[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,finisaj_zid_w,foaie_deschisa_hol,treapta_7]; intoarcere_45[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,finisaj_zid_w,zid_put_n,finisaj_zid_n,foaie_deschisa_hol,treapta_7,stalp_C_CASA_SCARA]; intoarcere_60[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,finisaj_zid_w,foaie_deschisa_hol,treapta_7]; intoarcere_75[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,finisaj_zid_w,foaie_deschisa_hol,treapta_7]; intoarcere_90[finisaj_zid_w,foaie_deschisa_hol]; in_gol_usa[finisaj_zid_w,foaie_deschisa_hol]; in_hol[foaie_deschisa_hol]
- TRANSPORT / ACCES = NECONFIRMAT

## Conflicte nerezolvate (păstrate explicit)
- **inverted_beam_fit** (DESCHIS_CALCUL): Grindă întoarsă + B_LINK_INVERTED_W @ X535: eliberează clear acces; fit sandwich −30…+32 și dimensionare legătură vest = calcul.
- **east_landing_span** (DESCHIS): Un singur reazem est C_E_PAL (Y449–489). Deschidere spre sud fără stâlp pe palier/scară — de dimensionat.
- **north_three_supports** (COMPARȚIE): C_N_BUC eliminat (aparate). B_N pe C_NW–C_N_MID–C_NE. Alternativă: al 4-lea reazem doar în rost real între corpuri după redesen mobilier.
- **C_NW_reduced_section** (IPOTEZĂ): C_NW redus ca să nu intre în duș; secțiune ≠ 30×40 — de confirmat sau duș decupat.
- **column_30_protrusion_vs_37m2** (DESCHIS): Proeminențe locale; util P/E = NECONFIRMAT — nu e rezervă stâlpi.
- **vestibule_cantilever** (DESCHIS): B_Y470 = acoperire vestibul; placa palierului +320 necesită schemă de sprijin separată — neconfirmat.
- **slab_span_without_X320** (DESCHIS): Fără reazem pe compartimentarea 12,5 cm — placă/grinzi pe perimetru; grosime 15 cm neconfirmată.
- **basement_retaining** (SEPARAT): Pereți subsol retenție teren — sistem separat de cadrele P/E.
- **p100_min_section** (IPOTEZĂ): 30 cm transversal = studiu preliminar P100; aplicabilitate pe sistem/ductilitate — nu validat.
- **etics_wrap_verify** (DESCHIS): ETICS peste stâlpi în model; detalii șantier neconfirmate.

## Fișiere
- `data/building/v47_a1_frame_study.json`
- `viewer/data/volume_v47_a1_frame.json` → `?v=v47_a1_frame`
- `outputs/plans/36_v47_a1_frame_structure_overlay.svg`
- `outputs/plans/37_v47_a1_frame_sections.svg`
- `outputs/reports/v47_a1_frame_structure.md`

Amenajarea `v47_a1_study` / `?v=v47_a1` rămâne referința aprobată (fără pereți structurali).
