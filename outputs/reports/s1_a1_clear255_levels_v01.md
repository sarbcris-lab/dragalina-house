# S1 A1 — Clear ≥255 HARD + placă/grindă + acoperiș 30°

**Status:** LOCK beneficiar A1.180 · 2026-10-18  
**Revocat:** acceptarea clear 241 sub grindă (D1b).

## Clear

| Loc | Minim | Valoare pachet |
|-----|------:|---------------:|
| Sub grindă | **255** | **255** |
| Sub placă | **255** | **280** (=255+drop 25) |
| Sub fals plafon | **255** | **274** |

## Placă — minim

| | |
|--|--|
| Span cu B_X_MID | L≈**2.52** m |
| Minim care trece ordin | **15** cm (μ=0.036, L/d=20.2, δ=1.5/10.1) |
| **Adoptat** | **15 cm** |
| Fără axă mid (L≈5.04) | pass=false — **păstrează B_X_MID** |

## Grindă / centură

| | h total (cu zonă placă) | Coborâre sub soffit |
|--|--:|--:|
| Tipic | 35 | 20 |
| Critic (B_X_MID, B_Y410) | **40** | **25** |

Intrados grindă = FF + 255. Nu mai există zonă cu clear 241.

## FF → FF

| | cm |
|--|--:|
| **Adoptat** | **307** |
| Descompunere | 255 + drop 25 + placă 15 + buildup 12 |
| FF P / FF E | 48 / 355 |
| Alternativă flush (fără drop) | FF→FF **282** |

## Acoperiș 2 ape · 30° · PV

| | |
|--|--|
| Panta | **30°** LOCK |
| Run (jumătate NS) | 430.7 cm |
| Rise | **248.6** cm |
| PV | ambele ape |

## Ce s-a corectat

- Anterior: clear 241 sub grindă — INTERZIS de beneficiar
- FF→FF trebuie să includă drop grindă + placă + buildup peste clear 255

Regen: `npm run volume:a1` · `npm run calc:a1`
