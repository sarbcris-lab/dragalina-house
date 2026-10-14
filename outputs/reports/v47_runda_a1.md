# V47 Runda A — studiu A1

## Status
**A1 NEFEZABIL / STUDIU DESCHIS** — `v47_exact.json` **neatins**.

Checks geometrice fără eșecuri critice: da · Fezabilitate A1: **nu**

### Observații deschise (blochează fezabilitatea)
- fundație completă ±15 pe tot conturul (est CF)
- straturi sandwich residual confirmate de structurist
- înălțime liberă validată pe geometrie structurală finală (nu doar soffit țintă)
- transport geometric fără coliziuni

## Traseu
`curte→palier−95→scară↓N→palier(sub planșeu Y490–590 + puț Y590–600)→ușă→hol→CT/dep`

## Planșeu peste palierul inferior
- Puț deschis în planșeu: **Y590–860** (sub rampă2)
- Palier acoperit: **Y490–590** sub soffit -30 → clear țintă **220 cm**
- Gabarit real pe palier acoperit (sample): 220 cm @ Y490 (intrados_placa_peste_palier_acoperit)
- Grindă reazem studiu @ Y590


## Datum absolut (teren = 0)

| Cotă | cm |
|------|---:|
| teren | 0 |
| FF parter | +32 |
| palier acces | -95 |
| FF subsol | -250 |
| intrados (țintă studiu) | -30 |
| clear **declarat** (țintă) | 220 |
| clear **minim global** | **220** @ Y490 / intrados_placa_peste_palier_acoperit |
| clear **minim pe traseu acces** | **220** @ Y490 / intrados_placa_peste_palier_acoperit |
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

- Minim: **220 cm** la X=615, Y=490, obstacol `intrados_placa_peste_palier_acoperit` (z_obs=-30, z_cale=-250)
- Ușă vs clear zonă: {"opening_plus_lintel_cm":215,"clear_at_door_zone_cm":220,"ok":true}

## Verificări
### PASS
- upper_landing → Y860
- upper abut stair top
- palier jos N de ultima treaptă
- ușă pe palier Y500–600 (dy=100)
- ușă ∩ hol pe Y
- puț deschis în planșeu: doar Y590–860 (sub rampă2)
- palier acoperit de planșeu Y490–590: clear țintă 220 sub soffit -30
- puț deschis nu intersectează poligonul living P
- zid N @ Y477.5–490 (N de palier)
- zid EST puț = 15 cm (JSON)
- gabarit minim global = 220 cm @ Y490 X615 (intrados_placa_peste_palier_acoperit)
- gabarit minim pe traseu acces = 220 cm @ Y490 (intrados_placa_peste_palier_acoperit)
- ușă+buiandrug 215 ≤ clear zonă ușă 220
- transport: scară clear 100 ≥ 90 (studiu)
- transport: usa_subsol_camere: gol montaj 100 → clear 90 (toc 5+5) — păstrat studiu
- transport: usa_hol_ct: gol montaj 100 → clear 90 (toc 5+5) — păstrat studiu
- transport: usa_hol_dep: gol montaj 100 → clear 90 (toc 5+5) — păstrat studiu
- transport: hol lățime 185 ≥ 90
- util studii recalculat 37.87875 m² (Δ vs ref 0)
- arii subsol brut recalculate 31.3175 m²
- anvelopă 680×860 păstrată
- fundație MODELATĂ (clip N/E/S/W=0/0/0/15 cm): fără overflow ≥2 cm

### FAIL
- (niciuna)

### Note
- Y470–590 pe bandă est: planșeu/palier acoperit — nu gol ignorat sub pardoseală
- sandwich sumă 62 cm închide span numeric, dar stratul residual_level_to_ff e ipoteză — straturi NECONFIRMATE structural
- TRANSPORT NECONFIRMAT: există coliziuni în secvența geometrică sau spațiu manipulare insuficient — nu se folosește W+15 ca substitut
- poziții în conflict: intoarcere_15[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,treapta_7]; intoarcere_30[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,treapta_7]; intoarcere_45[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,foaie_deschisa_hol,treapta_7]; intoarcere_60[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,foaie_deschisa_hol,treapta_7]; intoarcere_75[toc_n,toc_s,foaie_deschisa_hol]
- TRANSPORT NECONFIRMAT — A1 nu poate fi declarată fezabilă pe transport
- fundație: ținta ±15 cm eșuează pe est Dragalina; clipul actual nu e „fundație completă” — observație DESCHISĂ
- înălțime liberă 220 = țintă pe soffit studiu; validare structurală planșeu/grinzi = DESCHISĂ
- țintă fundație uniformă 15 cm EȘUEAZĂ PIP: target_NW +0.058m; target_NE +0.15m; target_SE +0.15m; target_E_mid +0.15m
- PIP=false dist≈0 pe clip_SE — același artefact numeric ca SE anvelopă
- proiecție redusă față de ținta 15 cm (est/Dragalina tipic limitat de contur CF)
- colț SE anvelopă: PIP=false dist≈0 (numeric contur) — neschimbat vs referință

