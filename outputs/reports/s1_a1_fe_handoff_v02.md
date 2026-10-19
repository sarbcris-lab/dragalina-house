# S1 A1 — Pachet FE de predat (v02)

**Pentru:** structurist / model FEM  
**Proiect:** Dragalina 131 · Turda · amenajare A1 înghețată  
**Status:** input + ordine de mărime din repo · **NU** proiect semnat · 2026-10-19  
**Medie note in-repo:** ~4.8/10 · plafon fără FE/geo ~6,5

---

## 0. Citește întâi (lock-uri)

| ID | Lock | Nu schimba fără beneficiar |
|----|------|----------------------------|
| **A1.180** | Clear **≥255 pretutindeni** (inclusiv sub grindă) | Fostul 241 e **revocat** |
| **A1.180** | FF→FF = **307** = 255 + drop + placă + buildup | |
| **D3 / PV** | Acoperiș **2 ape · 30° · PV pe ambele ape** · D3a lemn întâi | D3b BA = sensibilitate |
| **NO_LAMELE** | Fără `C_E_LAMELE` în cadru (doar ARH) | B_E_S + B_S_SE |
| **P100** | Stâlp ≥ **30 cm** | |
| **ARH** | Compartimentare P/E înghețată | |

**NU folosi** ca geometrie de calcul: `v47_a1_frame_study` (STALE).

---

## 1. Fișiere de importat

| Rol | Cale |
|-----|------|
| Schemă structurală | `data/building/a1_architecture.json` → `structure_a1_study_cm` |
| Alias curat | `data/building/a1_structure_study.json` |
| Amenajare / cotă acoperiș | `data/building/v47_a1_study.json` (`roof_cm`, `heights_cm`) |
| Volum 3D | `viewer/data/volume_a1.json` · view **1 · Structură** |
| Calc grinzi/placă/SE | `outputs/reports/s1_a1_calc_100_v01.md` |
| Vânt/flambaj/EC5 | `outputs/reports/s1_a1_wind_buckling_ec5_v01.md` |
| Max in-repo | `outputs/reports/s1_a1_max_inrepo_v01.md` |
| **Acest brief** | `outputs/reports/s1_a1_fe_handoff_v02.md` |
| JSON mașină | `outputs/reports/s1_a1_fe_handoff_v02.json` |

---

## 2. Încărcări blocate (ipoteze studiu — confirmă pe hărți)

### Planșeu
| | kN/m² |
|--|------:|
| q_Ed locuință (agregat studiu) | **11.78** |
| q_Ed palier/scară | **11.93** |

### Acoperiș D3a + PV · 30°
| | |
|--|--:|
| Gk | **0.9** kN/m² |
| sk (ipoteză) | **1.5** kN/m² |
| Qk zăpadă μ=0,8 | **1.2** |
| q_Ed design (CR0 snow/wind) | **3.36** |
| vb,0 (ipoteză) | **27** m/s |
| qp | **0.958** |
| we streșină (cpe F) | **-1.629** kN/m² |
| Rise / pitch | 248.6 cm / 30° |

### Seism (înlocuiește la FE)
| | |
|--|--:|
| ag / S / q | 0.1g / 1.2 / 3 |
| Vb ordin | **75.9** kN |
| Notă | IPOTEZĂ — nu zonare oficială pe 131; FE trebuie pe ag/S din P100 pe amplasament |

### Fundații
σ studiu **200 kPa** — studiu — NU Rc din geo_131

Materiale: **C25/30** · **B500B**

---

## 3. Cote (cm) — A1.180

| Cotă | Valoare |
|------|--------:|
| FF parter | 48 |
| FF etaj | 355 |
| FF→FF | 307 |
| Clear sub grindă | 255 |
| Clear sub placă | 280 |
| Placă th | 15 |
| Grindă h crit. | 40 |
| Drop sub soffit | 25 |
| Intrados grindă | 303 |
| Soffit / top placă E | 328 / 343 |
| FF beci / soffit L-1 | -250 / -30 |

