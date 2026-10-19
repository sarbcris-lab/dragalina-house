# S1 A1 — Viewer filtre V1 (A1.195)

**Criteriu închidere (debate):** subsol fără șarpantă · acoperiș fără stâlpi întregi · curte cu puț complet · default P+E

## Schimbări

| View | Comportament |
|------|----------------|
| **Ansamblu P+E** | Default la încărcare |
| **Doar subsol** | `put_reten_*` + retenții + uși + scară; clip Z ≤ soffit L-1; **fără** șarpantă |
| **Doar parter / etaj** | Clip Z pe nivel; fără șarpantă pe etaj (acoperiș = buton 3) |
| **Curte** | Acces beci + `put_reten_*`; **fără** `subsol_pardoseala*` |
| **Acoperiș** | Timber + shell (+ centuri E); **fără** `stalp_a1_*` |
| **Fundații** | Toggle separat |
| **WebGL fail** | Mesaj + linkuri planuri (nu „Încărcare…” infinit) |
| **Mesh list** | Ascuns în Debug |

## Nerezolvat (runde următoare)

- Secțiuni ClipPlanes adevărate (3 plane obligatorii)
- Plan ortografic / select cameră + util
- Planuri SVG Amenajare/Cote
- Împrejmuire: stil linie hotar vs gard (acum ambele vizibile, casă estompată)
