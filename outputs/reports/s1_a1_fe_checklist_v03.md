# Checklist FE — Dragalina 131 A1 (v03)

- [ ] **P1** Confirmă ag, TC, S pe 131 (P100) — înlocuiește ipoteza ag=0,10g
- [ ] **P1** Confirmă sk și vb,0 pe hărți CR1-1-3 / CR1-1-4 NA
- [ ] **P1** Model 3D cadre pe structure_a1_study_cm (NU frame V47)
- [ ] **P1** Combinații CR0 complete pe bare
- [ ] **P1** Geo 131 Rc — înlocuiește lock q_allow=221 (sens 180/250 deja în repo)
- [ ] **P2** Stâlpi: N+M+V + flambaj + P100 confinare
- [ ] **P2** Nod C_E_PAL + consolă + torsiune (vezi s1_a1_node_ce_pal_v01)
- [ ] **P2** Placă 15 + B_X_MID FE
- [ ] **P2** B_E_S / B_S_SE NO_LAMELE continuu
- [ ] **P2** Întoarsă + pier (As/ancorare în node pack)
- [ ] **P2** Retenție + apă + seism pe zid
- [ ] **P2** Fundații pe Rc geo_131 (pad-uri + talpă 80 pe q221)
- [ ] **P3** Șarpantă + ancorare we (BOM studiu în repo)
- [ ] **P3** Diafragmă placă
- [ ] **P3** Planșe armare DT (hint rebar ≠ DT)

## Lock-uri
- [ ] Clear ≥255
- [ ] 30° + PV ambele ape
- [ ] Fără C_E_LAMELE în cadru
- [ ] q_allow studiu 221 până la geo 131
- [ ] Geometrie structure_a1_study_cm

## Livrabile structurist
- [ ] Notă semnată
- [ ] Model FE
- [ ] Planuri armare
- [ ] Detalii nod C_E_PAL / întoarsă / șarpantă
