# Plan — definitivare structură 100% (Varianta A)

**Status:** PROPUNERE LOCK · 2026-10-16  
**Variantă:** A — cadre BA (`structure_two_variants_v01.md`)  
**Amenajare A1:** neatinsă ca referință  
**Regulă:** geometrie închisă → FE pe schema reală → adoptare secțiuni → abia apoi util din terasă/scară  
**Done când:** zero `conflict_geometric` / `calcul_lipsă` pe registrul structural + tabel secțiuni adoptate + `declared_buildable` rămâne `false` până la proiectant semnat (model = 100% coerent, nu autorizație)

---

## Definiție „100%”

| Nivel | Înseamnă | Nu înseamnă |
|-------|----------|-------------|
| **Model FRAME 100%** | Toate elementele dimensionate, trasee de încărcare închise, geo fără conflicte, registru gol | Autorizație / DTAC |
| **Proiect rezistență 100%** | Memoriu + planșe semnate structurist | — |

Acest plan duce **modelul** la 100%. Semnătura rămâne la structurist.

---

## Decizii de blocat acum (înainte de FE)

Fără aceste 3 răspunsuri, FE produce variante, nu o structură unică.

| # | Întrebare | Opțiuni | Impact |
|---|-----------|---------|--------|
| D1 | Clear **≥255 și sub grinzi**? (azi **241** sub grindă h35) | (a) hard peste tot → ridicare FF / grinzi mai plate / acceptare locală pe traseu grindă · (b) 255 doar sub placă, 241 OK pe grinzi | FF, scări, util vertical |
| D2 | Fațadă la stâlpi | (a) **pilastrii** ~9–10,5 cm (model actual) · (b) finisaj **plan** cu anvelopa (ETICS pe stâlp adus pe planul zidului) | aspect, detalii ETICS, POT marginal |
| D3 | Acoperiș | (a) **șarpantă ușoară** pe cadre · (b) **BA** (coamă/căpriori betonate) | greutate pe stâlpi, noduri +581, cost |

**LOCK 2026-10-16 (beneficiar):** D1=(b), D2=(a), D3=comparație la FE — **implicite acceptate** ca să vedem rezultatele; se pot schimba doar cu impact explicit pe 40/37/255.

---

## Faza 0 — Baseline înghețat (1 zi)

**Input:** HEAD FRAME actual.

Checklist (nu redeschide fără conflict nou):

- [x] Stâlpi thru ≥30, protr interior 0, A1/A2 pe stâlp
- [x] LOCK-1R consolă palier (fără stâlp în living)
- [x] B_E→Y590; B_Y470 P+E; grindă întoarsă dy=25
- [x] FF P=+48; placă țintă 15 (clear 255 sub placă)
- [x] Fără C_E_LAND_SP
- [x] Export **pachet FE**: planuri 38/39/40 + tabel stâlpi/grinzi + cote Z levels_cm + registru conflicte

**Livrabil:** `outputs/reports/v47_a1_frame_fe_input_pack_v01.md` (liste + fișiere) — **emis 2026-10-16**.

---

## Faza 1 — Închidere geo rămasă (2–4 zile, paralel cu start FE)

Doar ce încă blochează un model unic:

| ID | Acțiune | Criteriu închis |
|----|---------|-----------------|
| `basement_retaining` | ~~BA retenție~~ **LOCK 2026-10-16** geo BA 20 cm | Mesh `subsol_reten_ba_*`; calc împingere încă deschis |
| `B_X360_wide_pad` | ~~accept pad 70~~ **LOCK 2026-10-16** | Pad dx=70 acceptat; aliniere stâlpi amânată |
| `etics` colțuri | Detaliu colț N/W, N/E (overlap benzi) — fără redesign A1 | Note șantier în raport; mesh OK |
| Clear 241 | Aplică D1 | Lock în `conflicts_resolution` |

**Nu în Faza 1:** tăiere terasă/scară pentru util; Varianta B.

---

## Faza 2 — FE pe schema reală (ordine obligatorie)

Ordinea din `frame_calc_package_v01.md` — **nu sări**:

