# Audit spațiu — +1 treaptă (clear +16) · rampă 1 vs palier

**Status:** AUDIT · zero implementare · 2026-10-16  
**HEAD:** terasă deck X0–**340** · gap **15** · rampă1 X**355**–565 (going **210** = 7×30) · 8 contratrepte

## Verdict

La baza rampei 1 **nu există loc liber pentru o treaptă de 30 cm**. Ai doar **15 cm** (parapet/gol între terasă și rampă), iar going-ul 210 e **deja plin** (7 trepte). Pentru +16 cm clear (9 contratrepte pe R1) trebuie **+30 cm going** — din terasă (vest) sau din altă parte a traseului (sus), nu „din aer”.

---

## Confirmat (cote HEAD)

| Element | Cote cm | Tip |
|---------|---------|-----|
| Deck terasă P | X0–**340** · Y860–975 | demonstrat |
| Gap terasă→R1 | **15** (340→355) | demonstrat |
| Rampă 1 | X355–565 · dx=**210** · 7 trepte ×30 · **8** contratrepte | demonstrat |
| Podest SE | X565 · Y860 · 115×115 · z=+128 | demonstrat |
| Rampă 2 | Y860→590 · dy=**270** = 9×30 · **10** contratrepte | demonstrat |
| Palier etaj | Y470–590 · dy=**120** | demonstrat |
| `terasa_est` (perete) | X**331,3** · dx≈30 | demonstrat |
| Loc liber @ baza R1 pentru tread 30 | **0** (doar 15 parapet) | demonstrat |

---

## Opțiuni (comparate)

### A — Micșorare terasă / `terasa_est` spre vest (+1 treaptă @ baza R1)

| | |
|--|--|
| Ce | Deck E 340→**≤310** (−30); R1 începe 355→**325**; gap 15 păstrat; R1 going 210→**240** (8 trepte) |
| Clear | 241→**257** sub grindă (țintă) |
| Cost | −30 cm lățime terasă (~0,3×3,0 ≈ **0,9 m²** deck); mută `terasa_est` / hol |
| Pro | Direct pe întrebarea „baza rampei 1”; parapet păstrat |
| Contra | Taie terasă; atinge intrare/hol; roadmap zice scară/terasă **după** structură |

### B — Treaptă sus lângă podest + „palier spre nord”

| Variantă | Efect | Verdict |
|----------|-------|---------|
| B1: +1 tread la **capătul est** al R1 | Going +30 spre podest → podest X565→595 sau R1 mănâncă 30 din podest | **Conflict** cu banda scară X565 / lățime podest 115 |
| B2: +1 contratrepă pe **R2** + scurtează palierul (Y590→560) | Going R2 270→300; palier dy 120→**90** | Posibil la clear, dar **nu** e „baza R1”; palier 90 e strâmt |
| B3: împinge palier N (Y470↓) | Intră în living încălzit | **Conflict** amenajare / A6 / util |

„Treaptă sus + palier nord” **nu eliberează** cei 30 cm de la baza R1; mută problema pe R2/palier.

### C — Aceeași lungime R1, pantă mai abruptă (9 contratrepte pe 210)

| | |
|--|--|
| Tread mediu | 210/8 ≈ **26,3 cm** (<30) |
| Verdict | **Nu recomandat** (confort/normă treaptă) |

### D — Nu crește FF E−P; alte mijloace pentru clear 255 sub grindă

Grinzi mai plate / acceptare locală / FF — **în afara** acestui audit scară; de ținut pe FE/lege separat.

---

## Registru

| ID | Status |
|----|--------|
| gap_terrace_ramp1_15 | demonstrat — insuficient pt. tread 30 |
| ramp1_going_full_210 | demonstrat |
| opt_A_shrink_terrace_30 | ipoteză / conflict_geometric potențial (terasă, hol) |
| opt_B_top_or_ramp2 | conflict_geometric (podest/bandă) sau compromis palier |
| opt_C_steeper | respins confort |
| +16 clear via 19×16 | fezabil **doar** cu A (sau echivalent +30 going) |

---

## Pachet pentru debate

**ACCEPT**
- Gap 15 cm ≠ loc pentru treaptă 30 cm.
- Going R1 plin; +1 contratrepă cere +30 cm pe traseu.
- N/slab_edge / util geometric neatins de acest audit.

**CERE (alege 1)**
1. **A:** −30 cm terasă (deck+`terasa_est` vest) + R1 +30 going @ bază — pentru clear 257.
2. **B2:** +1 pe R2 + palier scurtat (90) — fără tăiere terasă; verifică ușă etaj / circulație palier.
3. **Amână** +16 până după FE placă/grindă (poate 241 e acceptat local).

**NU acum (fără acord)**
- Pantă abruptă pe 210.
- Palier N în living (Y470↓).
- Podest mutat pe X>565 peste bandă.

**Conflicte de raportat înainte de cote**
- Terasă utilă / hol_intrare / `terasa_est`.
- Clear 255 / FF / 18→19 contratrepte.
- Ușă etaj pe palier · planșa 40.
