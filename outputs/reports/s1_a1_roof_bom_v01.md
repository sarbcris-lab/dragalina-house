# S1 A1 — BOM șarpantă D3a (studiu)

**Status:** listă piese + fixări tip · **NU** listă de cumpărături semnată  
**Generat:** 2026-10-19T08:25  
**Geometrie:** 2 ape · 30° · pas egal **111.8** cm (7 căpriori/apă)

## Piese

| ID | Piesă | Secțiune | Buc | L (m) | Material | Notă |
|----|-------|----------|----:|------:|----------|------|
| RIDGE | Coamă | 20×35 | 1 | 6.83 | lemn C24 studiu | pe lungimea CONC E–W |
| PLATE_N | Solbanc N | 20×25 | 1 | 6.83 | lemn C24 studiu | pe centură/CONC nord |
| PLATE_S | Solbanc S | 20×25 | 1 | 6.83 | lemn C24 studiu | pe centură/CONC sud |
| RAFTER_N | Căpriori ape N | 12×25 | 7 | 4.97 | lemn C24 studiu | pas egal 111.8 cm (≤120); nBay=6 |
| RAFTER_S | Căpriori ape S | 12×25 | 7 | 4.98 | lemn C24 studiu | pas egal 111.8 cm; EC5 util=0.692 |
| GABLE_W | Stâlpișor fronton W | 20×20 | 1 | 2.49 | lemn C24 studiu | pe B_W |
| GABLE_E | Stâlpișor fronton E | 20×20 | 1 | 2.49 | lemn C24 studiu | pe B_E |

**Volum lemn ordin:** ~**3.45** m³ (fără pierderi / îmbinări)

## Fixări tip

| Nod | Tip | ×/nod | Noduri | Total | Notă |
|-----|-----|------:|-------:|------:|------|
| Căprior ↔ solbanc | șuruburi lemn Ø8×120 sau cuie 4,0×100 | 3 | 14 | **42** | min 2+1; we streșină → preferă șurub + colțar |
| Căprior ↔ coamă | șuruburi Ø8×140 sau cuie 4,0×120 + placă metalică | 2 | 14 | **28** | sau asamblare cuțit/coamă tip studiu |
| Solbanc ↔ centură BA | ancoră chimică M12 / bolt M12 @ ≤80 cm | 1 | 18 | **18** | ancorare uplift we streșină — FE confirmă |
| Stâlpișor ↔ grindă B_W/B_E | șuruburi Ø10×160 + saboți metal | 4 | 2 | **8** | pe ax grindă |
| Contravântuire ape (opțional studiu) | scândură 2,5×15 sau bandă metalică | 1 | 4 | **4** | dacă FE cere diafragmă suplimentară pe învelitoare |

## Verificare legată

- EC5 căprior: util **0.692** · PASS `true`
- we streșină: **-1.629** kN/m² → ancorare solbanc critică
- PV pe ambele ape: greutate inclusă în Gk studiu (vezi wind pack)

## Nu e în BOM

- Învelitoare / membrană / OSB  
- Șipci / contra-șipci  
- Cadre PV / șine  
- Detalii streșină / jgheaburi  

JSON: `s1_a1_roof_bom_v01.json`
