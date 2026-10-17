# V47 A1 FRAME — Continuare calc (2.3 aprofundat · 2.1b seism · 2.5 întoarsă)

**Status:** ordin de mărime · **NU** proiect semnat · **NU** adoptare în generator  
**Dată:** 2026-10-16

## 2.3 Placă — L/d cu factor K + săgeată elastică

q_qp (săgeți) ≈ **5.85** kN/m² (G + ψ₂Q) @15 cm.

| Variantă | L/d | L/d admis (K) | Span/depth | Săgeată elastică |
|----------|----:|-------------:|------------|------------------|
| placă 15 pe 6,2 m (fără bandă) | 49.6 | 44.2 | **fail ordin** | δ≈22.3 mm (lim 24.8; OK el.) |
| placă 15 · K=1,5 continuu (tot 6,2) | 49.6 | 51 | OK ordin | δ≈22.3 mm (lim 24.8; OK el.) |
| placă 20 pe 6,2 m | 35.4 | 44.2 | OK ordin | δ≈9.9 mm (lim 24.8; OK el.) |
| placă 15 + bandă pe axa C_N_MID–C_S_DORM_E (L≈3,1) | 24.8 | 44.2 | OK ordin | δ≈1.4 mm (lim 12.4; OK el.) |
| placă 28 pe 6,2 (comparație — impact clear) | 24.3 | 44.2 | OK ordin | δ≈4.1 mm (lim 24.8; OK el.) |

### Bandă pe axa `C_N_MID`–`C_S_DORM_E`

| | |
|--|--|
| Efect | deschidere placă **6,2 → ~3,1 m** |
| Grindă bandă tip | 30×35 tip · L=6.45 m · M≈162.6 kNm · μ=0.361 · flex RISK |
| Clear | h=35 → clear 241 pe bandă (D1 OK); NU pe A7 compartimentare ca grindă vizibilă — bandă în placă / grindă îngropată de studiat |

**Citire:** placa 15 pe 6,2 **nu** trece ordin SLS; cu **bandă** la 3,1 m **trece** span/depth ordin.  
Placa 20 tot pe 6,2 tot e la limită/fail. Placa 28 trece dar **strică clear 255** (−13 cm vs 15).  
→ **Țintă rămâne 15 + bandă sau FE care demonstrează continuu**; nu îngroșa acum.

## 2.1b Seism (ipoteză ag=0,10g)

| | |
|--|--|
| W total ordin | 672 kN |
| Vb | 57.1 kN |
| V med / stâlp | 5.19 kN |
| M etaj med | 7.48 kNm |
| Mrd ordin 30×30 / 30×40 | 55 / 75 kNm |

| ID | Rol | M ordin | vs 0,7·Mrd30 | Along→30 |
|----|-----|--------:|:------------:|----------|
| C_NW | colț | 10.5 | da | candidat |
| C_N_MID | fațadă N | 8.2 | da | candidat |
| C_NE | colț | 10.5 | da | candidat |
| C_W_MID | fațadă | 8.2 | da | candidat |
| C_W_DORM | colț | 9.7 | da | candidat |
| C_S_DORM_E | 30×30 | 7.5 | da | candidat |
| C_E_GEAM_S | fațadă E | 9 | da | candidat |
| C_E_PAL | nod consolă | 11.2 | da | păstrează/FE |
| C_CASA_SCARA | separator | 7.5 | da | candidat |
| C_S_INTRARE_W | fațadă S | 8.2 | da | candidat |
| C_S_INTRARE_E | 30×30 | 7.5 | da | candidat |

**Citire:** axial era generos; **seismul pe colțuri** mănâncă din rezervă. Candidații along→30 rămân valabili **doar după FE P100**; `C_E_PAL` + colțuri = prioritate păstrare 30×40 până la rezultat.

> ag=0.10g · S=1.2 · q=3 · λ=0.85 — IPÓTEZĂ, nu zonare 131

## 2.5 Grindă întoarsă `B_Y590_EDGE_INVERTED`

| | |
|--|--|
| Geo | Y575–600 dy=25 · X566.3 dx=115 · z sandwich −30…+32 |
| L / q / M / V | 1.15 m · 25 kN/m · 4.1 kNm · 14.4 kN |
| Capăt E | pier 15×15 · N≈44 / Nrd≈300 kN |
| Capăt V | placă + B_SEP_AFTER_DOOR + C_CASA_SCARA — slab pe V dacă placa e subțire |
| Verdict | Geo OK (ușă liberă). Calcul: armare întoarsă + transmitere V prin placă 15 = FE local. Nu schimba dy=25 acum. |

## Acțiuni model (acum)

| | |
|--|--|
| Schimbă stâlpi/grinzi/placă în generator | **Nu** |
| Următor calc | FE placă 15 ± bandă; FE P100; detaliu întoarsă V |
| Faza 1 geo | accept pad B_X360 (separat) |

JSON: `outputs/reports/v47_a1_frame_calc_continue_v01.json`
