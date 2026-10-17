# Brief FE — Dragalina V47 A1 FRAME · Varianta **P**

**Pentru:** structurist / model FE  
**De la:** studiu geometric + predimensionare (Cursor)  
**Data:** 2026-10-17  
**`declared_buildable`:** false  
**Supersede:** brief R (15 + bandă)

## Geometrie de modelat (sursă)

| Fișier | Rol |
|--------|-----|
| `data/building/v47_a1_frame_study.json` | schema |
| `outputs/plans/38_*.svg` `39_*.svg` `40_*.svg` | planuri |
| `decisions/form_target_R_v01.md` | lock P |
| `decisions/frame_recommended_variant_v01.md` | pachet |

## Ce e înghețat

- Cadre BA · stâlpi thru ≥30 pe **muchie placă** · falie EB20 = zidărie (N/V exces afară, E/S în interior la cheie)  
- Placă **20** · **fără** `B_BAND_X320` · **fără B_Y400** · clear **268** / **259**  
- **Dormitor LOCK neatins**  
- Consolă palier LOCK-1R (fără stâlp living)  
- Retenție BA 20 · FG pad 80 + strip 60  
- `C_N_MID` păstrat (drop = doar după FE)  
- Acoperiș: **D3a** întâi  

## Ce cerem de la FE (ordine)

1. **Placă 20 pe L≈6,2 m** — SLS/ULS, 2-way; comparație sensibilitate h=18 / h=15+bandă. **Prioritar.**  
2. **Nod C_E_PAL** — M/T/ridicare consolă 101+105. **Prioritar (împreună cu 1).**  
3. **Stâlpi** CR0+P100 — along 40→30 candidați **exceptând C_E_PAL**; rol `C_N_MID` fără bandă.  
4. **Grinzi** perimetrale (fără Y400, fără B_BAND).  
5. **Retenție + fundații** pe geo 131.  
6. **D3a** load path; sensibilitate D3b.  

## Ordin deja pe masă (nu înlocuiește FE)

| Element | Ordin |
|---------|-------|
| Placă 20 @6,2 K=1,3 | L/d≈35,4 ≤44,2 — OK span/depth studiu |
| Placă 15 fără bandă | FAIL @K1,3 — respins pe P |
| Bandă (istoric R) | retrasă din mesh |
| Consolă | M~6 · T~7 · nod~10 |
| Retenție uscat | E_a≈23 kN/m |
| Stâlpi axial | Nrd/N ≥3 pe 30×30 (fără M) |

Vezi `v47_a1_frame_slab_band_protrusion_v01.md`.

## Livrabil așteptat

Raport FE pe **P** cu armături / deflecții / noduri critice; `declared_buildable` rămâne false până semnare.
