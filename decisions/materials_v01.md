# Materiale pe ansambluri — locked 2026-10-16

**Status:** CONFIRMAT ca țintă de proiect (furnizori / SKU). Cantități + buget = următorul pas (BOM).  
**Catalog grosimi:** `decisions/assemblies_catalog_v01.md` · `data/building/assemblies_v01.json`.

---

## Decizie pe scurt

| Rol | Alegere | De ce |
|---|---|---|
| **Klinker E/S + gard** | **Ströher Riegel 50** · LF **490×40** · **silver-grau used look** | A1.131: **nu** pe N/V (acolo A1 tencuială) |
| **ETICS (vată + ceramic / tencuială)** | **Weber webertherm CERAMIC PREMIUM** (vată) pe zone klinker; același ecosistem Weber pe zone tencuite | ETA ceramic + disponibil RO; se potrivește cu **ISOVER FASSADE** (Saint-Gobain) deja în sandwich |
| **Vată fațadă** | **ISOVER FASSADE 80** | Locked în A1–A3 / A6 |
| **Umplutură necarrantă** | **EB20 Akustik 200** | Locked |
| **Interior camere A7** | **Knauf W112** · CW **75** · **2×12,5** GKB / față · vată fono | Gabarit finit **125 mm** = lock A7 |
| **Interior baie A8** | **Knauf W112** + **GKBI** pe fața umedă + faianță | Gabarit **150 mm** |

---

## 1. Klinker — Ströher Riegel 50

| | |
|---|---|
| Produs | Ströher **Riegel 50** clinker brick slips |
| Format | **LF 490 × 40 mm** (grosime placă tipică ~10–14 mm + adeziv → buget **15 mm** în A2) |
| Culoare | **silver-grau used look** |
| Unde | E Dragalina · S Cloșca · gard trotuar (A2 / A4 ext / A10) |
| Nu | **Nord + Vest** încălzit (A1 tencuială) · baie N/V (A3_N) · nișe / parapete tencuite |

**POT:** anvelopa finită cu A2 = **312 mm** pe E/S/V (Δ +13 mm vs A1 299). EST pe limită — Δ e în afara feței EB20, deja în modelul 682,6 × 861,3. Nu se adaugă încă un cm peste A2.

Link produs (catalog): https://www.stroeher.com/products/clinker-brick-slips/riegel-50

---

## 2. ETICS — Weber (recomandare locked)

**Nu** „vată oarecare + klinker lipit”. Sistem certificat **ceramic**.

| Zonă | Sistem Weber (referință documentare) | Finisaj |
|---|---|---|
| A2 / A3-K (klinker) | **webertherm CERAMIC PREMIUM** pe vată minerală | adeziv sistem + Ströher pe strat armat |
| A1 / A3-N (tencuială) | același nucleu webertherm / vată ISOVER 80 | grund + tencuială decorativă Weber |
| A6 (spre scară) | nucleu vată ca A1, fără klinker | tencuială pe fața scării |

Componente tipice (de confirmat pe fișa ETA actuală la ofertă):
1. adeziv lipire vată (Weber)
2. ISOVER FASSADE 80
3. dibluri sistem
4. masă de șpaclu + plasă (strat armat)
5a. **ceramic:** adeziv flexibil + placaj Ströher + chit rost  
5b. **tencuială:** grund + decorativă

**De ce Weber, nu alt brand:** acoperire RO + fișă ceramic pe vată + lanț Saint-Gobain cu ISOVER deja ales. Baumit / Caparol rămân plan B doar dacă oferta Weber e greu de făcut pe Ströher.

---

## 3. A7 — Knauf W112 @ 125 mm

| | |
|---|---|
| Sistem | **Knauf W112** (o singură orditură, dublu GK / față) |
| Montanți | **CW 75** @ ≤625 mm |
| Plăci | **2 × 12,5 mm GKB** fiecare față |
| Umplutură | vată minerală fono (cavitate 75 mm plină) |
| **Total finit** | **12,5+12,5 + 75 + 12,5+12,5 = 125 mm** |

Echivalent acustic tipic W112/CW75 ~53–55 dB (fișa sistem — de atașat la proiect).  
**Nu BCA.** Bandă TV / pocket = A9 (125 bază, 150 local).

---

## 4. A8 — baie pe W112

Același W112, pe fața baie: **GKBI + hidro + adeziv + faianță** → lock **150 mm**.  
Duș: membrană full height.

---

## 5. Mapare rapidă ID → material

| ID | Material dominant |
|---|---|
| A1 | EB20 + ISOVER 80 + **Weber** tencuială |
| A2 | EB20 + ISOVER 80 + **Weber ceramic** + **Ströher Riegel 50** |
| A3-N / A3-K | A1 / A2 + faianță int. |
| A4 | miez + Ströher pe ext. scară (fără vată 80) |
| A5 | parapet tencuit (nu klinker) |
| A6 | ca A1 spre scară; tencuială pe scară; **300 mm** |
| A7 | **Knauf W112** 125 |
| A8 | W112 + faianță 150 |
| A10 | Ströher 2 fețe pe miez |
| A11 / A12 | BA + hidro / soclu hidrofob |

---

## 6. Următorul pas (BOM)

Cantități mp + colțare + buget pe: Ströher, Weber (kit), ISOVER, EB20, Knauf W112 (profile + plăci + vată), faianță.  
Nu în acest commit — după regen volume + goluri.
