# V47 A1 FRAME — pachet input FE (Varianta A)

**Status:** Faza 0 · 2026-10-16  
**Sistem:** cadre BA — **nu** Varianta B (diafragme) în acest pachet  
**Țintă:** stâlpi + grinzi la **minim necesar** care trece ULS/SLS/P100 pe schema reală  
**Amenajare A1:** neatinsă · `declared_buildable = false`

## 0. Decizii înghețate (beneficiar)

| ID | Lock |
|----|------|
| D1 | Clear **255 sub placă**; **241 OK sub grindă** h35 |
| D2 | Pilastri ETICS pe stâlpi (A1 9,2 / A2 10,5) |
| D3 | Acoperiș: **compară** șarpantă ușoară vs BA la FE |
| Util E | **37,469 m²** (suma etichetelor libere) — nu redesign amenajare pentru calc |
| Protr interior | **0** — beton înlocuiește local EB20; ETICS afară |
| Thru stâlp | **≥ 30 cm** (P100) — **nu** sub 30 |

## 1. Fișiere de lucru

| Rol | Cale |
|-----|------|
| Schema | `data/building/v47_a1_frame_study.json` → `structure_frame_study_cm` |
| Generator | `src/study_v47_frame_schema.mjs` |
| Planuri | `outputs/plans/38_*.svg`, `39_*.svg`, `40_*stair*.svg` |
| Raport geometric | `outputs/reports/v47_a1_frame_structure.md` |
| Proces calc | `decisions/frame_calc_package_v01.md` |
| Plan 100% | `decisions/structure_finalize_100_v01.md` |

Regen: `npm run study:frame` · `npm run plans:frame`

## 2. Levels (cm) — cotă Z

| Cotă | Valoare |
|------|--------:|
| FF parter | +48 |
| FF etaj | +336 (= FF_P + 288) |
| Placă th (țintă) | **15** |
| Soffit placă E | +309 |
| Top placă E | +324 |
| Grindă h total (inclusiv zona plăcii) | **35** |
| Intrados grindă peste P | +289 |
| Clear P sub placă | **255** |
| Clear P sub grindă | **241** (acceptat D1) |
| Buildup sub FF | 12 |

## 3. Minime normative (start FE, nu „obișnuință”)

| Element | Minim normă | Start model actual | Optim FE |
|---------|-------------|--------------------|----------|
| Stâlp — latură mică | **≥ 30** | 30 (toți thru) | păstrează ≥30 |
| Stâlp — along | din calcul | tip **40**; deja **30×30** pe C_S_DORM_E, C_S_INTRARE_E | încearcă **30×30** unde trece; mărește along doar dacă fail |
| Grindă — lățime b | **≥ 20** | tip **30** (= thru stâlp la nod) | b≥20; preferă b = thru nod |
| Grindă — h | vs clear D1 | **35** total | coboară h doar dacă clear/D1 + ULS permit |
| Placă | — | **15** țintă | 15 întâi; tradeoff doar dacă SLS fail demonstrat |

**Regulă adoptare:** nu mări secțiuni „preventiv”; nu micșora sub P100; fără protr în cameră.

## 4. Stâlpi — geometrie de input

Coordonate = colț SW al betonului (cm). Secțiune = dx × dy.

| ID | x | y | dx×dy | Levels | Reazeme / notă FE |
|----|--:|--:|-------|--------|-------------------|
| C_NW | 1,2 | −0,1 | 40×30 | S–P–E | colț N/W; duș — nu micșora sub amenajare frame |
| C_N_MID | 321,3 | −0,1 | 40×30 | S–P–E | opțional vs doar NW+NE — comparație după 2.1 |
| C_NE | 651,3 | −0,1 | 30×40 | S–P–E | colț N/E |
| C_W_MID | 1,2 | 400 | 30×40 | S–P–E | pat x≥45 frame |
| C_W_DORM | 1,2 | 645 | 40×30 | S–P–E | colț S/W dorm |
| C_S_DORM_E | 331,3 | 645 | **30×30** | S–P–E | deja minim P100 pe ambele |
| C_E_GEAM_S | 651,3 | 310 | 30×40 | S–P–E | est |
| C_E_PAL | 651,3 | 449 | 30×40 | S–P–E | **critic** — nod consolă B_E |
| C_CASA_SCARA | 536,3 | 610 | 30×40 | S–P–E | separator; fără protr vest |
| C_S_INTRARE_W | 361,3 | 830 | 40×30 | S–P–E | sud intrare |
| C_S_INTRARE_E | 536,3 | 830 | **30×30** | S–P–E | deja minim P100 |
| C_SHAFT_E_PIER | 666,3 | 575 | 15×15 | **S** | pier grindă întoarsă — **nu** stâlp cadru P100 |

**Candidați reducere along 40→30 (dacă 2.1 trece):** C_NW, C_N_MID, C_NE, C_W_MID, C_W_DORM, C_E_GEAM_S, C_E_PAL, C_CASA_SCARA, C_S_INTRARE_W.

## 5. Grinzi — geometrie de input

