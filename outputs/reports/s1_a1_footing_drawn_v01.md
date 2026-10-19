# S1 A1 — Talpă pe geometria DESENATĂ (A1.200)

**Status:** ordin pe ml · **NU** semnat  
**Caz:** hw10 · inward toe=0 · heel sub placă beci  
**Generat:** 2026-10-19T19:59

## Problema

| | |
|--|--|
| **Desen 3D** | Talpă excentrică **inward** — finit pe front, heel sub beci |
| **Calc vechi** | toe 5 cm + umplutură γ·H pe heel → **nu e pe desen** |
| **Fix** | toe=0 · W_heel = placă 15 cm + q 5 kPa |

## B115 acum (desen)

| Verificare | Valoare | Cerință | PASS |
|------------|--------:|--------:|:----:|
| Alunecare FS | **0.79** | ≥ 1.1 | **false** |
| Răsturnare FS | **0.68** | ≥ 1.5 | **false** |
| σ max | **502** kPa | ≤ 221 | **false** |

**PASS @115 desen:** **false**  
(Referință calc vechi B115 heel+fill: FS_s 1.4 / FS_o 1.72 — înșelător pe desen.)

## B minim pe geometrie desenată

| | cm |
|--|--:|
| Fără pinten | **200** |
| + pinten 40 cm | **185** |

## Variante

| ID | B | Key | FS_s | FS_o | σ | PASS | Fail |
|----|--:|----:|-----:|-----:|--:|:----:|------|
| `D0_B115_drawn` | 115 | — | 0.79 | 0.68 | 502 | **false** | alunecare+răsturnare+σ |
| `D1_B130_drawn` | 130 | — | 0.85 | 0.84 | 540 | **false** | alunecare+răsturnare+σ |
| `D2_B150_drawn` | 150 | — | 0.93 | 1.08 | 590 | **false** | alunecare+răsturnare+σ |
| `D3_B180_drawn` | 180 | — | 1.05 | 1.51 | 150 | **false** | alunecare |
| `D4_B115_key40` | 115 | 40 | 1.02 | 0.7 | 542 | **false** | alunecare+răsturnare+σ |
| `D5_B130_key40` | 130 | 40 | 1.08 | 0.86 | 580 | **false** | alunecare+răsturnare+σ |
| `D6_B150_key40` | 150 | 40 | 1.16 | 1.1 | 371 | **false** | răsturnare+σ |

## Adopt A1.200

| | |
|--|--:|
| **B** | **200** cm |
| Pinten | nu |
| FS alunecare | **1.13** |
| FS răsturnare | **1.84** |
| σ | **106** kPa |
| PASS | **true** |

B minim pe geometrie inward + placă pe heel (fără pinten)

JSON: `s1_a1_footing_drawn_v01.json`
