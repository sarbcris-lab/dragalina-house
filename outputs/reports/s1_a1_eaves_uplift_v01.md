# S1 A1 — Uplift streșină + PV pe solbanc

**Status:** ordin · **NU** semnat · **NU** fișă producător  
**Generat:** 2026-10-19T08:25

## Încărcare

| | |
|--|--:|
| we zonă F | **1.629** kN/m² |
| Gk acoperiș | 0.9 kN/m² |
| Adâncime zonă F | 1 m |
| q net ULS (1,5·we − G) | **1.54** kN/m² |
| w pe solbanc | **1.54** kN/m |
| F pe căprior (pas 111.8 cm) | **1.73** kN |
| F solbanc vânt (L=6.83 m) | 10.54 kN |
| + cotă PV pe streșină | 4.15 kN |
| **F design solbanc** | **14.69** kN |

## Ancorare solbanc ↔ centură BA

| | |
|--|--:|
| Tip | M12 chimică / bolt în centură C25 |
| Nrd tip | 18 kN |
| Spațiere adopt | **≤ 80 cm** |
| Nr. / solbanc | **10** |
| util | **0.12** |
| PASS | **true** |

solbanc N și S: câte 10 ancore @ ≤80 cm

## Căprior ↔ solbanc

| | |
|--|--:|
| Tip | Ø8×120 lemn + colțar metalic recomandat |
| F / nod | 1.73 kN |
| Șuruburi / nod | **3** |
| util | **0.3** |
| PASS | **true** |
| Noduri total | 14 |

## FE / DT

- Confirmă vb,0 / cpe pe hartă NA  
- Capacitate ancoră din fișa producătorului + adâncime în centură  
- Colțar metalic la streșină dacă util șurub > 0,7  

JSON: `s1_a1_eaves_uplift_v01.json`
