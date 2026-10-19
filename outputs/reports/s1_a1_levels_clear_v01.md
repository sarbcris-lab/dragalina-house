# S1 A1 — Cote utile: placă, centuri, clear

**Sursă:** `structure_a1_study_cm.levels_cm` · A1.180  
**Nu e proiect semnat**

## Clear (înălțime utilă)

| Cotă | cm | Notă |
|------|---:|------|
| **Clear sub grindă** | **255** | HARD — pretutindeni |
| Clear sub placă | 280 | sub intrados placă |
| Clear → fals plafon | 274 | +6 cm fals = 280 |
| Clear beci sub placă (țintă) | 220 | FF −250 → soffit −30 |

## Placă / grindă / buildup

| Element | cm |
|---------|---:|
| Placă structurală | **15** |
| Grindă critică (total, zonă placă) | **40** |
| Grindă tipică | 35 |
| Drop sub soffit (grindă sub placă) | 25 |
| Buildup pardoseală sub FF | 12 |
| FF→FF (P→E) | **307** |

## Cote absolute (cm, față de teren ≈0)

| Nivel | Cotă |
|-------|-----:|
| FF parter | +48 |
| Intrados grindă peste P | +303 |
| Intrados placă E | +328 |
| Sus placă E | +343 |
| FF etaj | +355 |
| FF beci | −250 |
| Intrados placă L-1 | −30 |
| Sus talpă / bază elevație | −265 |
| Talpă jos | −310 |

## Scări (mesh-uri în 3D)

| Scară | Mesh | View |
|-------|------|------|
| Acces P (2 trepte → terasă) | `acces_treapta_*` | Structură / P+E |
| Curte → palier −95 | `subsol_racord_curte_*` | Structură / Subsol |
| Palier −95 → beci −250 | `subsol_scara_*` | Structură / Subsol |
| P→E (180+est) | `treapta_rampa*` | Structură / P+E |

## Talpă perimetru

- Lățime studiu: **115 cm** (după alunecare/răsturnare)
- **Excentrică spre interior** — fața exterioară aliniază cu fața zidului (nu iese în stradă pe Dragalina)
- Elevație retenție: de pe talpă (−265) până la **teren 0** (închide golul sub soclu)
