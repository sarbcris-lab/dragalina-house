# V47 — raport concept

## Față de v46 r7g
- Intrare prin **primire** (nu linia buc–terasă).
- Terasă unită + **paravan** (`terrace_guards_cm`).
- **Subsol** studiu sub rampă2 + curte locală.
- Etaj **înghețat** (terasă level 1 din `terrace_by_level[1]`).

## Util geometric
**37.8787 m²** · terasă liberă ~**9.57 m²**

## Avertismente
- **parter_etaj_entries_differ** (info): Parter și etaj au intrări pe fețe diferite (vest terasă vs est scară) — intenționat r7
- **pocket_bath_dorm_wc** (critical): Pocket baie←dorm NEFEZABIL cu WC pe poziția aprobată; studiu batantă pe același gol
- **fridge_gap_2_5** (warn): 2,5 cm ecran–frigider = ipoteză montaj, NECONFIRMATĂ
- **path_entry_chairs** (warn): Traseu intrare cu scaune ocupate încă strâns (~51 cm în r2)
- **wc_to_nisa_17_5** (info): WC–lateral nișă dulap 17,5 cm
- **assemblies_unconfirmed** (warn): Alcătuiri perete/planșeu/fonic — REZERVE NECONFIRMATE
- **terrace_door_probe** (info): Gol dorm–terasă X120–270 = PROBĂ; baseline X140–290
- **prana_ac_reserves** (warn): PRANA/AC = studiu/rezerve; extract baie + hotă separate obligatorii
- **parcel_vs_cf** (info): Poligon ~145,7 m² vs 147 m² CF — problemă deschisă; amplasare/urbanism NECONFIRMATE
- **fridge_gap_2_5** (warn): gap ecran–frigider 2,5 cm IPOTEZĂ
- **sofa_open_overlap_table** (info): Canapea desfăcută fără overlap masă
- **assemblies_unconfirmed** (warn): Alcătuiri / Rw / structură NECONFIRMATE
- **parcel_vs_cf** (info): Poligon≠CF — urbanism deschis
- **tv_thicken_local** (info): TV pe casetă doar cu întărire locală perete (aplicată ca rezervă geometrică 15 cm)
- **terrace_expand_urbanism** (warn): Terasă parter extinsă pe zona scării — verificare POT/amplasare/urbanism NECONFIRMATĂ

## Open issues
- pocket baie←dorm: batantă de detaliat (pocket nefezabil cu WC aprobat)
- pocket living/dorm CONDITIONAL
- TV: îngroșare locală dacă ecranul cere mai mult pe peretele comun
- AC outdoor vest — distanțe vecini/PRANA NECONFIRMATE
- gap frigider 2,5 cm IPOTEZĂ
- gol terasă dorm = PROBĂ
- alcătuiri/urbanism NECONFIRMATE
- terasă parter extinsă — urbanism/POT deschis
- parter vs etaj: intrări pe fețe diferite
- pocket baie←dorm: batantă de detaliat
- alcătuiri/urbanism NECONFIRMATE
