# V46 — raport + comparație V45

## Modificări față de V45
1. Palier superior **Y470–590** (120 cm); perete living–palier **Y440–470**
2. Intrare **Y475–565** pe vest palier (balama N păstrată)
3. Buc est: frigider Y580–645 · MSV 645–705 · chiuvetă corp 60×60 Y705–765 (+5 cm la colț)
4. **Ecran frigider** X475–535 Y565–577,5 (60×12,5) — mascare laterală, fără vestibul
5. Duș: închidere **glisantă** pe est; «dreapta» = spre nord, privit din baie spre est
6. Masă **Ø100** @ X510,Y320 + 4 scaune cu rezervă retragere
7. Dungi albe scară: identificate și corectate (vezi mai jos)

## Dungi albe de lângă scară
- **Cauză:** SVG/3D V45 desenau treptele la X565+10 cu lățime 105 → dungă albă vest X565–575 (background). Palier la X567.5 lăsa 2.5 cm pe ambele flancuri. Nu erau rosturi între trepte.
- **Corecție:** trepte pe X565–670; parapet est X670–680 desenat și cotat; palier X565 dx110; bandă umplută sub trepte
- Nu erau rosturi între trepte; erau **goluri de reprezentare** (background SVG / spațiu nedesenat în bandă).

## Util
| | V46 | V45 |
|--|-----|-----|
| Anvelopă | 39.0100 | 39.1250 |
| Util geom. | **37.8787** | 38.0688 |
| Δ | **-0.1900** | |

## Corecții aplicate
- **palier_plus_10_nord**: palier superior Y470–590 (120 cm); living_palier Y440–470
- **intrare_plus_10_nord**: gol intrare Y475–565
- **dungile_albe_scara**: Identificat: goluri de desen (offset +10 vest pe trepte + inset palier). Corectat: trepte X565–670, parapet X670–680, palier X565.
- **ecran_frigider**: perete scurt X475–535 Y565–577.5 (60×12.5); maschează frigiderul dinspre intrare; fără vestibul
- **v46r2_buc_est**: buc_est Y470–860; gol intrare Y475–565 pe racord corect
- **v46r2_dining_45**: masă Ø100 @ 515,325; scaune pe diagonale (~45°); scaun W cardinal eliminat
- **v46r2_dus_60**: glisantă est; privit est dreapta=sud; gol deschis 70 cm
- **v46r2_clearances**: recalculate 2D; eliminate 290 cm / warning fals scaun N–canapea
- **v46r3_pocket_study**: 3 sisteme pocket modelate cu casete; fezabilitate: 1× NOT_FEASIBLE, 2× CONDITIONAL
- **v46r3_dorm_fit**: noptiere 40×35; TV dorm Y500+; dulap glisant util~63; gol terasă X120–270
- **v46r3_mep**: PRANA dorm+living; AC studiu; extract baie + hotă separate
- **v46r4_fitout_mep**: baie/dorm/living/buc/terasă/intrare: fitout + MEP/hidro/electrice ca rezerve; canapea gabarit desfăcut; gol terasă rămâne PROBĂ; pocket neschimbat
- **v46r5_geometry_fixes**: TV living consolă; noptiere N/S; duș acces sud+șine; WC vest+casetă dorm CONDITIONAL; TV/AC dorm fețe reale; intrare/buc în contur; dining AABB rotit; îngroșare 0.15375 m²
- **v46r6_feedback**: AC out vest; TV≠casetă (regulă+consolă/solid); WC sud baie; bagaje SV; dulap intrare 30×70; podest=115 ca scara
- **v46r6b_layout_tweaks**: pat−20N; fără bagaje; TV centrate+întărire; dulap_intrare vest de frigider (era overlap=«cocotat»); fără depozitare_baie_inalt
- **v46r6c_entry_etaj**: gol_intrare si pe etaj; dulap_intrare Y410 (nu langa frigider)
- **v46r6d_no_shoe_cabinet**: eliminat dulap_intrare (pantofi)
- **v46r7_parter_terrace_entry**: intrare parter pe fost buc_terasa; terasă X0–565 Y675–975 (S neacoperit); parapet; etaj păstrează intrare scară
- **v46r7b_landing_parapet_gap**: palier X210-340 Y680-975; parapet sud intrerupt pe latimea celor 2 scari
- **v46r7c_etaj_freeze**: eliminat spill parapet/mobilier terasă parter pe etaj; etaj_frozen snapshot; terrace_by_level[1] lock
- **v46r7d_terrace_south_socle**: terasă Y675-1055 peste trepte; soclu mozaic pe elevație; etaj neschimbat
- **v46r7e_no_parapet_left_stairs_stay**: eliminat parapet sud-vest lângă scări; entry_steps readus Y975
- **v46r7f_parapet_both_sides_steps_only**: parapet sud stânga restaurat; acces doar pe latimea treptelor
- **v46r7g_steps_visible**: terasa opreste Y975; 2 trepte sud vizibile; fara entry_landing overlay
- **restore_r7g**: restaurat ultima variantă bună r7g; anulat pachetul r8

## Dining (Ø100)
- Poziție finală: X510 Y320
- Table→canapea: — cm
- Scaun N în folosire→canapea: **— cm**
- 
- 290 cm = lățime living, **nu** circulație liberă

## Clearances
- Intrare↔frigider: undefined cm (+ mâner 8 cm)
- Ecran↔frigider: **2.5 cm** (montaj/aerisire de confirmat)
- Vest ecran→perete dorm: **115 cm**
- Pat↔foaie dorm: 112.5 cm
- Dacă montajul cere gap 5 cm: mutare frigider +2,5 sud și MSV+chiuv +2,5 sud (gap colț 5→2,5); **modulele 60 cm neschimbate** — neaplicat

## Avertismente / ipoteze
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

## Ipoteze păstrate
Placă 15 · elevație +32 · cadastru 147 (POT) · amplasare neschimbată · WC cadru 15 · canapea desfăcută neconfirmată

## Nu «verificat»
Tâmplărie dorm–terasă, montaj gol buc–terasă, mecanism glisant duș (schematic), fronturi dulap.
