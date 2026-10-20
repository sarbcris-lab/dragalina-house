# S1 A1 — Verificare viewer/planuri A1.205

**Status:** verificare **statică** (cod + JSON + SVG) · capturi WebGL = checklist manuală mai jos  
**Rezultat:** **28/28** OK

## Checks automate

| ID | OK | Detaliu |
|----|----|---------|
| `site_layer_complete` | PASS | 0 fără site_layer |
| `level_tagged` | PASS | 0/1206 fără level |
| `basement_floors_exist` | PASS | 3 pardoseli beci |
| `basement_floors_level` | PASS | all subsol |
| `viewer_has_btnRoofTimber` | PASS | btnRoofTimber |
| `viewer_has_btnRoofAttic` | PASS | btnRoofAttic |
| `viewer_has_acoperis_sarpanta` | PASS | acoperis_sarpanta |
| `viewer_has_acoperis_pod` | PASS | acoperis_pod |
| `viewer_has_rowStructFilters` | PASS | rowStructFilters |
| `viewer_has_structFilter` | PASS | structFilter |
| `viewer_has_btnProprietate` | PASS | btnProprietate |
| `viewer_has_btnSubsolAcces` | PASS | btnSubsolAcces |
| `viewer_has_section_cap` | PASS | section_cap |
| `viewer_has_isBasementAccessId` | PASS | isBasementAccessId |
| `plans_fit` | PASS | Încadrează |
| `plans_pan_zoom` | PASS | pan/zoom |
| `plans_fundatii_tab` | PASS | tab fundații |
| `plans_compact` | PASS | fără frame vechi scroll-in-scroll |
| `situatie_arch` | PASS | — |
| `situatie_fund` | PASS | — |
| `situatie_north_corner` | PASS | nord prezent |
| `situatie_scale_bar` | PASS | scară 5 m |
| `situatie_setback_line` | PASS | linii retrageri |
| `chairs_rotated` | PASS | scaune rotite |
| `terrace_not_util` | PASS | terasă ≠ util |
| `door_vs_stair_clear` | PASS | gol ≠ clear |
| `roof_timber` | PASS | 17 elemente șarpantă |
| `roof_shell` | PASS | 6 învelitoare/PV |

## Checklist manuală (desktop + telefon)

Pentru fiecare view: captură full · elemente obligatorii prezente · străine absente · 2–3 cote pe select.

| # | View / combinație | Desktop | Mobil | Note |
|---|-------------------|---------|-------|------|
| 1 | Casă | ☐ | ☐ | fără gard/teren |
| 2 | Proprietate | ☐ | ☐ | sit + porți |
| 3 | Parter + Plan orto | ☐ | ☐ | rămâne parter |
| 4 | Etaj | ☐ | ☐ | fără șarpantă |
| 5 | Subsol · Camere | ☐ | ☐ | pardoseli vizibile |
| 6 | Subsol · Acces | ☐ | ☐ | put/scară dominante |
| 7 | Structură + filtre categorii | ☐ | ☐ | toggle stâlpi/grinzi |
| 8 | + Pereți | ☐ | ☐ | zid semi-transparent |
| 9 | Acoperiș · Exterior | ☐ | ☐ | PV + țiglă |
| 10 | Acoperiș · Șarpantă | ☐ | ☐ | fără învelitoare |
| 11 | Acoperiș · Pod (+S3) | ☐ | ☐ | tăiere ⊥ |
| 12 | Împrejmuire | ☐ | ☐ | hotar ≠ gard |
| 13 | Curte | ☐ | ☐ | auto/alee/puț |
| 14 | S1 / S2 / S3 + cap | ☐ | ☐ | față umplută |
| 15 | Secțiune → alt nivel | ☐ | ☐ | coerență |
| 16 | Planuri: Încadrează / zoom | ☐ | ☐ | /outputs/plans/ |
| 17 | Situație + Fundații | ☐ | ☐ | retrageri cotate |

## Cum rulezi

```
node src/verify_a1_viewer_a1205_v01.mjs
```
