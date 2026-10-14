# Etapa 0–1 — Audit surse (actualizat) · Dragalina 131

**Data:** 12.10.2026 · **Statut:** documente organizate; studiu conceptual pornit

## 1. Inventar organizat (`inputs/`)

| Cale | Rol | Status utilizare |
|------|-----|------------------|
| `inputs/cadastru/CF_54602_Turda_extras_2026-10-07.pdf` | Extras CF | CONFIRMAT |
| `inputs/sketches/plan_dimensional_parter_etaj.jpeg` | Schiță parter/etaj | IPOTEZĂ DE LUCRU |
| `inputs/references/*` | Inspirație fațade/volum | Referință vizuală |
| Plan amplasament desenat | — | **LIPSĂ** (nu blochează conceptul) |

## 2. Suprafețe CF (reguli de lucru)

| Câmp | Valoare | Folosire |
|------|---------|----------|
| Din acte | **172 m²** | Documentară |
| Măsurată | **147 m²** | Bază cadastrală pentru studiu |
| Existent C1 | **76 m²** | Amprentă actuală; **nu** plafon maxim pentru construcție nouă |

## 3. Segmente perimetru

10 lungimi Stereo 70 din CF — **CONFIRMAT**. Forma/unghiurile **nu** sunt inventate; poligonul rămâne nedeterminat.

## 4. Separare straturi

1. **Confirmat** — `data/site/parcel.json` → `confirmed`
2. **Ipoteză teren** — `working_envelope` rectangular ≈147.5 m² (schematic)
3. **Concept clădire** — `data/building/concept_v01.json` din schiță 9,30×7,80 (nu e cadastru)

## 5. Pipeline

`npm run generate` → `outputs/plans/*.svg` + `viewer/data/volume.json`
