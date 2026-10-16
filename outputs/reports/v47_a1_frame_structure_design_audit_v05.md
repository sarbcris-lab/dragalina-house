# Audit structură FRAME — v05 (corecție v04 + geometrie regenerabilă)

**Status:** NECONSTRUIBIL · NEVALIDAT  
**Bază:** feedback pe cf04740 + v04 · generator `study_v47_frame_schema.mjs` sursa de adevăr  
**Geo:** `decisions/geotech_hypothesis_v01.md` (ipoteză vecinătate, nu studiu 131)

---

## Corecții față de v04 (acceptate)

| Afirmație v04 | Verdict v05 |
|---|---|
| „Trebuie placă 25–28 cm” / „15 și 20 SLS fail” | **RESPINS ca demonstrație.** L/d = semnal → **calcul lipsă**. 15 = risc/de verificat; 20 = de verificat, nu respinsă; 25–28 = alternativă de comparat. **Nu schimbăm grosimea acum.** |
| „Stâlpișori plutitori, fără grindă” | **Corectat:** contact geometric parțial la +581 cu grinzi. Rămân: excentricitate, capacitate, căpriori E, BA vs șarpantă ușoară. |
| ~250 kPa ⇒ fundații subdimensionate | **Nu demonstrează singur.** Compară cu teren+soluție reală; Pconv 310 kPa = doar reper 120. |
| Ridicare pe `C_E_GEAM_S` | **Scenariu de verificat**, nu rezultat demonstrat. |

---

## Registru unic (status)

| ID | Status registru | Note |
|---|---|---|
| `east_landing_span` | **calcul_lipsă** | Consolă B_E Y489→**590** (nu 600 — fără intersect treaptă). Schema OK geometric. |
| `palier_plate_support` | **calcul_lipsă** | Living P / rece E; o placă BA + pachet fono separat |
| `slab_span_without_X320` | **calcul_lipsă** | Compară 15/20 pe schemă reală cu săgeți; fără adoptare 25–28 |
| `inverted_beam_fit` | **conflict_geometric** | Capăt V slab |
| `basement_retaining` | **conflict_geometric** | EB20 ≠ retenție; demolare integrală → BA nou |
| `roof_load_path` | **calcul_lipsă** | Contact parțial OK; căpriori E completați în generator; BA vs ușoară |
| `foundations_width` | **calcul_lipsă** | FG = lățime grindă preliminar |
| `etics_wrap_verify` / `B_X360_wide_pad` | **conflict_geometric** | Bandă ETICS / dx=70 |
| `amenajare_frame_overlays` | **rezolvat_geometric** | |
| Poartă în Structură / reframing sit | **rezolvat_geometric** | v04 |
| `B_Y470` la planșeu | **rezolvat_geometric** | în **generator** levels P |
| Dublură placă palier | **rezolvat_geometric** | gol în `etaj_placa` + `palier_superior_placa` |
| Vanguri rampă2 verticale | **rezolvat_geometric** | mesh înclinat |
| Vizibilitate stâlpi P/E | **rezolvat_geometric** | `continuousObjs` o decizie |
| `palier_superior_placa` în Structură | **rezolvat_geometric** | inclus; finisaj exclus |
| Regenerare șterge B_E / B_Y470 | **rezolvat_geometric** | fix în `study_v47_frame_schema.mjs` |
| Verificat prin calcul (placă/nod/retenție/fundații) | — | **niciunul încă** |

---

## Geometrie locked în generator (după `npm run study:frame`)

| Element | Valoare |
|---|---|
| `B_E` | y=9.2 → **Y590** · consolă **101 cm** din C_E_PAL · fără stâlp |
| `B_Y470` | levels **`["P"]`** (planșeu, nu streșină) |
| Rampă2 | vanguri **înclinate** |
| Căpriori | completați spre **X est** |
| Placă palier | fără dublură beton față de planșeu principal |

---

## Placă — poziție proiect

| Variantă | Clear @ FF288 | Poziție |
|---|---:|---|
| 15 cm | 255 | Risc deformare — **necesită calcul** |
| 20 cm | 250 | **De verificat**, nu respinsă |
| 25 / 28 cm | 245 / 242 | Alternativă de comparat |
| Bandă / PT | — | Nu prioritizăm înaintea convenționalului |

---

## Geo / fundații

Demolare integrală 131. Ipoteză vecinătate 120 (Pconv 310 kPa, argilă ~1,1 m).  
Subsol păstrat în studiu. Retenție BA + variante radier/tălpi = deschise. Nu copia 50 cm de la 120.

---

## Următorii pași

1. Regresie: `study:frame` → verifică B_E@590 + B_Y470@P  
2. FE placă 15 vs 20 (săgeți + limite) — sau marchează explicit calcul lipsă  
3. Nod consolă B_E + grindă întoarsă V  
4. Retenție BA + variante fundație cu presiuni afișate  
5. Șarpantă ușoară vs BA (comparție)
