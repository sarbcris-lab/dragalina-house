# S1 A1 — Confinare P100 (etrieri stâlpi, hint)

**Status:** spațiere ordin · **NU** plan dt · **NU** semnat  
**Generat:** 2026-10-19T08:25  
**Regulă tip:** s_crit ≤ min(b₀/2, 8Ø_long, 17,5 cm) · l_crit ≥ max(h_c, l_c/6, 45 cm)

## Stâlpi

| ID | Secțiune | util | Long. | s crit | s mijloc | l_crit | Adopt |
|----|----------|-----:|-------|-------:|---------:|-------:|-------|
| C_NW | 30×30 | 0.461 | 8φ16 | **12** | 20 | 45 | φ8 @ 12 cm pe 45 cm de la nod (sus+jos) / @ 20 cm mijloc |
| C_N_MID | 40×30 | 0.571 | 8φ16 | **12** | 20 | 45 | φ8 @ 12 cm pe 45 cm de la nod (sus+jos) / @ 20 cm mijloc |
| C_NE | 30×30 | 0.475 | 8φ16 | **12** | 20 | 45 | φ8 @ 12 cm pe 45 cm de la nod (sus+jos) / @ 20 cm mijloc |
| C_W_MID | 30×40 | 0.479 | 8φ16 | **12** | 20 | 45 | φ8 @ 12 cm pe 45 cm de la nod (sus+jos) / @ 20 cm mijloc |
| C_W_DORM | 30×30 | 0.276 | 8φ16 | **12** | 20 | 45 | φ8 @ 12 cm pe 45 cm de la nod (sus+jos) / @ 20 cm mijloc |
| C_S_DORM_E | 30×30 | 0.14 | 8φ16 | **12** | 20 | 45 | φ8 @ 12 cm pe 45 cm de la nod (sus+jos) / @ 20 cm mijloc |
| C_E_PAL | 30×40 | 0.671 | 8φ16 | **12** | 20 | 45 | φ8 @ 12 cm pe 45 cm de la nod (sus+jos) / @ 20 cm mijloc |
| C_CASA_SCARA | 30×40 | 0.147 | 8φ16 | **12** | 20 | 45 | φ8 @ 12 cm pe 45 cm de la nod (sus+jos) / @ 20 cm mijloc |
| C_S_INTRARE_W | 40×30 | 0.105 | 8φ16 | **12** | 20 | 45 | φ8 @ 12 cm pe 45 cm de la nod (sus+jos) / @ 20 cm mijloc |
| C_S_INTRARE_E | 30×30 | 0.21 | 8φ16 | **12** | 20 | 45 | φ8 @ 12 cm pe 45 cm de la nod (sus+jos) / @ 20 cm mijloc |

## Note

- Etrier **închis** + ciocuri 135° în zonă critică (P100).  
- Stâlpi cu flag REVIEW (`C_E_PAL`, `C_N_MID`): prioritate FE.  
- Nu înlocuiește calculul α / ωwd — doar temă de detaliere.

JSON: `s1_a1_p100_confinement_v01.json`
