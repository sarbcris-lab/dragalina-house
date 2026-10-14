# V46 rev.8 — raport de pornire (inventar + conflicte)

**Data inventar:** 2026-10-14  
**Sursă autoritară aleasă:** `data/building/v46_exact.json` (**meta.rev = 7**, status `GEOMETRIE_V46_REV7`, ultimele note `r7g`)  
**3D generat din aceeași sursă:** `viewer/data/volume_v46.json` / `outputs/plans/04_volume_concept_v01.json`

## 1. Ce este cel mai recent (nu după numărul din nume)

| Strat | Fișier de încredere | De ce |
|--------|---------------------|--------|
| Geometrie casă P+E | `data/building/v46_exact.json` | rev.7 + r7g (trepte vizibile, etaj înghețat); oglindit în `viewer/data/` |
| Plan parter | `outputs/plans/11_v46_exact_plan.svg` | regenerat din JSON; titlu rev.7 |
| Plan etaj (nume) | `outputs/plans/14_v46_etaj_plan.svg` | **titlu** rev.7, dar exportul era aproape identic cu parterul — de corectat în r8 |
| Mobilier / MEP SVG | `12_*` / `13_*` | **byte-identice cu 11** — nefolosibile ca straturi separate până la r8 |
| Secțiuni | `outputs/plans/15_v46_sections.svg` | din pipeline v46 |
| Parcelă CF | `data/site/parcel_polygon_cf.json` + `parcel.json` | 145,741 m² reconstruit vs **147 m²** măsurat / **172 m²** acte |
| Poartă + parcări | `gate_poarta_v05.json` + `site_program_v05.json` | din `Plan_integrat_poarta_v05.png` |
| Amplasament cadastral | `inputs/cadastru/plan_amplasament_54602.png` | **`Plan_teren_Dragalina_v03` lipsește din workspace** |
| Subsol | `inputs/references/Subsol_coordonat_S09.pdf` | **nu există încă geometrie parametrică** |
| Pachet PDF | `inputs/references/Casa_Dragalina_pachet_complet_R03.pdf` | folosit ca **listă de intenții/probleme**, nu ca model-sursă |
| Referințe PDF 2026-10-14 | `Parter_coordonat_P10.pdf`, `Etaj_V46_rev7_plan_complet.pdf`, `Plan_general_curte_acces_C01.pdf` | documentare; sync în `data/` = obiectiv r8 |

Landmark-uri menționate (`14_v46_etaj_plan(3).svg`, `04_volume_concept_v01(7).json`) = sufixe Windows de download; în repo sunt fără `(n)`.

## 2. Versiuni folosite pentru r8

- **Casă / terase / scară exterioară / etaj înghețat:** V46 JSON rev.7 (r7g).
- **Sit poartă/parcări:** v05 (declarat din plan integrat) — de studiat variante 4/5/6 m.
- **Subsol:** cote din brief + S09 ca studiu → `basement_cm` (ipoteză).
- **Orientare:** N sus, Dragalina est (dreapta), Cloșca sud (jos) — confirmată în `parcel.json`.

## 3. Conflicte (nu ascunse)

| ID | Conflict | Status |
|----|----------|--------|
| C1 | Brief: intrare parter **prin zona de primire, nu direct în bucătărie**. Model r7: `intrare_parter` deschide în bucătărie. | **de rezolvat r8** — vestibul/primire la ușă |
| C2 | Brief: front bucătărie nord **290 cm**. Model: L pe est+sud (frigider/MSV/chiuvetă/plită), lățime cameră 175 cm. | **ipoteză/conflict** — nu încape 290 pe nordul actual al bucătăriei |
| C3 | `terrace_libera_formula` în JSON încă pe amprenta etaj; valoarea numerică e pe parter. | corectat la export r8 |
| C4 | Volume 3D: meta încă `3D_EXACT_V44` / `rev3` în stringuri. | corectat la build r8 |
| C5 | Etaj SVG ≠ filtre pe `terrace_by_level[1]` / goluri L1. | corectat export r8 |
| C6 | Subsol absent din model parametric. | adăugat ca **studiu** r8 |
| C7 | POT/CUT / 147 vs 172 m². | **neclarificat** — nu se declară confirmate |
| C8 | Extindere terasă pe scară = urbanism deschis. | marcat **de verificat** |
| C9 | R03 PDF poate conține erori Codex. | nu e autoritar |

## 4. Reguli de lucru r8

- Etaj: **înghețat** (`etaj_frozen`) — fără schimbare contur; doar verificare pocket/MEP și plan etaj real.
- Parter terasă: unificată acoperit+neacoperit, se oprește la **Y975** + **2 trepte** vizibile sud.
- Orice cotă nouă: **stabilit** / **ipoteză de studiu** / **de verificat**.
