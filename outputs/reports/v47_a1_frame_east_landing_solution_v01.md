# Soluție studiu — east_landing_span v01

**Status:** **RESPINS 2026-10-16** — `C_E_LAND_SP` bloca palier/rampă beci.  
**Înlocuit de:** `outputs/reports/v47_a1_frame_slab_and_landing_v02.md` (consolă pe B_E).  
**Prioritate planuri:** P/E neschimbate · stâlp **nu** în circulația etaj scară / acces beci

---

## Problemă

Un singur reazem est `C_E_PAL` (Y449–489). Sud de el: placă palier scară = plafon living, deschidere ~3,7 m fără stâlp pe scară etaj.

## Opțiuni (scurt)

| Opțiune | Verdict |
|---------|---------|
| Stâlp S+P+E pe scară | Respins — îngustează circulația E |
| Consolă lungă / placă groasă fără reazem | Posibil dar costisitor; fără calcul = risc |
| **Stâlp S+P sub placă + grinzi pe contur** | **ALES** — reazem de jos, etaj liber |

## Soluție implementată

1. **`C_E_LAND_SP`** — 30×30 @ X641.3 Y575  
   - Niveluri: **doar S + P** (până la FF etaj / soffit placă)  
   - **Nu** urcă în volumul scară etaj  
   - Aliniat pe Y cu grindă întoarsă / muchie sud palier  

2. **`B_E` prelungit** — dy până prin `C_E_LAND_SP` (Y9.2→~605)  
   - Segmente: … → C_E_PAL → **C_E_LAND_SP**  
   - Clear C_E_PAL→C_E_LAND ≈ **0,86 m** (față–față)

3. **`B_LAND_S_EDGE`** — X536.3→641.3 @ Y575, h 15 cm, nivel **P**  
   - Leagă separator / C_CASA → C_E_LAND_SP  
   - Închide muchia sud a plăcii palier

4. **`C_SHAFT_E_PIER`** rămâne pe S — capăt est grindă întoarsă (complementar)

### Schemă 4 laturi placă palier (studiu)

```
        N: B_Y470_PALIER_EDGE / C_E_PAL
W: separator / C_CASA     E: B_E (ax X641)
        S: B_LAND_S_EDGE / C_E_LAND_SP
```

---

## Ordin de mărime (nu notă de calcul)

Ipoteze: q_Ed ≈ 11,8 kN/m² · placă palier ≈ 1,15×1,2 m ≈ 1,4 m² · Gk local + Qk.

| Element | L clear | Acțiune studiu | Citire |
|---------|---------|----------------|--------|
| B_E (C_E_PAL→C_E_LAND) | ~0,86 m | grindă scurtă, M mic | OK ordin |
| B_LAND_S_EDGE | ~1,05 m | grindă pe muchie, trib. ~0,6–1,0 m | OK ordin |
| C_E_LAND_SP axial | — | N din ~2–4 m² placă + grindă ≪ Nrd 30×30 | OK ordin |
| Placă palier 15 cm | pe 4 laturi | L max ~1,2 m → L/h≈8 | favorabil vs situația anterioară |

**Rămâne DESCHIS structurist:** armare, perforare, legătură la grindă întoarsă, P100 pe stâlpul scurt, detaliu oprire sub FF etaj.

---

## Cum vezi pe live

1. **1 · Structură**  
2. Caută mesh verde-măsliniu `stalp_SP_C_E_LAND_SP`  
3. `parter_centura_B_E` prelungit sud · `parter_centura_B_LAND_S_EDGE`  
4. Pe **Doar etaj**: stâlpul S+P apare ca reazem sub placă, **fără** continuare în aerul scării

---

## Fișiere

- `data/building/v47_a1_frame_study.json` — columns/beams/conflicts  
- `viewer/data/volume_v47_a1_frame.json`  
- Conflict `east_landing_span` → `STUDIU_SOLUTIE`
