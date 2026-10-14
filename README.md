# Dragalina 131 — studiu conceptual parametric

Model geometric unic din `data/`. Planurile SVG și volumul 3D se regenerează din aceleași parametri.

**Nu este proiect autorizabil.**

## Date confirmate (CF 54602)

| Câmp | Valoare |
|------|---------|
| Din acte | 172 m² |
| Măsurată | **147 m²** (bază studiu) |
| Existent C1 | 76 m² (≠ maxim permis pentru nou) |

Poligonul cadastral **nu** este reconstruit din cele 10 lungimi (unghiuri necunoscute).

## Rulare

```bash
npm run build          # reconstruct CF polygon + generate plans/volume
npx --yes serve . -p 5173
```

Conturul terenului vine din **lungimile CF** (`data/site/parcel_polygon_cf.json`). Unghiurile sunt ipoteză (nu apar în extras).

Apoi deschide:
- http://localhost:5173/viewer/
- http://localhost:5173/outputs/plans/02_parter_concept_v01.svg

## Structură

- `inputs/` — CF, schițe, referințe
- `data/site/parcel.json` — confirmat + anvelopă de lucru
- `data/building/concept_v01.json` — geometrie concept (ipoteză)
- `src/generate.mjs` — generator
- `outputs/plans/` — SVG + mesh JSON
- `viewer/` — volumetrie Three.js

## Iterație prin prompt

1. Modifică `data/building/concept_v01.json` (sau cere agentului).
2. `npm run generate`
3. Refresh viewer / redeschide SVG.
