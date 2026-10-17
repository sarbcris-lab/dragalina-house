# V47 A1 FRAME — Calc 2.1 stâlpi (preliminar)

**Status:** ordin de mărime · **NU** proiect semnat · **NU** adoptare secțiuni  
**Dată:** 2026-10-16  
**Input:** `v47_a1_frame_study.json` + q_Ed din audit v04  
**Următor:** FE 3D / P100 cu M+V+confinare — abia atunci along 40→30 în generator

## Metodă

| Parametru | Valoare |
|-----------|---------|
| q_Ed planșeu | **11.78** kN/m² |
| q_Ed palier | **11.93** kN/m² |
| q_Ed acoperiș ușor / BA | 4.5 / 7 |
| Beton | C25/30 · fcd=16.67 MPa |
| Nrd | 0,8 · Ac · fcd (**fără** flambaj, **fără** M) |
| Prag „încerc 30×30” | Nrd(30×30) / N_Ed ≥ **3** (rezervă pentru M+V) |

Ariile tributare = half-span pe grila de cadru (aproximare). Nu înlocuiesc model FE.

## Rezultate

| ID | Secțiune | N_Ed ușor (kN) | N_Ed BA (kN) | Nrd 30×30 | Nrd actual | Nrd/N (30) | Verdict |
|----|----------|---------------:|-------------:|----------:|-----------:|-----------:|---------|
| C_NW | 40×30 | 242.5 | 261.7 | 1200 | 1600 | 4.95 | axial_OK_incerc_30x30 |
| C_N_MID | 40×30 | 323.3 | 349.7 | 1200 | 1600 | 3.71 | axial_OK_incerc_30x30 |
| C_NE | 30×40 | 206.6 | 222.6 | 1200 | 1600 | 5.81 | axial_OK_incerc_30x30 |
| C_W_MID | 30×40 | 242.5 | 261.7 | 1200 | 1600 | 4.95 | axial_OK_incerc_30x30 |
| C_W_DORM | 40×30 | 161.7 | 173.7 | 1200 | 1600 | 7.42 | axial_OK_incerc_30x30 |
| C_S_DORM_E | 30×30 | 132.5 | 142.5 | 1200 | 1200 | 9.06 | axial_OK_incerc_30x30 |
| C_E_GEAM_S | 30×40 | 138.1 | 148 | 1200 | 1600 | 8.69 | axial_OK_incerc_30x30 |
| C_E_PAL | 30×40 | 131.8 | 139.8 | 1200 | 1600 | 9.1 | axial_OK_dar_pastreaza_30x40_nod_consola |
| C_CASA_SCARA | 30×40 | 119.6 | 127.8 | 1200 | 1600 | 10.03 | axial_OK_incerc_30x30 |
| C_S_INTRARE_W | 40×30 | 111.2 | 118.7 | 1200 | 1600 | 10.79 | axial_OK_incerc_30x30 |
| C_S_INTRARE_E | 30×30 | 83.4 | 89 | 1200 | 1200 | 14.39 | axial_OK_incerc_30x30 |

## Candidați along 40 → 30 (doar axial)

- **C_NW**
- **C_N_MID**
- **C_NE**
- **C_W_MID**
- **C_W_DORM**
- **C_E_GEAM_S**
- **C_CASA_SCARA**
- **C_S_INTRARE_W**

## Ce NU e demonstrat

- Combinații P100 (seism) + CR0
- Momente din cadre / excentricități / confinare zone critice
- Flambaj / lungimi de flambaj pe S–P–E
- Interacțiune N–M pe diagramă
- Pier `C_SHAFT_E_PIER` 15×15 (nu cadru)

## Decizie model (acum)

| Acțiune | Da/Nu |
|---------|-------|
| Păstrează secțiunile actuale în generator | **Da** |
| Reduce along la 30 în mesh | **Nu** — așteaptă FE cu M+V |
| Continuă 2.2 nod C_E_PAL | **Da** |

JSON: `outputs/reports/v47_a1_frame_calc_2_1_columns_v01.json`
