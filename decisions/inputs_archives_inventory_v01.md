# Inventar arhive `inputs/` — v01

**Data:** 2026-10-16  
**Extrase în:** `inputs/_extracted/<nume-arhiva>/`  
**Originale:** neschimbate (nu șterse)  
**Commit:** nu (doar inventar)

---

## Rezumat rapid (arhivă → ce e → util pentru 131?)

| Arhivă | Ce este | Parcelă / proiect | Util pentru **131**? |
|--------|---------|-------------------|----------------------|
| `27.11.2012.rar` | 15 JPG randări / wireframe concept (27.11.2012) | **120** (epocă Casa Cristina / Sârb) | **Nu** ca geo; doar vizual istoric |
| `casa cristina.rar` | EXE ArchiCAD Virtual Building Explorer (`ENVCASA CRISTINA.pln`) | **120** (arhitectură) | **Nu** (viewer 3D, fără PDF/DWG) |
| `casa cristina2.rar` | Același tip EXE (`CASA CRISTINA v14 31.01.2013.pln`) | **120** | **Nu** (variantă 31.01.2013) |
| `CASA SARB FAZA PTH_FORMAT ELECTRONIC.rar` | PTH rezistență complet (parte scrisă + A3/A4) | **Dragalina 120** (Paul Sârb) | **Da — reper vecinătate** (geo citat + structură 120) |
| `PREDARE INTERMEDIARA FAZA PTH.rar` | PTH intermediara rezistență (memoriu + planșe Rf/Rs) | **Dragalina 120** (demolare + construire) | **Da — reper vecinătate** (fundații / armări detaliate) |
| `dosar PT Aprilie2.rar` | Planșe arhitectură DTAC/PT (PDF) | **Dragalina 120** (arh. Ferencz Bakos) | **Parțial** — geometrie vecin / sit 120, nu proiect 131 |
| `PT Arhitectura - Draft.rar` | Draft PT arhitectură (PDF + DWG ArchiCAD) | **Dragalina 120** | **Parțial** — același proiect 120, cotă DWG utilă ca referință vecin |
| `redemolare.zip` | 6 JPG randări casă modernă (nu foto demolare teren) | **120** (vizual / „demolare+construire”) | **Nu** ca dovadă demolare **131**; nu geo |

**Concluzie:** Nu apare documentație de proiect sau studiu geo dedicată **Dragalina 131**. Tot ce e identificabil e pachetul **Casa Sârb / Dragalina 120** (2012–2013). Pentru 131 rămâne util ca **vecinătate** (mai ales memoriul de rezistență cu citare EMDI).

---

## 1. `27.11.2012.rar`

| Tip | Fișiere |
|-----|---------|
| JPG | `1.jpg`…`6.jpg`, `c1.jpg`…`c9.jpg` (15) |

- Conținut: randări / wireframe casă modernă P+1 + anexă, nu fișe foraj.
- Data numelui = 27.11.2012 (apropiat de EMDI oct. 2012), dar **nu** e studiul geotehnic.
- Clasificare: arhitectură concept **120**.

---

## 2–3. `casa cristina.rar` / `casa cristina2.rar`

| Tip | Fișiere |
|-----|---------|
| EXE | `casa cristina.exe` (~12 MB fiecare) |

- Nu se deschid ca arhivă; sunt **ArchiCAD Virtual Building Explorer**.
- Stringuri: `ENVCASA CRISTINA.pln` / `ENVCASA CRISTINA v14 31.01.2013.pln`.
- Fără PDF/DWG/DOC extrase.
- Clasificare: model 3D arhitectură **Casa Cristina = proiect 120**.

---

## 4. `CASA SARB FAZA PTH_FORMAT ELECTRONIC.rar` — **sursă cheie 120**

Cale: `_extracted/CASA SARB FAZA PTH_FORMAT ELECTRONIC/CASA SARB FAZA PTH_FORMAT ELECTRONIC/`

| Fișier | Tip |
|--------|-----|
| `PARTE SCRISA FAZA PTH CASA SARB_TURDA.pdf` | PDF (61 p.) — memoriu + caiete |
| `PARTE DESENATA A3_CASA SARB TURDA.pdf` | PDF planșe A3 |
| `PARTE DESENATA A4_CASA SARB TURDA.pdf` | PDF planșe A4 |

- Titlu: *Construire Casă Unifamilială P+1E, Garaj* — **Mun. Turda, str. Gen. Dragalina, nr. 120** — **aprilie 2013** — Gorgo Construct / ing. Paul Vultur.
- Beneficiar în documentație: **Paul Sârb**.

### Numere geo / structură (text extras din parte scrisă)

| Parametru | Valoare în memoriu |
|-----------|-------------------|
| Studiu geo | **SC EMDI SRL**, octombrie 2012 (citat; **PDF EMDI original absent** în arhive) |
| Foraje | S1, S2 |
| Stratificare S1 | 0…−1,10 m sol vegetal; −1,10…−1,65 m argilă neagră nisipoasă |
| Stratificare S2 | 0…−1,15 m sol vegetal; −1,15…−1,70 m argilă neagră nisipoasă |
| Strat bun fundare | argilă neagră nisipoasă |
| Adâncime fundare recomandată | **D = 1,15 m** sub TN |
| **Pconv.** | **310 kPa** |
| Îngheț (STAS 6054) | 0,90 m |
| Apă subterană (2012) | neîntâlnită |
| Tălpi continue | **50 × 70 cm**, beton simplu **C8/10** |
| Cota fundare proiectată | **−1,88 m** față de ±0,00; **−1,35 m** față de CTN (CTN=−0,53 m) |
| Socluri BA | h = 1,10 m; centuri 20 cm |
| Suprastructură | zidărie 25 cm + **stâlpișori / centuri 25×25 cm** |
| Planșeu peste parter | **13 cm** |
| Betoane | fundații C8/10; soclu/placă pe sol C12/15; grinzi/centuri/planșee **C16/20** |

