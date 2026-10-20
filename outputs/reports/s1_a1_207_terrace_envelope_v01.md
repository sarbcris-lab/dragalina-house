# A1.207 — Geamuri / fronton / plafon terasă + cale acoperiș

**Verdict structural (onest):** schema anterioară **nu** trata corect terasa acoperită ca reazem de streșină. Solbancul S stătea pe „CONC” la Y≈850, dar pe banda terasă (X≈0–312) lipseau stâlp + grindă sud — căpriorii păreau în consolă pe aer. Cutia de beci **exclude** excavarea sub terasă (A1.165); asta e OK pentru S, dar P/E trebuie să poarte acoperișul.

## Ce s-a corectat (studiu geometric, FE confirmă)

| Element | Fix |
|---------|-----|
| `C_SW_TERASA` | stâlp SV terasă @ Y820 (P+E, fără S) |
| `B_W_TERASA` | centură V C_W_DORM → C_SW_TERASA |
| `B_S_TERASA` | grindă sud terasă → C_S_INTRARE_W (reazem solbanc) |
| `placa_terasa_structura_*` | placă BA sub finisaj, continuous cu casa |
| `acoperis_plafon_terasa` / `_casa_scara` | închidere vizuală sub acoperiș |
| Fronton E | 18 cm, klinker `#c45a3a`, 2 cm proud |
| Geamuri | sticlă pe fața exterioară + opacitate 0.62 |

## Ce rămâne `calcul_lipsă`

- Capacitate C_SW_TERASA / B_S_TERASA / consolă placă terasă
- Fundație pe stâlp terasă (fără beci) — pad / grindă pe sol
- FE pe calea căpriori → solbanc → B_S_TERASA → stâlpi
