# Varianta R — traseu încărcare acoperiș D3a (geo)

**Status:** verificare geometrică · **NU** FE  
**Preferință:** D3a șarpantă ușoară (D3b = sensibilitate)

## Lanț

| De la | La | Status | Notă |
|-------|-----|--------|------|
| învelitoare / căpriori (D3a) | centuri perimetrale E (B_N, B_W, B_E, B_Y645…) | geo_OK_ipoteză | mesh acoperiș există; încărcare pe streșină → grinzi E |
| stâlpișori fronton | grinzi @ +581 (contact parțial) | geo_partial | audit: contact OK geometric; capacitate/excentricitate = FE |
| centuri E | stâlpi S–P–E | geo_OK | 11 stâlpi cu nivel E |
| B_BAND_X320 | stâlpi (N_MID, S_DORM_E) | geo_OK_studiu | planșeu E; fără Y400 (dorm LOCK); nu primar pentru acoperiș |
| D3b placă BA acoperiș | aceleași stâlpi (+ΔW ~172 kN) | sensibilitate | nu modelat ca mesh separat acum — FE sensibilitate |

## Elemente E în model

- Centuri/grinzi cu E: B_N, B_W, B_E, B_CASA_SCARA, B_Y645, B_BAND_X320, B_X360_DORM_INTRARE, B_Y830, B_Y470_PALIER_EDGE
- Stâlpi cu E: C_NW, C_N_MID, C_NE, C_W_MID, C_W_DORM, C_S_DORM_E, C_E_GEAM_S, C_E_PAL, C_CASA_SCARA, C_S_INTRARE_W, C_S_INTRARE_E

## Goluri calc

- Capacitate stâlpișori + excentricitate pe streșină
- Detaliu ancorare șarpantă la centură (seism)
- Zapadă locală / combinații CR pe acoperiș
- D3b doar ca sensibilitate — nu adoptat

## Verdict

Traseul D3a e închis geometric pe cadre (centuri→stâlpi). Rămâne FE pe stâlpișori/ancorare — nu blochează restul R.

JSON: `outputs/reports/v47_a1_frame_roof_path_R_v01.json`
