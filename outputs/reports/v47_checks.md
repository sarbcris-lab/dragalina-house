# V47 — verificări geometrice

| ID | Rezultat | Metodă | Notă |
|----|----------|--------|------|
| stair_z_links_95_to_250 | **pass** | z1 trepte = from−(i+1)×riser; z0 final = to_z; sumă = |from−to| | călcări z1=[-1.122…-2.328] → bot -2.500; 9×17.22222222222222=155 |
| stair_in_ramp2_band | **pass** | AABB scară ⊆ ramp2±tol (nu doar align string) | scară X577.5 Y595 ⊆ ramp2 |
| stair_landing_door_rooms | **pass** | AABB adjacency (P10) | palier−250 ↔ ușă; scară pe bandă rampă2 |
| clear_height_matches | **pass** | soffit − FF_subsol | -42−(-250)=208 = 208 |
| room_mesh_clear_height | **pass** | z1−z0 mesh cameră | vol h=2.080 m |
| equipment_no_overlap | **pass** | AABB pair | 9 echipamente fără overlap gabarit |
| equipment_service_clearance | **pass** | AABB service_front vs body | fronturi service fără overlap pe alte gabarite |
| gate_width_consistent | **pass** | egalitate numerică JSON/meta/SVG | JSON=7.1 · volume.meta=7.1 · plan26=7.1 (≈front Cloșca) |
| entry_description_consistent | **pass** | cross-check openings/scheme/path/SVG | lands_in+scheme+path+plan21 = HOL/PRIMIRE |
| surfaces_per_level_data | **pass** | basement.areas pe camere + areas_cm util/nivel | subsol 29.97 · P/E util 37.87875 (pe nivel) |
| envelope_680x860 | **pass** | egalitate | 680×860 |
| terrace_L1_frozen | **pass** | egalitate | 330×185 |
| court_to_access_link | **pass** | delta = from−to | −48→−95 via 3 trepte |
| structural_basement | **unknown** | în afara modelului | fundații/subzidiri — structurist |
| pot_cut_authorization | **unknown** | cadastru deschis | POT/CUT neconfirmate |

**Rezumat:** 13 pass · 0 fail · 2 unknown
