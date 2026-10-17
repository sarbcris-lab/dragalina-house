# Placă ± bandă — clear nou + proeminențe (2026-10-17)

**Status:** ordin de studiu · **NU** FE semnat · **NU** adoptare în mesh fără debate  
**Context:** FF→FF **306** (riser 17) · clear plafon @15 = **273** · sub grindă **259** · dorm **fără Y400**

## Întrebări

1. **Placă mai groasă mai cere bandă?**  
   La ordin: h≥18–20 pe L=6,2 cu K=1,3 continuu → L/d trece FĂRĂ bandă. h=15 fără bandă → FAIL (sau doar K=1,5 optimist). Bandă rămâne utilă pe 15 sau ca rezervă FE.

2. **Variantă optimă pe proeminențe?**  
   Studiu: h18_no_band — zero bandă; C_N_MID candidat drop după FE. Alternativ: h15/h18 + bandă flush (dacă FE acceptă nervură).

## Matrice (K=1,3 continuu pe L/d)

| h | Bandă | L crit | L/d / admis | Pass | Clear plafon | Proem. | Verdict |
|--:|-------|-------:|------------:|:----:|-------------:|-------:|---------|
| 15 | nu | 6.2 | 49.6/44.2 | nu | 273 | 0 | **MARGINAL_doar_K1.5** |
| 15 | downstand | 3.1 | 24.8/44.2 | da | 273 | 3 | **OK_ordin_cu_banda** |
| 15 | flush | 3.1 | 24.8/44.2 | da | 273 | 2 | **OK_ordin_cu_banda** |
| 18 | nu | 6.2 | 40/44.2 | da | 270 | 0 | **OK_ordin_fara_banda** |
| 18 | downstand | 3.1 | 20/44.2 | da | 270 | 3 | **OK_ordin_cu_banda** |
| 18 | flush | 3.1 | 20/44.2 | da | 270 | 2 | **OK_ordin_cu_banda** |
| 20 | nu | 6.2 | 35.4/44.2 | da | 268 | 0 | **OK_ordin_fara_banda** |
| 20 | downstand | 3.1 | 17.7/44.2 | da | 268 | 3 | **OK_ordin_cu_banda** |
| 20 | flush | 3.1 | 17.7/44.2 | da | 268 | 2 | **OK_ordin_cu_banda** |
| 22 | nu | 6.2 | 31.8/44.2 | da | 266 | 0 | **OK_ordin_fara_banda** |
| 22 | downstand | 3.1 | 15.9/44.2 | da | 266 | 3 | **OK_ordin_cu_banda** |
| 22 | flush | 3.1 | 15.9/44.2 | da | 266 | 2 | **OK_ordin_cu_banda** |
| 25 | nu | 6.2 | 27.6/44.2 | da | 263 | 0 | **OK_ordin_fara_banda** |
| 25 | downstand | 3.1 | 13.8/44.2 | da | 263 | 3 | **OK_ordin_cu_banda** |
| 25 | flush | 3.1 | 13.8/44.2 | da | 263 | 2 | **OK_ordin_cu_banda** |

Proeminențe: **0** = fără bandă (+ drop posibil C_N_MID) · **1** = bandă flush + N_MID · **3** = bandă downstand + N_MID.

## Candidați (scor crescător = mai bun)

1. `h18_no_band` — OK_ordin_fara_banda · scor 0.6 · proem 0 · clear 270 · fără bandă; C_N_MID poate ieși ulterior (comparatie)
2. `h20_no_band` — OK_ordin_fara_banda · scor 1 · proem 0 · clear 268 · fără bandă; C_N_MID poate ieși ulterior (comparatie)
3. `h22_no_band` — OK_ordin_fara_banda · scor 1.4 · proem 0 · clear 266 · fără bandă; C_N_MID poate ieși ulterior (comparatie)
4. `h25_no_band` — OK_ordin_fara_banda · scor 5 · proem 0 · clear 263 · fără bandă; C_N_MID poate ieși ulterior (comparatie)
5. `h15_no_band` — MARGINAL_doar_K1.5 · scor 9 · proem 0 · clear 273 · fără bandă; C_N_MID poate ieși ulterior (comparatie)
6. `h15_band_flush` — OK_ordin_cu_banda · scor 20 · proem 2 · clear 273 · bandă îngropată în placă (nervură); C_N_MID 40 pe N (pilastru/along)
7. `h18_band_flush` — OK_ordin_cu_banda · scor 20.6 · proem 2 · clear 270 · bandă îngropată în placă (nervură); C_N_MID 40 pe N (pilastru/along)
8. `h20_band_flush` — OK_ordin_cu_banda · scor 21 · proem 2 · clear 268 · bandă îngropată în placă (nervură); C_N_MID 40 pe N (pilastru/along)

## Recomandare studiu (debate)

| Prioritate | Pachet | De ce |
|------------|--------|--------|
| **1 — min proem.** | **Placă ~20 (18–22) fără `B_BAND_X320`** | L/d ordin OK pe 6,2 @K=1,3; clear încă ≥268; **zero** soffit bandă; C_N_MID = comparație ulterioară |
| 2 — clasic R | Placă **15** + bandă (ideal **flush**/nervură) | ușoară; panouri 3,1; proem. dacă downstand |
| 3 — evit | 15 fără bandă | FAIL L/d @K=1,3 |
| 3 — evit | 25–28 doar ca să „scape” de bandă | Gk↑; clear încă OK dar inutil dacă 20 trece |

### Bandă pe 20+ 

**Nu e obligatorie** la ordin span/depth. Poate rămâne ca **asigurare FE** (2-way, fisurare, vibrații) — atunci preferă **flush**, nu downstand.

### Clear (confirmare)

| h | Clear plafon | Sub grindă/bandă downstand |
|--:|-------------:|---------------------------:|
| 15 | 273 | 259 |
| 18 | 270 | 259 |
| 20 | 268 | 259 |
| 22 | 266 | 259 |
| 25 | 263 | 259 |

## Ce NU e demonstrat

- SLS fisurat / vibrații / 2-way real → **FE**
- Bandă flush vs downstand în execuție
- Drop `C_N_MID` fără bandă (fațadă N)

JSON: `outputs/reports/v47_a1_frame_slab_band_protrusion_v01.json`
