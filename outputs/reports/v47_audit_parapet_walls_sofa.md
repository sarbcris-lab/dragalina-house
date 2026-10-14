# Audit V47 — parapet / ziduri / canapea

## 1. Canapea parter — GREȘIT
| | Acum | Trebuie (ca etaj) |
|---|---|---|
| gabarit | **80 × 110** | **90 × 170** |
| id | `canapea_p` | același tip ca `canapea` etaj |

## 2. „Ziduri interioare” încă vizibile (transparente)
Nu sunt ziduri full — sunt **goluri desenate ca volume transparente** + soclu:
- `gol_gol_living_sub_palier_p_L0` (opacity 0.5)
- `gol_gol_living_palier_p_L0` (opacity 0.5)
- `soclu_living_palier` (soclu pentru zid etaj, încă pe P)
- `depozit_zid_est_nord` (intră în zona sub palier)

→ pe P trebuie **eliminate din desen**, nu doar „tăiate” ca zid plin.

## 3. Parapet verde — poziție greșită față de mobilier
- Parapet actual: X325 Y770–900 (muchie terasă/scară, dar **gol de mobilier**)
- Mobilier terasă P: `mob_terasa_*` la **X40** (vest) — departe de parapet
- Cerință: parapet **exact pe lângă mobilier**, închide terasa de palier/rampă, **fără** a bloca accesul etaj

→ mobilier pe estul terasei, lipit de parapet; parapet pe muchia est X340; gol sud acces rampă.

## 4. Acțiuni
1. Canapea P = 90×170 (ca etaj), pe est sub/în dreptul palierului
2. Nu mai desena golurile „living_sub/palier” ca extrude transparent pe P
3. Soclu respectă `wall.levels`
4. Parapet + mobilier terasă aliniate pe est
