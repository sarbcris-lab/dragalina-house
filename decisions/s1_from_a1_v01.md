# S1 — kickoff din A1 (amenajare + subsol plan)

**Status:** ACTIV · 2026-10-18  
**Intrare:** `ARH_FREEZE_AMENAJARE` + plan subsol A1.165–168  
**Nu redeschide:** compartimentare P/E, mobilier, handing uși (fără decizie explicită)

---

## Ce e înghețat ca input S1

| Strat | Sursă | Notă |
|-------|--------|------|
| Amenajare P/E | `a1_architecture.json` · planuri P/E | conflict → nu muta ARH |
| Cutie beci | `basement_cm.structure_box` | X30–534,3 × Y30–820 |
| Puț scară | `basement_cm.stair.pit` | N+E A11; V=ușă; S→curte |
| Stâlpi XY | `columns_cm` (PROVIZORIU) | continui; S1 confirmă secțiuni |
| Ghene | `mep_cm.shafts` REZERVĂ | drop baie vertical în CT |

**Envelope retenție (sursă de adevăr ARH):**  
`outputs/reports/s1_basement_envelope_from_a1_v01.md`

---

## Scope S1 (ordine)

1. ~~**Retenție / fundații**~~ — overlay + FG pe axe A1 (**A1.174**)  
2. ~~**Cadre geometric**~~ — `structure_a1_study_cm` + mesh 3D (**A1.174**)  
3. ~~**Pachet FE**~~ — `s1_a1_fe_input_pack_v01.md` + 2.1 ordin (**A1.175**)  
4. ~~**Fundații geo120 studiu**~~ — pad + talpă perimetru + elevație (**A1.185**)  
5. **FE numeric** — când există proiectant; până atunci deepen ordin în repo  
6. **Scară beci** — riser 17,22 ACCEPTAT; clear@pier avertisment  
7. Util autorizare — **după** adoptare secțiuni (nu acum)

Lock-uri: **clear ≥255 HARD** (A1.180 — D1b/241 revocat) · D2=(a) pilastrii · D3=acoperiș **30° PV** · `structure_finalize_100_v01.md`.

---

## Registru deschis (la start)

| ID | Tip | Notă |
|----|-----|------|
| `reten_mesh_vs_a1` | ~~rezolvat_geometric~~ A1.174 | cutie+puț+FG pe envelope A1 |
| `cadre_a1_mesh` | ~~rezolvat_geometric~~ A1.174 | `structure_a1_study_cm` în viewer |
| `fe_pack_a1` | ~~livrat~~ A1.175 | `s1_a1_fe_input_pack_v01.md` |
| `riser_beci_17_22` | ~~ACCEPTAT~~ A1.179 | brief 16 = P/E; beci OK @17,22 |
| `pier_clear_95_7` | avertisment | țintă 100 — confort scară, nu „structura pică” |
| `C_E_LAMELE` | ~~nu necesar~~ A1.179 | lipsește din cadru; opțional = grosime zid ARH |
| `geo_131` | calcul_lipsă | Rc oficial; **lock studiu 221 kPa din 120** A1.185 |
| `fundatii_perim_elevatie` | ~~mesh_studiu~~ A1.185 | talpă 80 + retenție pe talpă |
| `stâlpi_PROVIZORIU` | calcul_lipsă | **FE numeric pe pachet** |
| `C_E_LAMELE_P100` | ~~rezolvat~~ A1.177 | **nu e necesar** — calc SE trece fără el |
| `calc_100_a1` | ~~livrat~~ A1.177 | `s1_a1_calc_100_v01.md` — porți ordin OK |
| `grindă_întoarsă_puț` | ~~ipoteză geometrică~~ A1.175 | pier+întoarsă în mesh; FE local |

---

## Primul livrabil

~~Geometrie + pachet FE~~ → **DONE**. Următor: **FE numeric** (proiectant) + rezolvare `C_E_LAMELE` / riser / geo_131.
