# Arhitectură A1 — studiu (Etapa 2/3)

**Dată:** 2026-10-17  
**Status:** ARH_STUDIU v0.6 — plan A3 cu straturi (EB20 / ISOVER / beton)  
**Brief:** `decisions/brief_A0_v01.md`  
**Sit:** `data/building/a0_site.json`  
**Date:** `data/building/a1_architecture.json`  
**Planuri:** `outputs/plans/a1_plan_parter.svg` · `outputs/plans/a1_plan_etaj.svg`

---

## Înghețat din A0

| | |
|--|--|
| Corp finit | **680 × 860 cm** |
| POT | **39,78%** / 147 |
| Clear / riser | ≥255 / ≤16 |
| Util țintă | ≥37 m² |

## Compartimentare A1.1 (beneficiar)

**Pe plan apar doar:** terasă · dormitor · bucătărie · living · hol · (baie) · scară.

| Cameră | Parter | Etaj |
|--------|--------|------|
| **Dormitor** | Vest — **include dressing** (nișă), fără etichetă separată | la fel |
| **Bucătărie** | Nord-est, adâncă (~2×2,9 m) **cu dining** | doar **sud de peretele despărțitor** → fațadă sud |
| **Living** | Restul open est până la hol; **sub palier = extensie living** | **Living + dining** nord → perete despărțitor (**include zona ușii** de pe palier) |

### Pereți + stâlpi (A1.3 → A1.14)

| | |
|--|--|
| Grosimi | **Nu** 30 peste tot: **A1≈30** · **A2=31,2** · **A7=12,5** · **A8=15** cm |
| Stâlpi | Provizoriu. Pe **extrema cărămizii** (retrași de pe finit: A1−10 / A2−11,2) — **nu** aliniați cu fața finită a peretelui. Din 30 → **+10** în cameră. Fără pilastru afară. **C_SE** scos. |
| S1 | Confirmă / mută stâlpii — nu sunt înghețați. |

### Dimensiuni — în ce etapă?

| | |
|--|--|
| **Acum (A1 studiu)** | Cote de **lucru**: corp 680×860 înghețat A0; camere = compartimentare pe geometria remapată. Apar pe plan ca studiu. |
| **Îngheț** | După **confirmare** planuri P/E (poartă). |
| **Urmează** | Util shoelace pe fețe int.; finețuri mobilier/goluri; apoi S1. |
| **Hol** | Volum intrare întreg (nu fâșie) | — (intrare pe scară/palier) |
| **Terasă** | Sud-vest | Sud-vest (etaj) |

**Eliminat de pe plan:** legătură · circulație · dining separat · living_sub_palier ca „cameră” · nișă ca zonă numită.

## Regenerare

```bash
node src/build_a1_architecture.mjs
```

## Poartă

- [ ] Planuri P/E OK ca împărțire
- [ ] Da → util shoelace → S1  
- [ ] Nu → listă modificări ARH
