# S1 A1 — Pachet FE de predat (v03)

**Pentru:** structurist / model FEM  
**Proiect:** Dragalina 131 · Turda · amenajare A1 înghețată  
**Status:** input + ordine de mărime din repo · **NU** proiect semnat · 2026-10-19  
**Față de v02:** lock geo120 q=**221**, hint armare, sensibilitate 180/221/250, nod C_E_PAL, BOM șarpantă

---

## 0. Lock-uri

| ID | Lock |
|----|------|
| **A1.180** | Clear **≥255** · FF→FF **307** |
| **D3 / PV** | 2 ape · 30° · PV ambele ape · D3a |
| **NO_LAMELE** | Fără C_E_LAMELE în cadru |
| **A1.185** | Fundații q_allow **221** kPa (Pconv 120 / 1,4) · talpă perimetru **115** cm |
| **P100** | Stâlp ≥ 30 cm |
| **ARH** | Compartimentare înghețată |

**NU folosi** `v47_a1_frame_study` (STALE).

---

## 1. Fișiere

| Rol | Cale |
|-----|------|
| Schemă | `data/building/a1_architecture.json` → `structure_a1_study_cm` |
| Alias | `data/building/a1_structure_study.json` |
| Amenajare / acoperiș | `data/building/v47_a1_study.json` |
| Volum 3D | `viewer/data/volume_a1.json` |
| Calc 100 / wind / max | `s1_a1_calc_100_v01` · `wind_buckling` · `max_inrepo` |
| Fundații geo120 | `s1_a1_foundations_geo120_v01` |
| Sensibilitate | `s1_a1_foundations_sens_v01` |
| Hint armare | `s1_a1_rebar_hint_v01` |
| Nod C_E_PAL | `s1_a1_node_ce_pal_v01` |
| BOM șarpantă | `s1_a1_roof_bom_v01` |
| Uplift streșină | `s1_a1_eaves_uplift_v01` |
| Retenție+apă+seism | `s1_a1_retaining_seis_v01` |
| CR0 bare | `s1_a1_cr0_members_v01` |
| Talpă stabilitate | `s1_a1_footing_stability_v01` |
| Confinare P100 | `s1_a1_p100_confinement_v01` |
| Due-diligence cumpărare | `s1_a1_due_diligence_buy_v01` |
| **INDEX predare** | `s1_a1_fe_INDEX.md` |
| **Acest brief** | `s1_a1_fe_handoff_v03.md` |

---

## 2. Încărcări blocate

### Planșeu
q_Ed locuință **11.78** · palier **11.93** kN/m²

### Acoperiș D3a + PV
Gk **0.9** · sk **1.5** · q_Ed **3.36** · we streșină **-1.629** · 30°

### Seism (înlocuiește)
ag/S/q = 0.1g / 1.2 / 3 · Vb **75.9** kN

### Fundații (lock studiu)
| | |
|--|--:|
| Ipoteză | similar_Dragalina_120 |
| Pconv 120 | 310 kPa |
| **q_allow** | **221** kPa |
| Talpă perimetru | 115 cm |
| Notă | LOCK studiu A1.185 — NU Rc din geo_131 |

Materiale: **C25/30** · **B500B**

### Sensibilitate q (nu schimbă adoptul)

| Scenariu | q | Pad max | Σ m² | Talpă 80 | Talpă nec. |
|----------|--:|--------:|-----:|:--------:|-----------:|
| q180 | 180 | 205 | 19.85 | **true** | 60 |
| q221 | 221 | 185 | 16.4 | **true** | 60 |
| q250 | 250 | 175 | 14.68 | **true** | 60 |

---

## 3. Cote (cm)

| Cotă | Valoare |
|------|--------:|
| FF parter / etaj | 48 / 355 |
| FF→FF | 307 |
| Clear sub grindă / placă | 255 / 280 |
| Placă / grindă h | 15 / 40 |
| Beci FF / soffit | -250 / -30 |

