# S1 A1 — A1.206: scară / anvelopă / consolă (răspuns capturi)

## Ce era greșit în 3D (demonstrat)

| Observație | Cauză în date | Remediu |
|------------|---------------|---------|
| Plăci orizontale pe rampe | `pardoseala_scara_p_p` / `_e_e` = FF pe toată camera scară, fără gol | Nu se mai generează pardoseală pe `scara_*` |
| Se vede în pod | Streșină fără sofit + fronton triunghi subțire | Sofit N/S + fronton cu grosime |
| Fronton „fără cărămidă” | Mesh unic maro, fără A2 | Fronton E culoare klinker + label A2/Ströher |
| Geam living „lipsă” | Geamul e pe **fațada est**; privirea din vest/sud | Date OK — verificare din est / click `sticla_geam_est_L0` |

## Consolă căpriori — e posibil?

**Da, ca streșină tipică pe solbanc**, nu ca grindă liberă în aer.

- Căpriorii reazemă pe **solbanc** (pe centură/CONC) + **coamă**; vârful streșinii nu cere stâlpi.
- În model, depășirea față de amprentă e **~0–3 cm** (nu consolă mare liberă).
- Calcul studiu: EC5 căprior util **~0,69** PASS; uplift streșină `we` **−1,63 kN/m²** → ancorare solbanc (vezi `s1_a1_eaves_uplift_v01`, `s1_a1_roof_bom_v01`).
- Ce lipsea vizual: **sofit** — de aceea păreau „grinzi care nu se sprijină pe nimic”.

**Nu** este validat FE semnat; e studiu parametric.

## Puț scară — ce e OK / ce e deschis

- Sus: clear pe verticală (nu umpli cu placă FF) — aliniat cu clear255.
- P: `fatada_scara_est_inchidere_p` închide spre Dragalina.
- E: lamele + solid etaj.
- **Deschis:** închidere lateral/spate completă + citire cap (parapet/plafon) ca volum finit — de rafinat fără a muta amenajarea.

## Regen

```
node src/build_v47_3d.mjs data/building/v47_a1_study.json viewer/data/volume_v47_a1.json
```
