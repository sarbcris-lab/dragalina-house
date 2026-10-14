# Audit scară beci utilizabilă (rev 31)

**PASS cu warn**

## Închideri greșite
- lățime clară scară ~72.5 cm (zid E 30 cm a mâncat din bandă)

## Trebuie închis
- EST/Dragalina = zid beton
- fără horn deschis în curtea de la sol pe amprentă

## Trebuie să rămână deschis / liber
- puț vertical sub rampă 2 (headroom scară −95→rampă)
- ușă acces ≥200 cm pe palier −95
- clar scară ≥90 cm (sau lățimea proiectată)
- traseu palier −95 → trepte fântână → curte

## Checks
| ID | Rez | Detaliu |
|----|-----|---------|
| stair_delta | pass | 9× riser → 155 |
| levels | pass | access -95 FF -250 |
| door_height_usable | pass | ușă h=210 cm (minim ~200) |
| door_sill_at_access | pass | sill z=-0.95 |
| headroom_landing_to_soffit_note | pass | −95 → soffit -42 = 53 cm (puțin) — de aceea open_shaft sub r2 e necesar |
| open_shaft_flag | pass | open_shaft=true |
| intrados_has_shaft_hole | pass | holes=1 |
| no_capac_blocking | pass | fără capac |
| stair_clear_width | warn | clar ≈ 72.5 cm (bandă 115 − W12.5 − E30) — sub 85 = îngust / aproape inutilizabil |
| teren_one_hole | pass | teren holes=1 |
| amprenta_no_hole | pass | amprenta holes=0 |
| zid_e_exists | pass | E z-2.5..0.95 |
| zid_n_exists | pass | N z-2.5..-0.42 |
| racord_steps | pass | n=3 |
| basement_treads | pass | n=8 |
| palier_jos | pass | ok |
| palier_acces | pass | ok |
| fantana_w | pass | ok |
| put_marker | pass | put h=4cm (doar marker) |
