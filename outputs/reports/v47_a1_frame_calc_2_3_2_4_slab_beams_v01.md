# V47 A1 FRAME — Calc 2.3 placă + 2.4 grinzi (preliminar)

**Status:** ordin · **NU** proiect semnat · **NU** adoptare  
**q_Ed:** 11.78 kN/m²

## 2.3 Placă living (fără X320) — L ≈ 6,2 m

| h | L/d | M (kNm/m) | Semnal SLS (L/d vs ~26) |
|--:|----:|----------:|-------------------------|
| **15** | 49.6 | 56.6 | **SLS_semnal_fail_ordin** |
| 20 | 35.4 | 56.6 | **SLS_semnal_fail_ordin** |

Citire: ambele au L/d **peste** limita ordin simplu rezemat → **calcul_lipsă FE** (continuu / bandă / PT).  
**Nu** adoptăm 25–28 acum (lock proiect). Clear 255 cere **15** ca țintă.

## 2.4 Grinzi perimetrale (b=30 · h=35)

| ID | L (m) | trib | M (kNm) | V (kN) | μ | Flexiune |
|----|------:|-----:|--------:|-------:|--:|----------|
| B_N_span_NW_MID | 3.2 | 1.6 | 24.1 | 30.2 | 0.054 | OK ordin |
| B_N_span_MID_NE | 3.3 | 1.6 | 25.7 | 31.1 | 0.057 | OK ordin |
| B_W_span_NW_WMID | 4 | 1.5 | 35.3 | 35.3 | 0.079 | OK ordin |
| B_W_span_WMID_WDORM | 2.45 | 1.5 | 13.3 | 21.6 | 0.029 | OK ordin |
| B_E_span_NE_GEAM | 3.1 | 1.5 | 21.2 | 27.4 | 0.047 | OK ordin |
| B_E_span_GEAM_PAL | 1.4 | 1.5 | 4.3 | 12.4 | 0.01 | OK ordin |
| B_Y645 | 3.6 | 1.5 | 28.6 | 31.8 | 0.064 | OK ordin |
| B_Y830 | 1.75 | 1.2 | 5.4 | 12.4 | 0.012 | OK ordin |

### Test b=20 pe B_Y645

| | |
|--|--|
| Secțiune | 20×35 |
| M / μ | 28.6 / 0.095 |
| Citire | Flexiune poate trece ordin; **nod pe stâlp 30** → preferă **b=30** la față (nu reduce b sub thru fără detaliu) |

## Decizie model (acum)

| Element | Acțiune |
|---------|---------|
| Placă 15 | **păstrează** țintă; FE SLS = următorul blocant pe planșeu |
| Grinzi b×h | **păstrează 30×35**; nu reduce b la 20 în mesh |
| Clear 241 sub grindă | lock D1 — OK |

JSON: `outputs/reports/v47_a1_frame_calc_2_3_2_4_slab_beams_v01.json`
