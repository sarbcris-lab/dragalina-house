# Lock structural palier / colț L / centură — v01

**Status:** APROBAT + IMPLEMENTAT ca **LOCK-1R** (2026-10-16)  
**Surse:** `v47_a1_frame_study.json`, audit v02/v04, q_Ed=11,78 kN/m²

## Constraintă de spațiu (decisă)

Pe **parter**, banda X536 / Y449–489 e **living deschis** (separatorul `buc_est` începe abia @ Y590).  
**Stâlp `C_L_PAL` acolo = interzis.** LOCK-1 cu stâlp în colțul L e retras.

## LOCK-1R — consolă asumată pe B_E (fără stâlp în living)

| Element | Rol |
|---------|-----|
| **B_E** | → Y590 P+E; reazem est palier + consolă sud 101 cm |
| **B_Y470** | X565–670 (doar pe palier), levels **P+E**, capăt V liber = consolă ~105 cm odată cu placa; `exclude_basement` |
| **C_L_PAL** | **retras** (living P) |
| **B_X535_PAL_N** | **retras** (fără stâlp V nu are reazem) |
| Living sub palier | fără stâlp X565+ |
| Ușă Y500–600 | neatinsă |

### Predimensionare (ordine)

- Placă/bordură consolă L≈1,05 m @ q_Ed=11,78 → M≈6,5 kNm/m; As,min tipic guvernează flexiunea.
- **Decisive pentru proiect:** torsiune + ancorare la nod `C_E_PAL` / `B_E` (calcul, nu alt stâlp în living).

### Ce înseamnă „centură închisă” aici

Nu e un dreptunghi pe 4 stâlpi. E un **T / consolă**: centura E până la Y590 + braț N (`B_Y470`) în consolă. Asta e schema care respectă livingul P.

## LOCK-1 (stâlp colț) — anulat

Anulat de constraintă living P.

## Ce nu se schimbă

Slab 15, FF+48, GEO_X0, palier AFARĂ pe E, fără C_E_LAND_SP.
