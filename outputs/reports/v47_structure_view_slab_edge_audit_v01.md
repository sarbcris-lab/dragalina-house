# Audit view Structură — muchie placă vs stâlpi E/S

**Dată:** 2026-10-17 · Variantă: A1_FRAME · Status: studiu corectat (neconstruibil)

## Problema (beneficiar)

În view Structură, stâlpii pe **est** și **sud** nu stăteau pe muchia plăcii → părea **umplutură groasă** + **placă proeminentă** peste beton.

## Cauză

După LOCK fațadă E/S plan (beton = finit−A2):

| Contur | E (cm) | S (cm) |
|--------|--------|--------|
| Anvelopă finită (POT / ETICS) | 682,6 | 861,3 |
| Beton stâlpi CONC | **672,1** | **850,8** |

Mesh-urile `subsol_intrados_placa` și `etaj_placa_structura` foloseau încă `envelope_cm` (finit), deci consolă falsă **+10,5 cm** pe E și pe S față de fața beton a stâlpilor.

## Fix

- `structure_frame_study_cm.structural_footprint_cm` = dreptunghi CONC (0→672,1 × 0→850,8).
- Plăcile pe `site_layer: structura` extrudate pe acest footprint; ETICS rămâne în afara plăcii BA.
- POT / amprentă finită **neschimbate** (58,7923 m²).

## Verificare post-regen

| Check | Rezultat |
|-------|----------|
| Muchii placă structură (m→cm) | 672,1 × 850,8 |
| Stâlpi pe E @ x1=672,1 | C_NE, C_E_GEAM_S, C_E_PAL, C_SHAFT_E_PIER |
| Stâlpi pe S @ y1=850,8 | C_S_INTRARE_W, C_S_INTRARE_E |
| Consolă placă vs CONC | **0** (era +10,5 pe E/S) |
| Consolă finit vs CONC (ETICS) | +10,5 cm — corect, nu e BA |

## Regula canonică (view Structură)

**Muchie placă BA = față beton stâlpi perimetrali.** Umplutura (EB20) și ETICS nu lărgesc placa structurală.
