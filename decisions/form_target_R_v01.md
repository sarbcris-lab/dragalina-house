# Țintă = formă corectă (Varianta **P** — ex-R)

**Status:** ARHIVĂ · 2026-10-17 — supersedat de `decisions/project_restart_v01.md`  
**Nu urmărim acum:** autorizație / `declared_buildable` / semnătură  
**Urmărim:** geometria care iese din calculele de studiu (ordin) — coerentă, fără reazeme vagi

> Restart activ: nu mai edita FRAME pe această țintă; brief nou = Etapa 0.

## Principiu

Calculele (predimensionare) **conduc forma**. Autorizația e alt proiect, mai târziu.

## Forma P (înghețată 2026-10-17)

| Zonă | Formă |
|------|--------|
| Sistem | Cadre BA, stâlpi ≥30; **E/S** finit plan (beton=finit−A2, ETICS continuu, proem. int.); **N/V** int. la linie + pilastru ext. |
| Planșeu | Placă **20** · **fără** `B_BAND_X320` (L≈6,2) |
| Dormitor | **LOCK neatins** — fără grindă transversală (B_Y400 retras) |
| Clear | **268** sub placă · **259** sub grinzi (≥255) |
| Palier E | Consolă pe B_E, fără stâlp în living |
| Subsol | Retenție **BA 20** · FG **80** + bandă **60** |
| Întoarsă puț | Capăt V pe **B_SEP** · capăt E pe **pier** |
| Acoperiș | D3a ca intenție de încărcare; mesh actual = placeholder pe aceleași reazeme |
| Util | geometric pe falie (P/E NECONFIRMAT) — nu redesign amenajare |

**Supersede:** R = 15 + bandă (rămâne ca istoric / fallback FE).

## Ce mai schimbă forma (doar dacă calculul cere)

- Along stâlpi 40→30 — **după** eforturi M+V mai clare  
- Drop `C_N_MID` — doar după FE fără bandă  
- Revenire bandă / h≠20 — doar dacă FE cere, cu Δ clear raportat  

## Surse

- Proeminențe: `outputs/reports/v47_a1_frame_slab_band_protrusion_v01.md`  
- Recomandat: `decisions/frame_recommended_variant_v01.md`  
- Brief FE: `outputs/reports/v47_a1_frame_fe_brief_variant_R_v01.md` (de sync pe P)
