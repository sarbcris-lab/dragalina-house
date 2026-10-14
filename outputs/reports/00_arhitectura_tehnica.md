# Arhitectură tehnică minimă · propunere

**Scop:** un singur model parametric; fără aplicație web mare înainte de primul plan teren validat.

## Stack propus (minimal)

| Strat | Rol | Tehnologie |
|-------|-----|------------|
| Date | Sursă unică | JSON/YAML în `data/` |
| Generator 2D | Plan situație, planuri, elevații schematice | Python (SVG → PDF opțional) |
| Generator 3D | Volum, ferestre, scară, terase | Blender Python (`bpy`) headless, dacă e instalat |
| Validări | În afara parcelei, uși, scară, terasă utilă | Scripturi Python pe aceleași date |
| Viewer | Inspectare locală | HTML+SVG sau Blender/glTF; fără backend complex |
| Istoric | Variante + aprobări | `data/variants/` + `decisions/log.md` |

## Ce se poate automatiza cu Blender

**Da (dacă Blender e instalat și rulează CLI):**
- Extrudare volum din amprentă + înălțimi pe nivel.
- Goluri (uși/ferestre) ca boolean sau mesh parametric.
- Scări / terase / porți ca obiecte din parametri.
- Camere fixe + materiale simple pentru **studii comparative** (nu „autorizabile”).
- Export glTF / PNG din aceleași unghiuri.

**Limitări Blender (semnalate explicit):**
- Planuri cotate tip arhitectură (cote automate corecte, hașuri, cartuș) — slabe; preferabil SVG/PDF din generator 2D.
- Secțiuni tehnice cu detalii constructive — conceptuale, nu DTAC.
- Randare fotorealistă ≠ verificare legală sau structură.
- Fără addon BIM dedicat instalat, nu pretindem IFC/BIM complet.

## Ce necesită alte instrumente / om

| Nevoie | Instrument / actor |
|--------|--------------------|
| Contur real + suprafață | Extras CF, plan cadastral, eventual topograf |
| POT/CUT, aliniament, retrageri | Certificat urbanism / arhitect autorizat |
| Releveu existent | Măsurătoare pe teren |
| Proiect autorizabil | Arhitect + specialiști (Etapa 6 din brief) |
| Comparație stiluri corecte | Același set de camere Blender + materiale diferite |

## Pași concreți după aprobarea acestui audit

1. **Etapa 1:** `data/site/parcel.json` + plan SVG schematic sau documentar + raport.
2. **STOP** — aprobare plan teren.
3. Abia apoi volumetrie (2–3 amprente) pe poligonul aprobat.
4. Verificare Blender: `blender --version` și un script smoke-test.

## Structură foldere (aliniată brief)

Creată / de completat: `inputs/`, `data/`, `outputs/reports/`, `decisions/`.  
`src/` și `viewer/` — doar după ce există poligon de teren de generat.
