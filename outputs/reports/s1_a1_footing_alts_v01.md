# S1 A1 — Variante talpă retenție (dacă 80 / 115 „pică”)

**Status:** meniu de soluții · **NU** semnat  
**Generat:** 2026-10-19T08:48  
**Adopt model:** B=**115** cm

## Insight

Pintenul salvează ALUNECAREA, nu răsturnarea. Drenajul reduce Pa, dar cu seism tot trebuie B≳100 cm pe ordin.

## B minim pe scenariu (cu seism)

| Scenariu | B min |
|----------|------:|
| hw=0 (drenaj bun) | **105** cm |
| hw=0,5 m | **105** cm |
| hw=1,0 m | **115** cm |
| hw=1 + pinten 40 | **115** cm |
| hw=1 + pinten 60 | **115** cm |

## Variante

| ID | Descriere | B | hw | Key | FS_s | FS_o | PASS | Dacă nu |
|----|-----------|--:|---:|----:|-----:|-----:|:----:|---------|
| `V0_B80_hw10` | B80 · hw=1 m · seism — eșec referință | 80 | 1 | — | 0.99 | 0.86 | **false** | alunecare+răsturnare+σ |
| `V1_B115_hw10` | B115 · hw=1 m · seism — ADOPT model | 115 | 1 | — | 1.4 | 1.72 | **true** | — |
| `V2_B80_dry_seis` | B80 · drenaj hw=0 · tot cu seism | 80 | 0 | — | 1.23 | 1.06 | **false** | răsturnare+σ |
| `V2b_B_min_dry_seis` | B min la drenaj hw=0 + seism (=105 cm) | 105 | 0 | — | 1.59 | 1.78 | **true** | — |
| `V3_B80_hw05` | B80 · hw=0,5 m · seism | 80 | 0.5 | — | 1.16 | 1 | **false** | răsturnare+σ |
| `V3b_B_min_hw05` | B min la hw=0,5 + seism (=105 cm) | 105 | 0.5 | — | 1.5 | 1.68 | **true** | — |
| `V4_B80_key40_hw10` | B80 · pinten 40 cm · hw=1 — ajută alunecarea | 80 | 1 | 40 | 1.22 | 0.88 | **false** | răsturnare+σ |
| `V5_B80_key60_hw10` | B80 · pinten 60 cm · hw=1 | 80 | 1 | 60 | 1.46 | 0.9 | **false** | răsturnare+σ |
| `V5b_B_min_key40_hw10` | B min + pinten 40 · hw=1 (=115 cm) | 115 | 1 | 40 | 1.63 | 1.75 | **true** | — |
| `V6_B100_key40_hw10` | B100 · pinten 40 · hw=1 (compromis) | 100 | 1 | 40 | 1.45 | 1.34 | **false** | răsturnare+σ |
| `V7_B90_dry_noSeis` | B90 · hw=0 · FĂRĂ seism (doar comparație) | 90 | 0 | — | 1.56 | 1.5 | **true** | — |

## Decizie

| Situație | Alege |
|----------|-------|
| Acum / fără geo | **`V1_B115_hw10`** — La hw=1+seism, B min ≈ 110–115. Modelul e deja pe 115 — robust fără a miza pe drenaj. |
| Geo uscat + drenaj | B min ≈ 105 cm (tot cu seism) — nu neapărat 80 |
| Drenaj mediu hw≈0,5 | B min ≈ 105 cm |
| Vrei mai îngust @ apă | B115 + pinten 40 cm @ hw=1, sau B100+pinten (V6) |
| FE respinge 115 | B 130–150 cm, sau FE cu μ/heel reale + drenaj dovedit |

JSON: `s1_a1_footing_alts_v01.json`
