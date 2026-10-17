# Audit + aliniere fațadă unică (2026-10-17)

**Status:** aplicat în mesh FRAME · NECONFIRMAT capacitate  
**Regulă unică (beneficiar):**

| Față | Finit | Beton | Interior | Proeminență |
|------|-------|-------|----------|-------------|
| **E / S** | plană (linie) | finit − A2 (10,5) | finit − 31,2 | în **cameră** (+~10 vs falie) |
| **N / V** | pilastri stâlp+placă | pe finit (0) | **la linie** (baie/living N, dorm/baie V) | pe **exterior** |

## Ce era greșit (înainte)

1. Stâlpi E/S pe **finit** (682,6 / 861,3) → beton în zona ETICS; fără wrap → fațadă neizolată local.
2. Util pe X**661,9** / Y**840,6** — număra bandă încă perete (walls E int ≈ **651,4**).
3. Două ipoteze (masonry util ≠ volum estratificat).

## Ce e acum (o geometrie)

| Cotă | cm |
|------|---:|
| Finit E / S / W / N | 682,6 / 861,3 / 0 / 0 |
| Beton E / S | **672,1** / **850,8** |
| Int. E / W / N / S / S_dorm | **651,3** / **31,3** / **29,9** / **830,0** / **645** |
| Util P / E | **38,652** / **37,886** m² |
| POT 147 | **39,99%** (amprentă finită neschimbată) |

ETICS pe stâlpi: **da pe E/S**, **nu pe N/V**.

## Backlog (din feedback, neatins în această rundă)

- Clear etaj sub centuri (~239) — centuri ↑ / spre pod
- Goluri: parapet + lintel pe cote (nu extrudare pe toată H)
- Fundații vs cadastru
- Docs master stale / etichete scară
- FE placă 20 · consolă B_E · B_X360 70
- Acoperiș: etichete BA vs vizual lemn → D3a (etichete)

## Surse

- Generator: `src/study_v47_frame_schema.mjs`
- Lock: `decisions/form_target_R_v01.md` · log 2026-10-17
