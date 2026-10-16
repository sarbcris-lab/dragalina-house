# Pachet calcul Varianta A — cadre BA

**Status:** LOCK proces · 2026-10-16  
**După:** geometrie A6 + FF+48 + stâlpi ≥30 flush (P100)  
**Înainte de:** tăiere terasă/scară pentru util (doar după minim structural stabilit)

## 1. Minim acceptat (norme — nu ipoteză)

| Element | Minim | Sursă |
|---------|-------|--------|
| Stâlp cadru — latura mică | **≥ 300 mm** | P100-1/2013 §5.3.2.2 / §5.4.2.2 |
| Grindă cadru — lățime | **≥ 200 mm** | P100 §5.3.2.1 |
| Clear camere | **≥ 255 cm** | Law 114 / prioritate proiect |
| Util / POT | ≥37 m² / ~40% | prioritate proiect — **după** structură |

**Optim stâlpi (țintă studiu):** cea mai mică secțiune **≥30×?** care trece ULS/SLS/P100 pe schema reală, **fără proeminență în cameră** (beton înlocuiește local falie; ETICS afară). Along nu e „40 din obișnuință” — iese din calcul.

## 2. Ce e închis geometric (nu mai e „ghicit”)

- Stâlpi continui S–P–E, thru ≥30, protr interior **0**
- Sud: bump ETICS ~9 cm **afară** la stâlpi (nu în cameră) — de cuantificat POT
- L A6 etaj: palier rece AFARĂ; living P sub placă
- B_E → Y590; B_Y470 pe palier P+E; LOCK-1R consolă (fără stâlp în living)
- FF P = +48; placă 15 țintă clear 255
- Fără C_E_LAND_SP pe transport

## 3. Calcule obligatorii (ordine)

1. **Stâlpi** — eforturi N/M/V pe combinații CR0 + P100; verificare secțiune min 30×L; confinare zone critice  
2. **Nod C_E_PAL / B_E** — consolă palier (sud 101 cm + vest ~105 cm); torsiune, ancorare, ridicare  
3. **Placă palier + planșeu living** — SLS săgeți; ULS; L/d pe deschideri reale (fără X320 structural)  
4. **Grinzi perimetrale** (B_N, B_W, B_E, B_Y645, B_Y830, B_X360 pad) — M/V, lățime ≥20, h vs clear 255  
5. **Grindă întoarsă Y590** — fit uşă, pier, fundație  
6. **Fundații / retenție subsol** — geo pe parcelă (nu doar 310 kPa vecin)  
7. **Acoperiș** — traseu încărcare pe stâlpi/centuri  

Livrabil: tabel element → secțiune minimă care trece → secțiune adoptată (optim).

## 4. Proeminențe — stadiu

| Tip | Stadiu |
|-----|--------|
| Proem. **în cameră** | **0** pe toți stâlpii de cadru |
| Bump **afară** (sud) | ~9 cm la 4 stâlpi sud — singurul „plus” față de falie 20+ETICS |
| Along 40 vs 30 | De redus **doar dacă calculul permite** (optim) |

Nu mai „îmbunătățim” prin stâlpi &lt;30 sau prin ieșire în living.

## 5. Util — după structură

Recuperare ≥37 pe E: **terasă + scară** (cum a cerut beneficiarul), **după** ce minimul structural e stabilit pe calcule — ca să nu tăiem de două ori.