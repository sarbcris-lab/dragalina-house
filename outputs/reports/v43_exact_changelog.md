# V43 rev4 — raport verificări

## 1. Suprafață utilă netă
- Anvelopă shoelace: **40.3535 m²** (poligon verde — include pereți int)
- Pereți int net: **1.1338 m²** (brut 1.3337 − goluri 0.2000; intersecții 0.0000)
- **Util net = 39.2197 m²** (= 40.3535 − 1.1338)
- 40,3535 **nu** e păstrat ca „util”

## 2. Ușă bucătărie–terasă
- Gol Y707–802 păstrat (în dreptul terasei)
- Balama **nord** (360, 707); foaie deschisă pe Y707, X360–445
- Blat sud X430/Y770: **fără intersecție** cu foaia
- Frigider Y550–615 / MSV Y625: în afara baleierii
- Alternativă spre terasă: posibilă, dar balama N spre bucătărie preferată
- Pereții **neschimbați**

## 3. Baie / WC
- Corp WC: **70×40 cm** (lungime pe X, facing est); rezervor vest 25 / vas 45
- Use zone: X110–185, Y150–200 — **nu** intersectează corpul lavoar (Y210–250)
- Lavoar: 55×40 la X165/Y210; clear frontal 45 cm
- Coloană NE Y40–105; gol glisant Y155–235 liber

## 4. Masă
- 70×110; **fără scaun sud**; 3 locuri zilnice (W+E+E)
- Traseu intrare–bucătărie cu scaune ocupate: **75 cm** (bandă Y390–465)
- Scaun vest: genunchi ~5 cm; la ridicare ocupă fâșia spre dormitor
- 4 locuri zilnice: **nu**; propunere **2 permanente + 2 ocazionale** (masă extensibilă)

## 5. Plan exportat
- Trepte 1–7 (sud) + 9–17 (est), podest +128, palier +288, sens ↑
- Cote camere / pereți 12,5 / goluri / mobilier / traseu 75
- Arce uși: centru = balama; capete = închis/deschis
- Blaturi (draw_order 1) **sub** electrocasnice (order 2)

## 6. Secțiune / depozit
- Ușă alt est: X668, **Y620–710**, lățime **90 cm**
- Structură rampă **20 cm** sub fața de mers
- Clear pe lățimea ușii: **204–236 cm**
- Traseu exterior: fața est bandă scară X680 → Y620
- Ușa sud rămâne ~123 cm (acces jos)
- Y630–720 ar fi dat min **188** cu struct 20 — mutată

## 7. Ipoteze păstrate (neschimbate)
- Placă **15 cm**
- Elevație **+32 cm** (2×16)
- Alcătuire perete palier **12,5 cm**
- Poligon cadastral reconstruit ≈145,7 ≠ 147
- Amplasarea clădirii **neschimbată** (SE ambiguu pe contur)

## Site
- corners_inside: {"NW":true,"NE":true,"SE":false,"SW":true}
- overflow: {"NW":{"inside":true,"dist_m":0,"note":null},"NE":{"inside":true,"dist_m":0,"note":null},"SE":{"inside":false,"dist_m":0,"note":"PIP=false, dist≈0 (contur/numeric)"},"SW":{"inside":true,"dist_m":0,"note":null}}
