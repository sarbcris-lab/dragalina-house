# V47 — baseline și surse

## Git
Repository-ul local **nu are `.git`** în `C:\dragalina-house` — nu există commit de raportat. Inventarul s-a făcut pe fișiere + `meta`.

## Baseline confirmat (înainte de V47)
| Fișier | Rol | Status |
|--------|-----|--------|
| `data/building/v46_exact.json` | model 2D canonic r7g | **rev 7**, `GEOMETRIE_V46_REV7`, `etaj_frozen`, `note_rev7g` — **neatins** |
| `data/building/footprint_v01.json` | amplasare/parcelă | sursă; copie `footprint_v47.json` |
| `outputs/plans/04_volume_concept_v01.json` | 3D V46 | generat; **neatins** de V47 |
| `src/build_v46_3d.mjs` / `export_v46_docs.mjs` | pipeline V46 | **neatins** |
| Planșe `11`–`15` V46 | generate din V46 | păstrate |

Landmark-uri tip `(4).json` / `(7).json` = sufixe Windows; în repo sunt fără sufix.

## V47 = copie + modificare
Sursă: copie r7g → `data/building/v47_exact.json` → `npm run build:v47`.  
Planșele V47 se generează din geometrie, **nu** prin editare manuală SVG.
