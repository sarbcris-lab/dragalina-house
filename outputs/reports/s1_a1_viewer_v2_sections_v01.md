# S1 A1 — Viewer V2 secțiuni + plan orto (A1.196)

## Criteriu (debate rundă 2)

Fiecare vedere se încadrează corect; cotele din UI = model (A1.194/195).

## Livrat

| Control | Comportament |
|---------|----------------|
| **S1 · Acces beci** | ClipPlane vertical prin puț/scară; view subsol; cote clear 220 |
| **S2 · Casa scării** | ClipPlane pe A6/scară P–E; ansamblu; clear ≥255 / FF 307 |
| **S3 · Camere+acoperiș** | ClipPlane prin living; înălțimi 255/280/274/307 |
| **Secțiune off** | Scoate planul de tăiere |
| **Plan orto** | Cameră ortografică de sus pe nivelul activ (P/E/S) |
| Helper | PlaneHelper roșu pe planul de tăiere |

ClipPlanes se aplică pe **toate** materialele (nu hide pe nume).

## Limite V2

- Capetele tăiate nu sunt încă „umplute” (solid hatch) — doar clip + helper.
- Planele S1–S3 sunt preseturi pe cote site; reglaj interactiv (slider) = rundă ulterioară.
- Select cameră + util pe click = V3 (coordonare planuri).
