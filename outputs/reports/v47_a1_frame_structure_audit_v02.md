# V47 A1 FRAME — Audit rezistență v02 (complet)

**Data:** 2026-10-15  
**Model:** `v47_a1_frame_study` · viewer `volume_v47_a1_frame.json`  
**Verdict global:** **NECONSTRUIBIL / NEVALIDAT** — studiu geometric + ordine de mărime; **nu** înlocuiește proiectul de rezistență (structurist + verificări CR0/CR1-1-3/P100/P118).

---

## 0. Scop și metode

Audit pe **toate** sistemele de rezistență din model:

| Sistem | Ce verificăm |
|--------|----------------|
| Cadre BA P/E | stâlpi, grinzi, noduri, continuitate |
| Planșee | grosime, deschideri, reazeme, sandwich |
| Subsol / retenție | A11, fundații, grindă întoarsă, puț |
| Scări P↔E + L-1 | stringeri, paleți, clear, transport |
| Acoperiș 2 ape + PV | tip structură, pantă, încărcări |
| Anvelopă / layere A1–A12 | cum se îmbină cu betonul |
| Limite proprietate | N/E/S/W, talpi, pot |
| Gard / curte | A10, curte engleză, trepte |

**Calculele de mai jos sunt ordine de mărime (studiu), nu note de calcul.**

---

## 1. Verdict pe domenii

| Domeniu | Status | Notă scurtă |
|---------|--------|-------------|
| Grilă stâlpi (12) | **GEOMETRIC OK** | Continui S–P–E; fără stâlp pe palier/scară (intenție) |
| Secțiuni 30×40 | **IPOTEZĂ** | P100 / ductilitate nevalidate |
| Deschideri grinzi | **ORDINE OK** | Max ~3,61 m pe W; majoritatea ≤2,8 m |
| Placă 15 cm | **NECONFIRMAT** | L/h până ~24 pe W / palier deschis — la limită |
| Grindă întoarsă Y590 | **DESCHIS_CALCUL** | Fit sandwich −30…+32 |
| Palier scară (placă) | **DESCHIS** | Un singur reazem E (C_E_PAL); schemă 4 laturi deschisă |
| Subsol retenție | **SEPARAT** | Nu e același sistem cu cadrele P/E |
| Scări P↔E | **GEOMETRIC OK** | Stringeri 12; ramp2_structure 20 — dimensionare DESCHISĂ |
| Scări L-1 | **WARN** | Clear istoric ~72,5 cm (audit scară) |
| Transport / acces | **NECONFIRMAT** | Coliziuni pe intoarceri |
| Acoperiș | **FORMĂ STABILITĂ** | Structură șarpantă/BA **lipsă din model** |
| Gard | **NON-PORTANT** | Mesh 8 cm ≠ A10 230 mm |
| Limite / talpi | **IPOTEZĂ LOCK** | N~20 / W~1 / E pe Dragalina |
| Util P/E | **NECONFIRMAT** | ~38,5 / ~37,9 m² |

---

## 2. Sistem structural — ce e și ce nu e

**Este:** cadre beton armat (stâlpi + grinzi) + umplutură **nestructurală** EB20 + ETICS 80 mm.  
**Nu este:** zidărie portantă P/E; diafragme de etaj pe compartimentări 12,5; „stâlp în banda de 20 cm”.

Regulă de îmbinare (locked):

1. Beton = portanță (stâlp/grindă/placă/fundație).
2. EB20 = umplutură între stâlpi (nu calcanează încărcări verticale).
3. ETICS (vată 80 + finisaj) = **în afara** betonului, continuă pe fațadă — betonul **nu** înlocuiește banda de 9,2 cm.
4. Klinker (A2) = +13 mm pe E/S/V față de A1 — iese **în afară**; pe E (limita Dragalina) **nu** poate crește peste hotar fără renegociere.

**Inconsistență de date (de curățat):** în `wall_thickness_study_cm.concrete_column_cm` încă scrie **20** (legacy A1 falie), pe când FRAME folosește **30×40**. Nu amesteca cele două în proiect.

---

## 3. Stâlpi — inventar + potrivire plan

12 stâlpi. Coordonate post-A2 (+1,3 cm pe E/S/V față de axe nominale 9,2).