Cutie X 30–534.3 × Y 30–820 · Puț 564.3–668.8 × 490.7–858.7

---

## 4. Stâlpi

| ID | x | y | dx×dy | Levels | Pad cm | Rol |
|----|--:|--:|-------|--------|-------:|-----|
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

## 5. Grinzi

| ID | b×h | Levels | Supports | Notă |
|----|-----|--------|----------|------|
| B_N | 30×40 | S+P+E | C_NW, C_N_MID | centură N pe cutie (C_NW–C_N_MID) |
| B_N_TO_NE | 30×40 | P+E | C_N_MID, C_NE | centură N est → C_NE (banda scară / fațadă E) |
| B_W | 30×40 | S+P+E | C_NW, C_W_MID, C_W_DORM | centură V pe cutie |
| B_X_MID | 40×40 | S+P+E | C_N_MID, C_S_DORM_E, C_S_INTRARE_W | axă mid N–S (C_N_MID–C_S_DORM_E–C_S_INTRARE_W) |
| B_CASA_SCARA | 30×40 | S+P+E | C_CASA_SCARA, C_S_INTRARE_E | separator est cutie (= A6) C_CASA_SCARA→intrare E |
| B_Y645 | 30×40 | S+P+E | C_W_DORM, C_S_DORM_E | sud dorm pe cutie |
| B_Y820 | 30×40 | S+P+E | C_S_INTRARE_W, C_S_INTRARE_E | sud intrare pe cutie (Y≈820) |
| B_Y410 | 40×40 | P+E | C_W_MID, C_E_PAL | legătură mid W→E_PAL (peste cutie + scară) |
| B_E | 30×40 | P+E | C_NE, C_E_PAL | centură E fațadă (C_NE–C_E_PAL) |
| B_E_S | 30×40 | P+E | C_E_PAL, C_S_INTRARE_E | centură E sud scară — reazeme C_E_PAL + nod SE cu  |
| B_S_SE | 30×40 | P+E | C_S_INTRARE_E, C_E_PAL | închidere SE pe C_S_INTRARE_E↔C_E_PAL — C_E_LAMELE |
| B_Y_EDGE_INVERTED | 25×40 | S_inverted | C_CASA_SCARA, C_SHAFT_E_PIER | Grindă întoarsă pe puț (ușă→pier E); formă studiu  |

---

## 6. Nod C_E_PAL + întoarsă (rezumat)

| | |
|--|--:|
| Stâlp | 30×40 · N=741.6 · util=0.671 |
| Torsiune | 6.5 kNm |
| lb φ16 / φ14 | 780 / 680 mm |
| Întoarsă | 25×25 · PASS=true |
| Detaliu | `s1_a1_node_ce_pal_v01.md` |

---

## 7. Hint armare + BOM + uplift + retenție + CR0

- Armare: `s1_a1_rebar_hint_v01.md` (**nu** plan dt)
- Șarpantă BOM: `s1_a1_roof_bom_v01.md` · vol~**3.45** m³ · pas **111.8** cm
- Uplift solbanc: F=**14.69** kN · M12 @ **80** cm · PASS=true
- Retenție: M=**20.9** kNm/m (hw10) · φ12 @ 15 cm vertical interior + φ10 @ 20 oriz.
- CR0: gov **B_X_MID** @ STR_W · beams PASS=true · cols PASS=true
- Talpă: B80 **FAIL** → adopt **115** cm (FS_s=1.4, FS_o=1.72)
- Confinare P100: φ8 @ **12** cm zonă critică (hint)

**Start predare:** `s1_a1_fe_INDEX.md` · due-diligence: `s1_a1_due_diligence_buy_v01.md`

---

## 8. PASS ledger

