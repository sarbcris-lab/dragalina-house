# B_BAND_X320 — opțiuni (1-way / 2-way / Y400)

**Context:** pe ipoteză 1-way full, As≈1450 mm² e greu. Căutăm reducere **fără** grindă prin dorm.

**LOCK:** `în dormitor nu modificăm` — `B_Y400_BAND_TIE` **retras**.

## Comparație

| Caz | L (m) | trib | M (kNm) | As | Bare | Flex |
|-----|------:|-----:|--------:|---:|------|------|
| A_1way_full | 6.45 | 3.1 | 170.9 | 1456 | ≈6φ18+ — reconsideră | RISK |
| **B_2way_red** | 6.45 | 2 | 110.3 | 939 | ≈6φ16 / 4φ18 | OK |
| C_Y400_support | 4 | 3.1 | 65.7 | 560 | ≈4φ14 | OK |
| D_Y400_plus_2way | 4 | 2 | 42.4 | 361 | ≈4φ12 | OK |

## Recomandare pe R (post LOCK dorm)

1. **Geo:** `B_BAND_X320` pe `C_N_MID`–`C_S_DORM_E` — **fără** Y400.  
2. **Calc FE:** placă **2-way** + bandă → țintă caz **B** (As≈939, ≈6φ16 / 4φ18).  
3. Cazurile **C/D** (Y400) = doar istoric / bound; **respins** amenajare.  
4. Cazul **A** (1-way full) = bound superior, nu țintă.

JSON: `outputs/reports/v47_a1_frame_band_options_v01.json`