Aliniat cu `decisions/geotech_hypothesis_v01.md` (reper vecinătate 120).

---

## 5. `PREDARE INTERMEDIARA FAZA PTH.rar` — **planșe structură 120**

Cale: `_extracted/PREDARE INTERMEDIARA FAZA PTH/PREDARE INTERMEDIARA FAZA PTH/`

| Fișier cheie | Tip |
|--------------|-----|
| `PARTE SCRISA FAZA PTH INTERMEDIAR CASA SARB.pdf` | PDF (57 p.) — martie 2013, *Demolare construcție existentă; Construire… nr. 120* |
| `PARTE DESENATA/GGO_PSTUR_Rf.01.101_*_PLAN FUNDATII.pdf` | PDF (scan — fără text extractibil) |
| `…Rf.03.101_*_DETALII SI SECTIUNI FUNDATII.pdf` | PDF |
| `…Rs.01.101_*_PLAN COFRAJ PLANSEU…` … `Rs.03.210_*` | PDF armări grinzi / secțiuni / șarpantă |

- Același amplasament **120**; fază intermediară cu borderou planșe GGO_PSTUR.
- Planșele fundații/armări = desene scanate (OCR necesar pentru cote din planșă).

---

## 6. `dosar PT Aprilie2.rar` — arhitectură 120 (PDF)

Cale: `_extracted/dosar PT Aprilie2/dosar PT Aprilie/`

| Planșă | Fișier |
|--------|--------|
| Situație | `A02 Plan de situatie .pdf` |
| Parter / Etaj / Învelitoare | `A03`…`A05` |
| Secțiuni | `A06`…`A09` |
| Fațade | `A10`…`A14` |
| Împrejmuire / șantier / trasare | `A15`…`A17` |

- Antet: **arh. Ferencz Bakos**, proiect **010/2012**, fază DTAC, **22.04.2013**.
- *CONSTRUIRE CASA UNIFAMILIALA P+1E si GARAJ — str. Dragalina, nr. 120*.
- Sit: S(S)≈510 m²; casă Sconstr≈145 m²; garaj ≈39 m² (din plan situație).

---

## 7. `PT Arhitectura - Draft.rar` — draft PT arhitectură 120 (PDF+DWG)

Structură: `Planuri/`, `Fatade/`, `Sectiuni/` — fiecare cu PDF + DWG (+ Xref ArchiCAD).

| Cheie PDF | Cheie DWG |
|-----------|-----------|
| `A.01 Plan parter.PDF` | `A.01 Plan parter.DWG` (+ xref ~1 MB) |
| `A.02 Plan etaj.PDF` | `A.02 Plan etaj.DWG` |
| `A.03 Plan invelitoare.PDF` | `A.03…` |
| `A.04`/`A.05` fațade | DWG aferente |
| `A.06`…`A.08` secțiuni | DWG aferente |

- Proiect **010/2012**, fază **PT**, **11.03.2013**, *P+1E, GARAJ SI ATELIER*, **Dragalina 120**.
- Clasificare: arhitectură **120**, nu 131.

---

## 8. `redemolare.zip`

| Tip | Fișiere |
|-----|---------|
| JPG | `01.jpg`…`06.jpg` |

- Conținut verificat: **randări 3D** casă modernă / împrejmuire — **nu** fotografii de șantier demolare pe **131**.
- Numele arhivei sugerează legătura cu titlul PTH „Demolare construcție existentă…” de pe **120**.
- Pentru demolare **131**: **neutil** ca dovadă teren; eventual doar vizual.

---

## Clasificare pe teme

| Temă | Arhive / fișiere |
|------|------------------|
| **Dragalina 120 / Casa Sârb / vecinătate** | CASA SARB PTH, PREDARE INTERMEDIARA, dosar PT Aprilie2, PT Arhitectura Draft, Casa Cristina EXE, 27.11.2012 |
| **131 / proiect curent** | *nimic dedicat în aceste arhive* |
| **Demolare 131** | *nimic* (redemolare = randări, nu sit 131) |
| **Geo / structură PDF cu numere** | `PARTE SCRISA FAZA PTH CASA SARB_TURDA.pdf` (+ intermediara, aceleași cifre) |
| **EMDI original** | **lipsă** |

---

## Note operaționale

- Extracție: 7-Zip portable (instalarea system 7-Zip nu era disponibilă); unelte temporare sub `inputs/_tools/` (opțional de ignorat / șters).
- Desene Rf/Rs din predare = scan; cote din planșă necesită OCR sau citire vizuală.
- Viewer-ele Casa Cristina necesită rulare Windows + dependențe ArchiCAD VBE — nu inventariate ca surse cote.
