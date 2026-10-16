# Ordine de lucru: geometrie anvelopă + FF → apoi calcule structură

**Status:** LOCK proces · 2026-10-16  
**Motiv:** Calcule FE pe geometrie greșită (pereți, cote FF, grinzi) = timp pierdut.

## 1. Când facem calculele?

**Nu acum** ca livrabil final.  
**Da**, imediat **după** ce închidem:

1. **Pereții termici** unde ai spus (L la palier E; fațadă stradă P) — vizibili corect în view  
2. **Cotele FF** (teren → trepte → terasă / palier P / interior) — un singur sistem de cote  
3. **Traseul grinzilor** față de living (întoarse / în afara camerei) ca să respectăm **255**  

Apoi FE pe schema reală, cu prioritate:
- consolă B_E + placă palier  
- colțuri / deschideri fără stâlp  
- centuri care nu închid perimetrul  
- placă 15 (țintă clear 255)  
- grinzi vs 255 în garsoniere  

## 2. FF +48 cm — LOCK (3 ridicări)

| Cotă | Valoare | Sens |
|------|---------|------|
| Teren / alee (referință) | **0** | |
| `entry_steps` | **2 trepte** mesh (+16, +32) | `acces_treapta_0/1` · dy 60 |
| A 3-a ridicare | pe **palier / terasă** | FF = **+48** (nu a 3-a treaptă galbenă) |
| FF terasă + palier P + interior P | **+48 cm** | 3 × 16 ridicări totale |
| Beci (absolut) | **−250** | neschimbat vs teren |

**Lock:** 2 trepte + ridicare pe palier = FF +48.

## 3. Pereți — ce lipsește / ce trebuie locked (înainte de FE)

### Etaj — palier scară rece (în afara casei încălzite)
- **Nevoie:** anvelopă caldă în **L spre interior** (A6 ~300 mm):  
  - picior **V** (vest scară) — există intenție `buc_est_etaj` A6  
  - picior **N** (pe muchia palier Y470, spre living/camere) — **de confirmat / adăugat** dacă lipsește din view  
- Jos = living încălzit (aceeași placă); sus = circulație rece — deci L-ul e critic termic, nu doar „desen”.

### Parter — fațadă spre stradă
- Peretele **exterior izolat** pe direcția stradă (catalog A1/A2) trebuie să apară corect în view-uri (straturi, nu doar volum gri).  
- Separat: separator casă↔scară (A6) pe P unde e cazul.

**Regulă:** până pereții ăștia sunt cotăți și văzuți corect → **nu** începem FE „definitiv”.

## 4. Checklist scurt

- [x] FF = **+48** (3 ridicări × 16)  
- [ ] Lock geometrie L A6 la palier etaj + verificare view  
- [ ] Lock / corecție perete stradă P în view (straturi A1/A2)  
- [ ] Traseu grinzi vs clear 255 în garsoniere  
- [ ] Abia apoi: pachet calcul (consolă, colțuri, centuri deschise, placă 15)
