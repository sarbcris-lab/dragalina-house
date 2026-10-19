# Ghene MEP v01 — pe plan A1 înghețat

**Dată:** 2026-10-18 · **A1.157**  
**Prioritate:** planuri P/E înghețate. Subsol subordonat (conflict → beciul se modifică).

## Reguli

1. **Etaj:** util **intact** — doar traseu în pardoseală / gol placă (drop), fără casetă în cameră.
2. **Parter:** volume de ghenă acceptate unde spui tu (baie + colț hol→scară).
3. Overlay — nu mută pereți / stâlpi / mobilier.
4. Subsolul se aliniază pe **drop points**.

## Canalizare / apă / curent — trebuie separate?

| Sistem | Trebuie ghenă proprie? | Practică |
|--------|------------------------|----------|
| **Canalizare + vent** | Da, coloană dedicată (țevi sol) | O casetă / un drop vertical |
| **Apă** (rece/cald) | Nu obligatoriu separat | Poate împărți **aceeași** casetă cu canalizarea (compartiment sau spate) |
| **Curent** | Nu ca „ghenă” de țevi | Tub / nișă / tablou — de preferat **nu** amestecat liber cu canalizarea; poate fi nișă lângă aceeași zonă tehnică |

**Concluzie:** nu ai nevoie de 3 ghene. Ideal **1–2 casete** la P (WC + opțional mid-est / hol-scară); etaj = zero volum util.

## Poziții A1.157

| Id | Nivel | Unde | Sisteme | Util |
|----|-------|------|---------|------|
| `ghena_baie_wc` | P | lângă WC | canalizare + vent | 0,08 dacă e casetă în baie |
| `ghena_baie_mid_est` | P | NE baie, lângă `C_N_MID`, perete spre est | apă / nișă curent | 0,08 (poate fuziona cu WC dacă încape) |
| `ghena_buc_hol_scara` | P | colț hol spre scară (vest de `C_CASA_SCARA`) | canalizare+apă buc (colector) | 0,09 |
| `drop_etaj_baie` | E | peste coloana baie | drop | **0** |
| `drop_etaj_buc` | E | la CHI etaj → spre colector P | drop | **0** |

### Impact util dacă casetele P sunt volume în cameră

- **P:** −0,08 −0,08 −0,09 = **−0,25 m²** → ~38,35 (încă ≥37)  
- **E:** **0** (cerința ta)  
- Dacă fuzezi mid-est în WC: P **−0,17** (doar WC + hol-scară)

## Bucătărie

Buc P (nord) ≠ buc E (sud). Colectare orizontală în planșeu → **un** drop în colțul hol→scară (`ghena_buc_hol_scara`).
