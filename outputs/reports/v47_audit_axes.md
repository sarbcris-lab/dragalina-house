# V47 audit (pe rând)

## 1. Viewer / sursă — PASS

| Check | Rezultat |
|-------|----------|
| URL `?v47` → titlu V47 | pass (live) |
| Model `volume_v47_exact` | pass |
| Default **Doar parter** | pass (cod + live) |
| V46 separat (`volume.json`, link Model V46) | pass |
| Sursă `v47_exact.json` rev12 | pass |
| Banner concept / nu autorizabil | pass |

**Notă:** panou afișează `Util audit: undefined m²` — cosmetic, nu blochează modelul.

**Verificare:** http://localhost:5173/viewer/?v47

---

## 2. Terasă + parapet verde + mobilier — PASS (cu notă)

Criteriu = intenție rev12 (parapet **verde**, nu balustrada gri de contur).

| Check | Rezultat | Detaliu |
|-------|----------|---------|
| Placă terasă P dx≈340 | pass | `terasa` X0–340 Y675–975 |
| Parapet verde doar EST | pass | `terasa_parapet_est_neacoperit` X200 Y830–965 `#00ff22` |
| Oprește @ fațadă Y830 | pass | y0=830 |
| Mobilier VEST de verde | pass | `mob_terasa_*` x1≤180 < parapet x0=200 |
| Fără U verde vest/sud | pass | doar est + paravan X198 |
| Gol 2 trepte sud | pass | `terasa_gap_trepte` X210–340 |
| Parapete etaj înghețate | pass (out of scope) | sud/vest etaj neschimbate |

**Notă (OK, nu fail):** parapet **gri** sud-vest (`terasa_parapet_sud_w`, `terasa_parapet_vest`) rămâne ca balustradă de contur — altceva decât U-ul verde eliminat la rev12.

---

## 3. Intrare / PRIMIRE — PASS

| Check | Rezultat | Detaliu |
|-------|----------|---------|
| Cameră primire | pass | `hol_intrare` label PRIMIRE/HOL X360–535 Y680–770 |
| Intrare din terasă | pass | `intrare_parter` X330 Y680; `not_kitchen_workfront` |
| Fără bucătărie la intrare P | pass | buc P e NORD Y30–90, nu la ușă |
| Corp primire pe perete opus | pass | `corp_primire_p` X505 lipit X535 (vest buc_est) |
| Fără ziduri L sub palier intrare etaj pe P | pass | build skip + living_sub_palier deschis |
| Traseu terasă→PRIMIRE→living | pass | note P10 |

---

## 4. Living sub palier — PASS

| Check | Rezultat | Detaliu |
|-------|----------|---------|
| Zonă living_sub_palier | pass | X535–680 Y470–590 |
| Canapea P 90×170 | pass | `canapea_p` @550,420 est |
| TV vest | pass | `tv_p` @365,460 |
| Masă / măsuță | pass | `masa_dining_p` + `masuta_cafea_p` |
| Fără gol fantomă living P | pass | skip în build; 0 mesh |
| Fără ziduri L sub palier | pass | living deschis |

---

## 5. Bucătărie P / E — PASS

| Check | Rezultat | Detaliu |
|-------|----------|---------|
| Buc P nord | pass | Y30–90, front 290 |
| Nu la intrare | pass | intrare = PRIMIRE sud |
| `sud_bucatarie` P+E | pass | fără `levels` → build pe toate nivelele; note P+E |
| `buc_est` P de la Y590+ | pass | Y470–590 deschis sub palier |
| Etaj buc înghețat / separat | pass | terrace_by_level[1] înghețat; default Doar parter |

---

## 6. Scară exterioară / rampă — PASS

| Check | Rezultat | Detaliu |
|-------|----------|---------|
| flight_180 / rampă 1 | pass | definită în date |
| 2 trepte sud de placă | pass | gap + entry steps |
| Terasă ≠ sub scară | pass | deck X0–340 |
| Gol parapet pe trepte | pass | `terasa_gap_trepte` X210–340 |
| Mesh-uri scară | pass | 11 |

---

## 7. Subsol — PASS

| Check | Rezultat | Detaliu |
|-------|----------|---------|
| `basement_cm` | pass | status ipoteza_studiu |
| Clear 208 | pass | |
| Curte engleză + trepte | pass | |
| Acces sub rampă 2 | pass | |
| Mesh-uri + buton viewer | pass | 33 mesh; Doar subsol |

---

## 8. POT / documentație — PASS (deschis intenționat)

| Check | Rezultat | Detaliu |
|-------|----------|---------|
| `exclude_from_pot` pe neacoperit | pass | `terrace_by_level[0]` + `uncovered_south` |
| POT/urbanism neconfirmat | pass | flag deschis (așteptat) |
| Banner nu autorizabil | pass | |
| V46 intact | pass | `volume.json` |
| Structural nedenumit OK | pass | |

---

## Rezumat

| # | Aspect | Verdict |
|---|--------|---------|
| 1 | Viewer / sursă | **PASS** |
| 2 | Terasă + parapet verde | **PASS** |
| 3 | Intrare / PRIMIRE | **PASS** |
| 4 | Living sub palier | **PASS** |
| 5 | Bucătărie P/E | **PASS** |
| 6 | Scară exterioară | **PASS** |
| 7 | Subsol | **PASS** |
| 8 | POT / docs | **PASS** (POT oficial deschis) |

**Note minore (nu blochează):** `Util audit: undefined m²` în panou; parapete gri sud/vest = balustradă contur (nu U verde); POT/CUT cadastru rămân neconfirmate.