| ID | Secțiune | Rol | Conflicte amenajare | Severitate |
|----|----------|-----|---------------------|------------|
| C_NW | 40×30 +10 | colț N/W | duș — păstrăm stâlp; dus x≥50 | amenajare |
| C_N_MID | 40×30 +10 | B_N 3 reazeme | alternativă fără el | comparație |
| C_NE | 30×40 +10 | colț N/E | blat bucătărie | amenajare |
| C_W_MID | 30×40 +10 | B_W mid | pat x≥45 | amenajare |
| C_W_DORM | 40×30 +~9 | sud dorm W | gol terasă | gol |
| C_S_DORM_E | 30×30 +~9 | nod X360 | circulație terasă | amenajare |
| C_E_GEAM_S | 30×40 +10 | B_E mid | — | ok |
| C_E_PAL | 30×40 +10 | capăt B_E; **NU pe placă 15** | proem. pe palier E | **critic geometric** |
| C_CASA_SCARA | 30×40 flush | separator A6 | transport la 45° | acces |
| C_SHAFT_E_PIER | **15×15** doar S | capăt grindă întoarsă | — | **mic / de verificat** |
| C_S_INTRARE_W | 40×30 +~9 | sud intrare | fundație bandă dedicată | ok |
| C_S_INTRARE_E | 30×30 +~9 | nod B_Y830 / B_CASA | — | ok |

**Continuitate:** stâlpi P+E traversează placa (+293…+308) și buildup până la FF etaj — corect conceptual (pardoseala se decupează).

**P100:** 30 cm pe direcția transversală = **ipoteză**; sistem cadru vs zidărie duală, ductilitate, armături longitudinale/transversale — **zero calcul**.

---

## 4. Grizi / deschideri — ordine de mărime

Deschideri **față-față** (nominale, cm → m):

| Grindă / zonă | L (m) | L/h placă 15 | Comentariu |
|---------------|------:|------------:|------------|
| B_N vest (NW→N_MID) | 2,71 | 18,1 | confortabil cu grindă pe contur |
| B_N est (N_MID→NE) | 2,80 | 18,7 | idem |
| B_W nord (NW→W_MID) | **3,61** | **24,1** | **cea mai lungă pe contur** — grindă B_W obligatorie |
| B_W sud | 1,96 | 13,1 | ok |
| B_E (segmente) | 2,61 / 0,99 | 17 / 7 | ok până la C_E_PAL |
| B_Y645 dorm | 2,81 | 18,7 | ok |
| B_Y830 intrare | 2,05 | 13,7 | ok |
| Palier E deschis (fără stâlp sud de C_E_PAL) | **~3,7** | **~25** | **critică** — `east_landing_span` |

**Încărcare planșeu (ordine, ULS tipic CR0):**

- Gk ≈ placă 15 (3,75) + finisaje/șapă (~1,5–2,5) + pereți ușori (~1,0) → **~6–7 kN/m²**
- Qk locuință ≈ **2,0 kN/m²**
- q_Ed ≈ 1,35Gk+1,5Qk ≈ **11–12 kN/m²**

**Grindă:** h total **35 cm** (inclusiv zona plăcii); clear P sub grindă **241 cm**. Definiția e clară în JSON — nu coborî încă 35 sub placă.

**Placă fără reazem pe X320 part_mid:** corect (compartimentare nestructurală). Deschidere 2D pe living → **slab_span_without_X320 DESCHIS** — grosimea 15 cm poate fi insuficientă fără grinzi intermediare / sporire / nervuri.

---

## 5. Noduri și trasee de încărcare (critice)

### 5.1 Ansamblu muchie puț (cel mai sensibil)

```
B_Y590_EDGE_INVERTED (X565–680, Y575–590, z −30…−5)
  E → C_SHAFT_E_PIER 15×15 (în zid est)
  W → placă parter span → B_SEP_AFTER_DOOR (Y600–610) → C_CASA_SCARA
Ușă Y500–600 + palier Y490–600: fără stâlp (intenție)
```

**Probleme:**
- Fit vertical în sandwich soffit−30 → FF+32 = **62 cm** numeric, dar `make_up_to_ff` 27 cm **nu e beton** — e elevație ipotetică.
- Pier 15×15 e mic pentru capăt de grindă întoarsă — **capacitate/ancorare DESCHISĂ**.
- Interfață grindă întoarsă ↔ ușă 200 cm ↔ lintel 15 — trebuie detaliu cotat pe secțiune 37.

### 5.2 Palier scară rece (placă = plafon living)

- Reazem E: **doar C_E_PAL** (Y449–489).
- Sud: fără stâlp pe scară (clar transport) → consolă / deschidere lungă.
- B_Y470_PALIER_EDGE = bordură N — **schemă 4 laturi DESCHISĂ**.
- Vestibul închis **eliminat** (nu mai e cutie structurală).

### 5.3 Separator casă↔scară (A6 ≈ 300)

- C_CASA_SCARA flush în frunză X535–565 — corect termic (anvelopă caldă).
- B_CASA_SCARA Y610→860 + nod B_Y830 — traseu vertical pe separator.

