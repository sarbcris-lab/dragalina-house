# S1 A1 — Runda 1 done (parcelă + acces beci)

**Decizie:** A1.194 · **Generat:** 2026-10-19  
**Scope:** punctele 1–2 din debate (încadrare subterană + acces). **P/E neatins.**

## Rezultat audit

| Check | Înainte | După |
|-------|---------|------|
| Overflow fundații/puț (≥2 cm) | 7 fail · max **40,4** cm | **0 fail** |
| Clear scară vs pier | **74,5** cm (need 100) | pier **scos** · clear **100** |
| Clear beci sub grindă | 195 (h=40 drop) | **220** (grinzi S flush h=15) |
| Uși CT / depozit / magazie | lipseau | **3 goluri** în date + plan + 3D |

Raport detaliat: `s1_a1_r1_parcel_basement_v01.md`

## Ce s-a schimbat

1. **Puț E** clipat la finit **680**: `put_reten_e` ≈ **15,7** cm; `pit.x1` = **664,3**; clear scară **100**.
2. **Tălpi** N/E/S **excentrice spre interior** (`north_eccentric_inward` + east/south) — fără overflow pe poligonul reconstruit.
3. **`C_SHAFT_E_PIER` eliminat**; `B_Y_EDGE_INVERTED` reazemă pe **`put_reten_e`**.
4. **Uși:** `usa_magazie_ct`, `usa_magazie_depozit`, `usa_ct_depozit`.
5. **Grinzi S** în grosimea plăcii (h=15) → clear beci = ținta **220** sub grindă/placă.
6. **Generator:** `build_a1_architecture` **păstrează** `structure_a1_study_cm` + FF **307** la regen; nu mai recreează pierul.

## Explicit NEDREPTĂȚIT / deschis

| Item | Status |
|------|--------|
| Talpă **115** PASS pe calc heel+umplutură | **NU** — desenul e inward; `perimeter_strip_calc_status=NOT_VALIDATED_FOR_DRAWN_GEOMETRY` |
| `put_reten_e` 15,7 cm | FE / hidro — `shaft_east_wall_15_7_FE_ok` |
| Geo 221 pe 131 | tot ipoteză |
| Riser P–E 16,16 · MEP util etaj | runde următoare |
| Variante placă/armare | **nu** în runda 1 |

## Regenerare

```
node src/build_a1_architecture.mjs
node src/build_a1_structure.mjs
node src/build_v47_3d.mjs data/building/v47_a1_study.json viewer/data/volume_a1.json
node src/audit_a1_r1_parcel_basement_v01.mjs
```
