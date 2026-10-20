# S1 — geometrie cadre pe A1 (v01)

**Status:** studiu geometric · **neconstruibil** · 2026-10-20  
**Sursă:** `a1_architecture.columns_cm` + cutie/puț  
**Fișier:** `structure_a1_study_cm` / `data/building/a1_structure_study.json`

## Cutie
X **30–534.3** × Y **30–820**

## Stâlpi (11)
| id | x | y | dx×dy | levels | pe cutie |
|----|---|---|-------|--------|----------|
| C_NW | 10 | 10 | 30×30 | S+P+E | da |
| C_N_MID | 312.4 | 10 | 40×30 | S+P+E | da |
| C_NE | 638.8 | 10 | 30×30 | S+P+E | nu |
| C_W_MID | 10 | 410 | 30×40 | S+P+E | da |
| C_W_DORM | 10 | 645.2 | 30×30 | S+P+E | da |
| C_S_DORM_E | 322.4 | 645.2 | 30×30 | S+P+E | da |
| C_E_PAL | 638.8 | 410 | 30×40 | S+P+E | nu |
| C_CASA_SCARA | 524.3 | 550 | 30×40 | S+P+E | da |
| C_S_INTRARE_W | 312.5 | 818.8 | 40×30 | S+P+E | da |
| C_S_INTRARE_E | 524.3 | 818.8 | 30×30 | S+P+E | da |
| C_SW_TERASA | 10 | 818.8 | 30×30 | P+E | nu |

## Grinzi (14)
| id | supports | levels | note |
|----|----------|--------|------|
| B_N | C_NW, C_N_MID | S+P+E | centură N pe cutie (C_NW–C_N_MID) |
| B_N_TO_NE | C_N_MID, C_NE | P+E | centură N est → C_NE (banda scară / fațadă E) |
| B_W | C_NW, C_W_MID, C_W_DORM | S+P+E | centură V pe cutie |
| B_W_TERASA | C_W_DORM, C_SW_TERASA | P+E | A1.207: centură V pe terasă acoperită (fără S — cutie exclude excavare sub terasă) |
| B_X_MID | C_N_MID, C_S_DORM_E, C_S_INTRARE_W | S+P+E | axă mid N–S (C_N_MID–C_S_DORM_E–C_S_INTRARE_W) |
| B_CASA_SCARA | C_CASA_SCARA, C_S_INTRARE_E | S+P+E | separator est cutie (= A6) C_CASA_SCARA→intrare E |
| B_Y645 | C_W_DORM, C_S_DORM_E | S+P+E | sud dorm pe cutie |
| B_S_TERASA | C_SW_TERASA, C_S_INTRARE_W | P+E | A1.207: grindă sud terasă acoperită — reazem solbanc S (X vest→intrare) |
| B_Y820 | C_S_INTRARE_W, C_S_INTRARE_E | S+P+E | sud intrare pe cutie (Y≈820) |
| B_Y410 | C_W_MID, C_E_PAL | P+E | legătură mid W→E_PAL (peste cutie + scară) |
| B_E | C_NE, C_E_PAL | P+E | centură E fațadă (C_NE–C_E_PAL) |
| B_E_S | C_E_PAL, C_S_INTRARE_E | P+E | centură E sud scară — reazeme C_E_PAL + nod SE cu B_S_SE (fără C_E_LAMELE) |
| B_S_SE | C_S_INTRARE_E, C_E_PAL | P+E | închidere SE pe C_S_INTRARE_E↔C_E_PAL — C_E_LAMELE = doar ARH/fațadă |
| B_Y_EDGE_INVERTED | C_CASA_SCARA, put_reten_e | S_inverted | A1.194: grindă întoarsă ușă→put_reten_e (fără C_SHAFT_E_PIER — clear scară 100) |

## Deschis
- FE numeric pe schema fără C_E_LAMELE (span B_E_S / B_S_SE)
- geo_131 Rc parcelă
- riser_beci_17_22 vs brief 16
- shaft_east_wall_15_7_FE_ok
- footing_B200_FE_confirm_mu_water

## Următor
FE pe această schemă (nu pe FRAME V47). Viewer: `npm run volume:a1` → Structură.
