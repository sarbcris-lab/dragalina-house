# A1.209 — Audit look: perete scară ↔ Dragalina (randare vs model)

**Prioritate:** aspect din randare Belgian · tehnic = în serviciul look-ului  
**Surse look:** `inputs/references/style_target_belgian_caramida_tencuiala.png`, `outputs/_tmp_east_*.png`, `outputs/_tmp_belgian_*.png`  
**Surse model:** `stair_solid_e` / `stair_jaluzele_e` / `stair_parapet_e` · `B_E_S` · `C_E_PAL` · `C_E_LAMELE`

## Ce arată randarea (țintă)

| Detaliu | Look |
|---------|------|
| Plan fațadă E | **un singur plan** klinker, flush pe Dragalina |
| Perete scară↔stradă | **piele subțire** ~10–15 cm, nu stâlp vizibil |
| Parapet pe rampă | același klinker, **subțire**, capac **antracit** plat |
| Lamele | 3–4 lame antracit în gol; **fără pier gras** după ele |
| Deasupra golului | antet klinker/continuitate — **nu** grindă gri în clear |
| Scară | liberă pe lățime; structura **nu** intră în ochiul de scară |

## Ce e în model azi

| Element | Cote | vs look |
|---------|------|---------|
| `stair_solid_e` / jaluzele / parapet E | **dx = 10 cm** @ X667.4 | OK ca grosime piele |
| Parapet E (plan) | **10 cm** (detaliu fatadă: „Parapet scară E dx=10”) | OK — confirmă intuiția 10–15 |
| `B_E_S` | X638.8–668.8, **dx 30** | **FAIL look** — coboară în scară |
| `C_E_PAL` | 30×40, +10 în cameră | stâlp „aliniat” pe extremă, dar **masa e înăuntru** |
| `C_E_LAMELE` | 20×40 după lamele | **FAIL look** — pier vizibil; în randare e continuitate |
| Living E `est_living` | A2 **31,2 cm** | alt regim (încălzit); scară e piele rece |

**Conflict:** pielea ARH e 10 cm pe finit; grinda/stâlpul de cadru stau **~29 cm vest** de fața interioară a pielii → strâng scara. De asta „stâlpul e pe fațadă” pe ax, dar **grinda îngustează** ochiul.

## Soluții look-first (poți renunța la stâlp)

### S1 — Piele klinker 10–15 cm + structură invizibilă în scară *(cel mai aproape de randare)*
- Păstrezi ecranul subțire (parapet + plin + lamele) ca în randare.
- **Fără** `B_E_S` downstand în clear; **fără** pier `C_E_LAMELE`.
- Încărcările pe A6 / noduri N–S / placă — FE decide cum; look = scară liberă.

### S2 — Zid-lamă beton pe Dragalina (15–20 cm) + klinker afară *(recomandat dacă vrei „zid, nu stâlp”)*
- Un singur element vertical pe front: beton subțire = rol de stâlp+grindă pe zonă.
- Față exterioară = același plan klinker ca livingul.
- Gol lamele tăiat în lamă; antet flush (nu grindă în scară).
- Poți **renunța la `C_E_PAL` ca stâlp izolat** pe banda scară.

### S3 — Continuă parapetul după lamele (scoate pier-ul)
- Doar ARH: secvența randării = plin → lamele → parapet, **fără** 40 cm gri.
- Clear @pier dispare ca problemă; look se apropie imediat.

### S4 — Antet / buiandrug flush în grosimea pielii
- Orice grindă E pe scară = **în** cei 10–15 cm (sau pe extrados placă), niciodată 30 cm în ochi.

## Ce NU e look-ul din randare
- Grindă gri 30 cm care „stă pe zid” și iese în scară.
- Pier 20×40 ca accent după lamele.
- Parapet „gros de cadru”.

## Decizie — LOCK
**S2 acceptat** (2026-10-20) → implementat **A1.210**.

### Schiță azi → S2 (plan, cm)

```
AZI (problemă):
  A6|==== clear scară ====| B_E_S 30 @638.8 | piele 10 @667 | finit 680
                           ^ strangulează (~75 cm la față grindă)

S2 (lock):
  A6|======== clear ~100.7 ========| LAMĂ 15 @665========| finit 680
                                   ^ structură = look; fără pier; fără grindă în ochi
```

Detaliu: `decisions/log.md` A1.210 · regenerare `build_a1_architecture` + `structure:a1` + volume.
