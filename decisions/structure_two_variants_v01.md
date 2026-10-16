# Două variante de studiu structural — LOCK

**Status:** LOCK beneficiar · 2026-10-16  
**Amenajare A1:** neatinsă ca referință; studiile pot adapta doar ce e necesar pentru structură + anvelopă, cu raport Δ util / POT / clear.

## Ținte comune (ambele variante)

| Țintă | Prag |
|-------|------|
| **POT / amprentă** | ~**40%** max (RLU) — EST pe limită, fără +cm afară fără acord |
| **Util** | **≥ 37 m²** / nivel (metodă proiect) |
| **Clear** | **≥ 255 cm** camere locuite (preferință placă 15 @ FF actual) |
| **Seism / rezistență** | P100 + CR / EC — **calcul**, nu ipoteză |
| **Interior** | izolare **termică** (anvelopă caldă) + **fonică** (între unități / scară / planșee) |

`declared_buildable = false` până la pachet de calcul pe varianta aleasă.

## Varianta A — Cadre BA

- Stâlpi: **dimensiune minimă ≥ 30 cm** pe ambele laturi (P100-1/2013 §5.3.2.2 / §5.4.2.2).
- Tip: **≥ 30 × 40** (sau 30×30 la colțuri unde e cazul) — thru ≥30.
- **Fără proeminență în cameră:** betonul **înlocuiește local** falie EB20; ETICS rămâne **afară**.
- Umplutură necarrantă EB20 între stâlpi; A6 = anvelopă caldă spre scară rece (~300 mm finit).
- Livrabil: `v47_a1_frame_*` (existent; COL_THRU corectat la 30).

## Varianta B — BA cu pereți structurali

- Sistem: diafragme / pereți BA (eventual dual) — **nu** doar cadre.
- Grosimi, poziții, goluri: de studiat ca să **nu** sacrifice util ≥37 / POT ~40% / clear 255.
- Fonic: masa betonului ajută; tot trebuie detalii pe rosturi / scară / planșeu (nu „beton = gata”).
- Livrabil: studiu separat (de deschis) — **nu** amestecat în frame fără etichetă clară.

## Cum alegem ulterior

Comparație pe același brief:

1. Δ util P/E vs 37  
2. Δ amprentă / POT  
3. Clear 255  
4. Traseu încărcare + fezabilitate calcul (consolă palier, noduri, retenție)  
5. Performanță termică + fonică (A1/A2/A6/A7 + planșeu)  
6. Impact amenajare (stâlpi / nervuri în camere)

## Ce nu facem

- Nu declarăm conform P100 pe stâlpi &lt; 30 cm.
- Nu creștem amprenta „pentru izolare” pe EST fără acord.
- Nu scădem clear sub 255 ca să „salvăm” o variantă fără să raportăm conflictul.
