# Variantă R — status master (studiu)

**Dată:** 2026-10-16  
**Țintă:** formă corectă din calcule de studiu — **nu** autorizație  
**Lock formă:** `decisions/form_target_R_v01.md` · `decisions/frame_recommended_variant_v01.md`

---

## Ce este R

**Cadre BA** + placă **15** + **B_BAND_X320** (fără Y400) + consolă LOCK-1R + retenție BA 20 + FG 80/60 + acoperiș **D3a întâi** + util E **37,469** + **dorm LOCK neatins**.

---

## Geo / model — închis

| Element | Status |
|---------|--------|
| Stâlpi ≥30 flush · ETICS pe stâlp | OK |
| Placă 15 · clear 255 | OK țintă |
| B_BAND_X320 | activ · N_MID–S_DORM_E |
| B_Y400_BAND_TIE | **RETRAS** — dorm LOCK |
| Consolă palier LOCK-1R | OK |
| Retenție BA 20 | OK mesh |
| FG pad 80 + strip 60 | OK mesh |
| Pad B_X360 | acceptat |
| Întoarsă: capăt V pe B_SEP | formă închisă |
| Util E 37,469 | înghețat în generator |
| D1 clear 241 sub grindă | lock |
| Dormitor | **neatins** |
| Planuri 38/39/40 | regen fără Y400 |

---

## Calc ordin — pe masă (nu FE)

| Temă | Fișier | Citire |
|------|--------|--------|
| Stâlpi axial | `calc_2_1_columns` | Nrd/N≥3; along→30 după FE |
| Consolă | `calc_2_2_cantilever` | M/T mici; nod = FE |
| Placă/grinzi | `calc_2_3_2_4` + continue | 15@6,2 fail; cu bandă OK |
| Bandă opțiuni | `band_options` | țintă **B_2way** (fără Y400) |
| Y400 | `y400_tie_and_R_status` | **RETRAS** dorm LOCK |
| Fundații/acoperiș | `calc_2_6_2_7` | pad80/strip60; D3a −172 kN vs BA |
| Retenție | `variant_R_continue` | E_a≈23 uscat |
| Roof path | `roof_path_R` | centuri→stâlpi geo OK |
| Comparație variante | `variant_compare` | R = best pe brief |

---

## Deschis — doar FE / geo 131

1. Placă 15 + bandă 2-way (fără Y400)  
2. Nod C_E_PAL  
3. P100 stâlpi (along 40→30)  
4. Grinzi pe eforturi FE  
5. Retenție + hidro + Rc fundații  
6. D3a ancorare / stâlpișori; sensibilitate D3b  
7. Întoarsă capăt V  

---

**Nu autorizabil** până FE semnat + geo 131.
