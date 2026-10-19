# S1 A1 — Maxim in-repo (fără FEM / geo / planuri)

**Status:** plafon calculabil în acest repo · **NU** proiect semnat  
**Medie note estimată:** **4.8/10** · plafon teoretic in-repo ≈ **6,5**

## Răspunsul tău

**Nu, upgrade-ul anterior nu era maximul din repo.** Acum am adăugat ce mai era calculabil fără Robot/geo:
seism pe stâlpi, punching, SLS căpriori, vânt fațadă, retenție+apă, As min hint.

**Da, există un plafon:** peste **~6,5/10 medie** nu poți urca onest fără:
1. studiu geo pe 131  
2. FE 3D + P100 pe bare  
3. planuri armare / confinare semnate  

---

## 1. Seism pe stâlpi (Vb=75.9 kN repartizat ∝ I)

| ID | Share | V | M_seis | Mrd | util N+Mseis | PASS |
|----|------:|--:|-------:|----:|-------------:|:----:|
| C_NW | 0.1 | 7.59 | 11.7 | 157.5 | 0.382 | **true** |
| C_N_MID | 0.1 | 7.59 | 11.7 | 280 | 0.401 | **true** |
| C_NE | 0.1 | 7.59 | 11.7 | 157.5 | 0.395 | **true** |
| C_W_MID | 0.1 | 7.59 | 11.7 | 280 | 0.312 | **true** |
| C_W_DORM | 0.1 | 7.59 | 11.7 | 157.5 | 0.259 | **true** |
| C_S_DORM_E | 0.1 | 7.59 | 11.7 | 157.5 | 0.176 | **true** |
| C_E_PAL | 0.1 | 7.59 | 11.7 | 280 | 0.505 | **true** |
| C_CASA_SCARA | 0.1 | 7.59 | 11.7 | 280 | 0.152 | **true** |
| C_S_INTRARE_W | 0.1 | 7.59 | 11.7 | 280 | 0.124 | **true** |
| C_S_INTRARE_E | 0.1 | 7.59 | 11.7 | 157.5 | 0.218 | **true** |

Pass **10/10** — tot fără confinare / factori de comportare pe element.

## 2. Punching placă (h=15 cm)

| ID | V_Ed | v_Ed | v_Rdc | PASS |
|----|-----:|-----:|------:|:----:|
| C_NW | 80.7 | 0.233 | 0.557 | **true** |
| C_N_MID | 126.5 | 0.341 | 0.557 | **true** |
| C_NE | 84.4 | 0.244 | 0.557 | **true** |
| C_W_MID | 93.8 | 0.252 | 0.557 | **true** |
| C_W_DORM | 46.6 | 0.134 | 0.557 | **true** |
| C_S_DORM_E | 23.5 | 0.068 | 0.557 | **true** |
| C_E_PAL | 165 | 0.444 | 0.557 | **true** |
| C_CASA_SCARA | 34.5 | 0.093 | 0.557 | **true** |
| C_S_INTRARE_W | 24.1 | 0.065 | 0.557 | **true** |
| C_S_INTRARE_E | 35.4 | 0.102 | 0.557 | **true** |

Pass **10/10**

## 3. SLS căpriori (săgeată)

| δ inst | L/300 | L/200 | PASS L/300 |
|-------:|------:|------:|:----------:|
| 13.3 mm | 16.6 | 24.9 | **true** |

## 4. Vânt fațadă

| | |
|--|--:|
| we windward | 0.766 kN/m² |
| F_ULS N/S | 43.7 kN |
| F_ULS E/W | 55.1 kN |
| vs Vb seism | 0.73× |

Seismul Vb rămâne dominant vs vânt fațadă pe ordin.

## 5. Retenție + apă (hw=1 m)

| Pa pământ | Phydro | M | As nec | PASS |
|----------:|-------:|--:|-------:|:----:|
| 18.6 | 5 | 17.1 | 209 | **true** |

fără seism pe zid (Mononobe-Okabe) — încă deschis

## 6. As min hint (NU plan armare)

| ID | EC2 min | P100 hint zonă | Sugestie |
|----|--------:|---------------:|----------|
| C_NW | 180 | 900 | 4φ14 / 8φ16 (hint — nu proiect) |
| C_N_MID | 240 | 1200 | 4φ14 / 8φ16 (hint — nu proiect) |
| C_NE | 180 | 900 | 4φ14 / 8φ16 (hint — nu proiect) |
| C_W_MID | 240 | 1200 | 4φ14 / 8φ16 (hint — nu proiect) |
| C_W_DORM | 180 | 900 | 4φ14 / 8φ16 (hint — nu proiect) |
| C_S_DORM_E | 180 | 900 | 4φ14 / 8φ16 (hint — nu proiect) |
| C_E_PAL | 240 | 1200 | 4φ14 / 8φ16 (hint — nu proiect) |
| C_CASA_SCARA | 240 | 1200 | 4φ14 / 8φ16 (hint — nu proiect) |
| C_S_INTRARE_W | 240 | 1200 | 4φ14 / 8φ16 (hint — nu proiect) |
| C_S_INTRARE_E | 180 | 900 | 4φ14 / 8φ16 (hint — nu proiect) |

> Hint cantitativ — **nota armare rămâne joasă** până există planuri dt.

## Note 1–10 (după max in-repo)

| Aspect | Notă |
|--------|-----:|
| geometrie | **8** |
| clear255 | **9** |
| placa | **6** |
| grinzi | **6** |
| stalpi_NM | **5** |
| flambaj | **5** |
| seism_Vb | **4** |
| seism_bare | **5** |
| punching | **5** |
| zapada | **6** |
| gk_pv | **6** |
| capriori_ec5 | **6** |
| vant_acoperis | **5** |
| vant_fatada | **5** |
| ancorare_pv | **5** |
| traseu_acoperis | **7** |
| cr0 | **5** |
| fundatii | **4** |
| geo131 | **1** |
| retentie | **5** |
| noduri | **3** |
| armare_hint | **3** |
| confinare | **1** |
| fem | **1** |

**Medie 4.8** · Peste ~6.5 medie din repo e iluzie — fără FE/geo/planuri semnate notele pe fem/geo/confinare rămân 1 și trag media.

## Plafon

| Nivel | Medie țintă |
|-------|------------:|
| Acum (max in-repo) | **4.8** |
| Maxim onest doar din repo | ~6.5 |
| + geo 131 | ~7.2 |
| + geo + FE | ~8.5 |
| Proiect semnat autorizabil | ~9.5 |

JSON: `s1_a1_max_inrepo_v01.json`
