# S1 A1 — Retenție: pământ + apă + seism

**Status:** ordin extins · **NU** semnat · fără geo 131  
**Generat:** 2026-10-19T08:25

## Ipoteze

| | |
|--|--:|
| H zid | **2.5** m |
| Grosime | **30** cm |
| Ka / γ | 0.33 / 18 kN/m³ |
| ag / S | 0.1g / 1.2 |
| kh | **0.06** |
| ΔPae (Seed) | **2.5** kN/m |
| M seism | **3.8** kNm/m |

## Scenarii

| Caz | hw | Pa | Ph | ΔPae | M tot | As mm²/m | Hint | PASS |
|-----|---:|---:|---:|-----:|------:|---------:|------|:----:|
| **dry** fără apă (ca geo120 citat) | 0 | 18.6 | 0 | 2.5 | **19.3** | 189 | φ12 @ 15 cm vertical interior + φ10 @ 20 oriz. | **true** |
| **hw05** apă 0,5 m | 0.5 | 18.6 | 1.25 | 2.5 | **19.5** | 191 | φ12 @ 15 cm vertical interior + φ10 @ 20 oriz. | **true** |
| **hw10** apă 1,0 m (conservator studiu) | 1 | 18.6 | 5 | 2.5 | **20.9** | 206 | φ12 @ 15 cm vertical interior + φ10 @ 20 oriz. | **true** |

**Adopt studiu (conservator):** `hw10` → M=**20.9** kNm/m · φ12 @ 15 cm vertical interior + φ10 @ 20 oriz.

## Față de calc simplu (gaps 2.6)

| | Vechi (doar Ka) | Nou (apă 1 m + seism) |
|--|----------------:|----------------------:|
| M kNm/m | 18.9 | **20.9** |
| As mm²/m | 175 | **206** |

## FE

- Nivel apă real din geo 131  
- Mononobe-Okabe pe φ teren + δ interfață  
- Verificare alunecare / răsturnare pe talpa 80  
- Armare DT pe As de mai sus ca temă  

JSON: `s1_a1_retaining_seis_v01.json`
