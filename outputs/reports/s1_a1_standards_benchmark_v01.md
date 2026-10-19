# S1 A1 — Standarde, repere, status vs normă

**Status:** reper de lectură · **NU** certificat de conformitate  
**Amplasament:** Turda · schemă A1 · 2026-10-18  
**Canvas:** `a1-standarde-repere-structura`

## Cum se determină

| Fenomen | Standard | Formulă / idee | Input tipic | Ieșire |
|---------|----------|----------------|-------------|--------|
| Zăpadă | CR 1-1-3 | \(s=\mu_1 C_e C_t s_k\) | \(s_k{\approx}1{,}5\); \(\mu_1{\approx}0{,}8\) @30° | q pe ape → căpriori |
| Vânt | CR 1-1-4 | \(q_b=\tfrac12\rho v_b^2\); \(w_e=q_p c_{pe}\) | \(v_{b,0}\) hartă NA (~27 m/s inland) | Suctiune streșină / ancorare PV |
| Gk | CR 0 / 1-1-1 | sumă straturi | D3a+PV ≈0,9 kN/m² | pe toate barele |
| Combinații | CR 0 / EN 1990 | 1,35G+1,5Q (+ψ) | noi: q_Ed agregat | M/V/N |
| Flambaj BA | EC2 | \(\lambda=l_0/i\); \(\varphi\); \(N_{Ed}{\le}N_{Rd}\) | \(l_0{\sim}0{,}7…1{,}0\,H\) | NRd real |
| Flambaj/LTB lemn | EC5 | \(\sigma_{m,d}\); \(k_c f_{c}\) | C24; OSB = lateral | secțiune căprior |
| Seism | P100-1/2013 | \(V_b=\gamma_I S_d\lambda W/q\) | ipoteză ag=0,10g | forțe pe bare + confinare |
| Placă/grindă | EC2 | μ, V, L/d, δ≤L/250 | q_Ed 11,78 | h, armare |
| Fundații | NP112 + geo | σ ≤ Rc/FS | Rc studiu 200 kPa | pad |

## Unde suntem (A1)

### Acoperiș

| Criteriu | Reper | Noi | Status |
|----------|------:|----:|--------|
| sk | 1,5 (tipic) | 1,5 | ipoteză — confirmă hartă |
| q_Ed D3a+PV | — | **3,02** kN/m² (~177 kN) | calculat |
| Căprior 12×25 @1,2 | W≥M/σ | 1250≥~800 cm³ | ordin PASS |
| Vânt / ancorare PV | CR1-1-4 | — | **LIPSĂ** |
| Flambaj/LTB căpriori | EC5 | — | **LIPSĂ** |
| Reazem stâlpișori | pe centură | 100% B_W/B_E | geo PASS |
| Inel E | închis | B_E_S+B_S_SE | geo PASS |

### Cadru

| Criteriu | Reper | Noi | Status |
|----------|------:|----:|--------|
| Stâlp ≥300 | P100 | 30×30/40 | geo PASS |
| N+M (fără φ) | util&lt;0,85 | porți true | ordin — **fără flambaj** |
| Flambaj stâlpi | EC2 φ | — | **LIPSĂ** |
| Grinzi/placă | μ, L/250 | h40, placă15+mid | ordin PASS |
| Clear | ≥255 | 255 | LOCK |
| Vb | P100 oficial | 75,9 kN @ag=0,10 | doar global |
| Confinare | P100 | — | **LIPSĂ** |
| Geo 131 | Rc real | — | **LIPSĂ** |

## Vânt — pași până la număr

1. \(v_{b,0}\) din harta CR 1-1-4 (NA RO) pentru Turda  
2. Categorie teren + z streșină → \(c_e(z)\) → \(q_p\)  
3. \(c_{pe}\) pe zone acoperiș 30° (F–J) — suctiunea streșină critică pentru PV  
4. CR0: zăpadă **sau** vânt ca Q principal (ψ pe celălalt) — nu 1,5 pe ambele  

Ordin scară (nu verdict): \(v_b{\approx}27\) → \(q_b{\approx}0{,}45\) kN/m²; \(|w_e|\) streșină poate ~0,5–1+ kN/m².

## Flambaj — de ce N=A·fcd nu ajunge

- **Stâlpi:** fără \(l_0/\varphi\), rezervă axială e optimistă (mai ales colț + seism).  
- **Căpriori:** W≥M/σ = doar flexiune; lipsesc compresie pe pantă + LTB + lateral din OSB.

## Acoperire vs proiect semnat (estimare)

| Pachet | % | Următor |
|--------|--:|---------|
| Zăpadă+Gk acoperiș | ~60 | sk oficial + FE |
| Căprior flexiune | ~40 | EC5 LTB |
| Vânt+PV | **0** | CR1-1-4 pe A1 |
| Flambaj stâlpi | **0** | EC2 pe fiecare |
| Grinzi/placă | ~50 | FE + armare |
| Seism | ~20 | zonare 131 + bare |
| Detalii/confinare | **0** | proiectant |
| Fundații vs Rc | ~30 | geo 131 |

**Global estimat: ~40% din ce trebuie pentru proiect semnat.**

Surse: `s1_a1_calc_100_v01`, `s1_a1_calc_gaps_v01`, `v47_a1_frame_roof_pv_snow_bearing_v01`, A1.180.
