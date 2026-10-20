# Studiu: terasă fără stâlp colț + casa scării

**Status:** studiu_ordin_EC2 — NU proiect semnat  
**Generat:** 2026-10-20T09:59:52  
**Materiale:** C25/30 · B500 · Ecm=31000 MPa  

> Calcule de **ordin** (EC2 flexiune / Vrd,c / săgeată fisurată). Nu înlocuiesc FE / proiect semnat / P100 pe noduri.

---

## VERDICT

| Temă | Rezultat |
|------|----------|
| **Terasă CU `C_SW_TERASA`** | PASS — CU C_SW_TERASA: grinzile B_W / B_S la 30×40 trec pe ordin ULS+SLS (spanuri scurte ~1.4 / ~2.7 m). |
| **Terasă FĂRĂ stâlp @ h=40** | PASS |
| **Terasă FĂRĂ + grinzi adâncite** | PASS pe ordin — h min: {"B_W_TERASA_cant":{"h_cm":25,"pass":true,"M":27.56,"V":38.39,"shear_ok":true},"B_S_TERASA_cant":{"h_cm":35,"pass":true,"M":89.03,"V":65.35,"shear_ok":true}} |
| **Placă consolă pură 15 cm** | FAIL — min h sud ≈ **35 cm**, vest ≈ **35 cm** |
| **Casa scării (acum)** | PASS ordin pe grinzi/stâlpi principali — Casa scării pe schema actuală: B_CASA_SCARA (L≈2.2879999999999994 m), B_Y820, B_S_SE trec pe ordin la 30×40. Lamă B_E_S 15 cm: trece ca grindă îngustă pe criterii flex/SLS. NU e verificare seismică de nod / scară 3D. |
| **Recomandare** | Fără C_SW_TERASA: pe ordin EC2 trece dacă păstrezi B_W+B_S ca L pe contur (30×40) CU etrieri (⌀8/15 min) + armare consolă pe B_S (~4⌀16) + FE pe nodul liber și pe reazem acoperiș (acum pe C_SW). Placă 15 rămâne pe panouri scurte între grinzi — NU consolă pură. Stâlpul rămâne varianta cea mai ieftină/clară (M pe B_S de 4× mai mic). |

### Caveats
- Ordin EC2 pe bare izolate — nu model cadru 3D, nu P100 noduri, nu dinamică scară.
- Încărcări zăpadă / acoperiș / parapet = IPOTEZĂ.
- C_SW fără S: fundație locală / grinzi pe solbanc — calcul separat.
- Lamă S2 B_E_S 15 cm ≠ stâlp P100 — FE perete scurt obligatoriu (open_items).
- declared_buildable = false până la proiectant structură + geo_131.

---

## 1. Geometrie (din `structure_a1_study_cm`)

| Element | Cote |
|---------|------|
| Terasă P bbox | X8 Y674 · 336.4×293 cm |
| C_W_DORM | (10, 645.2) 30×30 |
| C_S_INTRARE_W | (312.5, 818.8) 40×30 |
| C_SW_TERASA | (10, 818.8) 30×30 · levels P+E · **fără S** |
| Clear B_W_TERASA | **1.436 m** |
| Clear B_S_TERASA | **2.725 m** |
| Consolă placă sud (Y dorm→sud terasă) | **2.918 m** |
| Consolă placă vest | **3.045 m** |

---

## 2. Încărcări

| | Valoare |
|--|--|
| Gk placă 15 | 3.75 kN/m² |
| Gk finisaj terasă | 1.2 kN/m² |
| Qk terasă | 4 kN/m² |
| **q_Ed terasă** | **12.68 kN/m²** |
| q_qp (SLS) | 6.15 kN/m² |
| trib W / S | 1.682 / 1.465 m |
| **q pe B_W / B_S** | **26.73 / 23.98 kN/m** (inclus parapet + acoperiș ordin) |

