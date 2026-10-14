# V47 — suprafețe

Recalculate din poligoane V47 — baseline comparativ **v46 r7g**.

## Util geometric vs utilă

| Tip | Valoare |
|-----|--------|
| Anvelopă shoelace | 39.010000 m² |
| Pereți int net | 1.131250 m² |
| **Util geometric (model)** | **37.878750 m²** |
| Utilă după reguli autorizare | *nu substituită aici*; POT pe teren CF **147 m²** |

egală cu util geometric din model; reguli autorizare (POT pe 147 etc.) separate

## Camere

| | V47 | V46 r7g |
|--|-----|-----|
| Dorm principal | 11.5094 | 11.5094 |
| Nișă dulap | 0.8400 | 0.8400 |
| Baie net | 6.5269 | 6.5269 |
| Terasă placă | 10.200 | 16.950 |
| Terasă liberă | **9.57** | 16.09 |
| Util geom. | **37.8787** | 37.8787 |

```
Pereți cm²: {
  "perete_comun_est": 7687.5,
  "nisa_dulap_spate": 1500,
  "nisa_dulap_est": 1187.5,
  "dorm_baie_nord": 2312.5,
  "ecran_frigider": 750
}
Goluri: {"baie_usa":1000,"dorm_usa":1125}
```
