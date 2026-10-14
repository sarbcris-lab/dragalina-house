# V47 Runda A — studiu A1

## Status
**A1 NEFEZABIL / STUDIU DESCHIS** — `v47_exact.json` **neatins**.

Checks geometrice fără eșecuri critice: da · Fezabilitate A1: **nu**

### Observații deschise (blochează fezabilitatea)
- straturi sandwich residual confirmate de structurist
- înălțime liberă validată pe geometrie structurală finală (nu doar soffit țintă)
- transport geometric (opțional dacă orientare corectă de la intrare)

## Traseu
`curte→palier−95→scară↓N→palier(sub planșeu Y490–590 + puț Y590–600)→ușă→hol→CT/dep`

## Planșeu peste palierul inferior
- Puț deschis în planșeu: **Y590–860** (sub rampă2)
- Palier acoperit: **Y455–590** sub soffit -30 → clear țintă **220 cm**
- Gabarit real pe palier acoperit (sample): 220 cm @ Y455 (intrados_placa_peste_palier_acoperit)
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
| clear **minim global** | **195.5** @ Y963.5 / intrados_podest_se@călcare_3 |
| clear **minim pe traseu acces** | **220** @ Y455 / intrados_placa_peste_palier_acoperit |
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

- Minim: **195.5 cm** la X=570, Y=963.5, obstacol `intrados_podest_se@călcare_3` (z_obs=148, z_cale=-47.5)
- Ușă vs clear zonă: {"opening_plus_lintel_cm":215,"clear_at_door_zone_cm":220,"ok":true}

## Verificări
### PASS
- upper_landing → Y868 (continuu cu rampă curte)
- upper abut stair top
- trepte curte Y868–1036 (6×28, 0→−95)
- alee racord continuu @ Y1036 (dy=150)
- alee lățime 150 cm păstrată
- palier jos N de ultima treaptă
- ușă pe palier Y465–565 (dy=100)
- ușă termină N de grindă (Y565 ≤ 575)
- ușă ∩ hol pe Y
- puț deschis în planșeu: doar Y590–860 (sub rampă2)
- palier acoperit de planșeu Y455–590: clear țintă 220 sub soffit -30
- puț deschis nu intersectează poligonul living P
- zid N @ Y442.5–455 (N de palier)
- zid EST puț = 15 cm (JSON)
- gabarit minim (fără sub-podest curte) = 220 cm
- gabarit minim pe traseu acces puț = 220 cm @ Y455 (intrados_placa_peste_palier_acoperit)
- sub podest_se (lățime utilă): min 195.5 cm ≥ 190 — NU se declară 200
- ușă+buiandrug 215 ≤ clear zonă ușă 220
- transport: scară clear 100 ≥ 90 (studiu)
- transport: usa_subsol_camere: gol montaj 100 → clear 90 (toc 5+5) — păstrat studiu
- transport: usa_hol_ct: gol montaj 100 → clear 90 (toc 5+5) — păstrat studiu
- transport: usa_hol_dep: gol montaj 100 → clear 90 (toc 5+5) — păstrat studiu
- transport: hol lățime 185 ≥ 90
- fundație beton în parcelă (inset finit 4.199999999999999 cm = termo−talpă)
- util studii recalculat 38.89875 m² (Δ vs ref 1.02)
- arii subsol brut recalculate 31.3175 m²
- anvelopă 680×860 păstrată
- țintă fundație ±undefined cm: toate punctele în parcelă
- fundație MODELATĂ (clip N/E/S/W=13.95/4.2/20/20 cm): fără overflow ≥2 cm

### FAIL
- (niciuna)

### Note
- Y470–590 pe bandă est: planșeu/palier acoperit — nu gol ignorat sub pardoseală
- sandwich sumă 62 cm închide span numeric, dar stratul residual_level_to_ff e ipoteză — straturi NECONFIRMATE structural
- Acoperirea fixă nouă se dimensionează ulterior, fără reintroducerea unei înălțimi insuficiente sub podest_se.
- TRANSPORT NECONFIRMAT: există coliziuni în secvența geometrică sau spațiu manipulare insuficient — nu se folosește W+15 ca substitut
- poziții în conflict: intoarcere_15[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s]; intoarcere_30[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s]; intoarcere_45[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,foaie_deschisa_hol]; intoarcere_60[zid_put_w_solid_n,zid_put_w_solid_s,toc_n,toc_s,foaie_deschisa_hol]; intoarcere_75[toc_n,toc_s,foaie_deschisa_hol]
- TRANSPORT NECONFIRMAT — A1 nu poate fi declarată fezabilă pe transport
- legacy +15 cm peste fața FINITE eșuează pe est — ipoteză greșită (termo nu stă pe talpă); nu cere mutarea casei
- înălțime liberă 220 = țintă pe soffit studiu; validare structurală planșeu/grinzi = DESCHISĂ
- util P/E 38.89875 m² (Δ 1.02 vs ref) — așteptat: living sub palier + închidere termică Y590
- PIP=false dist≈0 pe concrete_footing_NW, concrete_footing_NE, concrete_footing_SE — același artefact numeric ca SE anvelopă
- proiecție redusă față de ținta 5 cm (est/Dragalina tipic limitat de contur CF)
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
| palier_aliniat_scara | 0° | 80×90 @ (575,482.5) | — |
| intoarcere_15 | 15° | 98×105 @ (555,462.3) | zid_put_w_solid_n, zid_put_w_solid_s, toc_n, toc_s |
| intoarcere_30 | 30° | 111×114 @ (538,457.9) | zid_put_w_solid_n, zid_put_w_solid_s, toc_n, toc_s |
| intoarcere_45 | 45° | 116×116 @ (524.5,457) | zid_put_w_solid_n, zid_put_w_solid_s, toc_n, toc_s, foaie_deschisa_hol |
| intoarcere_60 | 60° | 114×111 @ (514.5,459.7) | zid_put_w_solid_n, zid_put_w_solid_s, toc_n, toc_s, foaie_deschisa_hol |
| intoarcere_75 | 75° | 105×98 @ (508.1,465.8) | toc_n, toc_s, foaie_deschisa_hol |
| intoarcere_90 | 90° | 90×80 @ (505,475) | — |
| in_gol_usa | 90° | 90×80 @ (505,475) | — |
| in_hol | 90° | 90×80 @ (440,475) | — |

