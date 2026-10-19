# S1 A1 — Stabilitate talpă perimetru (alunecare / răsturnare)

**Status:** ordin pe ml · **NU** semnat  
**Caz:** hw10 (retenție + apă + seism)  
**Generat:** 2026-10-19T08:26

## La B = 80 cm (lock vechi)

| Verificare | Valoare | Cerință | PASS |
|------------|--------:|--------:|:----:|
| Alunecare FS | **0.99** | ≥ 1.1 | **false** |
| Răsturnare FS | **0.85** | ≥ 1.5 | **false** |
| σ max | **-467** kPa | ≤ 221 | **true** |

**PASS @80:** **false**

## Adopt studiu

| | |
|--|--:|
| **B adopt** | **115** cm |
| FS alunecare | **1.4** |
| FS răsturnare | **1.72** |
| σ max | **187** kPa |
| PASS | **true** |

Talpa 80 pică alunecare/răsturnare la hw10; adopt studiu **115 cm** (sau pinten + drenaj).

Alternative: pinten sub talpă · drenaj (↓ hw) · μ mai bun din geo.

JSON: `s1_a1_footing_stability_v01.json`
