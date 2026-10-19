# S1 A1 — Select pack (viewer V3 / V4)

**Fișier:** `viewer/data/a1_select_v01.json`  
**Generat:** 2026-10-19T19:30:28.338Z

## Util
- Parter **38.5951** m² · Etaj **37.1366** m² (țintă 37)

## Gol ≠ trecere (mismatch)
- **dorm_terasa**: gol 150 · trecere 140
- **intrare_parter**: gol 100 · trecere 90
- **intrare_etaj**: gol 100 · trecere 88
- **buc_terasa_etaj**: gol 90 · trecere 78

## Sit (A1.198)
- auto Cloșca · pietonal Dragalina → alee → scări → beci
- Apă: pantă curte + put_reten — REZERVĂ
- hotar CF ≠ gard; limit_* = zid casă E/N
- Plan: `outputs/plans/a1_plan_situatie.svg`

## Avertismente
- [MED] Scară P–E: clear A6→E 104.5 cm; la C_E_LAMELE 95.7 cm (nu eticheta doar 100).
- [MED] intrare_etaj: gol construcție 100 cm · trecere liberă 88 cm (toc+mâner) — nu declara ușă 100.
- [LOW] Util etaj 37.1366 m² — rezervă peste 37 ≈ 0.137 m² (ghene sensibile).
- [INFO] Beci: clear sub placă/grindă S 220 cm (A1.194 flush).
- [INFO] Talpă 115 inward desen ≠ calc heel+umplutură — rundă fundații deschisă.
- [INFO] Hotar CF ≠ gard construit (limit_* pe E/N = zid casă; gard V+Cloșca+Dragalina S).
- [INFO] Acces: auto Cloșca · pietonal Dragalina→alee→scări→beci. Apă curte/put_reten = REZERVĂ (nu hidraulic).
