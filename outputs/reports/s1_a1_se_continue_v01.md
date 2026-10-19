# S1 A1 — Continuare „structurist în repo” (fără OIS)

**Status:** studiu de rezistență maxim posibil aici · **NU** proiect semnat  
**Ipoteză teren:** similar Dragalina **120** (Pconv 310 → q_allow **221** kPa)  
**Data:** 2026-10-19 · A1.185

## Mandat

În absența structuristului, continuăm dimensionarea **ordin** + geometrie fundații, cu etichetă clară: de înlocuit la geo 131 + PT.

## Făcut acum

1. Lock geo-studiu 120 → q_allow 221 kPa  
2. Pad-uri stâlpi recalculate  
3. **Talpă perimetru 80 cm** sub retenție + puț  
4. **Elevație:** retenție pe talpă (gol orizontal = 0)  
5. Raport: `s1_a1_foundations_geo120_v01.md`

## Următoarele ture (tot în repo, ordine)

| # | Acțiune | Livrabil |
|---|---------|----------|
| 1 | Armare min hint stâlpi/grinzi/retenție/talpă (As, etrieri tip) | `s1_a1_rebar_hint_v01` |
| 2 | Sensibilitate fundații q=180/221/250 | tabel |
| 3 | Detaliu nod C_E_PAL + întoarsă (As/ancorare ordin) | notă |
| 4 | Șarpantă: listă piese + cuie/șuruburi tip | BOM studiu |
| 5 | Regenerare FE handoff cu geo120 lock | handoff v03 |

## Ce rămâne imposibil fără extern

- Semnătură / răspundere legală  
- Geo **măsurat** pe 131  
- FEM validat (Robot etc.) — putem doar adânci ordin  
- DTAC / autorizare

## Cum folosești rezultatele

- **Cumpărare / temă:** da, ca fezabilitate  
- **Execuție / autorizare:** nu — predă unui structurist cu pachetul FE + acest lock
