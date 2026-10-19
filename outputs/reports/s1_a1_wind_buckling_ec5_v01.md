# S1 A1 — Upgrade: vânt · flambaj · EC5 · CR0

**Status:** ordin de studiu · **NU** FE semnat  
**Generat:** 2026-10-18T20:35  
**Scop:** ridică notele pe aspectele care erau la 1

## Verdict scurt

| Aspect | Înainte | Acum (estimat) | De ce |
|--------|--------:|---------------:|-------|
| Vânt CR1-1-4 | 1 | **5** | qp + cpe + we pe ape/streșină |
| Ancorare PV | 1 | **5** | uplift/panou vs șuruburi ordin |
| Flambaj stâlpi | 1 | **5** | λ, φ, NEd/NRd pe 10 stâlpi P/E |
| Căpriori EC5 | 1 (LTB) / 5 flex | **5** | flex+compresie+kcrit OSB |
| Combinații CR0 | 3 | **5** | zăpadă vs vânt dominant |

**Încă la 1 (extern):** FEM, geo 131, confinare P100, planuri armare.

---

## 1. Vânt (CR 1-1-4 ordin · Turda)

| | |
|--|--:|
| vb,0 (ipoteză inland) | **27** m/s — confirmă hartă NA |
| qb | 0.456 kN/m² |
| ce(z≈3.82 m, cat.III) | 2.1 |
| qp | **0.958** kN/m² |
| cpe streșină F | -1.7 |
| we streșină (critic) | **-1.629** kN/m² |
| we câmp | -0.383 kN/m² |

### Ancorare PV (ordin)

| | |
|--|--:|
| Arie panou | 1.7 m² |
| F uplift ULS / panou | **4.15** kN |
| / 4 fixări | 1.04 kN |
| R șurub tip | 1.5 kN |
| Pass 4 șuruburi | **true** |
| Min. șuruburi dacă nu | **3** |

> Dacă suctiunea streșină e pe primul rând de panouri: folosește zona F (we=-1.629), nu câmpul.

---

## 2. Combinații CR0 pe acoperiș

| Caz | q_Ed / q_net |
|-----|-------------:|
| Zăpadă dominantă (1,35G + 1,5·Qs + 0,6·1,5·Qw) | **3.36** kN/m² |
| Vânt câmp + ψ zăpadă | **2.69** kN/m² |
| Uplift net streșină (orientativ) | 1.81 kN/m² |
| Doar zăpadă (vechi) | 3.02 kN/m² |
| **Adoptat design căpriori** | **3.36** kN/m² |

---

## 3. Căpriori EC5 (12×25 @ 1.2 m · L=4.97 m · 30°)

| | |
|--|--:|
| q linie | 4.03 kN/m |
| M_Ed | 12.46 kNm |
| N axial pe pantă | 10.02 kN |
| σm | 9.97 MPa (fm,d=14.8) |
| σc | 0.33 MPa (fc,d=12.9) |
| kcrit (OSB) | 1 |
| util EC5 | **0.692** |
| **PASS** | **true** |

Fără OSB (kcrit=0.7): util ar crește ~0.98 — **păstrează învelitoare/OSB ca diafragmă**.

---

## 4. Flambaj stâlpi EC2 (l0=0,85·H_story=2.61 m)

| ID | Secțiune | λ | φ | N_Ed | NRd,buck | util | PASS |
|----|----------|--:|--:|-----:|---------:|-----:|:----:|
| C_NW | 30×30 | 30.1 | 0.971 | 354 | 1456 | 0.243 | **true** |
| C_N_MID | 40×30 | 34.8 | 0.958 | 550.8 | 1916.5 | 0.287 | **true** |
| C_NE | 30×30 | 30.1 | 0.971 | 369.3 | 1456 | 0.254 | **true** |
| C_W_MID | 30×40 | 34.8 | 0.958 | 414.9 | 1916.5 | 0.216 | **true** |
| C_W_DORM | 30×30 | 30.1 | 0.971 | 212.5 | 1456 | 0.146 | **true** |
| C_S_DORM_E | 30×30 | 30.1 | 0.971 | 116.7 | 1456 | 0.08 | **true** |
| C_E_PAL | 30×40 | 34.8 | 0.958 | 329.9 | 1916.5 | 0.172 | **true** |
| C_CASA_SCARA | 30×40 | 34.8 | 0.958 | 153 | 1916.5 | 0.08 | **true** |
| C_S_INTRARE_W | 40×30 | 34.8 | 0.958 | 125.4 | 1916.5 | 0.065 | **true** |
| C_S_INTRARE_E | 30×30 | 30.1 | 0.971 | 165.8 | 1456 | 0.114 | **true** |

**Pass:** 10/10
Toate sub util 0,85 pe ordin.

---

## 5. Ce NU s-a rezolvat (încă notă 1)

1. **FEM 3D** — Robot/Axis pe schema A1  
2. **Geo Rc pe 131** — studiu teren  
3. **Confinare P100** — etrieri zone critice  
4. **Planuri armare**  
5. **vb,0 / sk oficial** pe hărți NA — aici ipoteze Turda tipice  

## Regenerare

`npm run calc:a1:upgrade` sau inclus în `npm run calc:a1`

JSON: `outputs/reports/s1_a1_wind_buckling_ec5_v01.json`
