# Placă principală 15/20 + podest consolă — v02

**Status:** STUDIU · alegere schemă · **NEVALIDAT** structurist / execuție  
**Geometrie:** FRAME curent (post-retragerе `C_E_LAND_SP`)  
**Înlocuiește ca direcție:** `v47_a1_frame_east_landing_solution_v01.md` (stâlp S+P — respins)

---

## 0. Restricții locked

| | |
|---|---|
| P sub podest | **living** liber |
| E pe aceeași zonă | **circulație rece** (scară) |
| Stâlp în living / acces beci | **interzis** |
| Compartimentare A7 | **nestructurală** (Knauf W112) |
| FF→FF | **288 cm** |

---

## 1. Podest — schemă consolă (prioritară)

### Geometrie studiu

| Element | Valoare |
|---|---|
| Placă palier (contur tip) | X≈535–680 · Y≈470–590 |
| Lucru placă | **transversal** (E→V), L ≈ **0,8–1,05 m** |
| Grindă B_E | prelungită sud de `C_E_PAL` (Y489) → **Y600** · consolă ≈ **1,11 m** |
| Stâlp nou | **nu** |
| `B_LAND_S_EDGE` | **nu** se reintroduce în forma care taie treapta |

### Încărcări (comparație, neconfirmate proiect)

| Zonă | Gk | Qk | q_Ed = 1,35G+1,50Q |
|---|---:|---:|---:|
| Planșeu locuință | 6,50 kN/m² | 2,00 | **11,78** |
| Podest rece | 5,50 | 3,00 | **11,93** |

Gk de refăcut din sandwich final (EB20 / Weber / Ströher pe unde e cazul; pe A7 = greutate ușoară).

### Predimensionare placă podest (fâșie 1 m)

\[
L=1,05\,\mathrm{m},\quad q_{Ed}=11{,}93\,\mathrm{kN/m²}
\]
\[
M_{Ed}=qL²/2=\mathbf{6{,}57\,\mathrm{kNm/m}},\quad
V_{Ed}=qL=\mathbf{12{,}52\,\mathrm{kN/m}}
\]
La h=15 cm, d≈12 cm → As,calc ≈ **140 mm²/m** (orientativ; min./fisurare/ancorare pot guverna).

### Predimensionare B_E consolă (~1,2 m)

- w_Ed ≈ 16,1 kN/m (bandă podest + grindă 30×35)
- M_Ed încastrare ≈ **11,6 kNm**

**Nu** e obstacolul principal. Decisive:

1. **torsiunea** B_E din placa în consolă  
2. ancorarea armăturii superioare  
3. nodul `C_E_PAL`  
4. deformare / fisurare  
5. hidro + **fono** (P cald / E rece — pași)

Parapetul și EB20 **≠** reazeme structurale.

---

## 2. Placă principală — comparație 15 vs 20 cm

Fără reazem pe A7. Deschideri de ordinul **~6,2 m** între cadre perimetrale (cu gol scară + contur neregulat).

### Sensibilitate fâșie 1-D (simplu rezemată, q_Ed=11,78)

| L | M_Ed | As orient. (d≈12) | L/d (h=15) |
|---:|---:|---:|---:|
| 6,20 m | 56,6 kNm/m | ≈1205 mm²/m | **51,7** |
| 3,175 m | 14,8 kNm/m | ≈316 mm²/m | 26,5 |

EC2 tipic (control săgeată L/d): simplu ~20; continuu capăt ~26; interior ~30 (în funcție de ρ).  
**L/d ≈ 52 pe 15 cm = alarmă deformații**, chiar dacă ULS „iese” pe armare.

### De ce nu grindă pe compartimentare acum

Grindă N–S pe ~6,15 m, bandă ~3,10 m, 30×35:

- w_Ed ≈ 38,5 kN/m  
- M_Ed ≈ **182 kNm** · V_Ed ≈ **118 kN**  

Înălțime 35 cm e insuficientă ca rezolvare „sigură” din acest calcul; una mai înaltă coboară plafonul. **Nu** se adoptă înaintea analizei 2D a plăcii.

### Variante păstrate pentru model

| Variantă | Clear la FF288 | Notă |
|---|---:|---|
| **A — placă 15 cm** pe 2 direcții, cadre perimetrale | **255** | preferată amenajare; trebuie să treacă SLS |
| **B — placă 20 cm** aceeași schemă | **250** | plan B dacă 15 eșuează la săgeată / gol |

Nu micșorăm stâlpii pentru mobilier. Nu umplem zona podest cu stâlpi ca să „salvăm” placa.

---

## 3. Perimetrale (orientativ)

Deschidere ~3,61 m, bandă ~3,10 m + zidărie → M_Ed ≈ **74 kNm**.  
30×35 = candidat gravitațional rezonabil; seism / tăiere / noduri = deschise.

EB20 ≈ 5,2 kN/m pe ~2,61 m înălțime (cu rezervă) — pe grinzile care duc zidărie, **nu** pe A7.

---

## 4. Ordine de lucru

1. ~~Retragere C_E_LAND_SP~~ — făcut  
2. **Model podest consolă** + torsiune B_E (în curs în geometrie studiu)  
3. **Model placă 15 vs 20** 2D (gol scară, Gk real)  
4. Secțiuni / util P≠E / rampe înclinate / șarpantă ușoară  

---

## 5. Codificare în FRAME

| ID | Stare |
|---|---|
| `B_E` | dy până Y600 · consolă sud 111 cm · fără stâlp nou |
| `C_E_LAND_SP` / `B_LAND_S_EDGE` | retrași |
| `east_landing_span` | `STUDIU_CONSOLA` |
| `slab_span_without_X320` | `COMPARATIE_15_20` |
| `heights_cm.structural_slab_cm` | 15 (alt 20 → clear 250) |
