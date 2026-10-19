# S1 A1 — Combinații CR0 pe bare critice

**Status:** ordin pe eforturi existente · **NU** model FE · **NU** semnat  
**Generat:** 2026-10-19T08:25

## Descompunere planșeu

| | kN/m² |
|--|------:|
| Gk | **6.5** |
| Qk | **2** |
| STR 1,35G+1,5Q | **11.78** (ref calc ≈ 11.78) |

## Combinații

| ID | Descriere | q / factor |
|----|-----------|------------|
| STR_Q | 1,35G + 1,5Q (dominantă utilă) | q=11.78 · f=1 |
| STR_W | 1,35G + 1,5W + 0,7·1,5Q (vânt dominant — peri) | q=12 · f=1.019 |
| SEIS | G + ψ2Q + E (ψ2=0,3) — eforturi gravitaționale reduse + M din Vb | q=7.1 · f=0.603 |

## Grinzi critice

### B_Y410 (40×40, L=5.988 m) — ref M=84.5

| Combo | M kNm | V | As | PASS |
|-------|------:|--:|---:|:----:|
| STR_Q | 84.5 | 56.4 | 617 | **true** |
| STR_W | 86.1 | 57.5 | 629 | **true** |
| SEIS | 63.6 (G 50.9+E 12.7) | 34 | 372 | **true** |

Guvernant: **STR_W**

### B_E_S (30×40, L=3.988 m) — ref M=21.5

| Combo | M kNm | V | As | PASS |
|-------|------:|--:|---:|:----:|
| STR_Q | 21.5 | 21.5 | 157 | **true** |
| STR_W | 21.9 | 21.9 | 160 | **true** |
| SEIS | 16.2 (G 13+E 3.2) | 13 | 95 | **true** |

Guvernant: **STR_W**

### B_E (30×40, L=3.7 m) — ref M=18.5

| Combo | M kNm | V | As | PASS |
|-------|------:|--:|---:|:----:|
| STR_Q | 18.5 | 20 | 135 | **true** |
| STR_W | 18.8 | 20.4 | 138 | **true** |
| SEIS | 14 (G 11.2+E 2.8) | 12.1 | 81 | **true** |

Guvernant: **STR_W**

### B_X_MID (40×40, L=6.052 m) — ref M=86.3

| Combo | M kNm | V | As | PASS |
|-------|------:|--:|---:|:----:|
| STR_Q | 86.3 | 57 | 630 | **true** |
| STR_W | 87.9 | 58.1 | 642 | **true** |
| SEIS | 64.9 (G 52+E 12.9) | 34.4 | 380 | **true** |

Guvernant: **STR_W**

### B_N (30×40, L=2.724 m) — ref M=17.5

| Combo | M kNm | V | As | PASS |
|-------|------:|--:|---:|:----:|
| STR_Q | 17.5 | 25.7 | 128 | **true** |
| STR_W | 17.8 | 26.2 | 130 | **true** |
| SEIS | 13.1 (G 10.5+E 2.6) | 15.5 | 77 | **true** |

Guvernant: **STR_W**

### B_W (30×40, L=3.7 m) — ref M=32.3

| Combo | M kNm | V | As | PASS |
|-------|------:|--:|---:|:----:|
| STR_Q | 32.3 | 34.9 | 236 | **true** |
| STR_W | 32.9 | 35.6 | 240 | **true** |
| SEIS | 24.3 (G 19.5+E 4.8) | 21 | 142 | **true** |

Guvernant: **STR_W**


## Stâlpi critici

### C_E_PAL (30×40)

| Combo | N | M | util | PASS |
|-------|--:|--:|-----:|:----:|
| STR_Q | 741.6 | 58.2 | 0.671 | **true** |
| SEIS | 447 | 49.6 | 0.55 | **true** |

### C_N_MID (40×30)

| Combo | N | M | util | PASS |
|-------|--:|--:|-----:|:----:|
| STR_Q | 574.9 | 59.4 | 0.571 | **true** |
| SEIS | 346.5 | 50.7 | 0.49 | **true** |

### C_W_MID (30×40)

| Combo | N | M | util | PASS |
|-------|--:|--:|-----:|:----:|
| STR_Q | 433.2 | 58.2 | 0.479 | **true** |
| SEIS | 261.1 | 49.6 | 0.44 | **true** |

### C_NE (30×30)

| Combo | N | M | util | PASS |
|-------|--:|--:|-----:|:----:|
| STR_Q | 385.5 | 24.2 | 0.475 | **true** |
| SEIS | 232.3 | 20.6 | 0.44 | **true** |


## Acoperiș (din wind pack)

| Combo | q |
|-------|--:|
| SNOW — Zăpadă dominantă (1,35G + 1,5·Qs + 0,6·1,5·Qw) | **3.36** |
| WIND_FIELD — Vânt câmp | **2.69** |
| WIND_UPLIFT — Suctiune streșină (net) | **1.81** |

## Rezumat

- Grinzi toate PASS pe combo: **true**
- Stâlpi toate PASS pe combo: **true**
- Grindă guvernantă: **B_X_MID** @ STR_W (M≈87.9)

> FE trebuie să aplice combinațiile pe model 3D — aici e doar scalare onestă a ordinului din repo.

JSON: `s1_a1_cr0_members_v01.json`
