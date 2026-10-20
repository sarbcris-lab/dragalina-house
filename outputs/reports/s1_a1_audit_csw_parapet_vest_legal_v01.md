# Audit — C_SW_TERASA (grosime) + parapet vest „până sus” + vecin

**Status:** audit studiu · **NU** aviz urbanism · **NU** proiect semnat  
**Data:** 2026-10-20  
**Surse:** `structure_a1_study_cm` · `parapets_cm` · plan situație A1 (retrageri) · `CERINTE.md` · calc terasă v01 · A5 catalog

---

## Verdict

| Întrebare | Răspuns scurt |
|-----------|----------------|
| **Grosime stâlp dacă rămâne** | **Păstrează 30×30 cm** (minim P100 pe schemă). Axial util≈0,13 — nu cere mai gros. Opțional **30×40** pe axa B_S / acoperiș dacă FE cere rigiditate de nod — nu e obligatoriu pe ordin greutate. |
| **Parapet vest până sus, casă→stâlp?** | **Preferabil estetic/privacy DA** ca zid plin pe contur V (integrează stâlpul, închide privirea). **Nu e „doar parapet”** — e perete ~H plină pe ~1,4–1,7 m lungime. |
| **Legal / distanță vecin** | Colț SW amprentă → hotar CF ≈ **116 cm** (plan situație). Zid plin pe parcelă proprie la ~1,2 m de hotar = **posibil**, dar **DE VERIFICAT** cu CU/RLU (înălțime, incendiu, vedere). **Nu** e calcan pe limită; **nu** înlocuiește acordul vecinului dacă RLU cere. |

---

## 1. Stâlp C_SW_TERASA — ce grosime

### Demonstrat (model)
| | |
|--|--|
| Secțiune acum | **30×30** cm |
| Niveluri | **P+E** (fără S) |
| Rol | reazem B_W_TERASA + B_S_TERASA + acoperiș terasă (A1.207) |
| N ordin | ~156 kN · Nrd ~1200 kN · **util ≈ 0,13** |
| Ipoteză proiect | `column_section_hypothesis_cm`: **P100 ≥ 30** |

### Interpretare
- La încărcare axială, **25×25 ar ține greutatea**, dar pe schemă A1 **nu coborî sub 30** (P100 + coerență cu restul stâlpilor + nod acoperiș).
- **Mai gros decât 30** (ex. 35/40) **nu e cerut** de N; merită doar dacă FE pe moment/torsiune din B_S (L≈2,73 m) + încărcare acoperiș cere.
- **Recomandare audit:** lock **30×30**; alternativă de debate **30×40** (latura lungă pe E–V, aliniată B_S) dacă vrei nod mai rigid fără a mări amprenta pe vest spre hotar.

### Goluri
| Status | Item |
|--------|------|
| `calcul_lipsă` | FE nod C_SW + fundație locală (fără S — talpă/grindă pe solbanc) |
| `calcul_lipsă` | pad dedicat C_SW în `foundation_pad_adopt_cm` (acum lipsă) |
| `ipoteză` | încărcare acoperiș pe colț |

---

## 2. Parapet vest „până sus” casă → stâlp

### Acum (demonstrat)
| Element | Geometrie |
|---------|-----------|
| `terasa_parapet_vest` | X10 · Y674 · **dx 10** · dy 281,5 · **h = 105** · A5 |
| `terasa_parapet_vest_etaj` | similar · h 105 · dy 166,7 |
| Grosime A5 catalog | ≈ **12 cm** finit (nu zid portant) |
| Stâlp | X10–40 @ Y819 — **în dreptul** benzii parapetului (parapet pe fața stâlpilor, A1.64) |

### Ce propui tu
Zid/parapet **înălțime plină** (≈ până sub grindă / sofit terasă, nu 105) pe vest, de la peretele sud casă (≈Y645/674) **până la C_SW**.

### Comparație

| Criteriu | Parapet 105 (acum) | Zid plin „până sus” casă→stâlp |
|----------|--------------------|--------------------------------|
| Privacy vest | slabă | bună |
| Ascundere stâlp | stâlp vizibil deasupra parapetului | stâlp poate fi înglobat / citit ca pilastru |
| Structură | A5 neportant | poate lega B_W (contraventilare / umplutură pe grindă) — **nu înlocuiește** grindă BA |
| Lumină / look randare | deschis, aerisit | mai închis pe vest; schimbă fatadă |
| Grosime tipică | ~10–12 cm | dacă „zid”: **≥15–20 BA** sau EB20+finisaj (~25–30) — altfel rămâne parapet înalt slab |
| Legal | parapet terasă clasic | se apropie de **construcție verticală** lângă hotar — vezi §3 |