| ID | x | y | dx×dy | Levels | Reazeme | Prioritate FE |
|----|--:|--:|-------|--------|---------|---------------|
| B_N | 1,2 | −0,1 | 680×30 | P,E | NW, N_MID, NE | 2.4 — deschideri |
| B_W | 1,2 | −0,1 | 30×675 | P,E | NW, W_MID, W_DORM | 2.4 |
| B_E | 651,3 | −0,1 | 30×590 | P,E | NE, E_GEAM_S, E_PAL | **2.2** consolă + torsiune |
| B_Y470_PALIER_EDGE | 565 | 470 | 105×30 | P,E | B_E, C_E_PAL | **2.2** bordură consolă |
| B_Y645 | 1,2 | 645 | 360×30 | P,E | W_DORM, S_DORM_E | 2.4 |
| B_X360_DORM_INTRARE | 331,3 | 645 | **70**×215 | P,E | S_DORM_E, S_INTRARE_W | pad geometric — **sau** accept pad, **sau** aliniere (Faza 1) |
| B_Y830 | 361,3 | 830 | 205×30 | P,E | S_INTRARE_W/E | 2.4 |
| B_CASA_SCARA | 536,3 | 610 | 30×250 | S,P,E | CASA_SCARA, S_INTRARE_E | 2.4 |
| B_SEP_AFTER_DOOR | 536,3 | 600 | 30×10 | S,P | sep + CASA_SCARA | 2.5 traseu |
| B_Y590_EDGE_INVERTED | 566,3 | 575 | 115×25 | S_inv | pier + placă + SEP | **2.5** |

h grindă cadru (P/E): **35** cm total (vezi levels).

## 6. Placă / consolă (ordine 2.2–2.3)

| Item | Schema | Status |
|------|--------|--------|
| Planșeu living ~6 m fără X320 | placă 15 | calcul_lipsă SLS/ULS |
| Palier est | consolă pe B_E: sud **101** cm + vest **~105** (B_Y470) | LOCK-1R; fără stâlp în living |
| Nod C_E_PAL | torsiune / ancorare / ridicare | **2.2 primul după stâlpi** |

## 7. Registru — ce FE trebuie să închidă

| ID | Tip | Ieșire minimă |
|----|-----|---------------|
| `column_min_section` | 2.1 | tabel: id → 30×L_min care trece → adoptat |
| `east_landing_span` / `C_E_PAL` | 2.2 | armare consolă + nod OK/fail |
| `slab_span_without_X320` | 2.3 | 15 OK sau fail + tradeoff cerut |
| `beams_perimeter` | 2.4 | b×h min per grindă |
| `inverted_beam_fit` | 2.5 | capăt V / pier |
| `foundations_width` | 2.6 | tălpi (nu lățime grindă) |
| `basement_retaining` | 2.6 | BA retenție (geo Faza 1) |
| `roof_load_path` | 2.7 | (a) ușoară vs (b) BA |
| `B_X360_wide_pad` | geo+FE | o singură geometrie |

## 8. Livrabil așteptat de la rundă FE

Tabel obligatoriu:

```
element_id | secțiune_start | secțiune_min_care_trece | secțiune_adoptată | status | notă
```

Apoi: adoptare în `study_v47_frame_schema.mjs` (Faza 3) — **doar** după ce trece.

### Progres preliminar (2026-10-16) — ordin, nu adoptare

| Pas | Raport | Rezumat |
|-----|--------|---------|
| 2.1 | `v47_a1_frame_calc_2_1_columns_v01.md` | Axial OK pe 30×30 (rezervă ≥3) pt. majoritate; **C_E_PAL** blocat la 30×40 |
| 2.2 | `v47_a1_frame_calc_2_2_cantilever_v01.md` | M consolă ~6 kNm; T~7; nod ~10 — torsiune/ancorare = FE |
| 2.3–2.4 | `v47_a1_frame_calc_2_3_2_4_slab_beams_v01.md` | Placă L/d semnal; grinzi 30×35 flex OK ordin |
| 2.3+ / 2.1b / 2.5 | `v47_a1_frame_calc_continue_v01.md` | Bandă → L≈3,1 OK; seism ordin; întoarsă geo OK |
| Faza 1 | pad B_X360 | **accept dx=70** — `rezolvat_geometric` |
| Faza 1 | retenție subsol | **BA 20 cm** geo — `subsol_reten_ba_*`; calc împingere deschis |
| 2.6 | fundații | talpă **80** + bandă **60**; `foundations_width` geo OK |
| 2.7 | acoperiș | D3a întâi; D3b +~172 kN — `calc_2_6_2_7` |
| R | variantă | **RECOMANDAT** — brief `v47_a1_frame_fe_brief_variant_R_v01.md` |
| R+ | bandă/retenție/N_MID | `v47_a1_frame_variant_R_continue_v01.md` |

## 9. Ce nu se face în această rundă

- Varianta B (pereți structurali) — parcată
- Tăiere terasă/scară pentru util (Faza 4, după secțiuni)
- Stâlpi &lt; 30 cm
- Stâlp nou în living P
- Schimbare FF / h grindă fără impact explicit pe D1
