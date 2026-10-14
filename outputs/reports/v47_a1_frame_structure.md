# V47 A1 FRAME — studiu structural corectat (cadre BA)

## Status
**NECONSTRUIBIL / NEVALIDAT.** Variantă separată față de A1 amenajare aprobată.
Sistem: **cadre beton armat** + **EB20** + **vată 80 mm**. **Nu** pereți structurali P/E.

## Priorități geometrie
1. **Palier inferior liber:** `C_E_SOLID_N` eliminat; `C_E_PAL` Y450–490 (N de Y490); `C_CASA_SCARA` Y610+; ușă Y500–600 liberă.
2. **ETICS:** stâlpi sud inset — bandă vată **9.2 cm** pe fața exterioară; wrap 3D.
3. **Cote volum = JSON:** placă +293→+308; grindă intrados +273.
4. **Util P ≠ E:** pereți pe nivel; fără terasă/acces exterior; **status NECONFIRMAT — fără PASS**.
5. **Transport:** refăcut cu stâlpi + finisaje — **NECONFIRMAT / fără PASS acces**.

## Secțiuni stâlpi
- Preliminar **30×40 cm** + proeminență locală **10 cm** spre interior.
- Perete finit **30 cm**; ETICS continuă **peste** stâlpi (nu înlocuită de beton).
- *De confirmat prin calcul și cerințe normative* (P100 — aplicabilitate pe sistem/ductilitate).

## Eliminat / mutat
- `part_mid`: compartimentare 12,5 — nestructural
- `pal_nw`: etaj-only peste living — interzis
- `pal_ne`: înlocuit de C_E_PAL continuu
- `C_E_PUT@Y590`: îngusta scara — eliminat
- `C_E_SOLID_N@Y550`: intra în palierul inferior Y490–600 (X640–670 ∩ clar); retras — rol preluat de C_E_PAL Y450–490 N de palier
- `C_CASA_SCARA@Y590`: intersecta gol ușă — mutat la Y610+
- `grinda_X320`: nu pe fală compartimentare
- `pereți_structurali_P_E`: respins — doar cadre
- `20x40_in_20cm_leaf`: nu demonstrăm încadrarea în banda de 20 cm; studiem 30 cm + proeminență locală

## Tabel stâlpi

| ID | Poziție (cm) | Secțiune + proem. | Niveluri | Reazem inferior | Conflicte |
|----|--------------|-------------------|----------|-----------------|-----------|
| C_NW | X9.2–49.2 Y9.2–39.2 | 40×30 (proem. 10) | S–P–E | fundație_N/W | — |
| C_N_MID | X280–320 Y9.2–39.2 | 40×30 (proem. 10) | S–P–E | fundație_N | verificare goluri/ferestre nord |
| C_N_BUC | X535–565 Y9.2–39.2 | 30×30 (proem. 0) | S–P–E | fundație_N | — |
| C_NE | X640–670 Y9.2–49.2 | 30×40 (proem. 10) | S–P–E | fundație_E | geam ~Y105–310 — doar în plin |
| C_W_MID | X9.2–39.2 Y400–440 | 30×40 (proem. 10) | S–P–E | fundație_W | — |
| C_W_DORM | X9.2–49.2 Y635.8–665.8 | 40×30 (proem. 9.200000000000045) | S–P–E | fundație_S | gol terasă X120–270 |
| C_S_DORM_E | X330–360 Y635.8–665.8 | 30×30 (proem. 9.200000000000045) | S–P–E | fundație_S | proximitate circulație / ușă terasă |
| C_E_GEAM_S | X640–670 Y310–350 | 30×40 (proem. 10) | S–P–E | fundație_E | — |
| C_E_PAL | X640–670 Y449–489 | 30×40 (proem. 10) | S–P–E | fundație_E continuu — NU pe placă 15 | — |
| C_CASA_SCARA | X535–565 Y610–650 | 30×40 (proem. 0) | S–P–E | fundație X535 | — |
| C_S_INTRARE_W | X360–400 Y820.8–850.8 | 40×30 (proem. 9.200000000000045) | S–P–E | fundație_S | — |
| C_S_INTRARE_E | X535–565 Y820.8–850.8 | 30×30 (proem. 9.200000000000045) | S–P–E | fundație_S | — |

