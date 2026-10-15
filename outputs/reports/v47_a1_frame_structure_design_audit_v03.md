# V47 A1 FRAME — Audit proiectare structură v03

**Data:** 2026-10-15  
**Domeniu:** proiect + view `1 · Structură`  
**Verdict:** **NECONSTRUIBIL / NEVALIDAT** — geometria de cadru e coerentă pe noduri principale, dar view-ul era poluat, există goluri de proiectare reale, iar **calculele de rezistență lipsesc** (doar ordine de mărime).

---

## A. Verdict pe două axe

| Axă | Status | Pe scurt |
|-----|--------|----------|
| **View Structură (geometric UI)** | **FAIL → remediat partial** | Includea gard, porți, trepte, teren, țiglă — nu e „cadru BA”. Filtru curățat. |
| **Geometrie cadru (noduri)** | **WARN** | Noduri B↔C OK pe grinzi principale; B_SEP avea overlap 0 cu C_CASA (butt) — corectat +10 cm. |
| **Proiectare / calcule** | **FAIL** | Zero note ULS/SLS/P100; secțiuni ipoteză; fundații/retenție/acoperiș nevalidate. |

---

## B. Audit view „1 · Structură”

### B1. Ce era greșit (de ce „nici geometric nu-i ok”)

În view apăreau ~40 mesh-uri **non-cadru** cu `site_layer=structura` sau whitelist larg:

- `teren_cf`, `amprenta_*`
- `fundatie_gard_*`, `stalp_poarta_*`
- `subsol_scara_*`, `subsol_racord_*`, paleți
- `acoperis_apa_*` / frontoane / PV (învelitoare, nu schelet)
- rampe/podest ca „structură” amestecate cu stâlpii

**Efect:** scheletul BA e greu de citit; grinzi par „în aer”; acoperișul BA e ascuns sub țiglă.

### B2. Remediere view (acest commit)

View Structură = **doar**:

- `stalp_continuu_*`, pier subsol  
- `subsol_grinda_*`, `subsol_fg_*`, grindă întoarsă  
- `parter_centura_*`, `etaj_centura_*`, `etaj_placa_structura`  
- `acoperis_coama_*`, `solbanc_*`, `caprior_*`, stâlpișori fronton  
- stringeri rampă (placa scară ca element BA)

**Exclude:** teren, gard, porți, trepte, țiglă/PV.

### B3. Probleme geometrice rămase (proiect, nu doar UI)

| ID | Severitate | Detaliu |
|----|------------|---------|
| `east_landing_open` | CRITIC | B_E se oprește la C_E_PAL (Y489); sud = deschidere ~3,7 m fără stâlp — **intenție circulație**, dar **necalculată**. |
| `etaj_centura_at_eave` | WARN | Centurile „etaj” sunt modelate la **streșină** (eave), nu ca inel distinct sub șarpantă + planșeu clar separat vizual. |
| `roof_vs_columns` | WARN | Stâlpii se opresc la eave (~+5,81 m); coama ~+8,23 m → **2,4 m fără continuitate stâlp**; doar căpriori/stâlpișori fronton. |
| `inverted_beam_visual` | INFO | Grindă la z−30…−5 = soffit placă P — corect structural; pe „Doar subsol” pare în aer dacă nu citești cota. |
| `B_SEP_node` | FIXAT | Gap Y 0 (butt) → overlap 10 cm în C_CASA. |
| `fg_on_E_only` | FIXAT | Nu mai punem fundație pe grinzi doar-E / întoarse. |

---

## C. Audit proiectare (nu doar geometrie)

### C1. Sistem

- Cadre BA + umplutură EB20 **nestructurală** + ETICS.  
- **Nu** zidărie portantă P/E.  
- Status proiect: `declared_buildable: false`.

### C2. Încărcări — ordine de mărime (studiu)

| Încărcare | Valoare studiu | Status |
|-----------|----------------|--------|
| Gk planșeu | ≈ 6–7 kN/m² | IPOTEZĂ |
| Qk locuință | 2,0 kN/m² | tipic CR0 — de confirmat |
| q_Ed ≈ 1,35G+1,5Q | **≈ 11,8 kN/m²** | studiu |
| Zăpadă Turda | — | **LIPSĂ** (CR1-1-3) |
| Vânt | — | **LIPSĂ** |
| PV | ≈ 0,15–0,25 kN/m² | tipic |
| Seism P100 | — | **LIPSĂ** |