---

## 6. Layere A1–A12 ↔ structură

| ID | Grosime | Rol structural | Îmbinare cu cadre |
|----|--------:|----------------|-------------------|
| A1 | 299 | umplutură+ETICS N | pe/între stâlpi; ETICS peste beton |
| A2 | 312 | +klinker E/S/V | +13 mm **exterior**; pe E = risc hotar |
| A3 N/K | 311/324 | baie pe fațadă | ca A1/A2 + faianță int. |
| A4 | 148 | scară rece | **fără** ETICS full; klinker; pe stâlpi scară |
| A5 | ~116 | parapete | neportante; prinderi DESCHISE |
| A6 | ~300 | separator cald↔rece | pe C_CASA_SCARA — **anvelopă** |
| A7 | 125 | fono interior | **nestructural** |
| A8 | ~150 | baie int. | nestructural |
| A9 | 125/150 | TV/pocket | nestructural |
| A10 | 230 | gard | nestructural; ≠ mesh 8 cm |
| A11 | 326 | subsol retenție | **sistem separat** BA 300 + hidro |
| A12 | bandă 40 | soclu | pe A1/A2 |

**Ordin de montaj (logic):** fundații → stâlpi/diafragme subsol → grinzi/plăci → umplutură EB20 → ETICS → finisaje → acoperiș.  
Nord la 20 cm: finisaj **la ridicare** (nu re-intervenție).

---

## 7. Limite de proprietate ↔ structură

| Latură | Amplasare | Finisaj | Implicație structurală |
|--------|-----------|---------|------------------------|
| **N** | ~20 cm față de zid vecin (nu 0) | tencuială A1 | talpă clipată; fără schelă ulterioară; hidro/drenaj rost; P118 vs șarpanta vecinului |
| **E** | pe limita Dragalina | A2 klinker | **A2 +13 mm nu poate ieși peste hotar** — ori se „mănâncă” din interior, ori se renegociază |
| **W** | ~1,0 m țintă | A2 | spațiu pentru ETICS + întreținere; talpă +5 cm tipic |
| **S** | curte Cloșca | A2 + acces | curte engleză + trepte = ziduri retenție A11 |

**Fundații (studiu):** ETICS 9,2 în afara feței cărămizii; talpă +5 cm față de structură; clip parcelă N/E/S/W = 14,78 / 5 / 20 / 20 cm (constrâns).  
Amprentă post-A2: **58,79 m²** · POT pe 147 ≈ **40%**.

---

## 8. Acoperiș + PV

| Parametru | Valoare |
|-----------|---------|
| Tip | `two_pitch` (formă **stabilită**) |
| Coamă | pe X, L=682,6 cm, y=430 |
| Rise / pantă | 248 cm / **~30°** |
| Shell | 18 cm (mesh) |
| Acoperă | casă + bandă scară; **nu** podest SE, flight_180, entry_steps, terasă neacoperită |
| PV | ambele ape, inset 40, +6 cm |

**Lipsă critică:** modelul are **formă** de acoperiș, **nu** schemă de rezistență (grinzi de șarpantă / pane / placă BA / coamă pe stâlpi).  
Încărcări de estimat cu structurist: zăpadă Turda (CR1-1-3 — **verificare zonă**), vânt, Gk țiglă + vată B6 220 mm + PV (~0,15–0,25 kN/m²).  
Coamă pe mijloc Y430 ≈ pe axa mid — trebuie legătură la cadrele N/S (cârlige pe B_N / B_Y645 / stâlpi).

Fără copertină separată pe rampă 2 — corect ca intenție (acoperiș continuu).

---

## 9. Scări (toate)

### 9.1 P ↔ E
- Risers 16 cm; clear 105 + parapet E 10 = bandă 115 @ X565.
- Podest SE 115×115 @ +128, **neacoperit**.
- Ramp2 sub gable; `ramp2_structure_cm=20`; stringeri continue **12 cm** în mesh FRAME.
- Palier superior = **rece** (nu vestibul); placa = plafon living — vezi §5.2.

### 9.2 L-1 / curte engleză
- Acces: curte −48 → trepte → palier −95 → scară → FF −250.
- Clear țintă subsol **220** (soffit −30 − FF −250); audit vechi menționa 208 — aliniere cote **de unificat**.
- Clear scară beci: audit `v47_audit_scara_utilizabila` **warn ~72,5 cm** (bandă 115 − ziduri) — **utilizabilitate slabă**.
- Puț deschis sub ramp2 = obligatoriu pentru headroom.

