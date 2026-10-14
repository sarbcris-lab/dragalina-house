# V45 — suprafețe

Recalculate din poligoane V45 — **fără preluare V44**.

## Util geometric vs utilă

| Tip | Valoare |
|-----|--------|
| Anvelopă shoelace | 39.125000 m² |
| Pereți int net | 1.056250 m² |
| **Util geometric (model)** | **38.068750 m²** |
| Utilă după reguli autorizare | *nu substituită aici*; POT pe teren CF **147 m²** |

egală cu util geometric din model; reguli autorizare (POT pe 147 etc.) separate

## Camere

| | V45 | V44 |
|--|-----|-----|
| Dorm principal | 11.5094 | 11.5094 |
| Nișă dulap | 0.8400 (120×70) | 0.7200 (120×60) |
| Baie net | 6.5269 | 5.0019 |
| Terasă placă | 6.105 | 6.600 |
| Terasă liberă | **5.60** (320×175) | 6.08 (nu 320×190) |
| Util geom. | **38.0688** | 37.6181 |

```
Pereți cm²: {
  "perete_comun_est": 7687.5,
  "nisa_dulap_spate": 1500,
  "nisa_dulap_est": 1187.5,
  "dorm_baie_nord": 2312.5
}
Goluri: {"baie_usa":1000,"dorm_usa":1125}
```