q_Ed terasă = 1.35·(γc·h+finisaj) + 1.5·Qk; pe grindă + parapet + reazem acoperiș (ordin). Zăpadă Turda = IPOTEZĂ.

---

## 3. Terasă — S0 CU stâlp

| id | regim | L[m] | b×h | M[kNm] | V[kN] | As | μ | δ/lim [mm] | |
|----|-------|------|-----|--------|-------|----|---|------------|--|
| B_W_TERASA | simply_supported | 1.436 | 30×40 | 6.89 | 19.19 | 3⌀12 (339 mm²) | μ=0.011 | 0.1/5.7 | **PASS** |
| B_S_TERASA | simply_supported | 2.725 | 30×40 | 22.26 | 32.67 | 3⌀12 (339 mm²) | μ=0.036 | 0.9/10.9 | **PASS** |

---

## 4. Terasă — S1 FĂRĂ stâlp (grinzi consolă @ 40 cm)

M_cant = q L² / 2 (≈ **4×** față de simplu rezemat).

| id | regim | L[m] | b×h | M[kNm] | V[kN] | As | μ | δ/lim [mm] | |
|----|-------|------|-----|--------|-------|----|---|------------|--|
| B_W_TERASA_cant | cantilever | 1.436 | 30×40 | 27.56 | 38.39 | 3⌀12 (339 mm²) | μ=0.045 | 0.8/8 | **PASS** |
| B_S_TERASA_cant | cantilever | 2.725 | 30×40 | 89.03 | 65.35 | 4⌀16 (804 mm²) | μ=0.145 | 8.9/15.1 | **PASS** |

### h minim care trece (pas 5 cm)

| id | h_cm | M | As | δ | pass |
|----|------|---|----|----|------|
| B_W_TERASA_cant | **25** | 27.56 | 4⌀12 (452 mm²) | 4.1/8 | true |
| B_S_TERASA_cant | **35** | 89.03 | 4⌀16 (804 mm²) | 14.1/15.1 | true |

---

## 5. Terasă — S2 placă consolă pură (fără grinzi contur)

Criterii: μ&lt;0.25, V≤Vrd,c, δ≤L/180, L/d≤10.

| id | L | h | M | As | L/d | δ/lim180 | pass |
|----|---|---|---|----|-----|----------|------|
| placa_cant_S_15 | 2.918 | 15 | 53.99 | 4⌀20 (1257 mm²) | 23.3 | 27.6/16.2 | **FAIL** |
| placa_cant_S_20 | 2.918 | 20 | 53.99 | 4⌀16 (804 mm²) | 16.7 | 10.1/16.2 | **FAIL** |
| placa_cant_S_25 | 2.918 | 25 | 53.99 | 4⌀14 (616 mm²) | 13 | 4.7/16.2 | **FAIL** |
| placa_cant_S_30 | 2.918 | 30 | 53.99 | 4⌀14 (616 mm²) | 10.6 | 2.6/16.2 | **FAIL** |
| placa_cant_W_15 | 3.045 | 15 | 58.8 | 4⌀20 (1257 mm²) | 24.4 | 32.7/16.9 | **FAIL** |
| placa_cant_W_20 | 3.045 | 20 | 58.8 | 5⌀16 (1005 mm²) | 17.4 | 11.9/16.9 | **FAIL** |
| placa_cant_W_25 | 3.045 | 25 | 58.8 | 4⌀16 (804 mm²) | 13.5 | 5.6/16.9 | **FAIL** |

**Grosime minimă ordin:** sud **35 cm** · vest **35 cm**.

---

## 6. Terasă — S3 L-grinzi + placă pe panou scurt

Placă între grinzi (L≈1.436 m, h=15): **PASS** · M=3.27 kNm/m · δ=0.2 mm.

Acoperișul pe colțul SW trebuie redirecționat pe B_W/B_S (sau stâlp metalic ascuns) — C_SW era reazem acoperiș (A1.207).

---

## 7. Casa scării — schema actuală

