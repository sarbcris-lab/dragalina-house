# Audit — fronturi, aliniere, curte · concept_v01

**Verdict: NECONFORM.** Orientarea urbană din v01 nu respectă regula de amplasare confirmată de beneficiar.

## Ce ai cerut (regulă de amplasare)

| Regula | Status în v01 |
|--------|----------------|
| Aliniere cu **cei doi vecini** pe front Dragalina | **LIPSĂ** — vecinii nu apar; nu e modelat calcanul / aliniamentul de front |
| Construcție **pe limita de proprietate** la Dragalina | **Parțial** — y=0 e declarat, dar există `offset_x=0.5` și anvelopă greșită; nu e clar „pe limită” față de vecini |
| **Curtea către Cloșca** | **GREȘIT** — Cloșca e etichetată est, fără zonă CURTE; clădirea pare „lipită” de logica de colț fără curte pe Cloșca |
| Front Dragalina construit, fără grădină între casă și stradă | **Parțial OK** în intenție, **nevizibil** corect pe planul de situație |

## Erori concrete în modelul generat

1. **Anvelopă teren 12,5 × 11,8 m** — proporții inventate, aproape pătrate; brief ESTIMAT: ~**20 m** pe Cloșca × ~**8,5 m** lățime (front Dragalina ~8 m). Inversat / distorsionat.
2. **Cloșca tratată ca latură scurtă de lângă casă**, nu ca frontul pe care se deschide **curtea**.
3. **Vecin stânga / vecin dreapta (calcan)** absenți din planul de situație și din volum.
4. **Amprenta schiță 9,30 m** pe Dragalina vs front ESTIMAT ~**8–8,5 m** → **conflict dimensional** (posibil overflow pe parcelă). Marcat; nu e „confirmat cadastral”.
5. Banda scară/terasă e desenată, dar **nu e legată** de relația Curte–Cloșca / aliniament vecini.

## Ce rămâne valid

- CF: 147 măsurată / 172 acte / 76 existent (≠ maxim).
- Schița 9,30×7,80 ca **ipoteză de compartimentare**, nu ca poligon parcelă.
- Cerința: 2 apt. + terase private + scară independentă.

## Corecție aplicată (concept_v01b)

- Teren de lucru: ~**8,5 m** pe Dragalina × ~**20 m** pe Cloșca (ESTIMAT).
- Casă **pe limita Dragalina**, aliniată între **vecin vest** și **vecin est (calcan)**.
- **CURTE** explicită către **Cloșca** (adâncimea lotului în spatele / pe flancul către Cloșca).
- Conflict 9,30 vs ~8,5: afișat pe plan; amprenta de pe situație folosită la scară pe frontul de lucru, cu avertisment — compartimentarea din schiță rămâne de redimensionat la următoarea iterație dacă confirmi frontul ~8,5.
