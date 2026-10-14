# V47 Runda A — studiu A1

## Status
**A1 FEZABIL (geometric pe modelul de studiu)** — referința `v47_exact.json` **nu** a fost modificată.

## Traseu
`curte(0) → trepte → palier−95(Y800–860) → scară(Y600–800↓N) → palier liber−250(Y520–600) → ușă → hol → CT/dep`

## Datum absolut (teren amenajat = 0)

| Cotă | cm |
|------|---:|
| teren amenajat | 0 |
| FF parter | +32 |
| palier acces | -95 |
| FF subsol | -250 |
| intrados (studiu) | -30 |
| clear FF→intrados | **220** |
| ușă deschidere | 200 |
| rezervă buiandrug/toc | 15 |
| necesar ușă+buiandrug | 215 |

Clarificare: vechile `levels_vs_ff_parter_cm` erau **denumite** „vs FF” dar **aplicate absolut** în 3D. A1 le înlocuiește cu `absolute_from_grade_cm`.

## Verificări
### PASS
- upper_landing → Y860 (racord curte)
- upper abut stair top (south)
- palier jos N de ultima treaptă (liber)
- ușă pe palier liber
- ușă ∩ hol pe Y
- ușă 200+lintel 15 ≤ clear 220
- palier −95 în puț deschis (fără soffit)
- clear pe palier jos / camere = 220 cm
- sub rampa2: puț deschis — headroom vertical liber pe scară L-1 în bandă
- studii utili neschimbați 37.87875 m²
- anvelopă 680×860 păstrată
- zid E puț ≤ X680 (limită anvelopă)
- rezervă fundație ±15 cm → gabarit studiu -15…695 × -15…875 (verificare parcelă în volum 3D)
- notă: ușă tip 210+buiandrug 15=225 > clear 220 — A1 demonstrează cu deschidere 200+15=215≤220 (fără a egala camera la 210)

### FAIL
- (niciuna)

## Anvelopă subsol — grosimi studiu
| Rol | cm | Notă |
|-----|---:|------|
| perimetru structură | 30 | de confirmat structurist |
| compartimentări | 12.5 | |
| puț vest | 30 | = buc_est |
| puț est | 15 | sprijin Dragalina |
| proiecție fundație | 15 | dincolo de fața exterioară perete |

## Goluri
- hol ↔ CT: 90 cm (pe Y430)
- hol ↔ depozit: 80 cm (pe X350)
- palier ↔ hol: 70 cm @ Y530–600, h 200+15

## Impact studii / parcelă / POT
| Indicator | Valoare |
|-----------|---------|
| utili studii (înainte=după) | **37.87875 m²** (neschimbat) |
| anvelopă | 680×860 = 58,48 m² |
| POT anvelopă / 147 | **39.78%** (referință; confirmare limită admisă = deschisă) |
| poligon studiu | 145,741 m² |
| CF măsurat | 147 m² |
| colțuri anvelopă (volum) | NW/NE/SW inside; SE PIP=false dist≈0 (numeric contur — neschimbat vs referință) |
| scară SE | inside, overflow 0 |

## De ce nu A2/A3 (încă)
A1 trece verificările geometrice pe modelul de studiu → **A2/A3 neactivate**.

## Fișiere
- `data/building/v47_a1_study.json`
- `outputs/plans/31_v47_a1_subsol_plan.svg`
- `outputs/plans/32_v47_a1_access_section.svg`
- `outputs/reports/v47_runda_a1.md` (acest fișier)
- `viewer/data/volume_v47_a1.json` — viewer: `?v=v47_a1`
