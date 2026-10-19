# S1 A1 — Acoperire calcule (gaps fill)

**Status:** Maximul calculabil în repo pe schema A1 — NU proiect 100% semnat  
**Generat:** 2026-10-18T19:59:00

## Răspuns scurt

Am putut face în repo **12** blocuri de calcul ordin.  
**Nu** am putut (și nu pretindem): **5** — FEM, seism pe bare, confinare P100 detaliată, Rc pe 131, combinații CR0 oficial.

Decizia **NO_LAMELE** rămâne validă pe calculele de grindă SE; asta nu înseamnă „structura e 100% proiect”.

---

## Matrice

| ID | În repo? | Unde | Limită |
|----|:--------:|------|--------|
| 2.1_stalp_N_M | **da** | s1_a1_calc_100_v01 | fără flambaj/P100 confinare detaliată |
| 2.2_consola_C_E_PAL | **da** | acest fișier | ordin; FE nod rămâne |
| 2.3_placa | **da** | s1_a1_calc_100_v01 | L/d + δ fisurat ordin |
| 2.4_grinzi | **da** | s1_a1_calc_100_v01 | simplu rezemat; continuu ar reduce M |
| 2.5_intoarsa | **da** | s1_a1_calc_100_v01 | flex ordin; sandwich/ancorare FE |
| 2.6_fundatii_pad | **da** | s1_a1_calc_100_v01 | σ vs 200 kPa studiu |
| 2.6_retentie_impigere | **da** | acest fișier | fără apă/seism pe zid |
| 2.7_acoperis_D3 | **da** | acest fișier | comparație greutate, nu FEM |
| SE_LAMELE_decizie | **da** | s1_a1_calc_100_v01 | NO_LAMELE adoptat |
| pier_clear | **da** | acest fișier | audit geometric |
| riser_beci | **da** | acest fișier | vs brief — nu rezistență |
| seism_Vb | **da** | s1_a1_calc_100_v01 | doar Vb global |
| seism_pe_elemente | nu | — | cere model FEM / P100 complet |
| P100_confinare_zone | nu | — | detaliu armare — proiectant |
| geo_131_Rc | nu | — | lipsă studiu teren pe parcelă |
| FEM_Robot_etc | nu | — | în afara acestui repo |
| combinatii_CR0_oficial | nu | — | folosim q_Ed agregat 11.78 |

---

## 2.2 Consolă / nod C_E_PAL (A1)

| | |
|--|--|
| L_S (spre puț) | **1.387** m |
| L_W (spre A6) | **1.045** m |
| Placă S M | 11.5 kNm/m |
| Placă W M | 6.5 kNm/m |
| B_E consolă M/V | 12 / 17.3 |
| T / M_nod | 6.5 / 15.3 kNm |
| Păstrează 30×40 | **true** |
| Pass ordin | **true** |
| Notă | Eforturi modeste; riscul = detaliu torsiune/ancorare — FE nod obligatoriu (ca pe FRAME) |

---

## 2.6 Retenție (împingere)

| | |
|--|--|
| H | 2.5 m |
| Pa | **22.7** kN/m |
| M | **18.9** kNm/m |
| μ perete A11 | **0.015** → pass flex **true** |
| Notă | împingere activă simplă; fără apă/hidrostatic, fără seism pe zid — geo_131 deschis |

---

## 2.7 Acoperiș D3a vs D3b

| | D3a ușoară | D3b BA |
|--|----------:|---------:|
| q_Ed | 3.4 | 6.98 |
| W pe 58.79 m² | **200** kN | **410** kN |
| Δ | | **+210** kN |

FE întâi D3a (ușoară); D3b sensibilitate — lock D3

---

## Pier clear / riser

| | Valoare | Pass |
|--|--------:|:----:|
| Clear @pier | 95.7 cm (țintă 100) | **false** |
| Riser beci | 17.22 vs brief 16 | **false** |

clear 95.7 < 100 — acceptat ca avertisment sau mută pier  
DESCHIS — 17.22 > 16 brief; tradeoff: +1 treaptă / acceptare

---

## Ce rămâne în afara repo-ului

1. Model FEM (Robot/Axis/…) pe schema `structure_a1_study_cm`  
2. Seism pe elemente + confinare P100  
3. Studiu geo **Rc pe 131**  
4. Detaliu nod C_E_PAL (torsiune) semnat  
5. Decizie brief riser 17,22 vs 16  

JSON: `outputs/reports/s1_a1_calc_gaps_v01.json`