## Cote etaj / planșeu
Extrudările 3D TREBUIE să folosească aceste cote: placă +293→+308; grindă intrados +273; FF +320; buildup 12 separat.

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
| Util parter (studiu) | 38.605 |
| Util etaj (studiu) | 38.98 |
| Pereți int net P / E | 1.056 / 1.131 |
| Proeminențe stâlpi P / E | 0.369 / 0.369 |
| Thermal P / E | 0.255 / 0.255 |
| Δ vs 37 (informativ) | 1.605 / 1.98 |
| Verdict util | **NECONFIRMAT** (declared_pass=false) |

## Transport palier (stâlpi + finisaje)
Status: **NECONFIRMAT** · declared_pass_access=false
- Niciun stâlp pe AABB palier inferior după mutarea C_E_PAL N de Y490
- Coliziuni: intoarcere_15[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,finisaj_zid_w,treapta_7]; intoarcere_30[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,finisaj_zid_w,foaie_deschisa_hol,treapta_7]; intoarcere_45[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,finisaj_zid_w,zid_put_n,finisaj_zid_n,foaie_deschisa_hol,treapta_7,stalp_C_CASA_SCARA]; intoarcere_60[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,finisaj_zid_w,foaie_deschisa_hol,treapta_7]; intoarcere_75[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,finisaj_zid_w,foaie_deschisa_hol,treapta_7]; intoarcere_90[finisaj_zid_w,foaie_deschisa_hol]; in_gol_usa[finisaj_zid_w,foaie_deschisa_hol]; in_hol[foaie_deschisa_hol]
- TRANSPORT / ACCES = NECONFIRMAT

## Conflicte nerezolvate (păstrate explicit)
- **inverted_beam_fit** (DESCHIS_CALCUL): Grindă întoarsă Y575–590 X565–680 (schema), z −30…−5: eliberează clear acces (fără intrados −70). Trebuie verificat dacă încape în pachetul −30…+32 fără obstacole în living. Nu e rezolvare garantată.
- **east_landing_span** (DESCHIS): Fără stâlp est pe palier inferior Y490–600 / scară Y600–800 (proeminența ar reduce clarul). Deschidere pe C_E_PAL (Y450–490) → sud — de dimensionat.
- **column_30_protrusion_vs_37m2** (DESCHIS): Secțiuni preliminare 30×40 cu ~10 cm proeminență locală. Compatibilitatea cu pragul 37 m² = NECONFIRMAT până la reuniune CAD.
- **vestibule_cantilever** (DESCHIS): B_Y470 fără stâlp P în living: sprijin pe cadrul est continuu + consolă/legătură — de dimensionat.
- **north_span_option** (COMPARȚIE): C_N_MID introdus pentru a reduce deschiderea N; alternativa = grindă N pe deschidere mai mare fără C_N_MID — alegere după calcul seismic/grinzi.
- **slab_span_without_X320** (DESCHIS): Fără reazem pe compartimentarea 12,5 cm — placă/grinzi pe perimetru; grosime 15 cm neconfirmată.
- **basement_retaining** (SEPARAT): Pereți subsol retenție teren — sistem separat de cadrele P/E.
- **p100_min_section** (IPOTEZĂ): 30 cm pe direcție transversală = studiu preliminar legat de cerințe geometrice tip P100 pentru cadre; aplicabilitatea exactă depinde de sistem și clasa de ductilitate — nu validat.
- **etics_wrap_verify** (DESCHIS): Stâlpi sud inset cu bandă ETICS 9,2 cm pe fața exterioară; 3D extrudează wrap vată peste stâlpi. Continuitate reală pe șantier = detalii (colțuri, plasă, dibluri) — neconfirmat.

## Fișiere
- `data/building/v47_a1_frame_study.json`
- `viewer/data/volume_v47_a1_frame.json` → `?v=v47_a1_frame`
- `outputs/plans/36_v47_a1_frame_structure_overlay.svg`
- `outputs/plans/37_v47_a1_frame_sections.svg`
- `outputs/reports/v47_a1_frame_structure.md`

Amenajarea `v47_a1_study` / `?v=v47_a1` rămâne referința aprobată (fără pereți structurali).