Cutie: X 30–534.3 × Y 30–820  
Puț: X 564.3–668.8 × Y 490.7–858.7

---

## 4. Stâlpi (input model)

| ID | x | y | dx×dy | Levels | Pad adopt cm | Rol |
|----|--:|--:|-------|--------|-------------:|-----|
| C_NW | 10 | 10 | 30×30 | S+P+E | 130 |  |
| C_N_MID | 312.4 | 10 | 40×30 | S+P+E | 165 |  |
| C_NE | 638.8 | 10 | 30×30 | S+P+E | 135 |  |
| C_W_MID | 10 | 410 | 30×40 | S+P+E | 145 |  |
| C_W_DORM | 10 | 645.2 | 30×30 | S+P+E | 105 |  |
| C_S_DORM_E | 322.4 | 645.2 | 30×30 | S+P+E | 80 |  |
| C_E_PAL | 638.8 | 410 | 30×40 | S+P+E | 185 |  |
| C_CASA_SCARA | 524.3 | 550 | 30×40 | S+P+E | 90 |  |
| C_S_INTRARE_W | 312.5 | 818.8 | 40×30 | S+P+E | 80 |  |
| C_S_INTRARE_E | 524.3 | 818.8 | 30×30 | S+P+E | 90 |  |
| C_SHAFT_E_PIER | 638.8 | 580.7 | 30×30 | S | 80 | pier_inverted_beam |

## 5. Grinzi (input model)

