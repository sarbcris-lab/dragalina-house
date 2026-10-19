# S1 A1 — Viewer A1.202: clasificare / selecție / secțiuni

**Status:** rundă 1 din debate prezentare · **NU** închide §4–7  
**Commit țintă:** A1.202

## Acceptat din debate

Ordine: (1) clasificare+selecție+cote → (2) camere/secțiuni → (3) views complete → (4) planuri → (5) capturi.  
**Nu** se modifică amenajare / amprentă / util pentru aspect.

## Remedieri livrate

| Problemă | Fix |
|----------|-----|
| Pardoseli beci în „parter” | Bucket explicit `subsol` + `userData.level` |
| `pardoseala_dormitor_e` → etichetă parter | Match cameră pe **nivel** din sufix `_e` / `_p` / `subsol_` |
| CT cu clear 255/280/274 | Pe subsol: doar **clear beci 220** |
| Grindă = heights globale | Afișează **h / intrados / extrados** din mesh |
| Plan orto → forțează Parter | Păstrează `levelMode` (Curte/Împrejmuire/Structură…) |
| S1–S3 privite lateral | Cameră pe **normala** planului de tăiere |
| Select prin clip | Hit respins dacă `distanceToPoint < 0` |
| Frame cu stâlpi full-height | Box clampat pe banda Z clipată |

## Încă deschis (următoarele commits)

- Fețe de secțiune umplute (caps)
- `site_layer` pe ~616 mesh-uri fără tag (generator)
- Completare views §4 (Ansamblu Casă/Proprietate, Subsol Camere vs Acces, …)
- Planuri page §6 + situație §7
- Capturi desktop/mobil documentate

## Test manual (când WebGL e OK)

1. Doar subsol → se văd `subsol_pardoseala_*`
2. Click `pardoseala_dormitor_e` → nivel **etaj**
3. Click pardoseală CT → clear **220**, nu 255
4. Curte → Plan orto → rămâne Curte
5. S1/S2/S3 → privire frontală pe tăietură
