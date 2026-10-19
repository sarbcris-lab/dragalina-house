# S1 A1 — Fundații pe ipoteză teren tip Dragalina 120

**Status:** studiu de rezistență în repo · **NU** semnat · **NU** geo 131  
**Rol agent:** continuă dimensionarea ordin până la structurist / geo oficial  
**Generat:** 2026-10-19T08:25

## Lock geo-studiu

| | |
|--|--:|
| Sursă | Memoriu 120 / EMDI 2012 (citat) |
| Pconv 120 | **310** kPa |
| γ | 1.4 |
| **q_allow studiu** | **221** kPa |
| Adâncime recom. 120 | 1.15 m (beciul nostru e mai adânc → talpa la ≈−3,10) |
| Apă | neîntâlnită — nu elimina hidro pe 131 |

> Studiu AI / ordin — nu semnatură OIS/structurist. De înlocuit cu geo 131 + PT semnat.

## Pad-uri stâlpi (σ ≤ 221 kPa)

| ID | N kN | Pad cm | σ kPa | PASS |
|----|-----:|-------:|------:|:----:|
| C_NW | 369.6 | 130×130 | 219 | **true** |
| C_N_MID | 574.9 | 165×165 | 211 | **true** |
| C_NE | 385.5 | 135×135 | 212 | **true** |
| C_W_MID | 433.2 | 145×145 | 206 | **true** |
| C_W_DORM | 222 | 105×105 | 201 | **true** |
| C_S_DORM_E | 122.2 | 80×80 | 191 | **true** |
| C_E_PAL | 741.6 | 185×185 | 217 | **true** |
| C_CASA_SCARA | 176.5 | 90×90 | 218 | **true** |
| C_S_INTRARE_W | 131.5 | 80×80 | 205 | **true** |
| C_S_INTRARE_E | 173.3 | 90×90 | 214 | **true** |
| C_SHAFT_E_PIER | 20.3 | 80×80 | 32 | **true** |

## Talpă perimetru retenție

| | |
|--|--:|
| Lățime | **80** cm |
| N ordin | 41.5 kN/m |
| σ | 52 kPa |
| PASS | **true** |
| Pereți | subsol_reten_n, subsol_reten_s, subsol_reten_w, subsol_reten_e |

## Elevație

Retenția coboară pe **fața superioară a tălpii** (fără gol orizontal talpă↔zid).  
Mesh: `subsol_fg_perim_*` + zid retenție `z0 = top talpă`.

## Următor (tot fără structurist extern)

1. ~~Talpă+elevație în 3D~~ (acest pachet + volume:a1)  
2. Sensibilitate q_allow 180 / 221 / 250  
3. Armare min hint elevație / talpă  
4. Când există: **geo 131** înlocuiește acest lock

JSON: `s1_a1_foundations_geo120_v01.json`