| ID | Status | Detaliu |
|----|--------|---------|
| `clear_255` | **PASS_LOCK** | clear sub grindă 255 · FF→FF 307 |
| `NO_LAMELE` | **PASS_ORDIN** | B_E_S / B_S_SE fără C_E_LAMELE |
| `slab_15_with_BX_MID` | **PASS_ORDIN** | placă 15 cm doar cu B_X_MID |
| `beams_h40` | **PASS_ORDIN** | h adopt 40 pe grinzi critice |
| `columns_P100_geom` | **PASS_ORDIN** | ≥30 + util N+M ordin |
| `buckling_EC2_ordin` | **PASS_ORDIN** | λ/φ pe P/E — s1_a1_wind_buckling_ec5_v01 |
| `roof_snow_pv_wind_ordin` | **PASS_ORDIN** | q_Ed=3.36 · we=-1.629 |
| `rafter_EC5_SLS` | **PASS_ORDIN** | 12×25 pas egal · EC5 |
| `roof_bom_studiu` | **PASS_GEO** | vol~3.45 m³ · 7×2 căpriori |
| `seismic_columns_share` | **PASS_ORDIN** | Vb=75.9 kN |
| `punching_ordin` | **PASS_ORDIN** | vEd ≤ vRdc ordin |
| `ring_E_closed` | **PASS_GEO** | B_E_S + B_S_SE închis |
| `foundations_geo120_q221` | **PASS_ORDIN_IPOTEZA** | q_allow=221 kPa · talpă perimetru 115 cm |
| `foundations_sens_180_221_250` | **PASS_ORDIN** | pad max 180/221/250 = 205/185/175 |
| `rebar_hint` | **PASS_HINT** | s1_a1_rebar_hint_v01 — nu DT |
| `node_C_E_PAL_ordin` | **PASS_ORDIN** | T=6.5 kNm · lbφ16=780 mm |
| `eaves_uplift_anchors` | **PASS_ORDIN** | F=14.69 kN · M12 @ 80 cm |
| `retaining_hydro_seis` | **PASS_ORDIN** | M=20.9 kNm/m · φ12 @ 15 cm vertical interior + φ10 @ 20 oriz. |
| `CR0_critical_members` | **PASS_ORDIN** | gov B_X_MID@STR_W |
| `footing_stability` | **PASS_ORDIN** | B80 FAIL → adopt 115 cm · FS_s=1.4 · FS_o=1.72 |
| `p100_confinement_hint` | **PASS_HINT** | s_crit=12 cm · φ8 zonă |

---

## 9. Checklist FE

| Pri | Sarcină | În repo? |
|----:|---------|----------|
| 1 | Confirmă ag, TC, S pe 131 (P100) — înlocuiește ipoteza ag=0,10g | **NU** |
| 1 | Confirmă sk și vb,0 pe hărți CR1-1-3 / CR1-1-4 NA | **NU** |
| 1 | Model 3D cadre pe structure_a1_study_cm (NU frame V47) | **NU** |
| 1 | Combinații CR0 complete pe bare | **NU** |
| 1 | Geo 131 Rc — înlocuiește lock q_allow=221 (sens 180/250 deja în repo) | sens_tabel |
| 2 | Stâlpi: N+M+V + flambaj + P100 confinare | parcial_ordin |
| 2 | Nod C_E_PAL + consolă + torsiune (vezi s1_a1_node_ce_pal_v01) | parcial_ordin |
| 2 | Placă 15 + B_X_MID FE | parcial_ordin |
| 2 | B_E_S / B_S_SE NO_LAMELE continuu | parcial_ordin |
| 2 | Întoarsă + pier (As/ancorare în node pack) | parcial_ordin |
| 2 | Retenție + apă + seism pe zid | parcial_ordin |
| 2 | Fundații pe Rc geo_131 (pad-uri + talpă 80 pe q221) | ipoteza_120 |
| 3 | Șarpantă + ancorare we (BOM studiu în repo) | parcial_ordin |
| 3 | Diafragmă placă | **NU** |
| 3 | Planșe armare DT (hint rebar ≠ DT) | hint_only |

---

## 10. Regenerare

```
npm run calc:a1
npm run fe:handoff
```
