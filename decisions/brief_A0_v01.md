# Brief A0 — înghețat (Etapa 0)

**Dată:** 2026-10-17  
**Status:** CONFIRMAT beneficiar (restart)  
**Urmează:** Etapa 1 — amplasament pe sit (fără petice V47)

---

## 1. Decizii confirmate

| Temă | Decizie |
|------|---------|
| Teren | **147 m²** (ridicare topo **2011**) — canonic. **172 m²** acte/CF vechi = **eronat, scos**. |
| Subsol | **Necesar.** Forma / aria **nu** sunt prioritate — ies din constrângeri (fundare, retenție, scară, utilități). **Fără** grilă de stâlpi/„amenajare” dedicată subsolului. |
| Amenajare | **Păstrăm** în cea mai mare parte (camere, scară est, terasă, open). |
| Dimensiuni corp | **680 × 860 cm finit** = amprentă / POT **fix** — **fără** pilastri afară. |
| N / V / E / S | Fețe finite **plane** pe conturul 680×860. Exces stâlp/placă vs falie = **în interior** (nu crește POT). |
| Clear | ≥ **255 cm** parter **și** etaj (camere locuit). |
| Trepte | Contratrepă **max 16 cm** (fără lift — normă). |
| Util | ≥ **37 m²** (țintă geometrică / prag informativ). |
| Stil / materiale | Păstrate din proiect (Belgian, EB20, vată 80, klinker) — detaliu în Etapa 3. |
| Structură / FE | Abia Etapa 4, pe A1 înghețat. |
| Mod de lucru | Același proiect **curat**: preluăm doar ce e clar; **fără** lanț de micro-corecții pe același fișier. |

---

## 2. Gabarit + POT — LOCK (actualizat)

**Beneficiar 2026-10-17:** fără pilastri afară — absorbim excesul **în interior**.

| Contur | Definiție | POT |
|--------|-----------|-----|
| **Finit** | **680 × 860 cm** pe toate fețele (plan) | **Singura** amprentă: **58,48 m²** ≈ **39,78%** pe 147 |
| **Beton** | ≤ finit; pe E/S poate fi retras (ETICS în buget); pe N/V **nu** iese din 680×860 | Nu adaugă POT |
| **Util** | Fețe int. — stâlpi pot **proemina în cameră** | Tradeoff acceptat ca să ținem POT |

**Regula A0:** finit = dreptunghi curat. Orice „pilastru” = citire interioară / detaliu, **nu** creștere de amprentă.

---

## 3. Trei contururi (obligatoriu în modelul nou)

Nu mai amestecăm pe un singur dreptunghi:

1. **Finit / POT** = 680 × 860 (identic)  
2. **Beton** ≤ finit (retras pe E/S dacă ETICS; pe N/V tot în 680×860)  
3. **Util** = fețe int. − proem. interioare stâlpi → țintă ≥ 37 m²  

---

## 4. Ce preluăm din V47 (clar) vs ce lăsăm

**Preluăm ca intenție (nu ca mesh petecit):**
- Orientare sit, scară pe est, open P/E, terasă
- Clear ≥255, util ≥37, corp ~680×860
- Materiale / stil Belgian
- Subsol necesar, secundar ca formă
- Cadre BA ca preferință (Etapa 4)

**Nu preluăm ca „adevăr geometric”:**
- 682,6×861,3 (era A2 pe corp — aici corp = **680×860 fix**)
- Lanțul de lock-uri contradictorii pe același JSON
- Stâlpi / grinzi „de subsol” ca prioritate de desen
- Contratrepă 17 (brief nou = **max 16**)

---

## 5. Poartă → Etapa 1 (amplasament)

Checklist înainte de plan situație nou:

- [x] Subsol: necesar, formă liberă  
- [x] Amenajare: păstrată majoritar  
- [x] Corp finit **680×860** · **fără** pilastri afară · exces **în interior**  
- [x] Clear ≥255 · riser ≤16 · util ≥37  
- [x] POT = **58,48 m² / 147 ≈ 39,78%** (fără Δ pilastri)  

**Următorul livrabil agent:** plan situație A0 pe CF + tabel amprentă — **zero** edit pe `study_v47_frame_schema`.
