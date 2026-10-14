# Audit viewer — ce vezi tu vs ce trebuie

## Verdict (din captura ta)

**Te uiți la V46, nu la V47.**

| Indicator în poză | Valoare | Semnificație |
|---|---|---|
| Titlu | **Dragalina 131 · V46** | model greșit |
| Model | **`volume_v46_exact`** | fișier V46 |
| Buton activ | Doar parter | OK ca filtru, dar pe V46 |
| Link disponibil | „Model V47” | trebuie apăsat |

De aceea vezi: bucătărie la intrare, terasă sub scară, fără parapet verde pe muchia terasei — **asta e layout-ul V46**, nu modificarile V47.

## Ce trebuie să deschizi

URL corect:

`http://localhost:5173/viewer/?v47`

(nu `?v=v46`, nu click pe „Model V46”)

În sidebar trebuie să apară:

- titlu **V47**
- model **`volume_v47_exact`**
- text verde: terasă vest de scară · parapet verde · bucătărie NORD

Apoi **Doar parter**.

## Checklist V47 (după ce ești pe V47)

| Element | Cum arată corect pe V47 Doar parter |
|---|---|
| Bucătărie | module pe **NORD** (nu L la ușă) |
| Intrare | PRIMIRE/HOL + corp lipit spre est |
| Terasă | placă **oprește înainte de rampa 1** (nu sub scară) |
| Parapet verde | pe **dreapta terasei**: de la stânga celor 2 trepte galbene → dreptul ușii |
| Rampă 1 | culoare **albastru-gri** (scară), nu terasă |
| Sub palier etaj | living deschis + canapea est |
| Masă | între bucătărie N și canapea |

## De ce „Util audit: undefined” pe V46

În V46 `building_summary.useful_audit_m2` poate lipsi → sidebar arată `undefined`. Pe V47 câmpul e populat din build.

## Concluzie

Nu e că V47 „nu e făcut” în captura asta — **nu e încărcat V47**. Comută pe **Model V47** / `?v47` și verifică din nou.