### C3. Grinzi principale — M/Mu ordin (secțiune 30×35, As≈1%, fy=435, tributar ≈3 m)

| Grindă | Deschidere | M ≈ | M/Mu ≈ | Citire |
|--------|------------|-----|--------|--------|
| B_N | 2,71 / 2,80 m | 32–35 kNm | 0,35–0,38 | OK ordin |
| B_W nord | **3,61 m** | **58 kNm** | **0,63** | cea mai solicitată contur |
| B_E | 2,61 / 0,99 m | 30 / 4 | 0,33 / 0,05 | OK; **capăt liber sud = alt problem** |
| B_Y645 | 2,81 m | 35 | 0,38 | OK ordin |
| Rest | ≤1,7 m | mic | <0,15 | OK ordin |

**Atenție:** tributarul 3 m e **grosier**. Placa 15 cm pe living fără grindă intermediară (fără X320) poate schimba totul → verificare placă 2D **obligatorie**.

### C4. Stâlpi

| | |
|--|--|
| Secțiune | 30×40 (+10 proem. local) — **ipoteză P100** |
| N ordin (echidistribuit) | ~60 kN << Nrd beton ~1600 kN |
| Concluzie axial | Nu e problema; **flambaj, seism, noduri, ductilitate** = nevalidate |
| Pier 15×15 | **suspect** ca reazem grindă întoarsă |

### C5. Placă 15 cm

- L/h până ~24 pe deschideri lungi; palier est ~25.  
- Fără reazem pe compartimentare 12,5.  
- **NECONFIRMAT** ca groime unică.

### C6. Grindă întoarsă

- L≈1,15 m; h util în sandwich −30…−5 = 25 cm.  
- Traseu: pier E + placă + B_SEP → C_CASA.  
- **DESCHIS_CALCUL** (fit + armare + perforare placă).

### C7. Fundații / subsol

- Fg pe axe grinzi S/P + pad-uri stâlpi — **geometrie**, nu dimensionare NP112.  
- Retenție A11 = sistem **separat**.  
- Clip pe limită N/E — geotehnic **lipsă**.

### C8. Acoperiș

- Formă 30° + schelet studiu (coamă/solbanc/căpriori).  
- **Nu** e proiect de șarpantă; legătura la cadre = stâlpișori fronton, nu calcul.  
- Zăpadă/vânt/PV pe pantă = **lipsă**.

### C9. Scări

- Stringeri 12 / rampă 20 = model, nu verificări.  
- Palier = plafon living — reazeme DESCHISE.

### C10. Conformitate planuri (prioritate beneficiar)

- P/E = sursă de adevăr; stâlpii **nu** se elimină.  
- Beci realiniat pe X360 / X535 / Y400 / Y645; clar ocolește stâlpii.  
- Amenajare: dus x≥50, pat x≥45 — fără micșorare stâlpi.

---

## D. Ce lipsește ca să fie „proiect structură”

1. Note de calcul ULS/SLS (grinzi, placă, stâlpi, fundații).  
2. Verificare P100 (sistem, ductilitate, q, armături).  
3. CR1-1-3 zăpadă/vânt + combinații cu PV.  
4. Detalii noduri BA (armare, etrieri, înnădiri).  
5. Dimensionare talpi/radier + retenție subsol.  
6. Soluție calculată pe **east_landing_span**.  
7. Fit calculat grindă întoarsă + pier.  
8. Acoperiș: tip sistem + legături la cadre.  
9. Geotehnic + NP112.  
10. P118 vecinătate N (~20 cm).

---

## E. Priorități (ordine)

1. ~~Curățare view Structură~~ (făcut)  
2. **east_landing_span** — soluție (pier S+P / grindă / placă) + schiță calcul  
3. **Grindă întoarsă** — secțiune cotată + pier  
4. **Placă living 15 cm** — verificare 2D  
5. Brief structurist cu acest audit + overlay 36/37  

---

## Surse

- `data/building/v47_a1_frame_study.json`  
- `viewer/data/volume_v47_a1_frame.json` + `viewer/index.html`  
- `outputs/reports/v47_a1_frame_structure_audit_v02.md` (geometric anterior)  
- Overlay/secțiuni: `36_…`, `37_…`
