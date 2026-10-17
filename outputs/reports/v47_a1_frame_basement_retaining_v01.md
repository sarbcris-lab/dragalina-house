# V47 A1 FRAME — Retenție subsol BA (geo)

**Status:** geometrie LOCK · calcul împingere **deschis**  
**Dată:** 2026-10-16

## Ce s-a schimbat

| Înainte | Acum |
|---------|------|
| Contur subsol = „umplutură” EB20 (layer +Pereți) | Contur = **BA 20 cm** (`site_layer: structura`) |
| `basement_retaining` = conflict_geometric | `rezolvat_geometric` · `calcul_lipsă` pe împingere/talpă |

## Mesh-uri

- `subsol_reten_ba_n` / `_w` / `_s_dep` / `_s_hol` / `_hol_vest_reintrant` / `_ct_est`
- Partiții: `subsol_zid_ct_sud_*`, `subsol_zid_dep_hol_*` — **umplutură** 12,5

## Rămâne calcul

- Împingere pământ + hidro (geo 131)
- Talpă / radier vs FG actuale
- XPS / hidro pe față exterioară retenție
- Grosime 20 vs 25 dacă FE cere

## Bandă placă (legat, neactivată)

Opțiune `B_BAND_N_MID_S_DORM_STUDY` în conflict `slab_span_without_X320` — **nu** în `beams[]` până la FE.
