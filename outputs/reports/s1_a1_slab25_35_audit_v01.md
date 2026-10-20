# Audit placă 25 / 35 cm vs stâlp colț terasă

**Status:** audit_ordin — NU proiect semnat  
**Generat:** 2026-10-20T10:31:54

> Consolă ~**2.92 m** sud / **3.05 m** vest. Criterii: μ&lt;0.25, δ≤L/180, L/d≤10, forfecare.

---

## VERDICT

| Întrebare | Răspuns |
|-----------|---------|
| **Placă 25 — mai e nevoie de C_SW?** | Placă 25 consolă pură pe ~2,9–3,0 m: FAIL (L/d și/sau δ). Stâlpul SAU grinzi L rămân necesare. |
| **Placă 35 — mai e nevoie de C_SW?** | Placă 35 consolă pură: PASS pe ordin pe ambele direcții — C_SW + eventual B_W/B_S pot ieși (FE acoperiș + nod). |
| **25 + L-grinzi fără stâlp** | Placă 25 + L-grinzi 30×40 fără C_SW: pe ordin ca la studiu anterior (etrieri pe B_S) — stâlpul poate ieși; grinzile rămân. |
| **Clear 255** | Placă +10/+20 cm lovește clear 255 sau ridică FF→FF — HARD lock A1.180. Fără debate pe clear, 35 pe toată casa e scumpă. |
| **Alte elemente care dispar?** | Vezi §4 — majoritatea **NU** (doar C_SW ± grinzi contur terasă). |
| **Recomandare** | Dacă obiectivul e DOAR fără C_SW: (A) păstrează placă 15 + stâlp (A1.212) SAU (B) placă 15 + L-grinzi fără stâlp + FE acoperiș SAU (C) placă locală terasă 25–30 cu grinzi + FE — nu neapărat 35 global. 35 consolă pură = tehnic pe ordin, conflict clear/cost. Alte stâlpi de cadru (intrare, dorm, mid, casa scară, lamă S2) NU dispar din cauza plăcii terasă. |

---

## 1. Consolă pură (fără stâlp, fără grinzi contur)

### Sud L=2.918 m
| h | q_Ed | M | L/d | δ/lim180 | pass |
|---|------|---|-----|----------|------|
| 15 | 12.68 | 54 | 23.3 | 27.6/16.2 | **FAIL** |
| 20 | 14.37 | 61.2 | 16.7 | 12.1/16.2 | **FAIL** |
| 25 | 16.06 | 68.4 | 13 | 6.7/16.2 | **FAIL** |
| 30 | 17.74 | 75.5 | 10.6 | 4.2/16.2 | **FAIL** |
| 35 | 19.43 | 82.7 | 9 | 2.8/16.2 | **PASS** |

### Vest L=3.045 m
| h | q_Ed | M | L/d | δ/lim180 | pass |
|---|------|---|-----|----------|------|
| 15 | 12.68 | 58.8 | 24.4 | 32.7/16.9 | **FAIL** |
| 20 | 14.37 | 66.6 | 17.4 | 14.4/16.9 | **FAIL** |
| 25 | 16.06 | 74.4 | 13.5 | 7.9/16.9 | **FAIL** |
| 30 | 17.74 | 82.3 | 11.1 | 5/16.9 | **FAIL** |
| 35 | 19.43 | 90.1 | 9.4 | 3.4/16.9 | **PASS** |

---

## 2. Fără C_SW dar cu L-grinzi 30×40 + placă pe panou

| h placă | B_W cant | B_S cant | panou | |
|---------|----------|----------|-------|--|
| 15 | PASS M=26.5 | PASS M=95.4 | PASS |
| 25 | PASS M=32.1 | PASS M=115.4 | PASS |
| 35 | PASS M=37.6 | FAIL M=135.5 | PASS |

---

## 3. Impact clear / FF (lock A1.180)

| h | Δ vs 15 | clear sub placă dacă cobori sofit | FF→FF dacă păstrezi clear |
|---|---------|-----------------------------------|---------------------------|
| 25 | +10 | 270 cm | 317 cm (+10 H) |
| 35 | +20 | 260 cm | 327 cm (+20 H) |

---

## 4. Elemente care „încurcă” — ce poate dispărea?

| Element | Enervează | @ placă 25 | @ placă 35 | Păstrează dacă |
|---------|-----------|------------|------------|----------------|
| C_SW_TERASA | vizual colț; fundație fără S | încă necesar SAU grinzi L | POATE DISPARE (placă consolă) | acoperiș pe colț fără alt reazem; zid vest pe stâlp (A1.212) |
| B_W_TERASA / B_S_TERASA | drop sub sofit / vizual | RĂMÂN ca L (consolă) — esențiale fără stâlp @25 | pot DISPARE dacă placă 35 consolă + FE (sau rămân ca bordură mică) | placă 15–25 fără stâlp |
| C_S_INTRARE_W | în circulație terasă/intrare | — | NU dispare ușor — B_X_MID + B_Y820 + acoperiș/intrare | cadru principal sud |
| C_S_DORM_E | lângă ușă terasă | — | NU — B_Y645 + B_X_MID | cutie încălzită |
| C_W_DORM | pe fațadă V | — | NU — B_W + B_Y645; reazem nord consolă terasă | întotdeauna pe cutie |
| B_X_MID | poate trece peste living/buc | cu placă 25 pe casă, span ~3–3,5 m încă vrea axă sau grinzi; NU dispare doar din terasă | posibil span mai mare — FE; tot nu e legat de C_SW | cutie 5×8 m |
| B_E_S lamă S2 15 | clear scară (deja rezolvat ca lamă) | NU dispare — lock look A1.210; nu e stâlp în clear | NU dispare — lock look A1.210; nu e stâlp în clear | — |
| C_CASA_SCARA | lângă ușă etaj | NU dispare — scară + A6 | NU dispare — scară + A6 | — |
| B_Y_EDGE_INVERTED | sub palier | NU dispare din placă terasă — alt sistem | NU dispare din placă terasă — alt sistem | — |
| C_E_LAMELE | era în clear | DEJA SCOAS din cadru (A1.210 S2) | DEJA SCOAS din cadru (A1.210 S2) | — |

---

## 5. Pachet debate

1. **Nu schimba acum** clear 255 / A1.212 stâlp+zid fără decizie explicită.
2. Dacă vrei **fără C_SW**: alege (B) L-grinzi + placă 15–25 local terasă + FE acoperiș — nu forța 35 pe toată casa.
3. **Nu scoate** C_S_INTRARE_*, C_W_DORM, C_S_DORM_E, C_CASA_SCARA, B_X_MID, lamă S2 doar pentru „placă mai groasă pe terasă”.
4. FE obligatoriu pe consolă / nod acoperiș înainte de buildable.

*Script: `src/calc_a1_slab25_35_audit_v01.mjs`*
