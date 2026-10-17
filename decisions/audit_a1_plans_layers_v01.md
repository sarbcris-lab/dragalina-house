# Audit A1 planuri + straturi (2026-10-17)

**Verdict:** straturile v0.15–0.16 **nu erau OK** — corectat A1.16 (sens) + **A1.17** (izolație continuă / EB20 între stâlpi).

## A1.17 — răspuns beneficiar

| Întrebare | Răspuns pe plan |
|-----------|-----------------|
| De ce nu e izolație continuă la exterior? | Era greșit desenată pe toată grosimea împreună cu cărămida. Acum: bandă ISOVER/ETICS **continuă** pe finit (și peste stâlpi). |
| De ce cărămidă lângă stâlpi? | Greșit — EB20 e **umplutură între** stâlpi, nu pe fața ext. lângă beton. Stâlpul înlocuiește local falie; izolația trece pe dinafară. |

## Demonstrat (bug-uri)

| # | Problemă | Severitate | Fix |
|---|----------|------------|-----|
| 1 | `palier_A6_nord_etaj`: `outward_hint=south` ignorat → ISOVER spre **nord (încălzit)** | **CRITICAL** | `wallOutward` respectă hint + forțează S |
| 2 | `nisa_dulap_est` A8: faianță pe **vest** (dressing), nu spre baie_se (est) | **HIGH** | outward=W (baie la E) |
| 3 | Micro-straturi adeziv/ETICS 0,5–0,7 cm → linii moarte pe A3 | **HIGH** | benzi plan: tenc / EB20 / ISOVER / finisaj |
| 4 | `living_palier` desenat deși note ELIMINAT | **MED** | scos din `showWall` |
| 5 | Etichete `A1 30cm` pe fiecare fragment → zgomot | **LOW** | doar pe anvelope lungi, doar cod |

## OK (păstrat)

| | |
|--|--|
| Anvelopă N/V/E/S | ISOVER + klinker/ETICS pe **exterior**; EB20 spre interior |
| `buc_est` / A6 vertical | casă V → scară E |
| `palier_inchidere_sud_p` | încălzit N → rece S |
| Stâlpi | pe extrema EB20 (retrași de pe finit); beton hașurat; +10 |
| A7 | GKB \| vată \| GKB simetric |

## Încă deschis (nu blocant A1 studiu)

| # | Observație |
|---|------------|
| A | Nord X565–680: catalog amestec A1/A4 (scară rece) — pe plan tot A1 pe toată lungimea |
| B | Colțuri: straturile se suprapun (fără mitrare) — normal la studiu 2D |
| C | Beton = doar stâlpi (cadre); între stâlpi = EB20 umplutură — corect FRAME |
| D | Util shoelace − proem. stâlpi = rundă următoare |

## Fișiere

- Generator: `src/build_a1_architecture.mjs`
- Planuri: `outputs/plans/a1_plan_parter.svg` · `a1_plan_etaj.svg`
- Catalog: `decisions/assemblies_catalog_v01.md`
