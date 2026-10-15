# Fațade cărămidă + alcătuire perete — locked 2026-10-15

**Status:** CONFIRMAT ca țintă de proiect. Grosimi finisaj exterior klinker = **ipoteză studiu** (SKU nedecis) — orice +1…2 cm față de anvelopa finită 30 cm **contează la POT / limite**.

Stil vizual: `decisions/style_target_v01.md` (Belgian · Cărămidă + tencuială).  
Secțiune perete: `outputs/plans/35_v47_a1_exterior_wall_section.svg`.  
Sursă straturi: `construction_assemblies.exterior_wall_heated` în `data/building/v47_a1_study.json` (+ frame).

---

## 1. Alcătuire perete exterior încălzit (P/E) — stabilită

**Sistem:** EB20 Akustik 200 + ISOVER FASSADE 80 (ETICS pe vată)  
**Buget finit maxim:** 300 mm (`wall_ext_cm` = 30) · anvelopă **680 × 860 cm** = fața **finită** · fețe interioare neschimbate.

| # | Strat (int → ext) | mm |
|---|-------------------|----|
| 1 | tencuială interioară | 6 |
| 2 | finisare + vopsea | 1 |
| 3 | EB20 Akustik (umplutură neportantă) | 200 |
| 4 | adeziv ETICS | 5 |
| 5 | vată minerală fațadă ISOVER FASSADE | 80 |
| 6 | strat armat | 5 |
| 7a | **sau** grund + tencuială decorativă *(zone tencuite)* | 2 |
| 7b | **sau** adeziv + **placaj klinker** + rost *(zone cărămidă aparentă)* | ~14–23 *(ipoteză; SKU)* |

- Sumă cu 7a: **299 mm** (holaj 1 mm la 300).
- ETICS în afara feței cărămizii EB20: **92 mm** (5+80+5+2) cu tencuială; cu placaj klinker **crește** cu Δ față de 2 mm.
- Structură: beton portant (cadre FRAME studiu); EB20 = umplutură.
- Bandă scară rece (est, X565–680): **fără** ETICS complet — detaliu separat.
- De confirmat: furnizor ETICS „ceramic”, proiectant, structurist. Nu validat structural/termic/acustic.

**Nu:** cărămidă aparentă plină 10–12 cm pe fațadă (sparge gabaritul 30 cm / 680×860).

---

## 2. Unde e cărămidă (placaj klinker pe ETICS)

Orientare: **EST = Dragalina** · **SUD = Cloșca** · **VEST = curte** · **NORD = vecin**.

| Fațadă / element | Finisaj exterior | Note |
|---|---|---|
| **EST** Dragalina — corp încălzit (`est_living`, P+E) | **Cărămidă** pe planele principale | Pe limită — **nu se poate „crește” în afară** fără încălcare; placajul trebuie încadrat în bugetul finit sau compensat în straturi |
| **SUD** Cloșca — corp (`sud_bucatarie`, `dormitor_sud`, volume casă) | **Cărămidă** pe volume principale | Orice +cm spre sud intră în amprentă → **POT** |
| **VEST** curte | **Cărămidă** pe volume principale | Idem spre vest → **POT** |
| **NORD** încălzit (X0–565) + N-sus | **Tencuială** pe tot nordul (N-jos și N-sus) | **CONFIRMAT beneficiar 2026-10-15** — fără klinker pe N; klinker doar E/S/V (`setbacks_neighbors_v01.md`) |
| Nișe, retrageri, parapete balcon / terasă | **Tencuială** (nu klinker) | Belgian: contrast soft, același ton deschis |
| Bandă scară rece (est X565–680) | **Klinker** pe fețele exterioare (ca E) — **fără** ETICS 80 / A2 complet | A4 în `assemblies_catalog_v01.md`; int. volum scară = tencuială |
| Gard / zid trotuar (Cloșca + porțiune stradă) | **Cărămidă** (același limbaj) | Nu neapărat același sandwich termic; zid masiv + placaj |
| Parapete scară / terasă (fără termosistem) | De regulă **tencuială** | Conform stil Belgian |

**Rezumat:** cărămidă pe **toate cele 4 fațade ale corpului încălzit**, pe **volumele principale**; tencuială pe **retrageri / nișe / parapete balcon**.

---

## 3. POT — de ce contează și 2 cm

- Anvelopa modelului **680 × 860 cm** = fața **finită** cu finisaj 7a (tencuială ~2 mm).
- Placaj klinker tipic ~**1–2 cm** (plăci + adeziv) vs 2 mm tencuială ⇒ Δ finit ≈ **+1…2 cm pe față** dacă nu se absorb în bugetul 300 mm.
- **EST (Dragalina):** pe limită — creștere spre stradă / vecin **interzisă**; fie se înlocuiește 7a în bugetul 30 cm (armătură mai grea, eventual compensare), fie se reduce alt strat — **nu** se adaugă în afara anvelopei.
- **SUD / VEST / NORD:** +1…2 cm pe față măresc amprenta construită ⇒ **POT** (și eventual distanțe). Chiar Δ mic trebuie cotat înainte de autorizare.
- Gardul pe trotuar: grosime zid+placaj = element separat de amprenta casei, dar tot pe parcelă.

**Acțiune deschisă:** la alegerea SKU klinker, actualiza `th_mm` finisaj + recalcula dacă anvelopa finită rămâne 680×860 sau trebuie declarat Δ POT.

---

## 4. Explicit out

- Cărămidă aparentă 10–12 cm pe tot perimetrul
- Industrial dark ca țintă (cărămidă închisă + tencuială antracit pe corp)
- Extindere anvelopă „pe nestins” pentru a încăpea klinkerul pe Dragalina
