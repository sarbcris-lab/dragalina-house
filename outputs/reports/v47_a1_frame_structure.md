# V47 A1 FRAME — studiu structural separat (cadre BA)

## Status
**NECONSTRUIBIL / NEVALIDAT.** Variantă separată față de A1 amenajare aprobată.
Sistem: **cadre beton armat** (stâlpi + grinzi) + umplutură **EB20 Akustik** + **vată bazaltică 80 mm** (ETICS).
**Nu** pereți structurali din beton la parter/etaj. Pereții de sprijin ai subsolului = tratament separat.

## Constrângeri
- Anvelopă finită **680×860** cm; perete exterior max **300 mm**
- Amenajarea A1: **nemutată** (pereți/goluri/mobilier/scări)
- Fără stâlpi izolați în camere; reazeme în tronsoane pline
- Secțiuni **20×40 cm** = *de confirmat prin calcul și verificarea cerințelor normative*
- Termoizolația continuă peste beton spre exterior

## Eliminat din grila anterioară
- `part_mid`: pe compartimentare 12,5 cm (X347,5) — nu axă structurală; nu transformăm peretele int. în structural
- `pal_nw`: etaj-only peste living — interzis; reazem pe est continuu (C_E_PAL) sau grindă pe contur
- `pal_ne`: înlocuit de C_E_PAL continuu S–P–E
- `grinda_X320`: X320–340 ≠ compartimentare X347,5–360; nu forțăm grindă pe fală greșită
- `pereți_structurali_P_E`: direcție respinsă — doar cadre (stâlpi+grinzi) + EB20 umplutură

## Tabel stâlpi (ipoteze)

| ID | Poziție | Secțiune propusă | Niveluri | Reazem inferior | Conflicte amenajare |
|----|---------|------------------|----------|-----------------|---------------------|
| C_NW | X9.2 Y9.2 | 40×20 (along_N) | S–P–E | fundație_bandă_N/W | — |
| C_N_BUC | X535 Y9.2 | 20×20 (corner_N_buc) | S–P–E | fundație_N | verificare goluri nord |
| C_NE | X650 Y9.2 | 20×40 (along_E) | S–P–E | fundație_E | geam living ~Y105–310 — pilă doar în plin |
| C_W_MID | X9.2 Y400 | 20×40 (along_W) | S–P–E | fundație_W | — |
| C_W_DORM | X9.2 Y645 | 40×20 (along_S_dorm) | S–P–E | fundație_S | gol terasă X120–270 — rămâne în plin X0–120 |
| C_E_GEAM_S | X650 Y310 | 20×40 (along_E) | S–P–E | fundație_E | — |
| C_E_PAL | X650 Y470 | 20×40 (along_E) | S–P–E | fundație_E (continuu — NU pe placă 15) | înlocuiește pal_ne etaj-only; nu reazem pe placă 15 cm |
| C_E_PUT | X650 Y590 | 20×40 (along_E) | S–P–E | fundație_E | — |
| C_CASA_SCARA | X535 Y590 | 20×40 (along_separator) | S–P–E | fundație X535 | înlocuiește buc_y590 discontinuu; coordonare gol beci Y500–600 |
| C_S_INTRARE_W | X360 Y830 | 40×20 (along_S) | S–P–E | fundație_S_intrare | — |
| C_S_INTRARE_E | X535 Y830 | 20×20 (corner_S) | S–P–E | fundație_S | — |

## Cote etaj / planșeu
FF etaj +320; buildup 12 → față sup. placă +308; placă 15 → intrados +293; grindă 35 → intrados grindă +273; clear P sub grindă 241 (înainte de finisaj plafon). Nu suprapune placă cu pardoseală.

| Cotă | cm |
|------|---:|
| FF etaj | 320 |
| Față sup. placă | 308 |
| Intrados placă (15 ip.) | 293 |
| Intrados grindă (35 ip.) | 273 |
| Clear P sub grindă | 241 |

## Suprafețe utile (recalcul frame)
| | m² |
|--|---:|
| Util parter | **38.686** |
| Util etaj | **38.686** |
| Închidere termică Y590 | 0.255 |
| Prag 37 | 37 |
| Δ P vs 37 | **1.686** |
| Δ E vs 37 | **1.686** |
| Util A1 ref (înainte) | 37.87875 |

## Conflicte nerezolvate (păstrate explicit)
- **door_vs_beam_y575** (CRITIC): Gol ușă beci Y500–600, h=200 peste FF−250 (lintel → −35). Grindă Y575–590 intrados −70 → clear sub grindă pe Y575–600 ≈180 cm (162,8 pe ultima călcare). Golul trebuie păstrat liber — NU mutare automată nord.
- **slab_span_without_X320** (DESCHIS): Fără grindă/stâlp pe X320–347,5: planșeul spanuie living↔dorm pe reazeme perimetrale. Grosime 15 cm neconfirmată — poate cere placă mai groasă sau grinzi suplimentare (calcul).
- **etics_in_300mm** (CONSTRAINT): Anvelopă max 300 mm; EB20 200 + ETICS 92 + finisaje int. 7 = 299 mm. Termoizolația continuă peste beton spre exterior — nu se taie straturi ca să încapă stâlpul.
- **basement_retaining** (SEPARAT): Pereții subsolului care rețin pământul = sistem separat (nu cadre P/E). Neconfirmat geotehnic/NP112.
- **column_sections_unvalidated** (IPOTEZĂ): 20×40 cm orientate pe perete — de confirmat prin calcul și cerințe normative. Nu 20×20 „validate”.

## Fișiere
- `data/building/v47_a1_frame_study.json`
- `viewer/data/volume_v47_a1_frame.json` → `?v=v47_a1_frame`
- `outputs/plans/36_v47_a1_frame_structure_overlay.svg`
- `outputs/plans/37_v47_a1_frame_sections.svg`
- `outputs/reports/v47_a1_frame_structure.md`

Amenajarea `v47_a1_study` / `?v=v47_a1` rămâne referința aprobată (fără pereți structurali).
