# V47 audit subsol (rev 27)

**PASS** — pass 36 · warn 0 · fail 0

## Intenție
- Acces: curte engleză −48 → 3 trepte → palier −95 → scară → −250
- Sub rampă 2: fără depozit/placă P — puț deschis
- Clear: 208 cm · status: ipoteza_studiu

## Camere
- **camera_tehnica** 505×400 = 20.2 m² — cameră tehnică — FV 17kW / Deye 15kW / baterii / wallbox / degivrare
- **depozit_subsol** 320×200 = 6.4 m² — depozitare separată de service
- **hol_subsol** 185×182 = 3.37 m² — hol: se atinge de palier jos / ușă X535

## Checks
| ID | Rezultat | Detaliu |
|----|----------|---------|
| basement_block | pass | keys=17 |
| status_ipoteza | pass | status=ipoteza_studiu |
| clear_208 | pass | clear=208 |
| clear_formula | pass | soffit(-42) - FF(-250) =? 208 |
| levels_chain | pass | court -48 / access -95 / FF -250 |
| court_steps_count | pass | count=3 |
| court_delta | pass | from -48 → -95 delta=47 |
| court_in_east_limit | pass | x1=670 ew=680 |
| english_court_clamped | pass | x1=670 lim=670 |
| stair_along_ramp2 | pass | align=along_ramp2 inside=true |
| stair_in_band_x | pass | stair X577.5–667.5 vs ramp2 X565–680 |
| stair_z_95_to_250 | pass | from -95 to -250 |
| stair_risers_delta | pass | 9×17.22222222222222=155 vs delta 155 |
| no_storage_under_ramp2 | pass | under_ramp2=false |
| open_shaft_flag | pass | open_shaft=true |
| rooms_present | pass | n=3 ids=camera_tehnica,depozit_subsol,hol_subsol |
| rooms_have_size | pass | all dx,dy > 0 |
| areas_match | pass | declared 29.97 vs sum 29.97 |
| rooms_in_envelope | pass | rooms within 680×860 |
| subsol_meshes | pass | n=37 |
| mesh_curte_engleza | pass | pit/steps meshes |
| mesh_stair_beci | pass | basement stair treads |
| mesh_palier_acces | pass | landing −95 |
| mesh_palier_jos | pass | landing −250 |
| mesh_put_open | pass | open shaft marker under r2 |
| no_depozit_sub_r2_fill | pass | no P-level storage fill under ramp2 |
| stair_treads_descending | pass | treads=8 z1=[-1.12,-1.29,-1.47,-1.64,-1.81,-1.98,-2.16,-2.33] |
| racord_3_steps | pass | n=3 |
| racord_descending | pass | z1=-0.64→-0.79→-0.95 |
| viewer_subsol_btn | pass | Doar subsol button |
| viewer_curte_btn | pass | Curte view (english court) |
| plan_subsol_exists | pass | 27_v47_subsol_plan.svg |
| sect_subsol_exists | pass | 28_v47_subsol_section.svg |
| entry_door_ext | pass | usa_acces_subsol_ext sill -95 |
| door_to_rooms | pass | usa_subsol_camere |
| mesh_usa_ext | pass | ext door mesh |
