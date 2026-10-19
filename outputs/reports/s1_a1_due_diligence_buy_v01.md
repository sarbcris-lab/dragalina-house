# Due-diligence cumpărare — Dragalina 131 (A1)

**Pentru:** decizie cumpărare teren / temă structurist  
**Nu este:** proiect semnat, DTAC, ofertă de execuție  
**Data:** 2026-10-19 · pachet structural studiu A1.185–187

---

## Verdict scurt

**Fezabil pe ordin** ca casă P+E+beci pe schema A1, cu acoperiș 30°+PV și clear ≥255 — **cu condiția** să existe geo pe 131 și proiect de rezistență semnat înainte de autorizare/execuție.

Ipoteza teren e din **vecinătatea 120** (q_allow ≈ **221 kPa**), nu măsurătoare pe parcelă.

---

## Ce e deja PASS (studiu in-repo)

| Domeniu | Rezultat |
|---------|----------|
| Amenajare A1 | Înghețată; clear ≥255; FF→FF 307 |
| Cadru BA | Stâlpi ≥30; NO_LAMELE (fără stâlp lamele în cadru) |
| Placă 15 + B_X_MID | Ordin OK |
| Grinzi critice / SE | Ordin OK (CR0 scalat tot PASS) |
| Șarpantă D3a | EC5 OK; BOM + uplift solbanc PASS @ M12/80 cm |
| Fundații pe q=221 | Pad-uri OK; talpă **80→115 cm** (alunecare/răsturnare hw10+seism) |
| Retenție | Flex OK inclusiv apă 1 m + seism ordin |
| Nod C_E_PAL | Eforturi modeste; FE nod tot obligatoriu |

Detalii: `s1_a1_fe_INDEX.md` → handoff v03.

---

## Riscuri care pot schimba costul / fezabilitatea

| Risc | Impact | Ce deblochează |
|------|--------|----------------|
| **Geo 131 mai slab** (ex. q≈180) | Pad-uri +~20 cm / +~3,5 m² | Studiu geo pe parcelă |
| **Apă + seism pe retenție** | Talpa 80 insuficientă → adopt studiu **B=115 cm** (sau pinten/drenaj) | Geo + footing_stability |
| Apă freatică | Hidro + drenaj + As retenție | Geo + hidro |
| Seism / ag oficial ≠ 0,10g | Stâlpi, retenție, fundații | P100 pe amplasament |
| Nod C_E_PAL / consolă | Detaliu armare / torsiune | FE structurist |
| Autorizare | Fără PT semnat = nu construiești legal | Structurist + arhitect |

Sensibilitate: `s1_a1_foundations_sens_v01` (180 / 221 / 250).

---

## Ce poți decide acum (cumpărare)

| Întrebare | Răspuns din repo |
|-----------|------------------|
| Încape casa A1 pe parcelă cu structură plauzibilă? | **Da** (ordin) |
| Pot turna după aceste calcule? | **Nu** |
| Merită geo înainte de ofertă fermă? | **Da — prioritate #1** |
| Am nevoie de stâlp la lamele? | **Nu** (structural) |
| Acoperiș lemn 30°+PV e OK pe ordin? | **Da** (D3a întâi) |

---

## Ordine recomandată după cumpărare / înainte

1. Geo **Rc + apă** pe 131  
2. Structurist cu pachetul FE (`s1_a1_fe_INDEX.md`)  
3. Confirmare ag / sk / vb pe hărți  
4. PT + DTAC  

---

## Limite oneste

Media notelor in-repo ≈ **5/10**; plafon fără FE/geo ≈ **6,5**. Autorizabil (~9+) cere semnătură externă — nu e un eșec al studiului, e limita legală.
