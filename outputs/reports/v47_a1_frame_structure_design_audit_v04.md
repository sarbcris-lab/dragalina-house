# Audit proiectare structură — FRAME v04 (2026-10-16)

**Status:** NECONSTRUIBIL · NEVALIDAT structurist  
**Model:** `data/building/v47_a1_frame_study.json` + `viewer/data/volume_v47_a1_frame.json`  
**După:** retragere `C_E_LAND_SP`, `B_E` consolă → Y600, materiale A7/Weber/Ströher  
**Înlocuiește ca audit curent:** v03 (păstrat istoric)

Predimensionările = ordine de mărime pentru alegerea schemei, **nu** proiect de execuție.

---

## Verdict (1 frază)

Cadru geometric coerent pe noduri, dar **nevalidat**: placa ~6 m @ 15/20 cm eșuează SLS; acoperișul nu are cale de încărcare; retenția subsol e EB20 „umplutură”; fundațiile = lățimea grinzii.

---

## E. Ce e OK / locked

| | |
|---|---|
| `C_E_LAND_SP` / `B_LAND_S_EDGE` | retrași — zero stâlp în living / acces beci |
| Goluri | ușă beci Y500–600; `C_E_PAL` ≤489; `C_CASA` ≥610 |
| `B_E` consolă 111 cm (Y489→600) | consistent JSON ↔ mesh ↔ raport v02 |
| FF→FF 288 | 255+6+15+3+2+5+2 |
| Stâlpi continui | fundație→streșină fără gap; nu micșorați pentru mobilier |
| Filtru Structură | fără teren/gard/țiglă (după fix v04: fără poartă) |
| Straturi pereți | pe normală (nu pe lungime) |

---

## D. Top 10 — severitate

| # | Sev. | Problemă | Acțiune |
|---|---|---|---|
| 1 | **CRITIC** | Placă 15/20 @ ~6 m fără reazem A7; L/d≈52 (15) / ≈35 (20); EC2 tipic cere ~24–28 cm sau bandă/PT | FE 2D; **20 cm nu e suficient** ca salvare automată |
| 2 | **CRITIC** | Acoperiș: stâlpișori plutitori (~60 kN); **137 cm** fără căpriori pe E; S fără reazem X566–682 | Reazem coamă pe cadre; completare căpriori; alternativă șarpantă ușoară |
| 3 | **CRITIC** | Retenție subsol = EB20 `umplutura`, nu BA | Zid BA dimensionat; în Structură |
| 4 | ÎNALT | Fundații: talpă = lățime grindă (~250 kPa estimat); −3,10 m pe E fără subsol | Geotehnic + NP112; tălpi reale |
| 5 | ÎNALT | `B_E` consolă ≈ back-span; vârf încărcat de rampă2; ridicare pe `C_E_GEAM_S`; nod biaxial `C_E_PAL` | Calcul 3D nod + ancorare; eventual back-span mai lung |
| 6 | ÎNALT | `B_Y470` era doar la streșină (levels E) — **fix v04 → P** (bordură la planșeu) | Capăt V încă liber — reazem de studiat |
| 7 | MEDIU-ÎNALT | `levels` P/E ambiguu: inel subsol −70 peste palier beci (clear ~180 vs 220 auditat) | z0/z1 explicite per grindă |
| 8 | MEDIU-ÎNALT | Grindă întoarsă: capăt V pe buiandrug 15 cm; gap 10 cm vs `B_SEP` | Detaliu cotat |
| 9 | MEDIU | Grinzi S +9,2 cm în ETICS; `B_X360` dx=70 (pad nod); etichete 30×40 vs geo 30×30 — **fix label** | Aliniere / dx structural 30 |
| 10 | MEDIU | Scări exterioare fără fundații; viewer: poartă + reframing — **fix v04** | Structură scări outdoor |

---

## A. Geometrie

### Stâlpi (12)

