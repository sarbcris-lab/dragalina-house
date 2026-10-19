# S1 — envelope retenție din A1 (handoff)

**Generat din:** `data/building/a1_architecture.json` · `basement_cm`  
**Dată:** 2026-10-18 · A1.165–168  
**Status:** input S1 — FRAME mesh vechi = **STALE**

---

## Cutie încălzită (retenție principală)

| | cm |
|--|-----|
| x0 (față int. V) | **30** |
| x1 (față int. E = V A6) | **534,3** |
| y0 (față int. N) | **30** |
| y1 (față int. S) | **820** |
| Catalog perimetru | **A11** (32,6 finit) |
| FF beci | **−250** |
| Clear țintă | **220** |

**Exclude:** terasă; bandă scară rece ca „cameră” (doar puț).

**Colțuri:** N/S pe span exterior (inclusiv grosime V/E).

---

## Puț scară beci (incintă)

| | cm |
|--|-----|
| x0 | **564,3** (E A6) |
| x1 | **668,8** |
| y0 | **490,7** (N palier −250) |
| y1 | **858,7** |
| Ziduri | N + E = A11 |
| Vest | = retenție E cutie + ușă |
| Sud | deschis → curte |

---

## Stâlpi pe cutie (continui — secțiuni S1)

Pe / în retenție: `C_NW`, `C_N_MID`, `C_W_MID`, `C_W_DORM`, `C_CASA_SCARA`, `C_S_INTRARE_W/E`  
Pier liber în cutie: `C_S_DORM_E`  
În afara cutiei încălzite: `C_E_PAL`, `C_E_LAMELE`, `C_NE`

---

## Amenajare pe placă (nu dictează BA)

- CT NV · depozit vest-sud · magazie est  
- Partiții A7 pe XI și Y280  

---

## Acțiune S1

Remesh `subsol_reten_ba_*` (FRAME) pe acest envelope. Nu copia camerele beciului ca ziduri de retenție.