| Pas | Calcul | Ieșire minimă | Dacă fail |
|-----|--------|---------------|-----------|
| 2.1 | **Stâlpi** N/M/V · CR0+P100 · confinare | Secțiune min care trece (≥30×L); along optim (poate &lt;40) | Mărește along / clase beton-armătură — **nu** &lt;30, **nu** protr în cameră |
| 2.2 | **Nod C_E_PAL + consolă** B_E (101+~105) | Armare consolă, torsiune, ridicare | Consolă mai scurtă / grindă mai tare — **fără** stâlp în living fără acord |
| 2.3 | **Placă 15** living + palier (SLS/ULS) | 15 OK sau fail demonstrat | Tradeoff A–D din `conflicts_resolution_v01.md` — **decizie ta** înainte de îngroșare |
| 2.4 | **Grinzi** B_N/W/E, Y645, Y830, B_X360 | b≥20, h vs clear (D1) | h/b sau FF |
| 2.5 | **Grindă întoarsă** + pier | Capăt V + sandwich | Local BA / fundație |
| 2.6 | **Fundații + retenție** pe ipoteză 131 (geo parcelă când există) | Geo: pad 80 + strip 60 + retenție BA — **done studiu**; Rc 131 deschis | Nu „310 kPa vecin = OK” |
| 2.7 | **Acoperiș** (D3) — ambele variante comparate pe același brief | Comparație ordin D3a/D3b în calc_2_6_2_7; FE pe D3a întâi | Fără stâlpi noi în camere |

**Livrabil:** tabel `element → secțiune min care trece → secțiune adoptată → status`.

---

## Faza 3 — Adoptare în model (1–2 zile după FE)

1. Scrie secțiunile adoptate în `structure_frame_study_cm` (stâlpi, grinzi, placă, FG, acoperiș).
2. Regen `study:frame` + planuri 38–40 + volum.
3. Actualizează registru: fiecare ID → `rezolvat_calcul` sau `rezolvat_geometric` + ref calcul.
4. Log în `decisions/log.md`.

**Criteriu Faza 3:** `conflicts_unresolved` structural = [] (sau doar note execuție necritice).

---

## Faza 4 — Util ≥37 (abia după Faza 3)

Conform `roadmap_geometry_then_calc_v01.md`:

- Recuperare din **terasă + scară** (nu băga palierul rece în util).
- Corecție contabilă A6 dacă e cazul.
- Raport Δ POT / util / clear pe fiecare tăietură.

---

## Faza 5 — Poartă „structură model 100%”

| Check | Da/Nu |
|-------|-------|
| Zero conflict geo pe cadre / placă / consolă / retenție / acoperiș | |
| Tabel secțiuni adoptate din FE | |
| Clear 255 (și D1 pe grinzi) respectat sau excepție scrisă | |
| POT ~40% / util țintă pe drum (Faza 4 poate fi paralelă finală) | |
| `declared_buildable` încă `false` până la structurist | |
| Planuri + volum sync pe același HEAD | |

**Semnătură internă:** „Model FRAME structuralmente închis — așteaptă proiectant.”

---

## Ce rămâne în afara acestui plan

- Varianta B (pereți structurali) — doar dacă A eșuează pe consolă/util după FE
- Studiu geo teren 131 (input extern; până atunci ipoteză + sensibilitate)
- Proiect execuție / DTAC / semnare OAR/MLPAT

---

## Ordine pe săptămâni (orientativ)

| Săpt. | Focus |
|-------|--------|
| 1 | D1–D3 + Faza 0–1 (retenție BA geo, pack FE) |
| 2–3 | FE 2.1–2.5 (stâlpi → placă → grinzi) |
| 3–4 | FE 2.6–2.7 (fundații + acoperiș) + Faza 3 adoptare |
| 4+ | Faza 4 util + poartă 100% |

---

## Prima acțiune imediată (tu)

Confirmă **D1, D2, D3** (sau „implicit recomandat”). Apoi: (1) pack FE, (2) model retenție BA subsol, (3) trimitere la structurist / FE.
