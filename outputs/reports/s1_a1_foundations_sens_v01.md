# S1 A1 — Sensibilitate fundații q = 180 / 221 / 250

**Status:** studiu · **NU** semnat · nu rescrie lock-ul q=221  
**Generat:** 2026-10-19T08:25

## Rezumat

| Scenariu | q_allow | Pad max | Σ pad m² | Δ vs 221 | Talpă 80 PASS | Talpă nec. |
|----------|--------:|--------:|---------:|---------:|:-------------:|-----------:|
| **q180** pesimist (geo mai slab) | 180 | 205 | 19.85 | +20 cm max / +3.45 m² | **true** | 60 |
| **q221** lock studiu 310/1,4 (adoptat) | 221 | 185 | 16.4 | +0 cm max / +0 m² | **true** | 60 |
| **q250** optimist (aproape Pconv/1,24) | 250 | 175 | 14.68 | -10 cm max / -1.72 m² | **true** | 60 |

**Adoptat rămâne q=221** (A1.185). Geo 131 înlocuiește.

## Pad-uri pe stâlp

### q180 — q=180 kPa

| ID | N kN | Pad cm | σ | PASS |
|----|-----:|-------:|--:|:----:|
| C_NW | 369.6 | 145×145 | 176 | **true** |
| C_N_MID | 574.9 | 180×180 | 177 | **true** |
| C_NE | 385.5 | 150×150 | 171 | **true** |
| C_W_MID | 433.2 | 160×160 | 169 | **true** |
| C_W_DORM | 222 | 115×115 | 168 | **true** |
| C_S_DORM_E | 122.2 | 85×85 | 169 | **true** |
| C_E_PAL | 741.6 | 205×205 | 176 | **true** |
| C_CASA_SCARA | 176.5 | 100×100 | 177 | **true** |
| C_S_INTRARE_W | 131.5 | 90×90 | 162 | **true** |
| C_S_INTRARE_E | 173.3 | 100×100 | 173 | **true** |
| C_SHAFT_E_PIER | 20.3 | 80×80 | 32 | **true** |

### q221 — q=221 kPa

| ID | N kN | Pad cm | σ | PASS |
|----|-----:|-------:|--:|:----:|
| C_NW | 369.6 | 130×130 | 219 | **true** |
| C_N_MID | 574.9 | 165×165 | 211 | **true** |
| C_NE | 385.5 | 135×135 | 212 | **true** |
| C_W_MID | 433.2 | 145×145 | 206 | **true** |
| C_W_DORM | 222 | 105×105 | 201 | **true** |
| C_S_DORM_E | 122.2 | 80×80 | 191 | **true** |
| C_E_PAL | 741.6 | 185×185 | 217 | **true** |
| C_CASA_SCARA | 176.5 | 90×90 | 218 | **true** |
| C_S_INTRARE_W | 131.5 | 80×80 | 205 | **true** |
| C_S_INTRARE_E | 173.3 | 90×90 | 214 | **true** |
| C_SHAFT_E_PIER | 20.3 | 80×80 | 32 | **true** |

### q250 — q=250 kPa

| ID | N kN | Pad cm | σ | PASS |
|----|-----:|-------:|--:|:----:|
| C_NW | 369.6 | 125×125 | 237 | **true** |
| C_N_MID | 574.9 | 155×155 | 239 | **true** |
| C_NE | 385.5 | 125×125 | 247 | **true** |
| C_W_MID | 433.2 | 135×135 | 238 | **true** |
| C_W_DORM | 222 | 95×95 | 246 | **true** |
| C_S_DORM_E | 122.2 | 80×80 | 191 | **true** |
| C_E_PAL | 741.6 | 175×175 | 242 | **true** |
| C_CASA_SCARA | 176.5 | 85×85 | 244 | **true** |
| C_S_INTRARE_W | 131.5 | 80×80 | 205 | **true** |
| C_S_INTRARE_E | 173.3 | 85×85 | 240 | **true** |
| C_SHAFT_E_PIER | 20.3 | 80×80 | 32 | **true** |


## Recomandare

- Lock curent **221** e echilibrat față de 180 (pad max +20 cm) și 250 (-10 cm).
- Mărește pad-uri (max → 205 cm) și verifică talpa 80; posibil ≥60 cm pe retenție.
- Pad-urile actuale rămân confortabile; poți micșora ușor la FE dacă Rc confirmat.

JSON: `s1_a1_foundations_sens_v01.json`
