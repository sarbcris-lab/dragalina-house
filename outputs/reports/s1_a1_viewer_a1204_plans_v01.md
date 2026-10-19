# S1 A1 — A1.204: planuri page + situație

**Status:** debate §6–7 · capturi §5 încă deschise  
**Commit țintă:** A1.204

## Livrat

| Item | Detaliu |
|------|---------|
| Pagina planuri | Antet compact · note extensibile · **Încadrează / zoom / pan / fullscreen** · legendă laterală |
| Situație arh. | Nord dreapta-sus · retrageri cu linii · cartuș scurt + scară 5 m |
| Situație fundații | `a1_plan_situatie_fundatii.svg` — tălpi/pad/retenții vs hotar |
| Mobilier | Scaune ca formă rotită (nu AABB ~63) |
| Etichete | Terasă = „m² terasă (nu util)” · gol ușă ≠ clear scară / trecere |

## Test

1. `/outputs/plans/` — planul umple viewportul la deschidere (nu 530 px header)
2. Încadrează / wheel zoom / drag
3. Tab Situație · Fundații — tălpi vizibile + cotă colț→hotar
4. Parter — scaune dining ≈ diamant 45°, nu pătrate mari
5. TERASĂ — etichetă „nu util”

## Încă deschis

- Capturi desktop/mobil documentate (§5)
- Views §4 rest (acoperiș 3 prezentări, structură pe categorii)
- Moduri Cote/Structură pe plan = filtre CSS studiu (nu layere SVG încă)
