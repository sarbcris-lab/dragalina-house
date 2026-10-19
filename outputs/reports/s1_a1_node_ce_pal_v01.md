# S1 A1 — Nod C_E_PAL + întoarsă (As / ancorare ordin)

**Status:** detaliu de studiu · **NU** plan dt · **NU** semnat  
**Generat:** 2026-10-19T08:25

> Eforturi din `calc_2_2` + `calc_100`. FE nod rămâne obligatoriu.

## 1. Stâlp C_E_PAL

| | |
|--|--:|
| Secțiune | **30×40** |
| N | 741.6 kN |
| M ordin | 58.2 kNm |
| util N+M | 0.671 |
| Long. hint | 8φ16 |
| Etrieri | φ8 @ 11 cm zonă / @ 20 cm mijloc (ordin) |

**Păstrează 30×40** — util ~0,67; nu reduce fără FE.

## 2. Grinzi în nod

| Grindă | Rol | M | V | As | Inferior | În nod |
|--------|-----|--:|--:|---:|----------|--------|
| B_E | centură E nord→PAL | 18.5 | 20 | 135 | 3φ16 | 2φ16 continuitate + 2φ16 colț |
| B_E_S | centură E scară PAL→SE (NO_LAMELE) | 21.5 | 21.5 | 157 | 3φ16 | 2φ16 + etrieri φ8@10 în zonă nod |
| B_Y410 | grindă transversă / consolă ordin | 12 | 17.3 | 85.2 | 2φ16 | 3φ16 (negativ consolă) · lb≥780 mm |

## 3. Torsiune / ancorare

| | |
|--|--:|
| T ordin | **6.5** kNm |
| M nod | 15.3 kNm |
| As torsiune hint | ~66.4 mm² |
| Etrieri închiși | φ10 @ 10 cm pe 2×h de la față stâlp (ordin torsiune) |
| lb φ16 | **780** mm |
| lb φ14 | **680** mm |

Torsiune din consolă placă/grindă pe C_E_PAL — FE nod obligatoriu

## 4. Consolă placă (S / W)

- L_S = 1.387 m → φ12 @ 12 cm pe L_S (As≥1560 mm²/m min)
- L_W = 1.045 m → φ12 @ 12 cm pe L_W
- PASS ordin: **true**

## 5. Grindă întoarsă B_Y_EDGE

| | |
|--|--:|
| Secțiune | 25×25 |
| L / M / V | 1.019 m / 1.2 kNm / 4.9 kN |
| As flex | 16 mm² |
| Reazeme | C_CASA_SCARA, C_SHAFT_E_PIER |
| Inferior | 2φ12 (flex ordin mic) |
| Superior reazeme | 2φ14 în zone reazeme |
| Ancorare | ancorare ≥ 680 mm în C_SHAFT_E_PIER + în C_CASA |
| Notă | sandwich/placă: bare din întoarsă legate de plasa plăcii — FE local capăt |
| PASS | **true** |

## 6. Ce cere FE (nu e în acest fișier)

- Model nod 3D: stâlp + B_E + B_E_S + B_Y410 + placă consolă
- Torsiune + transfer V în stâlp
- Lungimi reale de ancorare / ciocuri
- Întoarsă: FE capăt pe pier + legătură placă

JSON: `s1_a1_node_ce_pal_v01.json`
