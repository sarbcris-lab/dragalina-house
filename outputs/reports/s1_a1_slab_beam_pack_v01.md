# S1 A1 — Comparație pachete placă / drop grindă

**Status:** sensibilitate · **NU** schimbă automat adoptul  
**Clear sub grindă:** **255** cm HARD · buildup **12** cm  
**Generat:** 2026-10-19T12:24

FF→FF = 255 + drop + placă + 12

## Tabel

| Pachet | Placă | Drop | h grindă | FF→FF | Δ vs 307 | Placă δ | B_X_MID | B_Y410 | Vol placă×2 | PASS |
|--------|------:|-----:|---------:|------:|---------:|--------:|:-------:|:------:|------------:|:----:|
| **P15_D25** 15 + drop25 (ADOPT) | 15 | 25 | 40 | **307** | +0 | 1.5/10.1 ✓ | ✓ δ18.6 | ✓ δ17.8 | 11.95 (Δ+0) | **true** |
| **P16_D20** 16 + drop20 | 16 | 20 | 36 | **303** | -4 | 1.3/10.1 ✓ | ✗ δ26.7 | ✗ δ25.6 | 12.75 (Δ+0.8) | **false** |
| **P18_D18** 18 + drop18 | 18 | 18 | 36 | **303** | -4 | 0.9/10.1 ✓ | ✗ δ26.7 | ✗ δ25.6 | 14.34 (Δ+2.39) | **false** |
| **P18_D20** 18 + drop20 | 18 | 20 | 38 | **305** | -2 | 0.9/10.1 ✓ | ✓ δ22.2 | ✓ δ21.2 | 14.34 (Δ+2.39) | **true** |
| **P20_D15** 20 + drop15 | 20 | 15 | 35 | **302** | -5 | 0.7/10.1 ✓ | ✗ δ29.5 | ✗ δ28.3 | 15.94 (Δ+3.99) | **false** |
| **P20_D20** 20 + drop20 | 20 | 20 | 40 | **307** | +0 | 0.7/10.1 ✓ | ✓ δ18.6 | ✓ δ17.8 | 15.94 (Δ+3.99) | **true** |

## Ranking (doar PASS)

| Criteriu | Pachet |
|----------|--------|
| Cel mai scund (FF→FF) | **P18_D20** (305 cm) |
| Cel mai puțin beton placă | **P15_D25** |
| Placă cea mai rigidă (δ min) | **P20_D20** (δ=0.7 mm) |
| Adopt curent | **P15_D25** |

## Detaliu grinzi critice

### B_X_MID (L=6.052 m, q=18.85)

| Pachet | h | δ_cr/lim | PASS |
|--------|--:|---------|:----:|
| P15_D25 | 40 | 18.6/24.2 | **true** |
| P16_D20 | 36 | 26.7/24.2 | **false** |
| P18_D18 | 36 | 26.7/24.2 | **false** |
| P18_D20 | 38 | 22.2/24.2 | **true** |
| P20_D15 | 35 | 29.5/24.2 | **false** |
| P20_D20 | 40 | 18.6/24.2 | **true** |

### B_Y410 (L=5.988 m, q=18.85)

| Pachet | h | δ_cr/lim | PASS |
|--------|--:|---------|:----:|
| P15_D25 | 40 | 17.8/24 | **true** |
| P16_D20 | 36 | 25.6/24 | **false** |
| P18_D18 | 36 | 25.6/24 | **false** |
| P18_D20 | 38 | 21.2/24 | **true** |
| P20_D15 | 35 | 28.3/24 | **false** |
| P20_D20 | 40 | 17.8/24 | **true** |

## Verdict

- **Păstrează P15_D25** dacă vrei minim beton și accepti FF→FF 307.  
- **Treci la P18_D20** dacă vrei clădire mai scundă (-2 cm) fără a pierde PASS pe ordin.  
- **P20_D20** dacă prioritatea e confort SLS placă (mai greu).  
- Nu recomandat: P16_D20, P18_D18, P20_D15.

> Schimbarea pachetului = FF etaj + scară P→E + 3D — doar după decizie explicită.

JSON: `s1_a1_slab_beam_pack_v01.json`
