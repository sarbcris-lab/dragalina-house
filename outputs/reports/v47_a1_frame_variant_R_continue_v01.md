# Variantă R — continuare calc (bandă · retenție · C_N_MID)

**Status:** ordin pe R · **NU** FE semnat  
**Dată:** 2026-10-16

## 1. `B_BAND_X320`

| | |
|--|--|
| Secțiune model | 40×35 · L=6.45 m · trib=3.1 m |
| q / M_ss / M_cont | 36.5 kN/m · 189.9 / 170.9 kNm |
| V / μ | 117.8 kN · 0.317 |
| As (cont) | **1456** mm² → ≈6φ18+ — bandă grea ca grindă 1-way; FE 2-way sau al 3-lea reazem |
| Clear sub bandă | **241** cm (D1 OK) |
| Flexiune | RISK |
| Reazeme | C_N_MID, C_S_DORM_E |

As ordin mare dacă trib 1-way e real. FE: (a) placă 2-way cu bandă rigidă, (b) reazem intermediar pe Y≈400 dacă e necesar — fără stâlp nou în cameră dacă se poate pe zid.

## 2. Panouri placă 15 (cu bandă)

| Panou | L | L/d | M | Span/depth |
|-------|--:|----:|--:|------------|
| vest de bandă (baie/dorm side) | 3.1 | 24.8 | 14.2 | OK |
| est de bandă (living side) | 3.1 | 24.8 | 14.2 | OK |

## 3. Retenție BA 20 — împingere ordin

| | |
|--|--|
| Ipoteză | γ=18 · φ=25° · H=2,5 m · uscat — NU geo 131 |
| Ka / p_bază / E_a | 0.406 · 18.3 kPa · 22.8 kN/m |
| M bază / As vert | 19 kNm/m · 304 mm²/m (φ12@15 ordin) |
| Verdict | BA 20 plauzibil pe împingere uscată ordin; cu apă/hidro → crește E. Geo 131 obligatoriu înainte de armare finală. |

## 4. Sensibilitate `C_N_MID`

| | Cu MID | Fără MID |
|--|--------|----------|
| Bandă N | pe C_N_MID | **fără reazem** |
| B_N | 2 travee ~3,2+3,3 | 1 traveu ~6,5 |
| N pe NW/NE | 242.5 / 206.6 | ~404 / ~368 |
| OK pe R? | **da** | **nu** |

Păstrează C_N_MID pe R. Eliminare = doar dacă abandonezi banda (și atunci placă 15 e riscantă).

## 5. Prioritate FE (neschimbată)

- 1. Placă 15 + B_BAND_X320 (P+E) — SLS/ULS
- 2. Nod C_E_PAL + consolă B_E / B_Y470
- 3. Cadre P100 stâlpi (along 40→30 candidați)
- 4. Retenție + hidro pe geo 131
- 5. D3a acoperiș pe același model

JSON: `outputs/reports/v47_a1_frame_variant_R_continue_v01.json`  
Brief structurist: `outputs/reports/v47_a1_frame_fe_brief_variant_R_v01.md`
