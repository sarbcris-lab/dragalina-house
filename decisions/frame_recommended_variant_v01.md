# Variantă recomandată de studiu — Varianta A (cadre)

**Status:** RECOMANDAT STUDIU · 2026-10-16  
**Nu este:** proiect semnat / FE validat / autorizabil  
**Este:** cea mai bună combinație pe criteriile proiectului **cu calculele ordin pe care le avem**

---

## Răspuns scurt

| Întrebare | Răspuns |
|-----------|---------|
| Am găsit varianta optimă FE? | **Nu** — lipsește FE/P100 semnat |
| Am găsit varianta optimă **de studiu**? | **Actualizat 2026-10-17** — vezi „Min proeminențe” mai jos (clear nou permite placă fără bandă) |
| Pot continua calculele eu? | **Predimensionare + comparații + geometrie** — da. **Semnătură / software FE comercial pe schema 3D** — nu înlocuiesc structuristul |

---

## Pachet înghețat (LOCK P — 2026-10-17)

| Decizie | Valoare | De ce |
|---------|---------|--------|
| Sistem | **Varianta A — cadre BA** | B parcată; util/fațadă/P100 stâlp ≥30 deja pe A |
| Placă | **20 cm** | L/d ordin OK pe 6,2 @K1,3; clear **268** |
| Bandă | **fără** `B_BAND_X320` | min proeminențe (soffit bandă eliminat) |
| Dormitor | **nu se modifică** | fără Y400 |
| Stâlpi | **30×40 / 30×30** pe **muchie placă** | `C_N_MID` păstrat până FE; along→30 după M+V |
| Grinzi | **b30 × h35** | clear sub grindă **259** |
| Consolă palier | LOCK-1R | fără stâlp în living |
| Retenție | **BA 20** | geo închis; împingere = calc |
| Fundații | pad **80** + FG **60** | nu lățime grindă; EST excentric int. |
| Acoperiș | **D3a ușoară** întâi | −~172 kN vs BA; D3b = sensibilitate |
| Util | geometric falie (NECONFIRMAT) | nu redesign amenajare |
| `declared_buildable` | **false** | până la structurist |

---

## Comparație (scor studiu — nu FE)

Criterii: clear 255 · util ≥37 · risc SLS placă · beton fațadă · fezabilitate calc.

| # | Variantă | Clear | Util | Placă SLS ordin | Cost/complex | Scor |
|---|----------|:-----:|:----:|:---------------:|:------------:|:----:|
| **R** | **A + 15 + bandă + D3a** | 273 | ~39 | OK cu bandă | mediu | clasic / ușor |
| **P** | **A + 18–20 fără bandă** | 270–268 | ~39 | OK ordin @K1,3 | mic proem. | **best pe proeminențe** |
| 1 | A + 15 fără bandă | 273 | ~39 | **fail** @K1,3 | mic | respins studiu |
| 2 | A + 20 + bandă | 268 | ~39 | OK (redundant) | proem. bandă | doar dacă FE cere |
| 3 | A + 25–28 fără bandă | 263–… | ~39 | OK | Gk↑ | inutil dacă 20 trece |
| 4 | A fără C_N_MID | — | ≈ | doar **după** drop bandă | −pilastru N | FE după P |
| 5 | Along toți 30×30 acum | — | +mic | — | — | prematur (seism/nod) |
| 6 | Varianta B diafragme | ? | ? | — | alt studiu | parcat |

**Concluzie / LOCK:** **P** adoptat în mesh (placă **20**, fără bandă). **R** = istoric. Raport: `outputs/reports/v47_a1_frame_slab_band_protrusion_v01.md`.

---

## Ce mai calculez eu vs ce e la structurist

| Eu (continuare studiu) | Structurist / FE |
|------------------------|------------------|
| Sensibilități, tabele, geometrie | Model 3D P100 + CR |
| Ordin M/V/N, L/d, presiuni | Armări, confinare, ductilitate |
| Adoptare secțiuni **după** FE | Semnătură, memoriu |

---

## Continuare pe R (2026-10-16)

| Check | Rezultat ordin |
|-------|----------------|
| Bandă 1-way L=6,45 | As≈1450 — **bound**, nu țintă |
| Bandă + **Y400** + 2-way | As≈**360** (≈4φ12) — **țintă studiu** |
| Bandă + Y400 1-way | As≈560 (≈4φ14) — fallback |
| Placă L≈3,1 | span/depth OK |
| C_N_MID | obligatoriu pe R |
| Retenție BA20 uscat | E_a≈23 kN/m; geo 131 deschis |

**Master status:** `outputs/reports/v47_a1_frame_variant_R_master_status_v01.md`  
**Band options:** `outputs/reports/v47_a1_frame_band_options_v01.md`  
**Brief structurist:** `outputs/reports/v47_a1_frame_fe_brief_variant_R_v01.md`

## Următorul pas util

1. FE placă 15 + bandă + **Y400** (și fără, ca dovadă).  
2. FE nod C_E_PAL.  
3. Abia apoi along 40→30 pe candidați.
