# V47 A1 FRAME — Acoperiș D3a: PV + zăpadă + reazeme + inel

**Status:** ordin de studiu · **NU** FE semnat · **NU** autorizabil  
**Amplasament:** Turda · sk=**1.5** kN/m² (CR 1-1-3/2012) · sens. 2

## Verdict

1. **Stâlpișori fronton:** pe **muchie / parțial** pe B_W / B_E — nu centrați (W overlap ~5 cm din 20).
2. **Plăci BA:** etaj **20 cm** (322→342); peste subsol **20 cm** pe footprint CONC.
3. **Centură sub fiecare placă:** da pe nivelele P și E din `beams[]` — dar **inelul E nu e închis** pe EST sud de Y590 / colț SE.
4. **„2 segmente în aer”:** `B_Y470_PALIER_EDGE` (consolă V 105) + consolă `B_E` sud de C_E_PAL (~101) = **LOCK-1R**, nu bug. Legarea lor = **stâlp nou în living** (retras intenționat).
5. **PV + zăpadă:** q_Ed D3a+PV @ sk1,5 ≈ **3.02 kN/m²** · W_plan ≈ **178 kN**. Căprior 12×25 @1,2 m: **ordin_OK_pe_simplu_rezemat — FE/înnădiri/ancorare lipsă**. Afirmația „ține tot” = **calcul_lipsă FE** (stâlpi, inel, ancorare).

## Încărcări (pe m² plan)

| Caz | Gk | Qk zăpadă (μ=0,8·sk) | q_Ed | W pe amprentă ~58.8 m² |
|-----|---:|---------------------:|-----:|---------------------------------------:|
| D3a + PV · sk=1,5 | 0.9000000000000001 | 1.2 | **3.02** | **178** |
| D3a + PV · sk=2,0 (sens.) | 0.9000000000000001 | 1.6 | 3.62 | 213 |
| D3a fără PV · sk=1,5 | 0.7 | 1.2 | 2.74 | 161 |

Gk: șarpantă 0.55 + solbanc/coamă 0.1 + **PV 0.2** + misc 0.05 = **0.9000000000000001** kN/m².

### Căprior (ordin)

| L (m) | pas (m) | q linie | M_Ed L/8 | W nec (σ14) | 12×25 W | |
|------:|--------:|--------:|---------:|------------:|--------:|---|
| 4.97 | 1.2 | 3.62 | 11.19 | 1 | 1250 | ordin_OK_pe_simplu_rezemat — FE/înnădiri/ancorare lipsă |

## Reazeme stâlpișori (pre-fix)

| Tag | Contur cm | Overlap | Fracție | Verdict |
|-----|-----------|---------|--------:|---------|
| W | X25–45 Y420–440 | B_W:100 | 0.25 | **pe_muchie_sau_partial** |
| E | X637.6–657.6 Y420–440 | B_E:310 | 0.78 | **pe_muchie_sau_partial** |

**Fix mesh:** centra pe B_W / B_E (față beton), nu pe inset față de finit.

## Inel centuri etaj

| Probă | Status | Grinzi |
|-------|--------|--------|
| NW (15,15) | **covered** | B_N, B_W |
| N mid (336,15) | **covered** | B_N |
| NE (657,15) | **covered** | B_N, B_E |
| W mid (15,400) | **covered** | B_W |
| E mid (657,400) | **covered** | B_E |
| E sud scară (657,700) | **GAP** | — |
| SE colț (657,835) | **GAP** | — |
| S intrare (450,835) | **covered** | B_Y830 |
| S dorm (180,650) | **covered** | B_Y645 |
| SW dorm (15,650) | **covered** | B_W, B_Y645 |
| consolă palier B_Y470 (600,485) | **covered** | B_Y470_PALIER_EDGE |

Pe EST sud de Y590 (după B_E) nu există grindă pe CONC_E; colțul SE structural (672/851) nu are stâlp — C_S_INTRARE_E e la X536. Inel E incomplet.

**Propunere studiu (debate):** C_SE @ CONC_E×CONC_S + B_E_S (Y590→S) + B_S_SE (de la C_S_INTRARE_E la C_SE) — debate înainte de mesh

### Console „în aer” (nu golul SE)

- **B_E**: west=— · south=101 — intenție_LOCK-1R_consolă — nu e bug; legare = stâlp nou în living (retras)
- **B_Y470_PALIER_EDGE**: west=105 · south=— — intenție_LOCK-1R_consolă — nu e bug; legare = stâlp nou în living (retras)

## Plăci + centuri

| Nivel | Placă structurală | Centură |
|-------|-------------------|---------|
| Peste subsol | 20 cm CONC | grinzi S / P+E |
| Etaj (peste P) | **20 cm** | beams `levels: P` |
| Sub acoperiș | — (șarpantă D3a) | beams `levels: E` pe același traseu |

## Registru

| ID | Status |
|----|--------|
| `roof_load_path` | geo traseu OK · încărcări D3a+PV documentate · **FE lipsă** |
| `gable_post_bearing` | **conflict_geometric** (pre-fix) → centra pe B_W/B_E |
| `ring_E_SE_gap` | **conflict_geometric** — EST Y590→S + colț SE fără stâlp |
| `cantilever_B_Y470` / `B_E_south` | ipoteză LOCK-1R · calcul consolă lipsă |

JSON: `outputs/reports/v47_a1_frame_roof_pv_snow_bearing_v01.json`