| ID | b×h adopt | Levels | Supports | Notă |
|----|-----------|--------|----------|------|
| B_N | 30×40 | S+P+E | C_NW, C_N_MID | centură N pe cutie (C_NW–C_N_MID) |
| B_N_TO_NE | 30×40 | P+E | C_N_MID, C_NE | centură N est → C_NE (banda scară / fațadă E) |
| B_W | 30×40 | S+P+E | C_NW, C_W_MID, C_W_DORM | centură V pe cutie |
| B_X_MID | 40×40 | S+P+E | C_N_MID, C_S_DORM_E, C_S_INTRARE_W | axă mid N–S (C_N_MID–C_S_DORM_E–C_S_INTRARE_W) |
| B_CASA_SCARA | 30×40 | S+P+E | C_CASA_SCARA, C_S_INTRARE_E | separator est cutie (= A6) C_CASA_SCARA→intrare E |
| B_Y645 | 30×40 | S+P+E | C_W_DORM, C_S_DORM_E | sud dorm pe cutie |
| B_Y820 | 30×40 | S+P+E | C_S_INTRARE_W, C_S_INTRARE_E | sud intrare pe cutie (Y≈820) |
| B_Y410 | 40×40 | P+E | C_W_MID, C_E_PAL | legătură mid W→E_PAL (peste cutie + scară) |
| B_E | 30×40 | P+E | C_NE, C_E_PAL | centură E fațadă (C_NE–C_E_PAL) |
| B_E_S | 30×40 | P+E | C_E_PAL, C_S_INTRARE_E | centură E sud scară — reazeme C_E_PAL + nod SE cu B_S_SE (fă |
| B_S_SE | 30×40 | P+E | C_S_INTRARE_E, C_E_PAL | închidere SE pe C_S_INTRARE_E↔C_E_PAL — C_E_LAMELE = doar AR |
| B_Y_EDGE_INVERTED | 25×40 | S_inverted | C_CASA_SCARA, C_SHAFT_E_PIER | Grindă întoarsă pe puț (ușă→pier E); formă studiu — FE local |

---

## 6. Ce e deja PASS pe ordin (nu sări peste FE)

| ID | Status | Detaliu |
|----|--------|---------|
| `clear_255` | **PASS_LOCK** | clear sub grindă 255 · FF→FF 307 |
| `NO_LAMELE` | **CHECK** | B_E_S / B_S_SE fără C_E_LAMELE |
| `slab_15_with_BX_MID` | **FAIL** | placă 15 cm doar cu B_X_MID |
| `beams_h40` | **CHECK** | {"B_N":40,"B_N_TO_NE":40,"B_W":40,"B_X_MID":40,"B_CASA_SCARA":40,"B_Y645":40,"B_Y820":40,"B_Y410":40,"B_E":40,"B_E_S":40,"B_S_SE":40} |
| `columns_P100_geom` | **CHECK** | ≥30 + util N+M ordin |
| `buckling_EC2_ordin` | **PASS_ORDIN** | λ/φ pe P/E — vezi s1_a1_wind_buckling_ec5_v01 |
| `roof_snow_pv_wind_ordin` | **PASS_ORDIN** | q_Ed=3.36 · we streșină=-1.629 |
| `rafter_EC5_SLS` | **PASS_ORDIN** | 12×25 @1,2 m + δ L/300 |
| `seismic_columns_share` | **PASS_ORDIN** | Vb=75.9 kN repartizat ∝ I |
| `punching_ordin` | **PASS_ORDIN** | vEd ≤ vRdc ordin pe stâlpi P/E |
| `ring_E_closed` | **PASS_GEO** | B_E_S + B_S_SE — fără gap SE (spre deosebire de FRAME vechi) |
| `gable_posts_on_beams` | **PASS_GEO** | stâlpișori W/E pe B_W / B_E |
| `foundations_pads_vs_200` | **CHECK** | pads adoptate vs 200 kPa — înlocuiește cu Rc geo |

> **PASS_ORDIN** = trece pe scheme simple din repo. FE poate confirma sau respinge — nu e semnătură.

---

## 7. Checklist FE (prioritate)

| Pri | Sarcină | În repo? |
|----:|---------|----------|
| 1 | Confirmă ag, TC, S pe 131 (P100) — înlocuiește ipoteza ag=0,10g | **NU** |
| 1 | Confirmă sk și vb,0 pe hărți CR1-1-3 / CR1-1-4 NA | **NU** |
| 1 | Model 3D cadre pe structure_a1_study_cm (NU frame V47) | **NU** |
| 1 | Combinații CR0 complete (G, Q snow, Q wind, E seism) pe bare | **NU** |
| 2 | Stâlpi: N+M+V + flambaj + P100 confinare zone critice | parcial_ordin |
| 2 | Nod C_E_PAL / consolă B_E + B_Y410 (torsiune, ancorare) | parcial_ordin |
| 2 | Placă 15 + B_X_MID: FE 2D/3D L/d, fisurare, armare | parcial_ordin |
| 2 | Grinzi perimetrale + B_E_S / B_S_SE (NO_LAMELE) — continuu | parcial_ordin |
| 2 | Grindă întoarsă + pier C_SHAFT_E_PIER | parcial_ordin |
| 2 | Retenție BA: împingere + apă + seism pe zid; armare | parcial_ordin |
| 2 | Fundații pe Rc din geo_131 (înlocuiește 200 kPa) | **NU** |
| 3 | Șarpantă D3a 30°+PV: căpriori, coamă, solbanc, ancorare we streșină | parcial_ordin |
| 3 | Diafragmă placă / transmitere forțe orizontale la centuri | **NU** |
| 3 | Planșe armare + detalii noduri + confinare — DT | **NU** |

---

## 8. Ordine de lucru recomandată

1. Geo **Rc pe 131** (blochează fundații)  
2. ag/sk/vb oficial pe hărți  
3. Model 3D A1 + combinații CR0  
4. Placă + B_X_MID + nod C_E_PAL  
5. Stâlpi P100 confinare  
6. Retenție + fundații pe Rc  
7. Șarpantă + ancorare PV (we streșină)  
8. DT armare  

---

## 9. Contact / regenerare

```
npm run fe:a1
```

Regenerează calc + acest brief. Viewer: Structură pe `volume_a1.json`.