### 9.3 Transport
Status **NECONFIRMAT**: coliziuni pe intoarceri 15–90° cu ziduri puț, toc, foaie, treaptă, C_CASA_SCARA la 45°.  
Nu se declară PASS pe W+15.

---

## 10. Gard + curte (structural)

**Gard (A10):** 15+200+15 = 230 mm klinker ambele fețe — **neportant**. Viewer încă **8 cm** — aliniere catalog↔mesh.  
Pe E+N pe amprenta casei = **peretele casei** (fără dublură gard). Porți: auto clear 7,1 m; pietonal 150 cm — fundații stâlpi poartă = detalii separate (neîn model).

**Curte:** 2× locuri 250×500 studiu; alee dy 150 @ Y1036.  
Curte engleză: închisă spre Dragalina (zid E); gol teren doar S de anvelopă; ziduri A11.  
Parapete A5 + prinderi — **neconfirmate**.

---

## 11. Conflicte deschise (registru master)

| ID | Severitate | Acțiune |
|----|------------|---------|
| inverted_beam_fit | DESCHIS_CALCUL | Secțiune cotată + calcul grindă întoarsă + pier 15×15 |
| east_landing_span | DESCHIS | Dimensionare placă/grindă palier sau reazem suplimentar (fără a bloca transport) |
| palier_plate_support | DESCHIS | Schemă 4 laturi / grinzi pe contur |
| slab_span_without_X320 | DESCHIS | Verificare placă living 15 cm sau grindă intermediară |
| p100_min_section | IPOTEZĂ | Structurist: tip sistem + secțiuni minime |
| etics_wrap_verify | DESCHIS | Detaliu nod stâlp–EB20–ETICS (în special N 20 cm) |
| basement_retaining | SEPARAT | Proiect retenție A11 + hidro + drenaj |
| column_30_protrusion_vs_37m2 | DESCHIS | Util NECONFIRMAT — nu micșora stâlpi |
| north_three_supports | COMPARATIE | Cu/fără C_N_MID |
| transport_access | NECONFIRMAT | Soluție geometrică sau acceptare restricții |
| roof_structure_missing | **NOU** | Adăugat schemă șarpantă/BA pe FRAME |
| A2_vs_E_limit | **NOU** | Hotar Dragalina vs +13 mm klinker |
| legacy_col_20_vs_30 | **NOU** | Curăță `concrete_column_cm: 20` din JSON |
| fence_8_vs_A10_230 | **NOU** | Aliniază mesh gard |
| basement_clear_208_vs_220 | **NOU** | Unifică cote clear |
| stair_L1_clear_72 | WARN | Lățime utilă beci |
| make_up_to_ff_27 | **NOU** | Clarifică ce e „rest elevație” vs beton |

---

## 12. Calcule — ce există vs ce lipsește

| Există în proiect | Lipsește (obligatoriu structurist) |
|-------------------|-------------------------------------|
| Geometrie cotată stâlpi/grinzi | Note de calcul ULS/SLS |
| Deschideri măsurate | Armături, clase beton/oțel |
| Încărcări ordine de mărime (acest audit) | Zăpadă/vânt pe zonă oficială |
| Clear-uri / transport geometric | Verificări P100 (seism) |
| Overlay 36 + secțiuni 37 | Detalii noduri BA |
| Catalog A1–A12 | Interacțiune retenție–cadre |
| | Șarpantă / legături acoperiș |
| | Fundații dimensionate (talpi/radier) |
| | Flambaj stâlpi, τ pe grinzi, perforare placă |

---

## 13. Priorități următoare (ordine propusă)

1. **Structură acoperiș** pe FRAME (lipsă totală) + legături la cadre.  
2. **east_landing_span + palier_plate_support** — riscul nr.1 pe P/E.  
3. **inverted_beam_fit** pe secțiune (ușă / grindă / sandwich).  
4. **A2 pe limita E** — hotărâre geometrică.  
5. **Curățare legacy** col 20 vs 30; clear subsol; gard A10.  
6. **Transport** — acceptare sau redesign local.  
7. Brief structurist cu acest audit + overlay 36/37 + catalog.

---

## Surse

- `data/building/v47_a1_frame_study.json` (`structure_frame_study_cm`)
- `outputs/reports/v47_a1_frame_structure.md`
- `outputs/reports/v47_audit_scara_utilizabila.md`, `v47_audit_subsol.md`
- `outputs/reports/v47_useful_by_level.md`, `v47_pot_util_assemblies.md`
- `decisions/assemblies_catalog_v01.md`, `setbacks_neighbors_v01.md`, `facade_brick_and_wall_v01.md`
- `outputs/plans/36_…overlay.svg`, `37_…sections.svg`, `35` / `35b` wall sections