## Transport echipamente
Gabarit: **80×70×180 cm** · Goluri montaj **100** / clear **90** (păstrate studiu)

| Prag | Gol montaj | Clear după toc |
|------|----------:|---:|
| scară→hol | 100 | **90** |
| hol→CT | 100 | **90** |
| hol→depozit | 100 | **90** |

### Verificare geometrică (nu W+15)
- Status: **neconfirmat** · confirmed=false
- Metodă: poziții succesive AABB 80×70 (+inflate manipulare) vs pereți/toc/foaie/trepte — nu formula W+15
- Inflate manipulare: 5 cm · foaie: {"thickness_cm":4,"swing":"90° în hol, balama sud"}

| Pose | unghi | AABB | coliziuni |
|------|------:|------|-----------|
| coborare_t1 | 0° | 80×90 @ (575,742.5) | — |
| coborare_t2 | 0° | 80×90 @ (575,717.5) | — |
| coborare_t3 | 0° | 80×90 @ (575,692.5) | — |
| coborare_t4 | 0° | 80×90 @ (575,667.5) | — |
| coborare_t5 | 0° | 80×90 @ (575,642.5) | — |
| coborare_t6 | 0° | 80×90 @ (575,617.5) | — |
| coborare_t7 | 0° | 80×90 @ (575,592.5) | — |
| coborare_t8 | 0° | 80×90 @ (575,567.5) | — |
| palier_aliniat_scara | 0° | 80×90 @ (575,500) | — |
| intoarcere_15 | 15° | 98×105 @ (555,497.3) | zid_put_w_solid_n, zid_put_w_solid_s, toc_n, toc_s, treapta_7 |
| intoarcere_30 | 30° | 111×114 @ (538,492.9) | zid_put_w_solid_n, zid_put_w_solid_s, toc_n, toc_s, treapta_7 |
| intoarcere_45 | 45° | 116×116 @ (524.5,492) | zid_put_w_solid_n, zid_put_w_solid_s, toc_n, toc_s, foaie_deschisa_hol, treapta_7 |
| intoarcere_60 | 60° | 114×111 @ (514.5,494.7) | zid_put_w_solid_n, zid_put_w_solid_s, toc_n, toc_s, foaie_deschisa_hol, treapta_7 |
| intoarcere_75 | 75° | 105×98 @ (508.1,500.8) | toc_n, toc_s, foaie_deschisa_hol |
| intoarcere_90 | 90° | 90×80 @ (505,510) | — |
| in_gol_usa | 90° | 90×80 @ (505,510) | — |
| in_hol | 90° | 90×80 @ (440,510) | — |

## Puț / goluri / grosimi
- open_shaft Y590–860
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

## Arii P/E (recalculate după coordonare planșeu)
Metodă: shoelace(interior_polygon) − reuniune pereți int (−goluri baie/dorm)

| | m² |
|--|---:|
| util geometric P/E (recalcul) | **37.87875** |
| util ref anterior | 37.87875 |
| Δ după coordonare planșeu | 0 |
| anvelopă shoelace | 39.01 |
| pereți int net | 1.13125 |
| subsol brut camere | 31.3175 |
| subsol util estimat | 29.5194 |
| POT anvelopă/147 | 39.78% (limită admisă = deschisă) |

Notă: coordonarea planșeului (gol doar Y590–860) nu modifică poligonul interior P/E; utilul e reafirmat prin recalcul independent, nu prin copiere.

## Fișiere
- `data/building/v47_a1_study.json`
- `outputs/plans/31_v47_a1_subsol_plan.svg`
- `outputs/plans/32_v47_a1_access_section.svg`
- `outputs/reports/v47_runda_a1.md`
- `viewer/data/volume_v47_a1.json` → `?v=v47_a1`

Runda B: **neîncepută**.
