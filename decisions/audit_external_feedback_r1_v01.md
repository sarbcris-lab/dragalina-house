# Audit extern (feedback) — rundă 1 · răspuns proiect

**Sursă:** audit pe GitHub `83f6534` (recenzor extern)  
**Data preluare:** 2026-10-16  
**Regulă:** prima rundă = **calcul + reprezentare**; fără sacrificiu util / terasă / lățime scară.

## Premisă legală (actualizat beneficiar)

- **Ignorat** ca blocaj: „apartament 2 camere / 52 m²”.
- **Autorizare:** perete dorm↔living **jos** → o cameră (living deschis); 37 m² = prag informativ 1 cameră, nu PASS pe util.
- Util geometric rămâne NECONFIRMAT (calcul separat de încadrarea legală).

## Ordine cerută de recenzor → status

| # | Cerință | Status rundă 1 |
|---|---------|----------------|
| 1 | Un calcul util + un tabel P/E (fără schimbări de plan) | **în curs / aplicat** — vezi mai jos |
| 2 | Decupare goluri reale + anvelopă N corectă + A3 baie | backlog |
| 3 | Geometrie finită vs parcelă (depășiri afișate) | backlog |
| 4 | Schemă structurală fără proem. / fără mărire amprentă | backlog (lock slab_edge + falie=zidărie deja pe HEAD) |
| 5 | Scară↔beci, apoi terasă dacă e nevoie | backlog |
| 6 | Secțiuni constructive + FE pe geometrie corectată | backlog |
| 7 | Regen planuri/rapoarte din aceeași sursă | parțial (FRAME 38–40); 21–25 rămân v47_exact |

## Fix rundă 1 — util (pct. 2)

**Bug demonstrat:** `polyE` exclude deja scara rece; apoi se scădea integral footprint A6 L (~1,515 m²), din care majoritatea e **în afara** conturului → util E subestimat (ex. 36,609).

**Corecție:** `thermal` = aria obstacolului **intersectată cu conturul util** (`rectAreaInsidePolyM2`). A6 vest (în afara polyE) nu se mai scade.

**Canon:** `areas_cm.useful_by_level` + `areas_cm.frame_study_areas` — același P/E geometric.  
Etichete libere (`useful_etaj_labels_sum_m2`) = **informativ**, nu înlocuiesc geometricul.  
`status_util = NECONFIRMAT` · `declared_pass_util = false`.

## Ce nu facem în rundă 1

- Mutări de plan pentru „a câștiga” util.
- Îngustare scară / tăiere terasă.
- Declarație PASS pe 37 sau pe POT 40%.
- Adoptare valoare unică „finală” fără arhitect + FE.
