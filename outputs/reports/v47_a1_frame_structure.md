# V47 A1 FRAME — studiu structural corectat (cadre BA)

## Status
**NECONSTRUIBIL / NEVALIDAT.** Variantă separată față de A1 amenajare aprobată.
Sistem: **cadre beton armat** + **EB20** + **vată 80 mm**. **Nu** pereți structurali P/E.

## Priorități rezolvate în geometrie
1. **Scară/ușă/palier:** `C_E_SOLID_N` Y550–590 (N de rampă); `C_CASA_SCARA` Y610+ (după gol); ușă Y500–600 liberă.
2. **Grindă muchie:** din schemă X565–680, mod **întoarsă** z −30…−5 (nu coborâre −70 pe clar) — încăpere în sandwich = calcul.
3. **Cote volum = JSON:** placă +293→+308; grindă totală 35 → intrados +273.
4. **Util P ≠ E** (contururi separate + proeminențe).

## Secțiuni stâlpi
- Preliminar **30×40 cm** + proeminență locală **10 cm** spre interior.
- Perete finit **30 cm** păstrat; ETICS continuă afară.
- *De confirmat prin calcul și cerințe normative* (P100 — aplicabilitate pe sistem/ductilitate).
- **Nu** demonstrăm încadrarea în banda de 20 cm.

## Eliminat / mutat
- `part_mid`: compartimentare 12,5 — nestructural
- `pal_nw`: etaj-only peste living — interzis
- `pal_ne`: înlocuit de C_E_PAL continuu
- `C_E_PUT@Y590`: îngusta scara X565–665 pe Y590–630 — mutat N ca C_E_SOLID_N
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
| C_W_DORM | X9.2–49.2 Y645–675 | 40×30 (proem. 10) | S–P–E | fundație_S | gol terasă X120–270 |
| C_S_DORM_E | X330–360 Y645–675 | 30×30 (proem. 10) | S–P–E | fundație_S | proximitate circulație / ușă terasă |
| C_E_GEAM_S | X640–670 Y310–350 | 30×40 (proem. 10) | S–P–E | fundație_E | — |
| C_E_PAL | X640–670 Y470–510 | 30×40 (proem. 10) | S–P–E | fundație_E continuu — NU pe placă 15 | înlocuiește pal_ne etaj-only |
| C_E_SOLID_N | X640–670 Y550–590 | 30×40 (proem. 10) | S–P–E | fundație_E | — |
| C_CASA_SCARA | X535–565 Y610–650 | 30×40 (proem. 0) | S–P–E | fundație X535 | — |
| C_S_INTRARE_W | X360–400 Y830–860 | 40×30 (proem. 0) | S–P–E | fundație_S_intrare | — |
| C_S_INTRARE_E | X535–565 Y830–860 | 30×30 (proem. 0) | S–P–E | fundație_S | — |

## Cote etaj / planșeu
Extrudările 3D TREBUIE să folosească aceste cote: placă +293→+308; grindă intrados +273; FF +320; buildup 12 separat.

| Cotă | cm |
|------|---:|
| FF etaj | 320 |
| Față sup. placă | 308 |
| Intrados placă | 293 |
| Intrados grindă (h total 35) | 273 |
| Clear P sub grindă | 241 |

## Suprafețe utile (P și E separate)
Metodă: P: shoelace(polyP)−pereți_int_net−thermal−proeminențe; E: shoelace(polyE)−pereți_int_net−proeminențe (NU usefulE=usefulP)

| | m² |
|--|---:|
| Util parter | **38.549** |
| Util etaj | **39.254** |
| Proeminențe stâlpi P / E | 0.35 / 0.35 |
| Închidere termică Y590 | 0.255 |
| Prag 37 | 37 |
| Δ P vs 37 | **1.549** (pass=true) |
| Δ E vs 37 | **2.254** (pass=true) |

## Conflicte nerezolvate (păstrate explicit)
- **inverted_beam_fit** (DESCHIS_CALCUL): Grindă întoarsă Y575–590 X565–680 (schema), z −30…−5: eliberează clear acces (fără intrados −70). Trebuie verificat dacă încape în pachetul −30…+32 fără obstacole în living. Nu e rezolvare garantată.
- **column_30_protrusion_vs_37m2** (DESCHIS): Secțiuni preliminare 30×40 cu ~10 cm proeminență locală. Compatibilitatea cu pragul 37 m² se demonstrează după scăderea intruziunilor — nu pe baza vechiului 20×40 în falie 20.
- **vestibule_cantilever** (DESCHIS): B_Y470 fără stâlp P în living: sprijin pe cadrul est continuu + consolă/legătură — de dimensionat.
- **north_span_option** (COMPARȚIE): C_N_MID introdus pentru a reduce deschiderea N; alternativa = grindă N pe deschidere mai mare fără C_N_MID — alegere după calcul seismic/grinzi.
- **slab_span_without_X320** (DESCHIS): Fără reazem pe compartimentarea 12,5 cm — placă/grinzi pe perimetru; grosime 15 cm neconfirmată.
- **basement_retaining** (SEPARAT): Pereți subsol retenție teren — sistem separat de cadrele P/E.
- **p100_min_section** (IPOTEZĂ): 30 cm pe direcție transversală = studiu preliminar legat de cerințe geometrice tip P100 pentru cadre; aplicabilitatea exactă depinde de sistem și clasa de ductilitate — nu validat.

## Fișiere
- `data/building/v47_a1_frame_study.json`
- `viewer/data/volume_v47_a1_frame.json` → `?v=v47_a1_frame`
- `outputs/plans/36_v47_a1_frame_structure_overlay.svg`
- `outputs/plans/37_v47_a1_frame_sections.svg`
- `outputs/reports/v47_a1_frame_structure.md`

Amenajarea `v47_a1_study` / `?v=v47_a1` rămâne referința aprobată (fără pereți structurali).
