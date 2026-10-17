# Audit planuri A1 — v0.64 (2026-10-17)

**Surse:** `data/building/a1_architecture.json` · `outputs/plans/a1_plan_{parter,etaj}.svg` · `a1_detaliu_fatada_est.svg`  
**Generator:** `src/build_a1_architecture.mjs`  
**Precedente:** `audit_a1_plans_layers_v01.md` (straturi A1.17)

---

## Verdict

**Planurile P/E sunt coerente geometric pentru studiu ARH** — compartimentare, scară, mid/palier, terasă −8, util net ≥37 pe ambele nivele.

**Nu îngheța încă** (poartă): gol ușă etaj 86 cm (sub 90/100), pier `C_E_LAMELE` 20×40 (FE), util = geometric NECONFIRMAT autorizare, stâlpi încă PROVIZORIU.

| Poartă (`arhitectura_A1_v01`) | Status |
|-------------------------------|--------|
| Planuri P/E OK ca împărțire | **DA (studiu)** — cu rezerve MED/LOW de mai jos |
| → util shoelace → S1 | Util net calculat; **S1 după confirmare beneficiar** |
| Nu → listă modificări ARH | Vezi „Deschis” |

---

## Demonstrat OK

| Domeniu | Verificare | Rezultat |
|---------|------------|----------|
| Corp | 680×860 finit | OK (A0) |
| Clear / riser | ≥255 / ≤16 | 255 / 16 · FF↔FF 19×16=304 |
| Mid E–V | `C_W_MID` = `C_E_PAL` @ Y410–450 | OK |
| Palier N | clear @ față S mid (Y450); A6 pe mid | OK |
| Ușă / stâlp L | `intrare_etaj` Y450–536; `C_CASA_SCARA` @536 | OK aliniat |
| Living E | L: N→XE; S de mid doar până la `buc_est` | OK (fără palier rece) |
| Buc E | net **5,03 m²** ≥5 | OK |
| Util P / E | **38,65 / 37,66** ≥37 | OK geometric |
| R2 ↔ palier | palier sud = R2 nord (588,7) | OK |
| Podest SE | 115×115 nemărit greșit spre pier | OK (undo A1.61) |
| Terasă | −8 V+E, −8 sud; parapet vest pe stâlpi | OK vs A1.63/64 |
| Izolație cant | `C_S_INTRARE_E` S+E; **fără** placare pe `C_S_DORM_E` | OK (63b) |
| Capăt est A6 P | izolație pe finit est `palier_inchidere` | OK |
| Straturi anvelopă | ISOVER continuu pe finit; EB20 între stâlpi | OK (moștenire A1.17) |
| Parapet scară E | doar etaj; `C_E_LAMELE` P+E | OK |

---

## Defecte / rezerve

| # | Sev | ID | Observație | Recomandare |
|---|-----|-----|------------|-------------|
| 1 | **MED** | `gol_etaj` | Gol `intrare_etaj` = **86** cm (lipit de mid + buc ≥5). Sub 90 (A1.42) / 100 (A1.43). | Confirmă beneficiar: acceptă 86, sau mută L / buc_est ca să revină ≥90 fără a pierde buc≥5 |
| 2 | **LOW** | `pier_FE` | `C_E_LAMELE` **20×40** — studiu; FE poate cere ≥30 pe fațadă | Amână la S1 / FE; nu blochează ARH |
| 3 | **INFO** | `util_auth` | Util = sumă camere net − proem. − A7/A8; **NECONFIRMAT** autorizare | Nu declara PASS legal pe 37 |
| 4 | **INFO** | `stâlpi` | Toți stâlpii `PROVIZORIU_A0` | S1 confirmă poziții/secțiuni |
| 5 | **INFO** | `mitrare` | Colțuri 2D: straturi se suprapun fără mitrare | Normal la studiu plan |

---

## Util (recapitulare)

| Nivel | Net m² | vs 37 | Brut camere | Shoelace contur (ref.) |
|-------|--------|-------|-------------|-------------------------|
| Parter | **38,65** | +1,65 | 39,14 | 39,91 |
| Etaj | **37,66** | +0,66 | 38,15 | 38,58 |

Metodă: vezi canvas `raport-suprafete-utile-a1` / `areas` în JSON.  
**Exclus:** terasă, scară/palier rece, banda zid A6 est.

Etaj pe camere (net): baie 6,42 · dorm 12,65 · living+dining 13,56 · buc 5,03.

---

## Scară / est (checklist scurt)

| Element | Cote |
|---------|------|
| Palier superior | Y450–588,7 · clear ~105×139 · +304 |
| R2 | Y588,7 · going 270 · 9×30 |
| Podest | Y858,7 · 115×115 · +144 |
| Secv. est etaj | plin → lamele L≈130 H210 → pier 20×40 → parapet podest |
| Geam living | L≈220,4 · H150 · prag90 · centru ~Y215 |

---

## Ce nu e în auditul ăsta

- FE / dimensionare stâlpi-grinzi (S1)
- Secțiuni constructive detaliate
- Conformare P100 / autorizare util
- 3D / randare Belgian ca dovadă cote

---

## Pachet pentru debate (beneficiar)

1. **Acceptă** planurile P/E ca împărțire studiu? (Da/Nu)
2. **Gol ușă etaj 86** — OK, sau cere ≥90/100 (cu impact pe L / buc)?
3. **Util geometric** e suficient ca prag studiu, sau vrei recalcul pe altă metodă înainte de S1?
4. **Nu schimba acum** (fără conflict nou): corp 680×860, mid@430, palier N@450, terasă −8, fără izolație pe `C_S_DORM_E`.

---

## Fișiere

- Acest audit: `decisions/audit_a1_plans_v02.md`
- Log: A1.63–64 în `decisions/log.md`
- Util canvas: `raport-suprafete-utile-a1`
