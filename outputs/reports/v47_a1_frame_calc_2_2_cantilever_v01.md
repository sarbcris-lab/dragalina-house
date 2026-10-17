# V47 A1 FRAME — Calc 2.2 consolă palier / C_E_PAL (preliminar)

**Status:** ordin de mărime · **NU** proiect semnat  
**Schema:** LOCK-1R — consolă sud **101 cm** · bordură N **105 cm** · fără stâlp în living  
**q_Ed palier:** 11.93 kN/m²

## Placă consolă (bandă 1 m)

| Direcție | L (m) | M (kNm/m) | V (kN/m) | As cerut | Guvernează |
|----------|------:|----------:|---------:|---------:|------------|
| Sud (din C_E_PAL) | 1.01 | 6.1 | 12 | 129.6 mm²/m | As_min |
| Vest (B_Y470) | 1.05 | 6.6 | 12.5 | 140.1 mm²/m | As_min |

Citire: flexiune placă **plauzibilă** @15 cm pe L≈1,0 m (As_min sau As mic). **Nu** demonstrează SLS pe planșeul living 6 m.

## B_E consolă sud

| Mărime | Valoare |
|--------|--------:|
| trib | 1.05 m |
| q pe grindă | 12.5 kN/m |
| M | **6.4** kNm |
| V | **12.7** kN |
| As flexiune ordin | 54.4 mm² |

## Torsiune / nod C_E_PAL

| Mărime | Valoare |
|--------|--------:|
| T ordin (din bordură W) | **6.6** kNm |
| M nod ordin (M+0,5T) | **9.7** kNm |
| Nrd 30×40 / 30×30 | 1600 / 1200 kN |

**Verdict:** eforturile pe consolă sunt **modeste**; riscul real = **torsiune + ancorare + ridicare** pe `C_E_PAL`, nu secțiunea axială.  
→ **Nu** reduce `C_E_PAL` 30×40 → 30×30 în această rundă.  
→ FE obligatoriu: model cu B_E + B_Y470 + placă palier + stâlp continuu S–P–E.

## Decizie model (acum)

| Acțiune | |
|---------|--|
| Păstrează C_E_PAL **30×40** | Da |
| Păstrează B_E b=30 · h=35 | Da (până la FE grindă) |
| Adaugă stâlp în living | **Nu** (LOCK-1R) |
| Status registru `east_landing_span` | rămâne **calcul_lipsă** (FE nod), geo OK |

JSON: `outputs/reports/v47_a1_frame_calc_2_2_cantilever_v01.json`
