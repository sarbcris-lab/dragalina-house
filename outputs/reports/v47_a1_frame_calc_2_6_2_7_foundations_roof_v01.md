# V47 A1 FRAME — Calc 2.6 fundații + 2.7 acoperiș (preliminar)

**Status:** ordin · **NU** Rc pe 131 · **NU** autorizabil  
**P_work studiu:** 200 kPa pe N_ser≈N_Ed/1.4 · **Pconv vecin (ref):** 310 kPa

## 2.6 Fundații

### A) Talpă izolată (conservator — upper bound)

| ID | N_ser (kN) | p @30 | p @80 | side izolat ≤200 | Hotar E |
|----|----------:|------:|------:|-----------------:|---------|
| C_NW | 173.2 | 1925 | 271 | 100 | centrat |
| C_N_MID | 230.9 | 2566 | 361 | 120 | centrat |
| C_NE | 147.6 | 1640 | 231 | 100 | excentric int. |
| C_W_MID | 173.2 | 1925 | 271 | 100 | centrat |
| C_W_DORM | 115.5 | 1283 | 180 | 80 | centrat |
| C_S_DORM_E | 94.6 | 1052 | 148 | 70 | centrat |
| C_E_GEAM_S | 98.6 | 1096 | 154 | 80 | excentric int. |
| C_E_PAL | 94.1 | 1046 | 147 | 70 | excentric int. |
| C_CASA_SCARA | 85.4 | 949 | 133 | 70 | excentric int. |
| C_S_INTRARE_W | 79.4 | 883 | 124 | 70 | centrat |
| C_S_INTRARE_E | 59.6 | 662 | 93 | 60 | excentric int. |

Citire: 30×30 (=secțiune stâlp) e **talpă falsă**. Izolat pur cere ~1,0–1,2 m pe cei grei — de aceea folosim **bandă + pad**.

### B) Sistem studiu: FG bandă 60 + pad 80

| | |
|--|--|
| Bandă N (ordin) | N_ser~552 kN · p_med~**142** kPa |
| Radier pe ~42 m² | N_tot_ser~1352 · p_med~**32** kPa |
| FG bandă 60 pe axe + pad 80 la stâlpi; p local pe pad e conservator — încărcarea se împrăștie în bandă/retenție | |

**Adoptare model:** pad **80×80** · strip **60** · EST excentric interior. Variantă radier = sensibilitate geo.

> 310 kPa = doar reper vecinătate.

## 2.7 Acoperiș — același brief

| | Șarpantă ușoară (D3a) | BA (D3b) |
|--|----------------------:|---------:|
| q_Ed | 3.4 kN/m² | 6.98 |
| W pe ~48 m² | **163** kN | **335** kN |
| Δ | — | **+172 kN** |
| Traseu | căpriori → centuri B_N/B_E/B_W → stâlpi; stâlpișori fronton pe streșină | placă/coamă BA → aceleași stâlpi; fără stâlpișori slabi |
| + | greutate mică pe stâlpi; seism mai blând | load path clar; masă/fonic |
| − | detaliu ancorare + excentricitate stâlpișori | +172 kN pe structură vs ușoară; fundații+seism |

**Verdict:** Pentru FE: rulează întâi D3a (ușoară) pe schema actuală; D3b ca sensibilitate. Nu alege BA doar ca să „salveze” stâlpișorii.

## Acțiuni

| | |
|--|--|
| Generator / mesh | FG pad 80 + strip 60 |
| Registru `foundations_width` | geo studiu OK; calc Rc = deschis |
| Registru `roof_load_path` | comparație D3a/D3b documentată; FE pe D3a întâi |

JSON: `outputs/reports/v47_a1_frame_calc_2_6_2_7_foundations_roof_v01.json`
