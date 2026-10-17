# Rezolvare conflicte FRAME — acord implementator pe audit + lege întâi

**Data:** 2026-10-16  
**Bază:** pachet recenzor structură + `priorities_legal_first_v01.md`  
**Regulă:** fac ce are dreptate structurisul; unde nu, motivez; modificări cu impact pe **POT~40% / util≥37 / clear≥255** = decizie explicită înainte.

---

## 1. Poziție pe fiecare item din audit

| ID | Structurisul | Implementator | Acțiune |
|----|--------------|---------------|---------|
| Baseline geo (stâlpi, B_E, palier, scară, GEO_X0, fără C_E_LAND_SP) | confirmat | **Acord** | păstrat |
| `B_Y470` fantomă L-1 | conflict / bug | **Acord** | **reparat** — filtru soffit/fg: doar `S` sau `P+E`, nu P-only |
| `inverted_beam_fit` gap Y590–600 | conflict + calcul | **Acord pe gap**; calcul rămâne | **geo închisă**: dy 15→25 (Y575–600), ușa neatinsă; fără impact 40/37/255 |
| `B_X360_wide_pad` | opțiuni aliniere | **Parțial acord** | **nu aliniez stâlpii acum** (risc util). Pad dx=70 acceptat provizoriu + **calcul**. Aliniere = doar cu Δ m² util pe masă |
| `slab_span` 15 vs 20 | FE, fără 25–28 | **LOCK P 2026-10-17** | **placă 20 fără bandă** în mesh; FE pe 6,2 |
| `east_landing` / B_E | calcul_lipsă | **Acord** | nu reintroduc C_E_LAND_SP; FE nod |
| `basement_retaining` | BA nou | **Acord** | model BA retenție = rundă separată subsol (flexibil, minime legale dacă există) — **nu** „EB20=structură” |
| `foundations_width` | calcul + geo 131 | **Acord** | nu „fix” din 310 kPa vecin |
| `roof_load_path` | calcul / BA vs ușoară | **Acord** | comparație ulterioară; fără stâlpi în camere |
| `etics_wrap_verify` | detalii șantier | **Acord** | fără redesign A1; detalii la execuție |
| `facade_slab_edge_masonry` | — | **LOCK 2026-10-16** | beton perimetru pe muchie placă; falie=zidărie (N/V afară, E/S interior la cheie); supersede flush-int / N@9,9 |
| `palier_plate_support` | calcul / Lnw | **Acord** | geometrie OK; performanță NECONFIRMATĂ |
| Placă 25–28 din L/d | respins ca demonstrație | **Acord** | nu adopt |

---

## 2. Grosimea plăcii — LOCK P (2026-10-17)

**Măsură proiect (FF→FF = 306 cm, buildup 12 cm, riser 17):**

| Grosime BA | Clear sub placă | vs ≥255 | Bandă | Status |
|------------|----------------:|:-------:|-------|--------|
| 15 cm | 273 | OK | necesară ordin | istoric R |
| **20 cm** | **268** | **OK** | **nu** | **LOCK P — mesh** |
| 25 / 28 cm | 263 / … | OK | nu | doar dacă FE cere |

Clear sub **grindă** (h total 35) = **259 cm** (≥255). Bandă retrasă.

### Recomandare implementator (optimă față de legea ta)

1. **Păstrăm 15 cm** ca grosime de proiect până la FE pe schema reală.  
2. FE trebuie să **încercă să valideze 15** (săgeți, fisurare, încărcări, goluri).  
3. **Doar dacă 15 eșuează demonstrat** deschidem tradeoff — nu înainte:

| Dacă 15 eșuează | Ce câștigi | La ce renunți / ce atingi |
|-----------------|------------|---------------------------|
| A. Placă 20 cm | mai multă rigiditate | clear **250** (−5 față de 255) — **renunți la 255** sau ceri interpretare legală |
| B. Ridici FF→FF (ex. +5 cm) + placă 20 | clear 255 păstrat cu 20 | clădire mai înaltă; verificări urbanism/înălțime maximă; scări/cote |
| C. Reduci buildup pardoseală (12→7) + placă 20 | clear recuperat | mai puțină izol. termoacustică pe etaj |
| D. Bandă/grindă locală / PT | rigiditate pe deschideri critice | util / clear local; complexitate |

**Nu alegem A/B/C/D acum.** Alegem: **rămânem pe 15 + FE**.

**LOCK D1 (2026-10-16 beneficiar):** 255 hard **sub placă**; **241 OK sub grindă** h35.

---

## 3. Ce s-a implementat în această rundă (fără impact legal 40/37/255)

1. Filtru generator: `B_Y470` nu mai apare ca `subsol_grinda_*` / `subsol_fg_*`.  
2. Grindă întoarsă: `dy=25` → nod la Y600 cu `B_SEP`; ușa beci neschimbată.  
3. `B_X360`: status → acceptat provizoriu + calcul; fără mutare A1.  
4. Registru + acest document.

---

## 4. Următoarele runde (ordine)

1. **Confirmare de la tine:** 255 sub placă = hard? 255 și sub grinzi (azi 241) = hard?  
2. FE placă 15 (și nod B_E) — livrabil calcul, nu schimbare grosime automată.  
3. Subsol: pereți BA retenție (spațiu tehnic flexibil).  
4. Fundații cu presiuni pe ipoteză 131 + studiu teren.  
5. Acoperiș BA vs ușoară.

---

## 5. Cum cerem alegere de acum înainte

Orice variantă vine cu: impact **POT / util m² / clear 255** (sau „zero impact pe acestea”) + ce rămâne neschimbat + la ce renunți dacă alegi varianta.