### Recomandare audit
- **Da, preferabil** dacă obiectivul e: (1) nu vrei stâlp „în aer” vizual, (2) privacy față de vest, (3) continuitate pe B_W.
- Execuție corectă: **zid pe axa parapetului** (X≈10–25/40), de la sud dorm până la fața N a C_SW, înălțime până la sofit grindă/acoperiș; stâlp rămâne **vizibil pe sud** sau înglobat.
- **Nu** declara „parapet A5 10 cm până sus” ca structură — fie **zid BA/cărămidă**, fie rămâne parapet 105.

---

## 3. Legal / distanță vecin (vest)

### Demonstrat pe plan situație A1
| Colț amprentă | Retragere la hotar CF (cm) |
|---------------|----------------------------|
| **NW** | **10** |
| **SW** | **116** |
| NE / SE | pe plan (est/sud — alte laturi) |

- Vestul terasei / C_SW e în zona **SW ≈ 1,16 m** față de hotar CF (nu pe calcan).
- Nordul casei e aproape pe hotar (**10 cm**) — acolo e regim de **limită/calcan**, separat de terasă.

### Din brief (`CERINTE.md`) — DE VERIFICAT
- Vecin spate: ferestre spre parcelă; s-a discutat **~60 cm** retragere **fără validare legală**.
- Acord verbal calcan (dreapta/Dragalina) ≠ act.
- Urbanism / RLU / CU = **necunoscute** în repo.

### Matrice risc (zid plin vest terasă)

| Temă | Evaluare studiu | Status |
|------|-----------------|--------|
| Amplasare pe parcelă proprie | da (~1,2 m de hotar la SW) | `demonstrat` geometric |
| „Calcan pe limită”? | **nu** (e retras) | `demonstrat` |
| Distanță tipică 2 m pentru **goluri** către vecin | zid **fără goluri** pe vest → argument mai blând decât fereastră; totuși **CU/RLU** decid | `calcul_lipsă` / urbanism |
| Înălțime vs împrejmuire | zid H≈2,5–3 m ≠ gard 2 m pe hotar — e parte din clădire/terasă | `ipoteză` |
| Incendiu fațadă la <D | posibil cerințe dacă D mic — **de verificat** | `calcul_lipsă` |
| Privacy vs ferestre vecin | zid plin **ajută** față de parapet 105 | `preferință` |
| POT | amprenta stâlp+parapet deja în ~58 m²; zid pe aceeași bandă ≈ **fără** salt POT dacă nu ieși din finit | `ipoteză` — verifică dacă grosimea iese vest de X0 |

### Atenție geometrică
- Finit vest casă / parapet la **X≈10** (local). Hotarul e **în afară** (retragere).
- Dacă îngroși zidul **spre vest** (în afara X0), **mănânci** din cei ~116 cm → risc urbanism. Preferă îngroșare **spre interiorul terasei** (spre est).

---

## 4. Registru status

| ID | Status |
|----|--------|
| Secțiune C_SW 30×30 | `rezolvat_geometric` + `ipoteză` P100 până FE |
| Pad / fundație C_SW | `calcul_lipsă` |
| Parapet 105 A5 actual | `rezolvat_geometric` |
| Zid plin vest casă→stâlp | `preferință` arh · `calcul_lipsă` urbanism |
| Retragere SW 116 cm | `demonstrat` pe plan situație |
| Conformare RLU/CU | `calcul_lipsă` (lipsă CU) |

---

## 5. Pachet debate (implementator — zero patch aici)

**Accept din audit**
1. C_SW rămâne **30×30** (default); opțional studiu FE **30×40**.
2. Parapet vest 105 poate fi înlocuit pe segmentul **casă→C_SW** cu **zid plin** (nu A5 10 cm „întins”), îngroșat **spre interior**.

**Cerere rundă limitată (dacă user aprobă)**
1. Schiță grosime zid V (15 BA vs 25–30 sandwich) + cotă față de hotar (nu reduce cei 116 cm).
2. FE/nod: C_SW + eventual umplutură pe B_W.
3. Pad C_SW / reazem fără S.

**Nu schimba acum**
- Amenajare A1, clear 255, lamă S2, poziție C_SW (X10 Y819).
- Nu declara „legal OK” fără CU.

**Conflict de raportat înainte de cote**
- Orice ieșire a zidului **vest de finit** care reduce retragerea SW sub valoarea din plan situație.
`

**Canvas** cu aceleași concluzii.