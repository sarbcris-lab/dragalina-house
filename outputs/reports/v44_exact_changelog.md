# V44 — raport + comparație V43

## Contur și înălțimi (fixe)
- Gabarit **680×860** neschimbat
- FF→FF **288** = 255+6+15+3+2+5+2
- V43 păstrat în `data/building/v43_exact.json` + `viewer/data/volume_v43.json`

## Util
| | V44 | V43 |
|--|-----|-----|
| Anvelopă | 38.8025 | 40.3535 |
| Util net | **37.6181** | 39.2197 |
| Δ util | **-1.6016** | |

## Camere cheie
| | V44 | Notă |
|--|-----|------|
| Dorm principal | 11.5094 m² (317,5×362,5) | lățime 317,5 păstrată |
| + nișă dulap | 0.7200 m² | 120×60 |
| Baie net | **5.0019 m²** | ~5,00 țintă |
| Terasă placă / liber | 6.60 / 6.08 | 6,60 / 6,08 |
| Hol | **eliminat** | hol_ne scos |

## Layout
1. dormitor_sud Y630; terasă Y660×200; dormitor_est scurtat la Y630
2. Nișă dulap în fosta baie; coloană MS eliminată din baie
3. Baie lărgită la X295 (265×225 bază); ușă pe est
4. MS+US în nișă 65×75 (aparat, nu depozit)
5. TV pe X347,5 Y115–255; fără hol_ne
6. Ușă dormitor pe est Y277–367; vechi gol N eliminat
7. Ușă buc–terasă Y670–760; blat sud 360–535×770

## Avertismente (nescrise)
- **culoar_baie_40** (critical): Trecere living→ușă baie doar 40 cm — sub 70 cm util
- **gap_ms_tv_10** (critical): Nu e traseu nord util; circulația trebuie pe culoarul de 40 cm sau ocol est
- **dulap_clear_12_5** (warn): Adâncime liberă în fața ușilor dulap = grosime perete eliminată; uși dulap necesită spațiu în dormitor la deschidere
- **buc_gol_90_not_passage** (info): Gol montaj 90 cm → trecere ~80 cm cu toc; nu 90 liber

## Ipoteze păstrate
Placă 15 · elevație +32 · palier 12,5 · cadastru ≈145,7≠147 · amplasare neschimbată
