# V44 — suprafețe verificate

Metodă: shoelace(anvelopă interioară) − reuniune pereți int (−goluri). Nu se preiau valori V43 contradictorii.

## Util global

| Pas | V44 | V43 (ref) |
|-----|-----|----------|
| Anvelopă shoelace | **38.8025** | 40.3535 |
| Pereți int net | **1.1844** | 1.1338 |
| **Util net** | **37.6181** | 39.2197 |

## Dormitor (descompunere)

| Element | m² |
|---------|-----|
| Dreptunghi principal 317,5×362,5 | **11.509375** |
| Nișă dulap 120×60 (pardoseală) | **0.720000** |
| Pereți nișă (în scăderea globală util) | 0.256250 |
| Sumă principal+nișă (orientativ) | 12.229375 |

Nu se folosesc 12,23 / 12,36 m².

## Baie

| Element | m² |
|---------|-----|
| Bază 265×225 | 5.962500 |
| − tăietură nișă (132,5×72,5) | 0.960625 |
| **Net baie** | **5.001875** (~5,00) |

## Terasă

- Placă 330×200 = **6.60 m²** (țintă 6,60)
- Liber (parapet V+S 10): 320×190 = **6.08 m²** (țintă 6,08)

## Pereți int (cm²)

```
{
  "dormitor_est": 4531.25,
  "nisa_dulap_spate": 1500,
  "nisa_dulap_est": 1062.5,
  "dorm_baie_nord": 2312.5,
  "baie_est": 2812.5,
  "tv_wall": 1750
}
Goluri: {"baie_usa":1000,"dorm_usa":1125}
Overlaps: 0
```
