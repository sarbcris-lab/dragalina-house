# S1 A1 — Viewer A1.203: caps + layers + views

**Status:** rundă 2 din debate prezentare · **NU** închide §6–7 (planuri/capturi)  
**Commit țintă:** A1.203

## Livrat

| Item | Detaliu |
|------|---------|
| Fețe secțiune | `section_cap` MeshBasic pe planul S1–S3 (fără clip pe material) |
| `site_layer` | `enrich_volume_layers_v01.mjs` + hook în `build_v47_3d` · ~1206 mesh-uri taguite |
| Casă vs Proprietate | Casă = volum fără sit; Proprietate = casă + gard/alee/curte |
| Subsol Camere \| Acces | Camere: pardoseli/ziduri, acces estompat · Acces: traseu curte→scară, camere estompate |
| Fundații | Default **off** (toggle) |

## Test manual

1. S2 · Casa scării → față bej pe tăietură (nu gol negru)
2. Casă → fără teren/gard; Proprietate → sit vizibil
3. Subsol · Camere → `subsol_pardoseala_*` dominante
4. Subsol · Acces → put/scară/ușă dominante
5. Click element → `site_layer` / `category` / `level` din volume

## Încă deschis

- Views §4 rest (dacă mai rămân din debate)
- Planuri page §6 + situație §7
- Capturi desktop/mobil
