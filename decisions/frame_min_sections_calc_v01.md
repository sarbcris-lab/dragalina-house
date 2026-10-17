# Cadre BA — stâlpi & grinzi la minim necesar

**Status:** LOCK proces · 2026-10-16  
**Context:** Continuăm **doar Varianta A** (cadre). Varianta B (diafragme) parcată.

## Semnificație „minim”

| Nu înseamnă | Înseamnă |
|-------------|----------|
| Cea mai mică schiță fără calcul | Cea mai mică secțiune **care trece** ULS/SLS/P100 pe schema reală |
| Grosime diafragmă | **Along / b / h** pe cadre, după FE |
| Sub P100 | Thru stâlp **≥ 30**; grindă **b ≥ 20** |

## Ținte FE (ordine)

1. Stâlpi: start din model; încearcă **along → 30** unde e 40; păstrează 30×30 unde deja e.
2. Nod C_E_PAL + consolă B_E (înainte de „optim” pe restul est).
3. Placă 15.
4. Grinzi: h=35 / b=30 start; reduce b doar dacă nodul și ULS permit (≥20).
5. Restul registrului (întoarsă, FG, acoperiș).

## Input

`outputs/reports/v47_a1_frame_fe_input_pack_v01.md`