Continui S·P·E (excepție `C_SHAFT_E_PIER` doar S). Secțiuni tip 30×40 / 40×30; `C_S_DORM_E` + `C_S_INTRARE_E` = **30×30 geometric** (etichetă aliniată v04).

Proeminențe: duș/pat mutate, nu stâlpii. Overlap mobilier `blat_*` / `C_N_MID` / `C_NE` — adaptat, încă vizibil.

### Grinzi

| ID | Note audit |
|---|---|
| `B_W` | deschidere N ~3,61 m — cea mai solicitată perimetrală |
| `B_E` | consolă **111 cm** sud de PAL; fără stâlp; torsiune + rampă2 pe vârf |
| `B_Y470` | bordură N palier → **nivel P** (planșeu), nu streșină |
| `B_Y590` inverted | capăt V slab; pier E parțial redundant cu inel `B_E` |
| `B_X360` | dx=70 = pad prin două stâlpi nealiniați; lățime structurală tip 30 |

### Plăci

- Planșeu etaj 15 cm (+293→+308); alt 20 → clear 250.  
- Palier Y470–590 / X565–670: consolă E→V pe `B_E`.  
- Duplicat `palier_superior_placa` vs `etaj_placa` — de curățat.

### Fundații / subsol

- FG pe axe grinzi = lățime grindă, **nu talpă**.  
- `subsol_fg_B_E` sub consolă Y489–600 = discutabil.  
- Retenție: **nemodelată** ca BA.

### Acoperiș

- Coamă BA + căpriori @120; bucla se oprește ~X623 → gol E.  
- Stâlpișori fronton pe streșină **fără grindă dedesubt**.

---

## B. Predimensionare (ipoteze)

C25/30 · B500 · q_Ed locuință **11,78** · podest **11,93** kN/m².

| Element | Ordin | Concluzie |
|---|---|---|
| Podest consolă L=1,05 | M=6,57 kNm/m · As≈140 (min. guvernează) | Plauzibil ULS; torsiune/ancorare decisive |
| `B_E` consolă ~1,2 m | M≈12 kNm + vârf rampă ≈25–40 | Nu e rupere; e nod/ridicare |
| Placă L=6,2 @15 | M≈57 kNm/m · L/d≈52 | **SLS fail** |
| Placă @20 | L/d≈35 | Încă slab vs EC2 ~24–28 |
| Grindă pe A7 6,15 m | M≈182 kNm @35 cm | **Nu adopta** ca primă |
| Perimetrală 3,61 m | M≈60–80 kNm (+EB20) | Candidat 30×35, etrieri |
| FG 0,30 m | ~250 kPa | Subdimensionat |

**Lipsește pentru proiect:** P100, CR1-1-3, geotehnic, armări, FE placă, retenție, detalii nod.

---

## C. Viewer Structură (v04)

### Include
Stâlpi continui, pier, fg+pad, grinzi S/P/E, placă, put beton, stringeri scară, coamă/căpriori/solbancuri.

### Exclude (corect)
Teren, amprentă, gard, țiglă, PV, umplutură EB20, trepte finisaj.

### Fix-uri v04
1. **Poarta** nu se mai reafișează în `structura` / `structura_pereti`.  
2. **Camera** nu mai recadrează pe tot situl după `setLevel("structura")`.  
3. Banner → audit **v04**.

### Rămas
- Scări outdoor în Structură fără fundații.  
- Retenție absentă din view (încă umplutură).  
- Semantica P=planșeu / E=streșină — ușor de confuzat.

---

## Următorii pași (ordine)

1. FE placă 15/20/**25–28** + bandă pe axa `C_N_MID`–`C_S_DORM_E`  
2. Traseu încărcare acoperiș (sau șarpantă ușoară)  
3. Retenție BA subsol + tălpi  
4. Nod `C_E_PAL` / torsiune `B_E`  
5. Scări înclinate reale + outdoor