## Structură perimetrală (variantă studiu — neconstruibilă)
- **Tronsoane/pile BA** în pereții exteriori; EB20 = umplutură între ele; **fără** grilă stâlpi / axă X320 / `pal_nw`/`pal_ne`
- Grosime structurală țintă **20 cm** = ipoteză; lungimi pile = ipoteză — **calcul structurist**
- Planșeu: geometrie amenajare separat de grosime structurală (15 cm neconfirmat) și buildup 12 cm
- Gol beci: **Y465–565** (înaintea grinzii Y575); palier Y455–600
- Living↔puț: închidere termică `living_put_thermal_y590` (inclusă în util)
- Rampe: plăci continue (reazeme = calcul)

## Perete exterior P/E (EB20 + ISOVER FASSADE)
- Alcătuire: **EB20 Akustik 200 mm + ISOVER FASSADE 80 mm** · nom. **299 mm** / max finit **300 mm**
- Status: **de confirmat** cu furnizorul sistemului ETICS și proiectantul — **nu** validat structural / termic / acustic
- Secțiune: `outputs/plans/35_v47_a1_exterior_wall_section.svg`
- CONFLICT faianță (baie): finisaj int. 19 mm vs vopsit 7 mm (Δ +12 mm) — **fără corectare automată plan**
- ETICS în afara cărămizii: 9.2 cm (înainte 10 cm)

## Puț / goluri / grosimi
- open_shaft Y590–860
- zid N @ Y442.5–455
- gol palier–hol: Y465–565 (gol 100 → clear 90)
- EST puț: 15 cm · VEST: 30 cm

## Fundație / parcelă
Model: **talpă pe beton**; **EB20 Akustik 200** umplutură; **ISOVER FASSADE 80** în ETICS (92 mm în afara cărămizii). Alcătuire **de confirmat** cu furnizor ETICS și proiectant — nu validată structural/termic/acustic.

- Inset față de finit: **4.199999999999999 cm**
- Clip: `{"N":13.95,"S":20,"W":20,"E":4.2,"inset_from_finished_cm":4.199999999999999,"thermosystem_outside_cm":9.2,"footing_beyond_structure_cm":5,"target_cm":5,"note":"talpă beton; ETICS 9.2 cm în afara fundației (EB20+ISOVER — de confirmat)"}`
- Talpă beton all_inside=true
- Legacy greșit (+15 pe finit) all_inside=false — **nu mutați casa din cauza lui**

| Punct (talpă beton) | inside | overflow_m |
|-------|:------:|-----------:|
| concrete_footing_NW | false | 0.006 |
| concrete_footing_NE | false | 0 |
| concrete_footing_SE | false | 0 |
| concrete_footing_SW | true | 0 |
| concrete_footing_N_mid | true | 0 |
| concrete_footing_E_mid | true | 0 |
| concrete_footing_S_mid | true | 0 |
| concrete_footing_W_mid | true | 0 |

## Arii P/E (recalculate după coordonare planșeu)
Metodă: shoelace(interior_polygon) − pereți int (−goluri) − închidere termică living↔puț

| | m² |
|--|---:|
| util geometric P/E (recalcul) | **38.89875** |
| util ref anterior | 37.87875 |
| Δ după coordonare planșeu | 1.02 |
| anvelopă shoelace | 40.285 |
| pereți int net | 1.38625 |
| subsol brut camere | 31.3175 |
| subsol util estimat | 29.5194 |
| POT anvelopă/147 | 39.78% (limită admisă = deschisă) |

Notă: coordonarea planșeului (gol doar Y590–860) nu modifică poligonul interior P/E; utilul e reafirmat prin recalcul independent, nu prin copiere.

## Rampă curte + podest_se (test +8 cm sud)
- Trepte: Y868–1036 (6×28, 0→−95)
- Palier −95: Y800–868 (L=68 cm, continuu)
- Alee/poartă: Y1036 (racord 0 cm)
- Min H sub podest_se (lățime utilă): **195.5 cm** (țintă ≥190; **nu** se declară 200)
- Intrados podest_se: +148 · muchie Y975

## Fișiere
- `data/building/v47_a1_study.json`
- `outputs/plans/31_v47_a1_subsol_plan.svg`
- `outputs/plans/32_v47_a1_access_section.svg`
- `outputs/plans/35_v47_a1_exterior_wall_section.svg`
- `outputs/plans/33_v47_a1_court_access_plan_after.svg`
- `outputs/plans/34_v47_a1_court_access_section_before_after.svg`
- `outputs/reports/v47_runda_a1.md`
- `viewer/data/volume_v47_a1.json` → `?v=v47_a1`

Runda B: **neîncepută**.