### Geometrie
| | |
|--|--|
| C_CASA_SCARA | (524.3,550) 30×40 · S+P+E |
| C_S_INTRARE_E | (524.3,818.8) |
| Clear B_CASA_SCARA | **2.288 m** |
| Clear B_Y820 | **1.718 m** |
| B_E_S (lamă S2) | L≈**3.988 m** · secțiune **15×…** |
| B_S_SE | L≈**1.257 m** |

### Grinzi

| id | regim | L[m] | b×h | M | V | As | δ/lim | |
|----|-------|------|-----|---|---|----|-------|--|
| B_CASA_SCARA | simply_supported | 2.288 | 30×40 | 12 | 20.98 | 3⌀12 (339 mm²) | μ=0.02 | 0.4/9.2 | **PASS** |
| B_Y820 | simply_supported | 1.718 | 30×40 | 5.95 | 13.86 | 3⌀12 (339 mm²) | μ=0.01 | 0.1/6.9 | **PASS** |
| B_E_S | simply_supported | 3.988 | 15×40 | 31.1 | 31.19 | 3⌀12 (339 mm²) | μ=0.102 | 5.5/16 | **PASS** |
| B_E_S_equiv30 | simply_supported | 3.988 | 30×40 | 31.1 | 31.19 | 3⌀12 (339 mm²) | μ=0.051 | 2.8/16 | **PASS** |
| B_S_SE | simply_supported | 1.257 | 30×40 | 3.09 | 9.83 | 3⌀12 (339 mm²) | μ=0.005 | 0/5 | **PASS** |
| B_E_S | simply_supported | 3.988 | 15×30 | 31.1 | 31.19 | 3⌀12 (339 mm²) | μ=0.199 | 15.2/16 | **PASS** |
| B_Y_EDGE_INVERTED | simply_supported | 0.974 | 25×25 | 1.65 | 6.77 | 3⌀12 (339 mm²) | μ=0.01 | 0.1/3.9 | **PASS** |

### Stâlpi (N ordin)

| id | secțiune | N [kN] | Nrd | util | P100 | |
|----|----------|--------|-----|------|------|--|
| C_CASA_SCARA | 30×40 | 218.2 | 1600 | 0.136 | true | **PASS** |
| C_S_INTRARE_E | 30×30 | 211.4 | 1200 | 0.176 | true | **PASS** |
| C_E_PAL | 30×40 | 218.2 | 1600 | 0.136 | true | **PASS** |
| C_SW_TERASA | 30×30 | 156 | 1200 | 0.13 | true | **PASS** |

---

## 8. Interpretare pe scurt

1. **Stâlpul din colț nu e „obligatoriu legal”**, dar cu **placă 15 + grinzi 40** pe consolă de **~1.4–2.7 m** (și acoperiș pe colț) **consola pe ordin e severă** (M de 4× față de grindă rezemată).
2. **Fără stâlp, varianta realistă pe ordin:** L-grinzi pe contur cu **h adoptat din tabelul minH** + placă 15 pe panouri scurte + **FE pe nodul liber** + traseu încărcare acoperiș.
3. **Placă consolă pură 15 cm: nu.** Trebuie ~**35+ cm** pe direcția lungă — conflict cu FF/clear/etaj.
4. **Casa scării ține pe ordin** pe B_CASA_SCARA / B_Y820 / stâlpi; **lamă 15 (S2)** rămâne **open item FE** (nu e grindă clasică 30).

---

## 9. Pachet debate (pentru implementator — zero patch aici)

- **Accept:** păstrăm C_SW_TERASA ca soluție de referință până la FE; sau
- **Cerere studiu FE:** rundă 1 = consolă L fără C_SW cu h grinzi din minH; rundă 2 = cascție acoperiș.
- **Nu schimba acum:** clear 255, FF, amenajare A1, lamă S2 poziție.
- **Raportează conflict:** dacă h grindă consolă &gt; drop sub sofit / conflict parapet vizual.

*Ref. script: `src/calc_a1_terrace_stair_cantilever_v01.mjs`*
