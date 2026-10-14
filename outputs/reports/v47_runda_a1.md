# V47 Runda A — studiu A1 (corectat)

## Status
**A1 FEZABIL (după corecții)** — `v47_exact.json` **neatins**.

## Traseu
`curte(0) → trepte → palier−95(Y800–860) → scară(Y600–800↓N) → palier liber−250 → ușă (clear 90) → hol → CT/dep`

## Datum absolut (teren = 0)

| Cotă | cm |
|------|---:|
| teren | 0 |
| FF parter | +32 |
| palier acces | -95 |
| FF subsol | -250 |
| intrados (țintă studiu) | -30 |
| clear **declarat** (țintă) | 220 |
| clear **minim global** | **220** @ Y230 / intrados_placa_parter@camera_tehnica |
| clear **minim pe traseu acces** | **251** @ Y830 / structura_r2_0 |
| ușă + buiandrug | 200+15=215 |

## Sandwich intrados -30 → FF +32 (62 cm)

| Strat | cm | z0 → z1 |
|-------|---:|---------|
| intrados_finish | 2 | -30 → -28 |
| services_plenum | 8 | -28 → -20 |
| structural_slab | 20 | -20 → 0 |
| insulation | 5 | 0 → 5 |
| heating_screed_finish | 12 | 5 → 17 |
| residual_level_to_ff | 15 | 17 → 32 |

straturi sumă 62 cm = FF(32) − intrados(-30)

**Clear-ul de 220 cm nu este validat prin scădere**; validarea e `headroom_audit` (intersecții cu `structura_r2_*`, intrados palier etaj, placă).

## Headroom (calcul)

- Minim: **220 cm** la X=282.5, Y=230, obstacol `intrados_placa_parter@camera_tehnica` (z_obs=-30, z_cale=-250)
- Ușă vs clear zonă: {"opening_plus_lintel_cm":215,"clear_at_door_zone_cm":558,"ok":true}

## Verificări
### PASS
- upper_landing → Y860
- upper abut stair top
- palier jos N de ultima treaptă
- ușă pe palier Y500–600 (dy=100)
- ușă ∩ hol pe Y
- puț deschis începe la Y490 (= palier)
- zid N @ Y477.5–490 (N de palier, nu Y590)
- zid EST puț = 15 cm (JSON)
- sandwich modelat: 62 cm = FF(+32) − intrados(-30)
- gabarit minim global = 220 cm @ Y230 X282.5 (intrados_placa_parter@camera_tehnica)
- gabarit minim pe traseu acces = 251 cm @ Y830 (structura_r2_0)
- ușă+buiandrug 215 ≤ clear zonă ușă 558
- transport: scară clear 100 ≥ 90
- transport: usa_subsol_camere (scară→hol): gol 100 → clear 90 după toc 5+5
- transport: usa_hol_ct (hol→CT): gol 100 → clear 90 după toc 5+5
- transport: usa_hol_dep (hol→depozit): gol 100 → clear 90 după toc 5+5
- transport: gabarit lățime 70 ≤ clear 90
- transport: întoarcere pivot scară→ușă OK: Dy 110 ≥ 85.0 (gabarit 80×70)
- transport: rotație liberă NU (diag 106.3 > min latură); acceptat doar pivot în gol
- transport: hol lățime 185 ≥ 90 (către CT/depozit)
- util studii recalculat 37.87875 m² (Δ vs ref 0)
- arii subsol brut recalculate 31.3175 m²
- anvelopă 680×860 păstrată
- fundație MODELATĂ (clip N/E/S/W=0/0/0/15 cm): fără overflow ≥2 cm

### FAIL
- (niciuna)

### Note
- clear_declared 220 NU e validat doar prin scădere; vezi headroom_audit.min_clear_cm
- gabarit 80×70×180; întoarcere: free=false pivot=true (Dy 110, necesar pivot 85)
- Palierul vechi dy=80: pivot necesita ≥ W+15; cu W=70 → 85 > 80 → EȘEC întoarcere (chiar dacă golul trecea obiectul).
- țintă fundație uniformă 15 cm EȘUEAZĂ PIP: target_NW +0.058m; target_NE +0.15m; target_SE +0.15m; target_E_mid +0.15m
- PIP=false dist≈0 pe clip_SE — același artefact numeric ca SE anvelopă
- proiecție redusă față de ținta 15 cm (est/Dragalina tipic limitat de contur CF)
- colț SE anvelopă: PIP=false dist≈0 (numeric contur) — neschimbat vs referință

## Transport echipamente
Gabarit explicit: **80×70×180 cm** — baterie 70×25×110 + marjă manipulare; L=80 pe direcția de coborâre

| Prag | Gol montaj | Clear după toc (5+5) |
|------|----------:|---:|
| scară→hol | 100 | **90** |
| hol→CT | 100 | **90** |
| hol→depozit | 100 | **90** |

### Întoarcere pe palier
- Palier liber: **100×110 cm** (fost 80 cm — insuficient pentru pivot)
- diag(80×70=106.3) ≤ min(100,110) → free=false
- clear_ușă 90 ≥ L 80 → Dy ≥ W+marjă = 70+15 → pivot=**true**
- Palierul vechi dy=80: pivot necesita ≥ W+15; cu W=70 → 85 > 80 → EȘEC întoarcere (chiar dacă golul trecea obiectul).
- Verdict transport: **OK**

## Puț / goluri / grosimi
- open_shaft Y490–860
- zid N @ Y477.5–490
- gol palier–hol: Y500–600 (gol 100 → clear 90)
- EST puț: 15 cm · VEST: 30 cm

## Fundație / parcelă
Țintă 15 cm · clip `{"N":0,"S":0,"W":15,"E":0,"target_cm":15}` · clip_all_inside=false · target_all_inside=false

| Punct (clip) | inside | overflow_m |
|-------|:------:|-----------:|
| clip_NW | true | 0 |
| clip_NE | true | 0 |
| clip_SE | false | 0 |
| clip_SW | true | 0 |
| clip_N_mid | true | 0 |
| clip_E_mid | true | 0 |
| clip_S_mid | true | 0 |
| clip_W_mid | true | 0 |

## Arii (recalculate, nu copiate)
| | m² |
|--|---:|
| util studii (recalcul) | **37.87875** |
| util ref (înainte) | 37.87875 |
| Δ | 0 |
| subsol brut camere | 31.3175 |
| subsol util estimat | 29.5194 |
| POT anvelopă/147 | 39.78% (limită admisă = deschisă) |

## Fișiere
- `data/building/v47_a1_study.json`
- `outputs/plans/31_v47_a1_subsol_plan.svg`
- `outputs/plans/32_v47_a1_access_section.svg`
- `outputs/reports/v47_runda_a1.md`
- `viewer/data/volume_v47_a1.json` → `?v=v47_a1`

Runda B: **neîncepută**.
