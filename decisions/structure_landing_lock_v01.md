# Lock structural palier / colț L / centură — v01

**Status:** APROBAT + IMPLEMENTAT (LOCK-1) — 2026-10-16  
**Surse:** `v47_a1_frame_study.json`, audit v02/v04, q_Ed=11,78 kN/m²

## Problemă (fapte)

| Fapt | Valoare |
|------|---------|
| Palier rece | X565–670 × Y470–590 (1,05 × 1,20 m) |
| B_E | → Y590, consolă 101 cm sud de C_E_PAL, levels P+E |
| B_Y470 | levels **P only**, capăt V @ X536,3 **liber** (~105 cm consolă) |
| Colț L cald | ~X536,3 / Y470 — A6, **fără stâlp** |
| Ușă P | Y500–600 pe X536 — fără stâlp (lock transport) |
| Centură E peste palier | **deschisă** (fără B_Y470 pe E, fără picior V) |

Predimensionare: placă consolă L=1,05 → M≈6,5 kNm/m (As,min guvernează). B_E consolă M≈4 kNm (nu rupere). **Defectul e schema de reazeme**, nu „povestea” că placa e slabă.

## LOCK-1 (recomandat)

1. **C_L_PAL** — X536,3 · Y449–489 · 30×40 · S+P+E (nord de ușă, în linia A6).  
2. **B_Y470** — levels **P+E**.  
3. **B_X535_PAL_N** — X536,3 · Y470→500 · P+E (până la gol ușă).  
4. **B_E** neschimbat. Living sub palier **fără** stâlp X565+.  
5. Ușă Y500–600, B_SEP, C_CASA_SCARA neschimbate.

## LOCK-2 / LOCK-3

- LOCK-2: doar grinzi, fără stâlp colț — nod L rămâne îndoielnic.  
- LOCK-3: status quo + FE — **respins** pentru obiectivul „fără semne de întrebare”.

## Ce nu se schimbă în acest lock

Slab 15, FF+48, GEO_X0, palier AFARĂ pe E, fără C_E_LAND_SP, util≥37 pe E = task separat.
