# Schemă — model parametric

## Straturi (nu amesteca)

| Strat | Fișier | Conținut |
|-------|--------|----------|
| Confirmat | `data/site/parcel.json` → `confirmed` | CF: arii, segmente, adresă |
| Ipoteză teren | `parcel.json` → `working_envelope` | Anvelopă schematică |
| Concept clădire | `data/building/concept_v01.json` | Plan + volum din schiță |
| Variante stil | (ulterior) | Materiale pe aceeași geometrie |

## Pipeline

```
data/*  →  src/generate.mjs  →  outputs/plans/*.svg
                             →  viewer/data/volume.json
```

Runtime: **Node.js** (Blender/Python neinstalate pe mașină).
