# V43 rev4 — suprafețe

## Util net (verificabil)

| Pas | Valoare |
|-----|--------|
| Aria în interiorul anvelopei (shoelace) | **40.353500 m²** |
| − reuniune pereți interiori (brut) | 1.333750 m² |
|   intersecții duble | 0.000000 m² |
|   − goluri în pereți (baie+dorm glisante) | 0.200000 m² |
| = amprentă pereți netă | **1.133750 m²** |
| **Util net** | **39.219750 m²** |

Descompunere: 40.3535 − 1.1338 = **39.2197 m²**.

```
Pereți (cm², clipți la poligon):
  dormitor_est: 5118.75
  dorm_baie_nord: 3968.75
  baie_est: 2812.5
  hol_ne: 1437.5
Goluri (cm²): {"baie_glisanta":1000,"dorm_glisanta":1000}
Notă: 40,3535 m² = poligonul verde (include pereți int) — NU e util net.
Pragurile nu se scad separat (rămân în util).
```

| Cantitate | Valoare |
|-----------|--------|
| Terasă placă | 5.0490 m² |
| Terasă liberă | 4.5760 m² |
| Bandă scară | 4.3700 m² |
| Gabarit | 58.48 m² |

## Site

- Parcelă reconstruită: 145.741 m² vs 147 — **aproximativ**
- corners_inside: {"NW":true,"NE":true,"SE":false,"SW":true}
- corner_overflow_m: {"NW":{"inside":true,"dist_m":0,"note":null},"NE":{"inside":true,"dist_m":0,"note":null},"SE":{"inside":false,"dist_m":0,"note":"PIP=false, dist≈0 (contur/numeric)"},"SW":{"inside":true,"dist_m":0,"note":null}}
