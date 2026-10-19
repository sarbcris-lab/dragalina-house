# Jurnal decizii

## 2026-10-19 — A1.204: planuri page §6 + situație §7

Debate prezentare rundă 3 (fără amenajare/amprentă):
1. `/outputs/plans/` — antet compact, note extensibile, pan/zoom/Încadrează/fullscreen.
2. Situație arh. + **Situație fundații** (două planșe); nord clar; cotă colț→hotar; cartuș + scară 5 m.
3. Planuri A1: scaune rotite; terasă ≠ util; gol ușă ≠ clear scară / trecere.
Deschis: capturi §5 · rest views acoperiș/structură categorii · layere SVG reale pe moduri.

## 2026-10-19 — A1.203: viewer — caps + site_layer + Casă/Proprietate + Subsol Camere|Acces

Debate prezentare rundă 2 (fără amenajare/amprentă):
1. Fețe de secțiune umplute pe S1–S3 (`section_cap`).
2. Backfill `site_layer` / `category` / `level` pe volume (`enrich_volume_layers_v01` + hook build).
3. Views: **Casă** vs **Proprietate**; **Subsol · Camere** vs **Subsol · Acces**.
4. Fundații default off.
Deschis: planuri §6–7 · capturi · rest views dacă mai apar.

## 2026-10-19 — A1.202: viewer — clasificare / selecție / cote / secțiuni ⊥

Debate acceptat (runda prezentare): **fără** schimbare amenajare/amprentă.
1. Pardoseli beci → bucket **subsol** (nu parter).
2. Select: nivel din id/z · cameră pe nivel corect · CT beci ≠ clear 255 P.
3. Grindă: h/intrados din mesh, nu doar heights globale.
4. Plan orto **păstrează** view-ul activ.
5. S1–S3: cameră **perpendiculară** pe planul de tăiere.
6. Click: ignoră hit-uri pe partea clipată.
7. Încadrare: clamp pe banda Z clipată.
Deschis: fețe de secțiune umplute · site_layer pe toate mesh-urile · views complete §4 · planuri §6–7.

## 2026-10-19 — A1.201: fațadă E — geam real + închidere scară P

- **Geamuri:** toc antracit + sticlă (`toc_*` / `sticla_*`) pentru geam/terasă/glisante — nu doar gol cyan.
- **Uși:** panou antracit simplu în gol.
- **Casa scării → Dragalina:** `fatada_scara_est_inchidere_p` Y450→860, soclu→FF etaj (închide gaura de pe P).
- Lamele/solid etaj neschimbate. Reper: `a1_detaliu_fatada_est.svg`.

## 2026-10-19 — A1.200: talpă pe geometria DESENATĂ (inward)

- Problema: calc B115 (heel+umplutură γ·H) **≠** desen (toe0 inward, heel sub placă beci).
- Pe desen @115: FS_s **0,79** / FS_o **0,68** — **FAIL**.
- Adopt ordin: **B = 200 cm** inward (FS_s 1,13 / FS_o 1,84 / σ 106) — `s1_a1_footing_drawn_v01`.
- Alt: B185 + pinten 40 cm. Calc vechi heel+fill rămâne referință, nu suprascrie B.
- Status: `VALIDATED_ON_DRAWN_GEOMETRY_ORDIN` (nu semnat FE/geo).

## 2026-10-19 — A1.199: lamele + fațadă est scară în 3D (= plan etaj)

- Plan etaj: plin → **lamele L129,6 H210** → `C_E_LAMELE` → parapet — acum și în 3D (`fatada_scara_*`, lamele metal antracit).
- Pier `C_E_LAMELE` = **ARH/fațadă** (`stalp_arh_…`), nu în cadru FE.
- Scară etichete: **19×16,16 = FF→FF 307** (nu mai 19×16=304 pe JSON).
- Curte engleză: ziduri fântână E/W (−95→0) + trepte lipite sud casă Y860; vizibilă în Curte/Subsol.
- Detaliu: `outputs/plans/a1_detaliu_fatada_est.svg`.

## 2026-10-19 — A1.198: viewer V4 — împrejmuire / curte / situație

- View Împrejmuire: `limit_*` (hotar pe casă) ≠ `gard_`/`poarta_` (construit); casă estompată; auto/alee.
- View Curte: gard+porți+teren+puț retenție+acces; fără `limit_*` și fără pardoseli camere beci.
- Plan situație A1: `outputs/plans/a1_plan_situatie.svg` (hotar CF, amprentă, cutie/puț, terasă, porți, auto, retrageri, POT).
- Annotări acces+apă în viewer (`sitePanel`) + select pack + tab Situație pe planuri.
- Generator: `src/export_a1_site_plan_v01.mjs`.

## 2026-10-19 — A1.197: viewer V3 — selecție cote + coordonare

- Click 3D → panou util / gol≠trecere / stâlp / grindă.
- Toggle Coordonare (goluri/stâlpi/grinzi evidențiate).
- Pack `a1_select_v01.json` + avertismente; planuri index cu util + notă uși.

## 2026-10-19 — A1.196: viewer V2 — secțiuni ClipPlane + plan orto

- S1 Acces beci · S2 Casa scării · S3 Camere+acoperiș — ClipPlane pe toate straturile + PlaneHelper.
- Plan ortografic de sus pe nivel (P/E/S); cote clear în panou.
- Înlocuiește „Secțiune interior” pe hide-by-name.

## 2026-10-19 — A1.195: viewer V1 — filtre / clasificare

- Default **Ansamblu P+E** (nu Structură).
- `put_reten_*` în bucket subsol; Doar subsol fără șarpantă; stâlpi clip Z L-1.
- Curte: puț retenție + acces; fără pardoseli camere beci.
- Acoperiș: șarpantă+shell, fără stâlpi full-height.
- Toggle Fundații; mesh dump în `<details>`; fallback WebGL → link planuri.

## 2026-10-19 — A1.194: rundă 1 — parcelă + acces beci

- Overflow fundații/puț: **0** (era max 40,4 cm N + 21,4 cm puț E).
- Puț E clipat @ finit 680 · `put_reten_e` 15,7 cm · clear scară **100**.
- `C_SHAFT_E_PIER` scos; grindă întoarsă pe `put_reten_e`.
- Uși beci: magazie↔CT, magazie↔depozit, CT↔depozit.
- Grinzi S flush (h=15) → clear beci **220**; FF→FF **307** păstrat.
- Talpă 115 inward: calc heel **nevalidat** pe desen — rundă 3.
- Raport: `s1_a1_r1_round1_done_v01` · audit `s1_a1_r1_parcel_basement_v01`.

## 2026-10-19 — A1.193: site landing + mobile viewer/planuri

- Landing `/` prezentabil (brand Dragalina, hero vizual, CTA 3D/planuri); Vercel nu mai redirectează forțat la viewer.
- Viewer: drawer controale pe mobil, bare touch, linkuri FE v03, tipografie Syne/Figtree.
- Planuri index: tab-uri P/E/subsol + scroll orizontal pe SVG.

## 2026-10-19 — A1.192: comparație pachete placă/drop (nu schimbă adopt)

- `s1_a1_slab_beam_pack_v01`: 15/25 vs 16/20 vs 18/18 vs 18/20 vs 20/15 vs 20/20.
- Verdict ordin: **20+drop15 FAIL** (grindă h=35 insuficientă pe B_X_MID/Y410).
- Alternativă mai scundă care trece: **18+drop20** → FF→FF **305** (−2 cm).
- Adopt rămâne **15+drop25 / 307** până la decizie explicită.

## 2026-10-19 — A1.191: scări vizibile + talpă inward + retenție la teren

- Viewer Structură: include scări beci/acces/rampe (nu le mai exclude).
- Talpă perimetru **excentrică spre interior** — finit pe front, nu în stradă.
- Retenție A1: z1 = teren 0 (închide gol −30…0 sub soclu).
- Cote: `s1_a1_levels_clear_v01.md` (placă 15, grindă 40, clear 255).

## 2026-10-19 — A1.190: 3D complet — amenajare A1 + layere/fatade

- `build_v47_3d`: amenajare din `a1_architecture` (nu study drift); `site_layer` anvelopa/finisaj/goluri/mobilier; `col_facade_*` pe stâlpi perimetru A1.
- Viewer „2 · + Pereți”: include anvelopa + goluri + col_facade.
- Audit: `npm run audit:a1:layers` → `s1_a1_volume_layers_audit_v01`.

## 2026-10-19 — A1.189: variante talpă (drenaj / pinten / B)

- Meniu rezervă: `s1_a1_footing_alts_v01` — V1 B115 rămâne adopt; V2/V3 drenaj→B80; V4/V5 pinten.
- Nu schimbă geometria față de A1.188; documentează fallback dacă 115 e respins la FE/geo.

## 2026-10-19 — A1.188: predare FE + due-diligence + talpă/P100

- Index predare: `s1_a1_fe_INDEX.md` (+ handoff/checklist v03).
- Due-diligence cumpărare: `s1_a1_due_diligence_buy_v01.md`.
- Residual: alunecare/răsturnare — **B80 FAIL** la hw10+seism → adopt **B=115 cm**; confinare P100 φ8@12 cm zonă.

## 2026-10-19 — A1.187: uplift streșină + retenție seism + CR0 bare

- Uplift solbanc/PV: `s1_a1_eaves_uplift_v01` — F design + M12 spațiere + șuruburi căprior.
- Retenție pământ+apă+seism (Seed): `s1_a1_retaining_seis_v01` — adopt hw=1 m.
- CR0 pe grinzi/stâlpi critici: `s1_a1_cr0_members_v01` (scalare din calc_100).
- Scripts: `calc:a1:uplift` · `calc:a1:retain` · `calc:a1:cr0` · handoff v03 actualizat.

## 2026-10-19 — A1.186: sens fundații + nod C_E_PAL + BOM + handoff v03

- Sensibilitate q_allow **180 / 221 / 250** — `s1_a1_foundations_sens_v01` (adopt rămâne 221).
- Nod C_E_PAL + întoarsă: As/torsiune/lb ordin — `s1_a1_node_ce_pal_v01`.
- BOM șarpantă D3a (piese + fixări tip) — `s1_a1_roof_bom_v01`.
- Handoff FE **v03** cu geo120 + rebar + sens + nod + BOM.
- Scripts: `calc:a1:sens` · `calc:a1:node` · `calc:a1:roof` · `fe:handoff` → v03.

## 2026-10-19 — A1.185: structurist-studiu — fundații pe ipoteză 120

- Fără structurist extern: continuăm dimensionare ordin în repo.
- Lock: q_allow = **310/1,4 ≈ 221 kPa** (Pconv 120); pad-uri recalculate; **talpă perimetru 80** sub retenție; elevație = zid pe talpă (fără gol).
- `calc_a1_foundations_geo120_v01.mjs` · raport `s1_a1_foundations_geo120_v01.md`.
- **Nu** înlocuiește geo 131 / PT semnat.

## 2026-10-19 — A1.184: scară P→E fără gol la palier sus

- Cauză: clear255 → FF→FF **307**, scara V47 rămăsese **18×16=288** → gol ~**19 cm** sub FF etaj.
- Fix: **19 ridicări** (R1=9, R2=10), riser **307/19≈16,16**; 3D A1 citește `a1.stair_cm`.
- Viewer: ultima treaptă ajunge la FF etaj.

## 2026-10-18 — A1.183: pachet FE de predat (handoff v02)

- \`export_a1_fe_handoff_v02.mjs\` → brief + JSON + checklist pentru structurist.
- Lock-uri A1.180/D3/NO_LAMELE · încărcări blocate · PASS ledger · checklist P1–P3.
- \`npm run fe:a1\` / \`npm run fe:handoff\`.

## 2026-10-18 — A1.182: maxim in-repo (plafon ~6,5)

- Pachet `calc_a1_max_inrepo_v01.mjs`: seism pe stâlpi, punching, SLS căpriori, vânt fațadă, retenție+apă, As min hint.
- Verdict: **nu mai e maximul din chat** după A1.181 — dar **da, ăsta e plafonul onest in-repo** (~6,5 medie). Autorizabil ~9,5 cere geo+FE+dt.
- `npm run calc:a1:max`

## 2026-10-18 — A1.181: upgrade note — vânt + flambaj + EC5 + CR0

- Pachet `calc_a1_wind_buckling_ec5_v01.mjs` → `s1_a1_wind_buckling_ec5_v01.md`.
- Note ridicate: vânt/PV/flambaj/EC5 **1→5**; CR0 **3→5**. Medie ~4→~4,8.
- Rămân la 1 (extern): FEM, geo 131, confinare P100, armare.
- Hook: `npm run calc:a1:upgrade` (inclus în `calc:a1`).

## 2026-10-18 — A1.180: clear ≥255 HARD + acoperiș 30° + cote corecte

- **Revocat** D1(b) / clear 241 sub grindă — beneficiar: **minim 255 pretutindeni**.
- Pachet cote: FF→FF = 255 + drop grindă + placă + buildup; placă min **15** (cu B_X_MID); grindă crit. **40**.
- Acoperiș **2 ape · 30° · PV** pe ambele ape (rise = run·tan30°).
- Raport: `outputs/reports/s1_a1_clear255_levels_v01.md`.

## 2026-10-18 — A1.179: lock due-diligence cumpărare teren

- **Riser beci 17,22:** ACCEPTAT — brief 16 = doar P↔E, nu L-1.
- **C_E_LAMELE:** **nu e nevoie structural** (calc SE); poate lipsi din cadru sau = grosime perete ARH (fără rol BA).
- Context: verificare fezabilitate **înainte de cumpărare** (nu DTAC).

## 2026-10-18 — A1.178: onestitate acoperire calc + gaps

- `s1_a1_calc_gaps_v01.md`: matrice ce e în repo vs ce nu (FEM, seism bare, Rc 131…).
- Completat: 2.2 consolă A1, 2.6 retenție, 2.7 D3a/D3b, pier/riser audit.
- „Calc 100%” redenumit mental = **maxim ordin în repo**, nu proiect semnat.

## 2026-10-18 — A1.177: calc 100% — LAMELE nu e necesar

- Raport: `outputs/reports/s1_a1_calc_100_v01.md`
- **Verdict SE:** `NO_LAMELE` — B_E_S ~4 m trece flex/shear/SLS @30×35 fără reazem lamele.
- Adoptat: h **40** pe `B_X_MID` + `B_Y410` (SLS); pad-uri pe N din calc vs 200 kPa.
- Porți calc: toate TRUE (ordin — nu proiect semnat). `geo_131` Rc rămâne deschis.

## 2026-10-18 — A1.176: C_E_LAMELE scos din cadru

- Stâlpul de la lamele = **doar ARH/fațadă**, nu reazem.
- B_E_S / B_S_SE închid SE pe **C_E_PAL ↔ C_S_INTRARE_E** (fără LAMELE).
- Rămâne în `columns_cm` ca element amenajare; lipsește din `structure_a1_study_cm`.

## 2026-10-18 — A1.175: pachet FE A1 + pier/întoarsă pe puț

- `export_a1_fe_pack.mjs` → `s1_a1_fe_input_pack_v01.md` + calc 2.1 ordin.
- Pier `C_SHAFT_E_PIER` + `B_Y_EDGE_INVERTED` pe puț (geometric).
- Flag: `C_E_LAMELE` 20×40 &lt; P100≥30.

## 2026-10-18 — A1.174: S1 remesh cadre pe A1

- `src/build_a1_structure.mjs` → `structure_a1_study_cm` (stâlpi/grinzi/FG pe cutie+puț).
- `build_v47_3d` (architectureOnly): emite grinzi S+P+E, talpi, FG, placă cu gol puț.
- Viewer Structură = schemă A1, nu FRAME. FE încă deschis.

## 2026-10-18 — A1.173: Structură include retenție + puț

- Bug viewer: `subsol_reten_*` / `put_reten_*` aveau `site_layer=structura` dar `isStructuraMesh` le sărea.
- Fix: incluse în view **1 · Stâlpi A1** (cutie + ziduri puț).

## 2026-10-18 — A1.172: site doar A1 + plan subsol vizibil

- `/` și Vercel → `viewer/?v=a1` (nu FRAME).
- Viewer: linkuri Plan parter / etaj / **subsol**; FRAME scos din UI.
- `outputs/plans/index.html` = doar planuri A1 (inclusiv subsol).

## 2026-10-18 — A1.171: model A1 curat separat de FRAME

- Viewer default: `volume_a1.json` (`?v=a1`) — amenajare + subsol cutie, fără cadre/grinzi/FG vechi.
- FRAME rămâne pe `?v=frame` ca **STALE** (nu se amestecă).
- Generator: `architectureOnly` sare scheletul V47/FRAME; emite doar stâlpi PROVIZORIU din `a1_architecture.columns_cm`.

## 2026-10-18 — A1.170: generator 3D subsol pe A1 (nu V47)

- `build_v47_3d.mjs`: dacă există `a1_architecture.basement_cm.structure_box` → retenție/camere/puț din A1.
- Scos din path-ul activ: L reintrant, `hol_subsol`, diafragme puț legacy duplicate.
- Legacy V47 rămâne doar ca fallback dacă lipsește A1.

## 2026-10-18 — A1.169: start S1 din A1

- Amenajare P/E + plan subsol = **input înghețat** pentru structură.
- Kickoff: `decisions/s1_from_a1_v01.md` · envelope: `outputs/reports/s1_basement_envelope_from_a1_v01.md`.
- Primul task S1: **remesh retenție** pe cutia A1 (FRAME vechi = STALE).

## 2026-10-18 — A1.168: puț scară pe plan subsol (cu ziduri)

- **Nu** plan separat: scară/puț pe `a1_plan_subsol`.
- Incintă: **N+E A11**; **V** = retenție cutie + ușă; **S** deschis spre curte.
- Înainte: doar volume „plutitoare” fără zid — bug de model.

## 2026-10-18 — A1.167: colțuri retenție închise

- Bug vizual: N/S se opreau pe fețele int. → pătrate goale 32,6×32,6 la NW/NE/SW/SE.
- Fix: N/S pe span **exterior** (inclusiv grosimea V/E); V/E rămân pe Y int.

## 2026-10-18 — A1.166: plan subsol complet (axe/cote/layere)

- SVG subsol aliniat la P/E: axe A–D / 1–6, cotă camere+cutie, retenție **A11** pe layere, partiții **A7**, stâlpi beton, scară, drop, legendă.
- Pereți în `basement_cm.walls` (4 retenție + 2 partiții).

## 2026-10-18 — A1.165: subsol optim pentru planuri P/E

- Cutie **X30–A6 × Y30–820** = amprentă încălzită (nu terasă, nu camere scară).
- **N@Y30**: drop baie vertical, stâlpi N pe cutie, living fără salt fundație.
- CT **NV** (ferită) · magazie est (ușă) · depozit vest-sud; partiții ușoare.
- Cost rezidual: sprijin/hidro la rost N — nu geometrie P/E.

## 2026-10-18 — A1.164: beci = cutie pe griă stâlpi

- Contur retenție: **X30–A6 × Y410–820** (N pe C_W_MID, S pe C_S_INTRARE, E pe A6).
- Fără tăiere living la Y350; nord cutie = linie trecere fundație.
- Amenajare pe placă: CT vest N · depozit vest S (despărțire @Y645 dorm) · magazie est (ușă).

## 2026-10-18 — A1.163: CT ferită de apă (vest)

- **Ușă A6 → MAGAZIE** (antecameră umedă pe banda est).
- **CAMERĂ TEHNICĂ** mutată **vest sub living** (Y350–620) — departe de scară/curte.
- Depozit = vest sud; drop-uri MEP → CT prin colectare orizontală în placă.

## 2026-10-18 — A1.162: sud CT = magazie (nu hol)

- Zona Y620–820 est redenumită **MAGAZIE** — nu e hol de la intrarea în beci (intrarea e în CT).

## 2026-10-18 — A1.161: beci mărit sub fundație (compatibil P/E)

- N **Y350** (~3,5 m de fațadă N, nu calcan vecin) · S **Y820** (sub hol, în amprentă).
- ~**23 m²** camere: depozit/scule · CT (ușă scară) · hol.
- **P/E înghețat intact** ca geometrie; beciul influențează doar goluri placă/MEP + S1 structură.

## 2026-10-18 — A1.160: beci fără nord — amprentă parțială sud/curte

- **Fără excavare** N de **Y490** (rost vecin ~20 cm).
- Camere: depozit vest · hol (ușă A6 + drop buc) · CT spre curte sub hol P (Y620–720).
- Drop baie: **colectare orizontală în placă** → CT. P/E neatins.
- Sud beci **Y720** (nu sub toată terasa).

## 2026-10-18 — A1.159: scară beci V47 pe banda A1

- Traseu: **curte → palier −95 → scară ↓N (clear 100 sub R2) → palier −250 → ușă A6 → hol_subsol**.
- Remap: lipit `STAIR_A6_EAST_X` 564,3; puț = amprenta R2 A1.
- **Fit:** clear A6→E **104,5 ≥100** OK; @pier **95,7** (avertisment pe zona pier); ușă pe Y hol OK.
- **DESCHIS:** riser **17,22** vs brief max **16**; trepte curte pe sit; transport întoarcere (din V47 NECONFIRMAT).
- Plan: `a1_plan_subsol.svg` actualizat. P/E neatins.

## 2026-10-18 — A1.158: subsol subordonat — camere pe drop-uri A1

- Camere beci realiniate pe **XI / A6**: CT · depozit · hol_subsol.
- Drop-uri: baie→CT · buc hol-scară→hol_subsol.
- Plan: `outputs/plans/a1_plan_subsol.svg` (studiu). P/E neatins.
- Urmează: S1 structură (sau scară beci + echipamente pe același cadru).

## 2026-10-18 — A1.157: ghene — E util intact · P baie+hol scară

- **Etaj:** fără casetă în util — doar **drop** (pardoseală).
- **P:** `ghena_baie_wc` (lângă WC) · `ghena_baie_mid_est` (NE baie / C_N_MID, perete est) · `ghena_buc_hol_scara` (colț hol→scară).
- Canalizare = coloană; apă poate împărți caseta; curent = nișă/tub (nu a 3-a ghenă obligatorie).
- Util dacă volume P: ~**−0,25** (sau −0,17 dacă fuzezi mid în WC); E **0**.

## 2026-10-18 — A1.156: ghene overlay + subsol subordonat planului

- **Prioritate:** P/E înghețat. Subsol necesar; conflict → se modifică beciul, nu pereții/stâlpii/mobilierul.
- Ghene = strat `mep_cm.shafts` (REZERVĂ): baie vest · buc P · buc E · rece scară (înlocuit A1.157).
- Doc: `decisions/ghene_mep_v01.md`.

## 2026-10-18 — A1.155: ÎNGHEȚ amenajare P/E

- Beneficiar: **înghețăm** planurile de amenajare.
- `meta.status` → **ARH_FREEZE_AMENAJARE**.
- **În:** camere, pereți, goluri, uși, mobilier, SVG P/E.
- **Afară:** stâlpi/grinzi/FE, ghene MEP, pier final, util autorizare, finisaje.
- Regulă: fără mutare geometrie înghețată fără decizie explicită; doar straturi noi.
- Urmează: ghene → S1 structură → rost scară → util auth.

## 2026-10-18 — A1.154: audit pre-îngheț planuri P/E

- Audit mobilare/uși/camere: **OK amenajare** (util P **38,60** / E **37,14**; gol intrare E **100**).
- Fix: `corp_inalt_e` mutat S de foaia `intrare_etaj` (Y555, dy 33,8).
- **Îngheț condiționat** — așteaptă confirmare beneficiar. În afara înghețului: ghene, pier/FE, S1, util autorizare.
- Canvas: `a1-audit-pre-freeze-v03`.

## 2026-10-18 — A1.153: terasă E — fără măsuță lounge

- Scos `masuta_lounge_e` (N de lounge).

## 2026-10-18 — A1.152: terasă E — cafe + lounge (după ușă)

- Cafe 70 + 2 scaune pe **NV**; lounge **220×65** pe sud (parapet), inclusiv zona **S de foaia** ușii (Y≥775, până X260).
- Măsuță N de lounge, vest de vârful foii (X237).
- Bandă est ~**62** cm liberă la ieșire (X260–322).

## 2026-10-18 — A1.151: mobilier terasă pe zone + circulație

- **P:** lounge 70×130 + măsuță pe **acoperit vest**; bistro 70 + 2 scaune pe **neacoperit** (vest de parapet verde). Culoar **X≥170** liber (gol dorm → intrare).
- **E:** cafe 70 + 2 scaune pe vest; **est liber** pentru foaia `buc_terasa` (arc X237–322).
- Scos blob-urile V47 „MOB TERASĂ” / lounge+scăune în arc.

## 2026-10-18 — A1.150: bucătărie P front nord W→E

- Secvență pe nord: **FR 60** lipit vest → **MSV 60** → **CHI 60** → **plită+cuptor 60** → **dulap/blat 56,4** până la est.
- Fără amprente separate cuptor/hotă pe plan (un corp plită+cuptor).
- Culoar față de masa dining ~**125** cm (neschimbat).

## 2026-10-18 — A1.135: canapea/TV + buc E fără overlap + hol sud

- Canapea **90×170** închis / **180×170** deschis (spre vest); TV **lipit vest**.
- Parter: `canapea_p` pe est living; cuier+primire mutate pe **sud hol** (scoase din foaia intrare).
- Etaj buc: L est+sud — câte **o amprentă/corp** (fără blat+modul+plită+cuptor suprapuse).

## 2026-10-18 — A1.134: mobilare V47 pe plan A1 înghețat (doar adăugare)

- **Freeze geometrie:** fără modificare pereți / goluri / uși / util / straturi / scară / baie+pat existente.
- Adăugat mobilier V47 cu **fit absolut** pe `rooms_cm` A1 (buc P/E, living E, dining P, hol, terasă P, noptiere dorm).
- **Dezbatere (nu adăugat):** `canapea_p` (S40 în hol), `tv_p` (S10), `blat_tail_p` (E2,5), `tv_dorm` (E8,9), `perdea_dorm_terasa` (S8), `dulap` nișă veche (nișa A1 ≠ V47).
- Canvas: `a1-mobilare-freeze`.

## 2026-10-18 — A1.133: deschideri uși intrare P + terasă E

- `intrare_parter`: **înăuntru spre dreapta** în hol (balama N, foaie → est).
- `buc_terasa_etaj`: **afară spre stânga** pe terasă (balama N, foaie → vest).
- Corectează A1.115 (ambele erau afară dreapta, balama S).

## 2026-10-18 — A1.132: util, MS, scară, straturi lizibile, axe

- Util: scoase goluri uși ≤1 m (`baie_usa*`); rămâne portal 120.
- MS: facing **nord** + etanș dus|MS pe plan.
- Scară: clear real A6→E ≈103,1 / @pier ≈95,7 (nu 105); rost 3 cm trepte–palier marcat.
- Plan: **3 benzi** pe anvelopă (finisaj/ISO/EB20); catalog mm în **cartuș**; axe punctate fine + etichete afară.
- Hol: neschimbat (politică).

## 2026-10-18 — A1.131: N+V tencuială 30 · S+E klinker · baie A3_N

- **Nord + Vest:** A1 **30 cm** tencuială — **fără** klinker.
- **Sud + Est:** A2 **31,2 cm** klinker — pe plan **toate straturile** din catalog.
- **Baie pe N+V:** A3_N **31,1 cm** (faianță); duș/mobilier pe fețele int. A3_N.
- Hol neschimbat (113,7×120). Catalog + materials actualizate.

## 2026-10-18 — Predare editabilă arhitect (DXF/PDF)

- Dosar: `outputs/arhitect_predare/` din `a1_architecture.json` (aceeași geometrie ca planurile A1 din viewer).
- DXF 1:1 cm, layere A-STRUCTURA…A-COTE; planuri P/E, secțiuni A-A/B-B, fațade N/S/E/V + PDF.
- Catalog straturi, registru ipoteze, propunere IFC (fără IFC încă). Verificare redeschidere: ezdxf + preview PNG.
- Regenerare: `npm run export:architect`.

## 2026-10-18 — A1.130: parter = etaj (baie + dorm)

- Parter aliniat la etaj: **MS în baie** lângă duș pe sud; **nișă 180×60** culoare dorm + 3 glisante.
- Scoase pe parter: nișa MS în hol, dressing L, flancuri hol_nisa / prosoape.
- Ziduri A8 (spate nișă 180, est nișă, est MS→hol) pe **P+E**.

## 2026-10-18 — A1.129: A8 est MS fără stub N în baie

- `baie_dus_est_e` începea la Y129 → proeminență care tăia baia.
- Acum de la **Y144** (sud baie) → spate nișă; rol = separator baie↔hol.

## 2026-10-18 — A1.128: fără cant ISO prin EB20 (C_W_MID / C_E_PAL)

- Benzile galbene sub stâlpii mid vest/est **tăiau zidul** (ISO ∩ EB20).
- Scos `paintRect` cant S pe `C_W_MID` și `C_E_PAL`. ISO rămâne doar pe finit exterior.

## 2026-10-18 — A1.127: nișă etaj = culoare dormitor

- Nișa 180×60 pe etaj: fill + util la **dormitor** (nu living).

## 2026-10-18 — A1.126: EB20 continuu sub stâlpi · fără petic ISO onSDorm

- Cauza benzii galbene care „tăia” zidul la C_W_DORM / C_S_DORM_E (P+E):
  EB20 era decupat pe stâlp + petic ISO `onSDorm` → ISO vizibil în grosimea zidului.
- Fix: **EB20 continuu** (umplutură sub stâlpi); stâlpii peste; **fără** petic `onSDorm`.

## 2026-10-18 — A1.125: fără ISO pe cant S la C_W_DORM

- Banda galbenă care tăia zidul vest lângă stâlpul dorm = greșit (mijloc zid = umplutură).
- Scos `paintRect` ISO pe cantul sud `C_W_DORM`.

## 2026-10-18 — A1.124: etaj — bandă N MS = baie · colț A8

- Bandă albă **N de MS** (est duș): fill + util baie.
- Colț alb X211–226 / Y219–234: A8 est prelungit până la spatele nișei.

## 2026-10-18 — A1.123: etaj — A8 după MS · glisante nișă · est plin

- A8 duș|MS mutat **est după MS** (duș lipit de MS).
- Scoasă `nisa_living_sud_e` — gura nișei = **3 glisante** (P+E).
- Scoasă ușa albastră pe est nișă — **zid A8 plin** (culoare perete).

## 2026-10-18 — A1.122: etaj — MS în baie · nișă 180×60 living

- **Doar etaj.** Parter neschimbat (MS în nișa hol).
- MS: în **baie**, lângă duș pe **sud** (est de A8 duș, fața S aliniată cu dușul).
- Nișă **180×60** revine la living (util living_e); acces din hol; fără glisante spre dorm.
- Scoase pe etaj: hol_nisa N/S, L dressing dorm, flancuri MS.

## 2026-10-18 — A1.121: util include goluri uși din toc

- Lipseau din util pardoselile din **toc** (baie_usa, baie_usa_dorm, baie_living_gol) ≈ **0,42 m²**/nivel.
- Obstacol zid = amprentă **∖ gol**; golurile atribuite hol_vest / living.
- Metodă: cameră+goluri − (stâlpi ∪ ziduri∖goluri). Fără terasă/scară/anvelopă.

## 2026-10-18 — A1.120: recalcul util precis (post A1.116–119)

- Metodă A1.110: uniune fețe int. − uniune geo obstacole (stâlpi ∪ A6/A7/A8).
- **P net 38,3347 m²** (+1,33 vs 37); **E net 36,8762 m²** (−0,12 vs 37).
- Baie net **4,5917** (corp 3,5192 + duș 0,9000 + flanc 0,1575 + est liber 0,0750 − stâlp 0,0375).
- Etichete plan = același net din `a1_architecture.json`.

## 2026-10-18 — A1.119: ISO pe cant S la C_E_PAL (+ C_W_MID)

- `C_E_PAL`: lipsea placarea pe **fața sud** (spre palier rece); est era OK.
- Adăugat bandă ISO 8 cm pe cant S; simetric pe `C_W_MID`.

## 2026-10-18 — A1.118: fără izolație în toc (gol prin toată grosimea)

- Izolația pe anvelopă/A6 era continuă prin gol → ISO în toc (~8–10 cm); toc nu se prinde pe ISO.
- Fix: **taie ISO (+EB20) pe goluri**; desen ușă/geam = **toată grosimea** peretelui.

## 2026-10-18 — A1.117: colț SV parapet terasă în L

- A1.115 lăsase **gol** la SV (sud începea după vest).
- Sud: x = față vest (include colțul); vest: dy până la **fața N** a sudului.
- Capăt E neschimbat (până la zid/parapet est).

## 2026-10-18 — A1.116: A8 duș↔MS aliniat la colț (fără stub 5 cm)

- Stub ~5 cm (Y174–179) lângă sticlă: scos — `nisa_est_N` începe la **Y179** (= `hol_nisa_N`).
- Liber/sticlă **15×50** până la colț; A8 doar Y179–219.

## 2026-10-18 — A1.115: ușă terasă afară dreapta · parapet sud scurtat

- `intrare_parter` + `buc_terasa_etaj`: deschidere **în afară dreapta** pe terasă (balama S, foaie vest).
- Parapet sud P/E: scurtat la capete — fără overlap cu **parapet vest** și **zid/parapet est**.

## 2026-10-18 — A1.114: zid roșu 15×45 DISPARE → util

- Segmentul marcat pe plan (est duș, lângă 45×35): **fără A8**; pardoseală `baie_est_liber` **15×45**.
- `nisa_est_N` rămâne doar **Y174–219** (duș↔MS).
- Pe axul scos: linie sticlă dashed (nu zid).
- Util baie **+0,0675 m²**.

## 2026-10-18 — A1.113: undo A1.112 — ANULAT de A1.114

## 2026-10-17 — A1.111: goluri uși baie + dorm = 90

- `baie_usa` (hol→baie): gol **90** (era 80); foaie 88.
- `baie_usa_dorm` (baie→dorm): gol **90** (era 80); foaie 88.

## 2026-10-17 — A1.110: util = uniune geometrică obstacole

- Feedback SVG: etichete ≠ geometrie (living +0,14; baie proem. supraestimată).
- Fix: `net = brut − uniune(stâlpi ∩ ∪ A6/A7/A8 ∩)` — fără pin×faceLen, fără dublă numărare.
- Living E: scade A6 palier (fill sub zid ≠ util). Etichete din același net.
- Nu bloca compartimentarea pe sute cm² față de 37.

## 2026-10-17 — A1.109: nișă MS +5 cm sud

- Nișă MS (A8 N+S + clear 60) mutată **+5 cm sud**.
- Baie flanc prosoape: **45×35**; dorm bandă sub MS: **60×25**.
- Clear MS Y194–254; zid N Y179; zid S Y254; raft est Y269–294.

## 2026-10-17 — A1.108: MS −2,5 cm sud

- Nișă MS (A8 N+S + aparat): **+2,5 cm sud** (anulează A1.93).
- Clear MS Y189–249; flanc prosoape dy 30; raft est Y264–294.

## 2026-10-17 — A1.107: C_N_MID pe axa N–S mid

- `C_N_MID` mutat: **față est = XI** (ca `C_S_DORM_E` / `C_S_INTRARE_W`).
- Ax B: N_MID + S_DORM_E + S_INTRARE_W aliniați pe separator.

## 2026-10-17 — A1.106: util baie recalculat (L)

- Baie net **4,4504 m²** = corp 3,5192 + duș sud 0,90 + flanc 0,1238 − proem. 0,07 − A8 0,0225.
- Detaliu în `areas.useful_baie_detail`; etichetă plan „util (L)”.

## 2026-10-17 — A1.105: gol hol↔living = culoare living

- `baie_living_gol` (bandă A7 fără ușă) umplut cu **living** `#e8efe4` pe plan.

## 2026-10-17 — A1.104: undo ×2 (A1.103 + A1.102)

- Anulate alinierea A7 pe C_N_MID est și jog-ul hol.
- Separator A7 continuu la XI; `baie_sud_gol` din nou până la separator.

## 2026-10-17 — A1.103 / A1.102 / A1.101 — anulate

- (vezi A1.104)

## 2026-10-17 — A1.100: suprafețe utile = uniune corectă

- Brut = **uniune** rect+parts (fără dublă numărare duș/dressing/MS).
- Pereți A7/A8 scăzuți pe uniune; etichete plan = net pe nivel.

## 2026-10-17 — A1.99: dressing în L, zid ⊥ la colț

- În spatele glisantelor **180**: dressing **L** continuu (fără zid între rafturi).
- **nisa_est_S** (⊥ pe uși) doar Y234–246,5 — se oprește la **colțul L** (sud MS).
- Braț scurt L = sud MS, X151,2→211,2.

## 2026-10-17 — A1.98: separator MS↔dulap vizibil

- Fill dressing nu mai acoperă **nisa_est_S** (începe la X166,2, sud MS).
- Separator redesenat **după** fill — zid A8 între MS și dulap.

## 2026-10-17 — A1.97: zid dreapta dulap + nișă spate

- Refăcut **nisa_est_S** A8 X151,2 Y234–294 (înlocuiește stub `nisa_colt_dressing`).
- Dulap **120** vest; **nișă raft** în dreapta spate (est de zid).
- Glisante 180 rămân pe gură.

## 2026-10-17 — A1.96: dressing = culoare dormitor

- Verde + alb din dulap (inclusiv **45×32,5**) → **dorm** `#e9e0d5` (nu living).
- Living revenit la `#e8efe4`.

## 2026-10-17 — A1.95: sanitare

- Blat + lavoar **+15 cm est**; WC **+10 cm sud**.



## 2026-10-17 — A1.94: colț dressing închis (~45)

- `nisa_dulap_spate` prelungit până la X166,2; `hol_nisa_S` de la X151,2.
- Colț vertical Y234–246,5; `dorm_flanc_est` **47,5** cm (Y246,5–294) — L închis cu `dorm_baie_nord`.

## 2026-10-17 — A1.93: MS +2,5 N + zid S dressing

- MS clear Y186,5–246,5 (+2,5 N); prosoape dy 27,5 până la zid N.
- Refăcut **hol_nisa_S** Y246,5–261,5 — separator MS ↔ dressing (dulap 3 glisante).
- Raft est Y261,5–294.

## 2026-10-17 — A1.92: gol zid = nișă dormitor

- Fosta amprentă **nisa_est_S** (golul unde era zidul) + dulap + raft = **nișă dorm 180×60**, culoare dormitor.
- Un singur `dressing_nisa` pe Y234–294.

## 2026-10-17 — A1.91: duș +15 N + zid baie↔dorm

- Duș **120×90** Y129–219 (+15 N).
- Refăcut **nisa_dulap_spate** A8 pe sud duș (Y219–234, dx 120) — separator baie↔dorm (lipsea din A1.85).
- Dulap rămâne Y234–294; prosoape/MS pe banda Y144.

## 2026-10-17 — A1.90: fără zid est în dulap

- Scos **nisa_est_S** (A8 pe spatele dulapului / între dulap și bandă MS).
- Dressing continuous pe 180 în spatele glisantelor.

## 2026-10-17 — A1.89: glisante dressing 3×60 pe 180

- Scos **hol_nisa_S** (colț E–V / paralel sud al nișei dorm).
- Gura nișei spre dorm: **3 uși glisante** pe **180** (X31,2–211,2).
- Flanc est prelungit Y249–294; raft est 45; MS rămâne cu A8 nord + acces hol.

## 2026-10-17 — A1.87: MS cu A8 15 N+S

- Nișă MS: zid N Y174–189 · clear Y189–249 · zid S Y249–264 (A8 15).
- Aparatul în clear (nu pe/sub ziduri); gura est spre hol.

## 2026-10-17 — A1.86: MS +15 cm spre sud

- (înlocuit A1.87 — lipseau zidurile N/S)

## 2026-10-17 — A1.85: MS în nișa baie↔dorm (schiță)

- MS **60×60** est de duș (Y174–234), acces hol — nu lângă dulap.
- Stivă: duș **120×90** + prosoape 30 | MS 60; dulap **120×60** + raft 30.
- Corecție A1.84: MS era greșit pe banda dulapului (Y234–294).

## 2026-10-17 — A1.84: duș în nișă (fără +15 în dorm)

- (parțial — MS mutat corect în A1.85)

## 2026-10-17 — A1.83: schiță baie+hol+dorm

- (corectat A1.84 — duș 90 ieșea 15 cm din nișă)

## 2026-10-17 — A1.82: dus / WC / lavoar ca V47

- (înlocuit de A1.83 / schiță)

## 2026-10-17 — A1.81: nișă MS +2 cm spre dorm

- Hol-nișă Y191–251 (era 189–249); baie util net **4,52 m²** (≥4,5).

## 2026-10-17 — A1.80: colțuri nișă închise baie/dorm

- Flancuri vest prelungite până la nișa hol; est flancuri închis spre hol (deschidere doar baie/dorm).

## 2026-10-17 — A1.79: nișă hol 60×60 la mijloc

- Nișă hol util **60×60**, centru Y219 (mijloc hol 159–279); gura spre hol.
- Flancuri baie/dorm **60×30**; dressing vest util **120**.

## 2026-10-17 — A1.78: ușă hol→baie

- Batantă pe `baie_sud_gol` gol **80**; balama E = **dreapta din hol**; foaie → nord în baie.

## 2026-10-17 — A1.77: a 2-a nișă spre baie

- `nisa_dulap_est` prelungit S→N până la `baie_sud_gol` (Y144–294).
- Nișă baie util **180×51**, deschisă nord spre baie; spate comun cu nișa dorm.

## 2026-10-17 — A1.76: zid baie N de gol 120

- `baie_sud_gol` A8: Y144–159, X226,2→separator — paralel `dorm_baie_nord`, îndreptul nișei.
- Baie utilă până la fața N a zidului (dy 114).

## 2026-10-17 — A1.75 UNDO

- Revenit la A1.74b (gol 120 după colț dorm). Cererea „închide baie simetric + ușă din hol” neînțeleasă — de clarificat.

## 2026-10-17 — A1.74: gol 120 living–baie

- Gol **120** imediat N de colț dorm (Y279→159); colț Y279–294 plin.

## 2026-10-17 — A1.73: nișă+ușă la 90 cm de pat

- `DORM_N` 270→**294**; nișă+`baie_usa_dorm` odată; clear N pat→ușă **90**.

## 2026-10-17 — A1.72: fără pocket · batantă baie→dorm

- Scoase `baie_usa` + `dorm_usa` (casete) → **zid plin** living↔dorm/baie.
- `baie_usa_dorm`: batantă gol **80**, balama V, deschidere **stânga în dorm** (sud).

## 2026-10-17 — A1.71: pat −10 cm de vest

- Pat X**41,2** (era 31,2) — clear 10 față de perete, evită stâlp +10.

## 2026-10-17 — A1.70: nișă util 180×60

- Clear 180 E–V × 60 N–S; A8 15 pe spate+est; front @Y270.
- Baie N–S → **165** (era 157,2).

## 2026-10-17 — A1.69: pat 210×170

- Căpătâi vest @X31,2; Y384–554; **90 cm** clear până la față N `dormitor_sud` (Y644). Pe P+E.

## 2026-10-17 — A1.68: cote utile pe plan

- Pe cameră: clear `L×l` + m² util (nu doar etichetă).
- Lanț N→S vest: baie / bandă nișă / dorm + cotă A7; goluri uși cu clear.

## 2026-10-17 — A1.67: uși glisante pe separator / terasa_est

- `baie_usa` + `dorm_usa` (pocket) → X**339,9** (= perete_comun_est); casete incluse.
- `buc_terasa_etaj` → X**322,5** (= terasa_est); balama pe perete mutat.
- `dorm_terasa` / `intrare_parter` erau deja pe geometrie nouă.

## 2026-10-17 — A1.66b: cote coerente (nu zero)

- Readus: cote clear pe camere, goluri cheie, clear scară, +10 stâlpi, gabarit.
- Rămân scoase: axe A–D/1–6, cote pe fiecare segment perete, spam parapet/note.

## 2026-10-17 — A1.66: plan curat (fără zgomot)

- (prea agresiv — corectat 66b)

## 2026-10-17 — A1.65: separator XI −7,6 · ușă etaj 100

- `XI` 360→**352,4**; perete_comun / terasa_est / suduri / C_S_DORM_E odată cu el.
- `intrare_etaj` gol **100** (Y450–550); buc E net ≥5; **scară neschimbată**.

## 2026-10-17 — Audit planuri A1 v02

- Verdict: P/E **OK studiu**; nu îngheț. Rezerve: gol ușă **86**; pier 20×40 FE.
- Raport: `decisions/audit_a1_plans_v02.md` · canvas `audit-planuri-a1-v02`.

## 2026-10-17 — A1.64: parapet + placă terasă −8 cm sud (spre N)

- Muchia sud placă/parapet retrasă **8 cm** spre nord (P + E); parapete V/E scurtate la fel.

## 2026-10-17 — A1.63b: fără izolație pe C_S_DORM_E (NE terasă)

- Scos placarea 8 cm de pe colțul NE terasă — despărțea stâlpul de zid.

## 2026-10-17 — A1.63: izolație canturi · placă terasă −8 · util detaliat

- Izolație 8 cm pe cant: `C_S_INTRARE_E` (S+E), + capăt est `palier_inchidere_sud_p`. (`C_S_DORM_E` anulat în 63b.)
- Placă terasă P/E retrasă **8 cm** pe laterale V+E; parapet vest pe fața stâlpilor (nu pe ETICS).
- Colț L / ușă: gol **86**, stâlp @**536** (ușă Y450–536); buc etaj net ≥5 m² (față V buc_est − proem.).
- Living E în L (fără palier rece). Util net P/E recalculat pe camere − proem. − A7/A8.

## 2026-10-17 — A1.62: C_CASA_SCARA + intrare_etaj → N

- Colț L / stâlp / ușă: **579.1→550** (= `Y_PALIER_N`+gol100). Ușa Y450–550 (lipită de mid).
- Bucătărie etaj crește (~203×279 ≈ 5,65 m²).

## 2026-10-17 — A1.61b: undo podest→pier · palier superior până la mid

- Anulat: mărirea podestului SE până la `C_E_LAMELE` (R2/podest ca A1.60).
- Palier superior: nord clear = față S mid (`Y_PALIER_N`); zid A6 pe stâlpii mid.

## 2026-10-17 — A1.60: C_E_LAMELE și pe parter

- Stâlpul apare pe P+E (continuu / fundație posibilă). Parapet + lamele + zid plin est scară = **doar etaj**.

## 2026-10-17 — A1.59: parapet/lamele est scară doar pe etaj

- Parapet/lamele nu pe plan P. (Stâlpul readus pe P în A1.60.)

## 2026-10-17 — A1.58: pier 20×40 · parapet continuă după stâlp

- Pier lungime fațadă **40** (≈¼–⅓ din L lamele ~130); parapet jos de imediat sud de pier (≥70 sub acoperiș + podest). Fără gap gol.

## 2026-10-17 — A1.57: lamele mai înalte (proporție randare vs geam)

- H **210** (z FF+30→+240): vârf ≈ lintou geam; jos sub prag (~⅓×H geam).

## 2026-10-17 — A1.56: est scară — plin / lamele / pier / gap70 / parapet podest

- Geam living neschimbat.
- Zid plin pe palier (+1 treaptă); gol lamele de la a 2-a treaptă: **L≈145 · H** (→210 în A1.57).
- Pier `C_E_LAMELE` 20×25; gap **70** la limita acoperiș R2; parapet jos pe podest E+S.

## 2026-10-17 — A1.55: geam est centrat în jumătatea nordică

- `geam_est` mărit spre sud: centru @ **Y215** (=860/4); L≈220,4 (Y104,8→325,2).

## 2026-10-17 — A1.54: stâlpi mid pe axa ½860 · palier odată cu ei

- `C_W_MID` + `C_E_PAL`: centru @ **Y430** (y=410, dy=40); `Y_PALIER_N`=**450** (fața S).

## 2026-10-17 — A1.53: axe mijloc clădire 680/2 · 860/2

- Pe plan: albastru **½680** @ X340 · **½860** @ Y430 (gabarit finit).

## 2026-10-17 — A1.52: scos C_E_GEAM_S · C_E_PAL pe ax mid · palier +N

- `C_E_GEAM_S` eliminat (stâlp pe R2 rece — ulterior).
- `C_E_PAL` pe aceeași Y cu `C_W_MID`; `Y_PALIER_N` = fața S stâlpi mid → palier mărit N–S.
- Ax 3 unificat (fără 3').

## 2026-10-17 — A1.51: axe pe plan (centre stâlpi)

- A–D (V→E) · cifre N→S pe centre stâlpi; (mid E/V erau nealiniate — rezolvat în A1.52).

## 2026-10-17 — A1.50: plan A3 mărit · cote complete · detaliu fațadă E

- Scale ~2,15 · hârtie A3; cote pe camere, segmente perete, goluri, scară clear/parapet.
- Pe geam: L + H=150 + prag=90; pe parapete: h (105/120). Anti-suprapunere texte.
- `outputs/plans/a1_detaliu_fatada_est.svg` — desfășurare S→N cu lungimi pe fiecare segment.

## 2026-10-17 — A1.49: undo A1.45–48 → A1.44 (parapet est continuu)

- Scos `C_E_JALUZELE`, gol jaluzele, zid descendent. Parapet est scară = bandă continuă palier→capăt R2 (ca înainte de Belgian).

## 2026-10-17 — A1.48 / A1.47 / A1.46 / A1.45 — ANULATE

- (est scară Belgian — undo complet)

## 2026-10-17 — A1.44: C_CASA_SCARA −10 N · bucătărie ≥5 m²

- Colț L / stâlp / ușă: 589.1→**579.1**; bucătărie etaj **≈202,8×249,7 ≈ 5,06 m²** (240×203 ar fi 4,87 — sub 5).
- Palier clear N–S rămâne până la R2 (~115); R2/podest nemișcate.

## 2026-10-17 — A1.43: palier 115×115 · zid N −25,2 · ușă 100

- Clarificare: mutarea **ocolțului L** (`C_CASA_SCARA`) odată cu zidul N **nu** mărește clear-ul.
- `Y_PALIER_N` 469.3→**444.1** (−25,2); `C_E_PAL` urmează zidul; `C_CASA_SCARA` rămâne @589.1.
- Palier clear **105×115** → bandă **115×115** (ca podestul); `intrare_etaj` gol **100**.

## 2026-10-17 — A1.42: gol 90 · palier sub zid N · ușă stânga

- `intrare_etaj`: **gol 90** cm; deschidere **stânga înăuntru** (balama S, foaie vest).
- `palier_superior`: deck de la fața **sud** a `palier_A6_nord_etaj` (nu peste perete); clear ~105×90.

## 2026-10-17 — A1.41: intrare etaj lângă stâlp · fără ecran

- `intrare_etaj`: gol 90, sud exact pe fața N a `C_CASA_SCARA` (Y499.1–589.1).
- `ecran_frigider`: **ELIMINAT**; `Y_BUC_E` = 589.1 (bucătărie sud de colț L).

## 2026-10-17 — A1.40: C_CASA_SCARA pe colțul L hol NE

- `C_CASA_SCARA`: mutat nord pe colț (`Y589.1` = `palier_inchidere_sud_p` × `buc_est`); X neschimbat (+10 în hol).

## 2026-10-17 — A1.39: geam dorm→terasă centrat între stâlpi

- `dorm_terasa`: gol 150 cm centrat între `C_W_DORM` și `C_S_DORM_E` (mai la vest față de proba X120).

## 2026-10-17 — A1.38: ușă intrare P — gol 100 · dreapta înăuntru

- `intrare_parter`: gol **100** cm; de pe terasă deschizi **spre dreapta înăuntru** (balama S; foaie est în hol).

## 2026-10-17 — A1.37: trepte + parapet est −20 vest · sud −20

- 2 trepte + `terasa_parapet_est_neacoperit` mutate 20 cm vest; `terasa_parapet_sud_w` + deck `palier_parter` scurtate 20 cm.

## 2026-10-17 — A1.36: +1 treaptă R1 · 19×16 FF↔FF

- +1 treaptă la baza R1 (going 210→**240**, 8×30); R1 **9**↑, R2 **10**↑ → **19×16 = +304** FF↔FF; podest **+144**.

## 2026-10-17 — A1.35: C_S_INTRARE_W −10 cm vest

- Stâlp hol SV mutat 10 cm spre vest (x = terasa_est.x − 10).

## 2026-10-17 — A1.34: C_S_INTRARE_W — placare unită cu sud

- Placare vest prelungită +8 cm sud; bandă sud pe stâlp — unește cu izolația fațadei sud.

## 2026-10-17 — A1.33: fără placare pe C_S_DORM_E (colț)

- Placare 8 cm doar `C_W_DORM` (sud) + `C_S_INTRARE_W` (vest); colțul `C_S_DORM_E` fără.

## 2026-10-17 — A1.32: placare 8 cm pe stâlpi terasă

- Stâlpi nemișcați. Pe fețele spre terasă: **8 cm izolație** (proeminență pe pereții terasei) — `C_W_DORM` sud, `C_S_DORM_E` sud+vest, `C_S_INTRARE_W` vest.

## 2026-10-17 — A1.31: undo A1.29–A1.30

- Revenire la A1.28: stâlpi dorm/SV pe finit; fără overlay/mutări greșite pentru izolație pe stâlpi terasă.

## 2026-10-17 — A1.28: C_S_INTRARE_W pe finit vest

- Stâlp SV bucătărie: față vest = `terasa_est.x` (perete finit), nu +10 inset.

## 2026-10-17 — A1.27: trepte calculate (going = n×30)

- Going R1/R2 forțat `n×tread` (nu remap ~29,9). Etichetă = `going/n` din geometrie, nu text hardcodat.

## 2026-10-17 — A1.26: trepte pe plan = going/30

- R1 desenat cu **7×30**, R2 cu **9×30** (nu 8/10 contratrepte ca benzi).

## 2026-10-17 — A1.25: stâlpi dormitor sud pe finit

- `C_W_DORM` + `C_S_DORM_E`: față sud coborâtă pe `dormitor_sud` finit (nu pe extrema EB20).

## 2026-10-17 — A1.24: fără EB20 pe vest terasă

- Peretele `vest` tăiat la nordul `dormitor_sud` (ca în sursă Y30–645). Pe terasă vest rămâne doar parapet A5 — fără umplutură EB20.

## 2026-10-17 — A1.23: C_S_INTRARE_W pe colțul L (terasa × sud)

- Stâlp SV bucătărie în colțul real: vest = `terasa_est.x + 10` (limita izolației pe terasă), sud = `NS − 11,2`.

## 2026-10-17 — A1.22: C_S_INTRARE_W în colț SV (limita izolației)

- (suprascris de A1.23) vest era doar pe capătul sud_buc; prea est față de colțul L.

## 2026-10-17 — A1.21: parapet fără EB20 · izolație corectă · colțuri stâlpi

- Parapet terasă = gri solid A5 (fără cărămidă/hașură EB20).
- `terasa_est`: izolație spre **terasă (V)**, nu spre hol (era pe „interior”).
- Scos peticul de izolație pe capătul est dormitor_sud (față interioară).
- Goluri colț stâlpi: izolație pe finit în fața stâlpilor + colțuri N/W N/E.

## 2026-10-17 — A1.20: parapet · gaura living · scară curățată · palier

- Parapete terasă din `parapets_cm` = **beton/zidărie A5** (nu izolație).
- Gaura living P est: EB20 lipsea după C_E_PAL → 589; fix span după ultimul stâlp.
- Scara: pe P doar R1+podest (+ghost R2/palier); pe E palier+R2 — ca plan real (ref. Dragalina 120 A03/A04).
- Palier: **105×120 clear** + parapet est 10 = bandă **115** (V47; nu redus).

## 2026-10-17 — A1.19: 3 straturi · goluri pe falie · izolație colțuri

- Doar **beton / EB20 Akustik / izolație** pe plan (fără tencuială/klinker/GKB).
- Uși & geamuri pe falie (nu pe izolație).
- Petice izolație: colț buc SE, capăt dorm SE, bandă est living continuă.

## 2026-10-17 — A1.18: fără EB20 pe exterior

- Beneficiar: încă era umplutură pe exterior.
- Cauze: (1) span perete→primul stâlp = banda de colț ~11 cm; (2) A6 fără stâlpi până la finit est.
- Fix: EB20 doar între stâlpi consecutivi + clip față de inset-ul de colț (nu pe finit).

## 2026-10-17 — A1.17: izolație continuă · EB20 între stâlpi

- Beneficiar: lipsea izolația continuă pe exterior; cărămida nu stă „lângă” stâlpi pe fața ext.
- Pe plan: ETICS/ISOVER bandă continuă (și peste stâlpi); EB20 doar în span-urile dintre stâlpi; beton = stâlpi.

## 2026-10-17 — A1.16: audit + fix straturi

- Audit: `decisions/audit_a1_plans_layers_v01.md`
- Fix CRITICAL: A6 nord etaj — ISOVER spre sud (rece), nu nord.
- Fix A8 nișă est — faianță spre baie; benzi plan fără micro-adeziv; `living_palier` scos.

## 2026-10-17 — A1.15: plan cu straturi (A3)

- Pereții pe plan nu mai sunt un dreptunghi maro: straturi vizibile (EB20, ISOVER, ETICS/klinker, GKB, faianță) + stâlpi beton hașurați.
- Legendă materiale pe dreapta; catalog `assemblies_catalog_v01`.

## 2026-10-17 — A1.14b: stâlpi ≠ aliniați cu finit

- Beneficiar: avem **lungimi finite** → stâlp 30 **nu** se egalizează cu cărămidă 20 pe aceeași muchie.
- **Pereți** pe finit 680×860. **Stâlpi** pe extrema cărămizii (retrași: A1 −10 / A2 −11,2 de pe finit).
- Proem. în cameră rămâne **+10** (30−20) — nu e inset-ul de pe finit.

## 2026-10-17 — A1.14: proem. stâlpi = cărămidă pe extremă

- Beneficiar: cărămidă pe extrema plăcii/stâlpilor → din 30 cm stâlp, **20 pe extremă**, **+10 în interior**.
- Corectat în A1.14b (poziție retrasă; nu flush pe finit).

## 2026-10-17 — A1.13: hol scurt · SCARĂ nu sub palier

- Hol P doar sud de A6 (~Y619). Sub palier = living, fără etichetă SCARĂ.

## 2026-10-17 — A1.12: închidere palier P (E–V → limită)

- Perete A6 paralel sud: de la hol (X534) până la limita est (Dragalina).
- Închide palierul înăuntru; living sub placă nord de zid.

## 2026-10-17 — A1.11: reverse A1.8–A1.9

- Beneficiar: greșit complet — reverse. Scoase închiderile A6 inventate pe P.
- Rămâne doar continuitatea perete est → palier (A1.5).

## 2026-10-17 — A1.7: C_SHAFT_E_PIER scos (nu C_E_PAL)

- Beneficiar: „de celălalt ziceam” — stâlpul pe palier = **C_SHAFT_E_PIER** (acces scară).
- Scos din A1 (în V47 era doar S). **C_E_PAL** readus (est / living sub palier).

## 2026-10-17 — A1.6: C_E_PAL scos (acces scară) — ANULAT

- Confuzie: beneficiarul vorbea de C_SHAFT, nu C_E_PAL. Corectat în A1.7.

## 2026-10-17 — A1.5: gol palier + stâlpi buc_est

- Perete est continuu până la palier (fără bandă albă); C_E_PAL unește.
- C_CASA_SCARA + C_S_INTRARE_E trase în hol/buc (~+10 cm vest de buc_est).

## 2026-10-17 — A1.4: toți stâlpii ies în interior

- Regulă: stâlp > perete pe normală → **toți** proem. în cameră (N/V/E/S, hol est).
- Fără pilastru afară. **C_SE** scos (adăugat aiurea).
- Pereți catalog A1/A2/A7/A8 neschimbat.

## 2026-10-17 — A1.3: grosimi reale + stâlpi pe plan

- Pereți pe catalog (A1≈30 · A2=31,2 · A7=12,5 · A8=15) — nu 30 peste tot.
- Stâlpi pe plan (corectat ulterior A1.4).
- Cote = linii de cotă fețe int.

## 2026-10-17 — A1.2: nișă=dormitor · buc E de la perete

- Nișă dressing = culoare dormitor (P+E), nu baie.
- Etaj: bucătărie doar sud de perete despărțitor; zona ușii = living+dining.
- Cote = **studiu de lucru**; îngheț după confirmare planuri.

## 2026-10-17 — A1.1 compartimentare (beneficiar)

- Fără legătură / circulație / nișă / living_sub_palier ca camere.
- P: terasă · dormitor(+dressing) · bucătărie(+dining) · living(+ext. palier) · hol.
- E: bucătărie intrare→sud · living+dining intrare→nord · dormitor(+dressing).
- Regen planuri + `a1_architecture` v0.2.

## 2026-10-17 — Arhitectură A1.0 (Etapa 2/3)

- Corp **680×860** din A0; amenajare remapată din V47 (fără structură).
- Planuri: `outputs/plans/a1_plan_parter.svg` · `a1_plan_etaj.svg`.
- Date: `data/building/a1_architecture.json` · doc `decisions/arhitectura_A1_v01.md`.
- Util: ref V47 ~37,78 m² (PROVIZORIU) · țintă ≥37. Poartă: confirmare P/E → A1.1 / S1.

## 2026-10-17 — Teren = 147 m² (172 scos)

- Beneficiar: **172 m²** din acte/CF vechi = **eronat**; nu se mai raportează.
- Canonic: **147 m²** ridicare topo **2011**. Sync A0 + `parcel.json`.

## 2026-10-17 — Amplasament A0 (Etapa 1)

- Corp **680×860** pe sit CF · fără pilastri afară · EST pe Dragalina · curte sud.
- Amprentă **58,48 m²** · POT **39,78%** / 147.
- Fișiere: `data/building/a0_site.json` · `outputs/plans/a0_plan_situatie.svg` · `decisions/amplasament_A0_v01.md`.
- Generator: `node src/build_a0_site.mjs` (nu FRAME).

## 2026-10-17 — Brief A0: finit 680×860 fără pilastri afară

- Beneficiar: pilastri N/V afară **nu** (ar crește POT ~+1,5 m² @10 cm).
- **LOCK:** finit **680×860** = POT; exces stâlp/placă **absorbit în interior**.
- Sync `brief_A0_v01.md`. Următor: amplasament A0.

## 2026-10-17 — Brief A0 confirmat (restart)

- Subsol necesar; formă nerelevantă; fără prioritate stâlpi/desen subsol.
- Amenajare + dimensiuni păstrate majoritar.
- Clear ≥255 · riser ≤**16** · util ≥37.
- Doc: `decisions/brief_A0_v01.md`.

## 2026-10-17 — RESTART proiect (V47 FRAME înghețat)

- Beneficiar: oprim ciclul de corecții; model nou, fără amestec ARH/R/Inst.
- Doc: `decisions/project_restart_v01.md` — etape 0→6, reguli, brief seed.
- **V47 A1 FRAME = arhivă** — nu se mai petecează forma pe `study_v47_frame_schema`.
- Următor: confirmare brief (§4) → `brief_A0_v01` → amplasament A0.

## 2026-10-12 — Organizare + start concept_v01

- Documentele mutate în `inputs/{cadastru,sketches,references}/`.
- CF: 172 din acte, **147 măsurată** (bază), 76 existent C1 (≠ maxim nou).
- Nu se cere alte documente înainte de studiul conceptual.
- Schița 9,30×7,80 = ipoteză clădire, **nu** geometrie parcelă.
- Poligon din 10 segmente: **neinventat** (nedeterminat fără unghiuri).
- Anvelopă teren rectangulară provizorie doar pentru plasare volum.
- Generat: plan situație, parter, etaj, mesh volumetric + viewer.
- **Următorul checkpoint:** verificare planuri cotate + volum înainte de randări realiste.

## 2026-10-12 — Audit fronturi (v01 respins / corectat)

- v01 **NECONFORM**: orientare greșită, fără vecini, fără curte Cloșca, anvelopă ~pătrată inventată.
- Reguli fixate: **pe limita Dragalina**, **aliniere cu doi vecini**, **curte către Cloșca**.

## 2026-10-12 — Contur din CF (corecție)

- Anvelopa rectangulară inventată **abandonată**.

## 2026-10-12 — Plan amplasament (corecție formă)

- Beneficiarul a furnizat **planul de amplasament** (parcela 54602 + C1).
- Imagine: `inputs/cadastru/plan_amplasament_54602.png` (= documentul de cadastru folosit pentru formă).

## 2026-10-12 — Reproducere fidelă din plan

- Motiv eșec: unghiuri inventate + **străzi greșite**.

## 2026-10-12 — Corecție străzi (orientare finală)

- Beneficiar: **Dragalina = DREAPTA**, **Cloșca = JOS**.

## 2026-10-12 — Etapa 2 volumetrie footprint_v01

- Casă nouă **9,30 × 7,80 m** (72,54 m²) pe limita Dragalina (dreapta).
- Amplasată spre N; **curte sud → Cloșca**.
- Bandă scară/terasă 2,40 m pe latura spre Cloșca.
- 9,30 încape pe Dragalina (18,54 m); adâncime 7,80 pe lățime ~8,8 m → ~1 m spre vest.
- STOP pentru confirmare amprentă înainte de planuri detaliate.

## 2026-10-12 — Amprentă pe 3 limite + Etapa 3 propuneri

- Beneficiar: **nord OK**, pe limita vecinului, **practic pe 3 limite**.
- Amprentă v0.2: N (pct 5–7) + Dragalina + Vest · **~73,4 m²** · adâncime ~8,02 m.
- Propuneri compartimentare pe aceeași amprentă:
  - **A** — terasă din dormitor (aproape de schiță)
  - **B** — terasă din living (+ geam spre curte)
- Planuri: `outputs/plans/05_propunere_{A|B}_{parter|etaj}.svg` + comparație.

## 2026-10-12 — 3D din Plan_integrat_poarta_v05

- Sursă: `inputs/Plan_integrat_poarta_v05.png` (poartă culisantă 90° vest + 2 auto pe Cloșca).
- Flux: beneficiarul stabilește în plan → agentul extrudează 3D din poligon CF + program.
- Generare: `npm run volume` → `viewer/data/volume.json`.
- Viewer: toggle poartă închisă / deschisă.

## 2026-10-13 — Layout V43 parametric (iterare cote)

- Sursă: `inputs/Audit_V43_dimensiuni_si_cazare.html` (680×860 cm, pereți 30/15, nivel 304).
- Parametri: `data/building/layout_v43.json` → `tune`.
- Regenerare: `npm run layout` → `outputs/plans/07_layout_v43.svg` + studio HTML.
- Flux: modificăm ușor cotele în `tune` până găsim varianta; lanțuri sud/vest verificate.

## 2026-10-13 — V43 în proiect ca 3D exact

- `data/building/v43_exact.json` = pereți/camere/mobilier/goluri din audit (cm).
- `npm run volume:v43` → viewer 3D pe sit CF; EST pe Dragalina (pct 5); P+1 @ 304 cm.
- Nu e randare foto-reală; este volumetrie exactă din aceleași cote V43.

## 2026-10-15 — Țintă stil exterior (Belgian)

- **Locked:** Belgian · Cărămidă + tencuială (nu Industrial dark).
- Corp: cărămidă long-format; nișe/parapete: tencuială deschisă; metal antracit mat; gard la trotuar în același limbaj.
- Nuanță cărămidă: **deschisă sau intermediară**, nu închisă; SKU încă nedecis.
- Detalii + reper: `decisions/style_target_v01.md`, `inputs/references/style_target_belgian_caramida_tencuiala.png`.

## 2026-10-15 — Fațade klinker + alcătuire perete (POT)

- Placaj klinker pe **volumele principale** ale tuturor fațadelor corpului încălzit (E/S/V/N); tencuială pe nișe/retrageri/parapete balcon; gard trotuar = cărămidă.
- Perete P/E: EB20 200 + ISOVER FASSADE 80 + ETICS; finit max 300 mm; anvelopă 680×860 = fața finită.
- +1…2 cm placaj vs tencuială **contează la POT**; pe EST/Dragalina nu se crește în afara anvelopei.
- `decisions/facade_brick_and_wall_v01.md` + `construction_assemblies.facade_cladding` în study JSON.

## 2026-10-15 — Retrageri vecini N/V

- **Nord:** vecin OK inclusiv 0 cm; pe teren există ~20 cm între ziduri; casă vecin recent refăcută.
- **Recomandare locked ca ipoteză:** **nu 0 cm** — păstrează rost **~20 cm**; vest **~1 m**.
- Sub 60 cm față de hotar → acord autentic + verificare RLU; la 20 cm preferabil **tencuială pe N** (klinker greu de montat/întreținut).
- `decisions/setbacks_neighbors_v01.md`.

## 2026-10-15 — Soluție optimă nord

- Pe limită N + rost ~20 cm (terenul nu permite 80–100 cm).
- **Nord = tencuială** (finisaj la ridicare + hidro/drenaj); **klinker pe E/S/V** (vest ~1 m, vecin vest nu e lipit).
- Fără goluri inutile pe N; acord notarial + RLU; nu 0 cm pe casa refăcută a vecinului.

## 2026-10-15 — Vecin N = doar P + 4 ape

- Vecin nord: **parter + acoperiș 4 ape**; noi P+1 → N-jos vs N-sus.
- Atenție apă/zăpadă/incendiu pe învelitoarea lui; fără schelă pe acoperișul vecinului.

## 2026-10-15 — Nord = tencuială (confirmat)

- Beneficiar: **pe tot nordul (N-jos + N-sus) = tencuială**, fără klinker.
- Klinker rămâne pe E / S / V + gard.

## 2026-10-15 — Catalog ansambluri CONFIRMAT

- `decisions/assemblies_catalog_v01.md` OK beneficiar.
- Reguli: A1/A6 ≈300; A2 klinker 312 (vată 80); A7 fono 125 (nu BCA); A8 baie ≈150; A4 scară klinker ext. ≈150.

## 2026-10-15 — Update assemblies_v01 în proiect

- Sursă: `data/building/assemblies_v01.json`; aplicat pe A1 + FRAME.
- 3D: layere pe catalog_id (A1/A2/A4/A6/A7/A8); A2 +13 mm în mesh.
- SVG: `35_…A1` + `35b_…A2_klinker`.

## 2026-10-15 — Geometrie A2/A8

- A2: +1,3 cm exterior E/S/V; envelope **680×860 → 682,6×861,3** cm; amprentă **58,48 → 58,79 m²** (Δ +0,31).
- A8 baie: pereți **15 cm**; util uscat ≈ neschimbat (A2 în afară).
- `src/apply_geometry_assemblies_v01.mjs` + regen volumes.

## 2026-10-15 — Site = doar V47 A1 FRAME

- Viewer + redirect `/` încarcă **doar** `volume_v47_a1_frame.json`.
- Taburi: overlay / secțiuni cadre / A1–A2 wall / util / POT / catalog.
- V47, A1 studiu, V46 **nu** mai apar ca modele principale.
- Continuăm pe FRAME: layere + îmbunătățiri.

## 2026-10-15 — Audit rezistență FRAME v02

- Raport: `outputs/reports/v47_a1_frame_structure_audit_v02.md`.
- Acoperă: cadre, planșee, grindă întoarsă, scări P/E+L-1, subsol, acoperiș, gard, curte, A1–A12, limite N/E/S/W.
- Verdict: **NECONSTRUIBIL/NEVALIDAT**; top riscuri = east_landing_span, inverted_beam_fit, acoperiș fără structură, A2 vs hotar E.

## 2026-10-15 — FRAME: vizibilitate stâlpi + structură acoperiș

- Bug viewer: `stalp_continuu_*` erau clasificate doar pe zMid → păreau „doar subsol/parter”. Acum pe S+P+E.
- 11 stâlpi continui + 1 pier subsol (C_SHAFT_E_PIER). N = pe limita proprietății (rost ~20 cm până la zidul vecinului).
- Grindă întoarsă: mesh verde `subsol_grinda_y590_inverted` + SVG 37.
- Acoperiș: coamă + solbancuri + căpriori BA (studiu) în 3D.
- Clarificare „72,5 cm”: NU e lățimea scării proiectate (scara beci = clear **100** cm); 72,5 e (a) warn vechi pe ziduri greșite sau (b) culoar living mobilier.

## 2026-10-15 — FRAME: planuri P/E sfinte · beci realiniat · schelet curățat

- **Prioritate:** amenajare P/E = sursă de adevăr; stâlpii nu se elimină; beciul se ghidează pe axe plan.
- Camere beci: CT / depozit / hol pe X360·X535·Y400·Y645; clar ocolește stâlpii (în pereți).
- Schelet: eliminate grinzi/fundații hardcodate pe 650/I (nu închideau nodurile); fg+grinzi din schema stâlpilor.
- Viewer: pe etaj vezi planșeu+stâlpi+schelet acoperiș; `1 · Structură` ascunde țigla ca să apară coama/căpriorii.
- Centură E discontinuă sud de C_E_PAL = **intenție** (gol scară), nu bug.

## 2026-10-15 — Audit proiectare structură v03

- Raport: `outputs/reports/v47_a1_frame_structure_design_audit_v03.md`.
- View Structură: exclus poluare (gard/trepte/teren/țiglă) — doar cadru BA.
- B_SEP overlap în C_CASA; fg doar pe axe S/P.
- Calcule: ordine de mărime (B_W M/Mu≈0,63); P100/zăpadă/fundații = LIPSĂ.

## 2026-10-15 — Soluție east_landing_span (S+P)

- `C_E_LAND_SP` 30×30 @ Y575 — **doar S+P** (nu urcă în etaj scară).
- `B_E` prelungit; `B_LAND_S_EDGE` pe muchia sud palier.
- Raport: `outputs/reports/v47_a1_frame_east_landing_solution_v01.md`.
- Conflict → `STUDIU_SOLUTIE` (NEVALIDAT structurist).

## 2026-10-16 — Materiale + A7 Knauf + retragere landing

- **Retras** `C_E_LAND_SP` + `B_LAND_S_EDGE` (blocau palier/rampă beci); `B_E` din nou până la `C_E_PAL`; east_landing = DESCHIS_REPROIECTARE.
- **A7 = Knauf W112** CW75 · 2×12,5/față · **125 mm**.
- **Klinker:** Ströher Riegel 50 LF 490×40 silver-grau.
- **ETICS:** Weber webertherm CERAMIC PREMIUM (vată) — recomandare locked.
- `terasa_est` → **A1** (nu A5); A6 = **300** exact.
- Generator: fără auto-scale straturi; normală interior corectă (grosime, nu lungime).
- Decizie: `decisions/materials_v01.md`.

## 2026-10-16 — Schemă structură (predimensionare, nu execuție)

- **P ≠ E** la podest: P = living sub placă; E = circulație rece. Fără stâlp în living / acces beci.
- **Podest:** studiu consolă transversală (~1 m) pe B_E scurt din C_E_PAL — nu consolă 3,7 m; nu C_E_LAND_SP.
- **Placă principală:** comparație **15 vs 20 cm** pe 2 direcții; **fără** grindă lungă pe compartimentare A7 ca primă opțiune.
- Punctul care decide casa = placa 15/20, nu umplerea zonei podest cu stâlpi.
- Status conflicts: `east_landing_span` / `palier_plate_support` → STUDIU_CONSOLA; `slab_span_without_X320` → COMPARATIE_15_20.

## 2026-10-16 — Podest consolă + placă 15/20 în geometrie

- `B_E` prelungit la Y600 (consolă sud **111 cm** din C_E_PAL) — fără stâlp.
- Raport: `outputs/reports/v47_a1_frame_slab_and_landing_v02.md`.
- v01 east_landing cu stâlp = **RESPINS**.
- `heights_cm`: slab 15 (alt 20 → clear 250).

## 2026-10-16 — Audit structură v04 + fix viewer/geo

- Raport: `outputs/reports/v47_a1_frame_structure_design_audit_v04.md`.
- Critice: placă 15/20 insuficientă SLS; acoperiș fără load path; retenție subsol EB20.
- Fix viewer: poartă scoasă din Structură; fără reframing pe tot situl; banner → v04.
- Fix geo: `B_Y470` levels **P** (planșeu); etichete `C_S_DORM_E` / `C_S_INTRARE_E` = 30×30.

## 2026-10-16 — v05: corecție audit + generator regenerabil + geo

- **Nu** adopta placă 25–28: L/d = semnal, nu SLS fail demonstrat.
- Acoperiș: stâlpișori = contact parțial (nu plutitori absenți); căpriori completați pe E.
- Generator `study_v47_frame_schema.mjs`: `B_E`→Y590, `B_Y470` levels P — persistă după regen.
- Fără dublură placă palier; vanguri rampă2 înclinate; Structură include `palier_superior_placa`.
- Vizibilitate P/E: `continuousObjs` o decizie.
- Geo: `decisions/geotech_hypothesis_v01.md` (vecinătate 120; demolare integrală 131).
- Audit: `v47_a1_frame_structure_design_audit_v05.md` + registru status.

## 2026-10-16 — Coordonare geometrie (runda post-v05)

- `GEO_X0=1.3` în generator cadru (= A2 recenter) — C_NE@641.3 etc.
- Palier: izol. 6 + șapă 4 + finisaj 2 cm (nu grosime 0).
- Rampă 1+2: vanguri înclinate sub intrados; capăt superior = nTread (nu nRiser) — aliniază la +298 Intrados / +304 FF.
- `podest_se_placa` în Structură; Viewer `sharedFloorObjs` — grinzi/plăci pe Doar parter.
- Gol placă = contur exact palier; planuri FRAME `38`/`39` din frame study (nu v47_exact).

## 2026-10-16 — Cadre BA: audit stadiu → pachet calcul

- Proem. interior = 0; bump sud ~9 cm afară.
- Minim stâlp = 30 cm (P100); along 40 = încă ipoteză până la FE.
- `frame_calc_package_v01.md` + roadmap: calcul înainte de tăiere terasă/scară pentru util.
- Util E sub 37 = onest (palier afară); recuperare terasă/scară după structură.

## 2026-10-16 — Două variante studiu + cadre ≥30 cm

- LOCK: `structure_two_variants_v01.md` — **A** cadre BA min 30 cm (P100); **B** BA cu pereți structurali.
- Ținte comune: util ≥37, POT ~40%, clear ≥255, calcul forțe, fonic+termic.
- Varianta A: `COL_THRU=30`, `PROTRUSION_IN=0` (stâlp înlocuiește local EB20; ETICS afară). 20 cm retras — neconform P100.

## 2026-10-16 — LOCK-1R palier (fără stâlp în living)

- `C_L_PAL` retras: pe P e în living deschis (separator @ Y590+).
- Palier = **consolă pe B_E**; `B_Y470` doar X565–670, P+E, capăt V liber asumat.
- Calcul obligatoriu: armare consolă + torsiune nod `C_E_PAL` (nu alt stâlp în living).

## 2026-10-16 — Palier etaj AFARĂ + L A6 + gol Y590

- `living_put_thermal_y590` doar pe **P** (nu pe E — băga palierul în casă); `outward_hint: north`.
- L A6 etaj: `buc_est_etaj` (V, out E) + `palier_A6_nord_etaj` @ Y470 (out **N** = spre palier rece); polyE exclus palierul.
- Gol palier↔rampă2 @ Y590: stivă prag (placă+XPS+impact+șapă+finisaj) + reazem vanguri în placă palier + bandă BA.
- Util E studio ≈36.24 (<37) — consecință palier AFARĂ; de recuperat altundeva (NECONFIRMAT).

## 2026-10-16 — Geometrie anvelopă/FF înainte de FE

- Proces: `decisions/roadmap_geometry_then_calc_v01.md` — pereți L + FF locked → apoi calcule (consolă, colțuri, centuri).
- **FF P = +48 cm** — 2 trepte (+16/+32) + a 3-a ridicare pe palier/terasă; beci −250 absolut.

## 2026-10-16 — 2 unități = garsoniere · clear 2,55 m

- Lock: `decisions/legal_height_studios_v01.md` — Legea 114/1996 Anexa 1: **2,55 m** camere de locuit.
- Placă 15 = OK la limită; 20 = 250 (sub lege); sub grindă 241 = conflict de rezolvat.

## 2026-10-16 — Prioritate: legea întâi

- Lock: `decisions/priorities_legal_first_v01.md` — POT ~40%, util ≥37 m², clear ≥255 cm, apoi restul.
- Subsol/terasă/scări = flexibile dacă minimele legale sunt îndeplinite.
- Orice „alege varianta” trebuie cu impact pe aceste praguri (sau explicit: fără impact).

## 2026-10-16 — Audit structură: acord + rezolvări fără impact legal

- Doc: `decisions/conflicts_resolution_v01.md`.
- Fix: B_Y470 exclus din soffit/fg L-1; grindă întoarsă dy=25 (nod B_SEP); B_X360 pad păstrat + calcul.
- Placă: **preferință 15 cm** (clear 255); 20 doar după FE fail + tradeoff explicit. Clear sub grindă **241** = conflict separat de întrebat.

## 2026-10-16 — Închidere geometrie scară (post-78ec6a2)

- Podest BA **15 cm** separat (+133→+148); pachet finisaj 12 cm deasupra — nu 3 cm.
- Sistem: **trepte pe plăci BA** + vanguri pe muchii cu **reazem 15 cm în placa podestului**.
- `B_Y590_EDGE_INVERTED` = `inverted_edge_beam` (aceeași geometrie cu GEO_X0).
- Palier: XPS 300 5 cm + membrană impact 1 cm + șapă 4 + finisaj 2 (ipoteză; Lnw NECONFIRMAT).
- Planuri 38/39: goluri, scară, podest, contur plăci; secțiuni noduri → `40_…_stair_sections.svg`.

## 2026-10-16 — Stâlpi flush + fațadă A1/A2 stratificată

- `COL_THRU=30`, flush int. (`PROTRUSION_IN=0`); beton = miez (înlocuiește local EB20).
- Pe față exterioară: stivă catalog exactă **fără EB20** — A1 nord 9,2 cm (adeziv+vată80+armat+grund); A2 E/S/V 10,5 cm (+klinker Ströher).
- Finisaj int. pe fețele interioare: tencuială 6 + vopsea 1.
- Mesh: `col_facade_*` în volum FRAME; view **2 · + Pereți**. Planuri 36–40 regen.

## 2026-10-16 — Plan definitivare structură 100%

- Doc: `decisions/structure_finalize_100_v01.md` — faze 0–5, D1 clear sub grindă / D2 pilastrii / D3 acoperiș, FE ordine, poartă done.
- Roadmap actualizat: pointer către plan.

## 2026-10-16 — D1–D3 implicite acceptate

- D1=(b) clear 255 sub placă; 241 sub grindă acceptat provizoriu până la FE.
- D2=(a) pilastrii pe fațadă.
- D3=comparație șarpantă ușoară vs BA la FE.

## 2026-10-16 — Cote plan din contur liber (nu rooms_cm AABB)

- `interior_free_spaces_v01.mjs`: baie L ≈ **6,48 m²** (nu 7,62); nișă ≈ **0,76 m²** (fețe pereți); circulație living–buc etichetată separat.
- Planuri 38/39: etichete „liber”; util studio rămâne shoelace FRAME (**≠** suma etichetelor).

## 2026-10-16 — Util E = suma etichetelor (beneficiar)

- LOCK: util etaj studio = **37,469 m²** = baie+nișă+dorm+living+buc+circulație.
- Palier scară rece **1,26 m²** rămas exclus; scară = doar lățime liberă, nu m² util ap.

## 2026-10-16 — Continuare FE cadre (minim stâlpi/grinzi)

- Varianta B (diafragme) **parcată**; lucrăm **Varianta A**.
- „Minim” = secțiuni minime **care trec** calculul (P100 ≥30 stâlp, b≥20 grindă); along 40→30 doar dacă FE permite.
- Faza 0: `outputs/reports/v47_a1_frame_fe_input_pack_v01.md` + `decisions/frame_min_sections_calc_v01.md`.

## 2026-10-16 — Calc preliminar 2.1–2.4 (ordin, nu adoptare)

- Scripturi: `calc_v47_frame_columns_prelim_v01.mjs`, `…_cantilever_…`, `…_beams_slab_…`
- Rapoarte: `outputs/reports/v47_a1_frame_calc_2_1_columns_v01.md`, `_2_2_cantilever_`, `_2_3_2_4_slab_beams_`
- Stâlpi: axial → candidați along 30 (fără C_E_PAL); **nu** schimbat în generator
- Consolă: M/T ordin mici; nod C_E_PAL rămâne 30×40 până FE
- Placă 15/20 @6,2 m: semnal SLS; grinzi 30×35 flexiune ordin OK
- Model: secțiuni **neschimbate**; următor = FE cu M+V+P100

## 2026-10-16 — Continuare calc 2.3/2.1b/2.5 + pad B_X360

- Raport: `outputs/reports/v47_a1_frame_calc_continue_v01.md`
- Placă 15 @6,2: fail ordin; **15 + bandă** N_MID–S_DORM_E @3,1: OK ordin
- Seism ipoteză ag=0,10: Vb~57 kN; along→30 doar după FE P100
- Întoarsă: geo OK; FE local capăt V
- LOCK: accept pad B_X360 dx=70 (`rezolvat_geometric`)
- Util E **37,469** înghețat în `study_v47_frame_schema` (shoelace separat)

## 2026-10-16 — Retenție subsol BA (Faza 1 geo)

- Contur subsol: **BA 20 cm** (`subsol_reten_ba_*`, layer Structură) — nu EB20 umplutură.
- Partiții int. subsol: rămân umplutură 12,5.
- `basement_retaining` → `rezolvat_geometric` · calc împingere/talpă/XPS încă deschis.
- Bandă placă: opțiune în conflict `slab_span_without_X320` (nu activă în beams[]).

## 2026-10-16 — Fundații studiu 80+60 + acoperiș D3a/D3b

- Raport: `outputs/reports/v47_a1_frame_calc_2_6_2_7_foundations_roof_v01.md`
- Model: talpă **80×80** · FG bandă **60** (nu lățime grindă); EST excentric interior
- `foundations_width` → `rezolvat_geometric` · Rc 131 încă deschis
- Acoperiș: FE întâi **D3a** ușoară; D3b BA ≈ +172 kN pe ~48 m²

## 2026-10-16 — Variantă recomandată studiu R

- `decisions/frame_recommended_variant_v01.md` + `outputs/reports/v47_a1_frame_variant_compare_v01.md`
- **R** = A + placă15 + **B_BAND_X320** + D3a (optima pe brief, nu FE semnat)
- Bandă activată în `beams[]` (studiu); C_N_MID păstrat ca reazem N

## 2026-10-16 — Continuare R: bandă + retenție + brief FE

- `outputs/reports/v47_a1_frame_variant_R_continue_v01.md`
- Brief structurist: `outputs/reports/v47_a1_frame_fe_brief_variant_R_v01.md`
- Bandă: flex OK ordin; **C_N_MID obligatoriu** pe R; retenție uscată plauzibilă @20 cm

## 2026-10-16 — Bandă: reazem Y400 (fără stâlp cameră)

- \`B_Y400_BAND_TIE\` activ în beams (C_W_MID → X535 @Y400)
- Comparație: `outputs/reports/v47_a1_frame_band_options_v01.md`
- Țintă As bandă ≈**360** mm² (Y400+2-way) vs 1450 (1-way full)

## 2026-10-16 — Y400 scurtat (nu living) + checklist R

- \`B_Y400_BAND_TIE\`: doar C_W_MID→bandă (~3,2 m); fără C_CASA_SCARA (@Y610)
- Clash: dorm clear 241 OK (D1); living neatins
- Calc Y400: As mic (≈4φ12); status R: `outputs/reports/v47_a1_frame_y400_tie_and_R_status_v01.md`

## 2026-10-16 — Master status R + roof path + planuri

- `outputs/reports/v47_a1_frame_variant_R_master_status_v01.md` — un singur status
- `outputs/reports/v47_a1_frame_roof_path_R_v01.md` — D3a geo centuri→stâlpi
- Planuri 38/39 regen: etichete B_BAND + B_Y400 vizibile

## 2026-10-16 — Țintă = formă (nu autorizație)

- Beneficiar: forma corectă din calcule de studiu; autorizația nu e acum.
- `decisions/form_target_R_v01.md`
- Întoarsă: capăt V explicit pe B_SEP (formă închisă); fără reazem „placă” vag

## 2026-10-16 — Arhive inputs (Casa Sârb 120)

- 8 arhive extrase în `inputs/_extracted/`; inventar `decisions/inputs_archives_inventory_v01.md`
- Tot = **Dragalina 120**; nimic dedicat 131; EMDI original absent
- Confirmă geo citat: Pconv **310**, D=1,15, tălpi 50×70; structură 120 = zidărie + stâlpișori **25×25** (≠ cadre R pe 131)

## 2026-10-16 — Dorm LOCK: fără B_Y400

- Beneficiar: **în dormitor nu modificăm** — `B_Y400_BAND_TIE` retras.
- Bandă rămâne `B_BAND_X320` pe C_N_MID–C_S_DORM_E; FE pe 2-way (fără reazem @Y400).

## 2026-10-16 — REVERSE: 6 stâlpi flush-ext

- Anulat: `C_E_MID_N` / `C_E_MID_S` + flush-ext pe E/S — revenire flush-int, 3 stâlpi EST (`C_NE`, `C_E_GEAM_S`, `C_E_PAL`).
- Rămâne: dorm LOCK (fără B_Y400).

## 2026-10-16 — EST + SUD intrare pe muchia plăcii

- EST×3: `C_NE`, `C_E_GEAM_S`, `C_E_PAL` — față E = SLAB_E 682,6
- SUD intrare×2: `C_S_INTRARE_W/E` — față S = SLAB_S 861,3
- `C_SHAFT_E_PIER` → 30×30 pe muchie placă (ex 15×15)
- **REVERSE** `C_E_SCARA_N/S` — adăugați greșit; scoși. „2 est scară” ≠ stâlpi noi.
- Fix P+E: goluri tăiate în straturile zidului (`geam_est` etc.); fără wrap ETICS pe stâlpi E/S la muchie placă (dispar pilastrii dubli).

## 2026-10-17 — Inel E închis: C_SE + B_E_S + B_S_SE

- Beneficiar: da la închiderea inelului.
- **C_SE** colț S/E pe CONC · **B_E_S** Y590→S · **B_S_SE** C_S_INTRARE_E→C_SE.
- C_SHAFT_E_PIER rămâne **S-only** (nu pe palier P). Span B_E_S ~261 = FE.
- `ring_E_SE_gap` → rezolvat_geometric · calcul_lipsă.

## 2026-10-17 — Acoperiș: calc PV+zăpadă + reazeme + inel E

- Calc ordin: D3a+PV · sk Turda 1,5 → q_Ed ~2,85 kN/m²; căprior 12×25 @1,2 m ordin OK; **FE lipsă**.
- Stâlpișori erau pe muchie B_W/B_E → centrați pe grindă; solbanc/coamă pe CONC.
- Plăci: etaj **20** · peste subsol **20**. Centuri P+E da; **inel E gol** EST Y590→S / SE.
- „2 segmente în aer” = console LOCK-1R (B_Y470 + B_E), nu golul SE.
- Raport: `outputs/reports/v47_a1_frame_roof_pv_snow_bearing_v01.md`.

## 2026-10-17 — Fix view Structură: placă pe muchie CONC (E/S)

- Audit: stâlpi E/S păreau inset → consolă falsă placă +10,5 cm (= ETICS pe anvelopă finită).
- Placă structurală (subsol + etaj) = `structural_footprint_cm` **672,1×850,8** (față beton); finit 682,6×861,3 rămâne doar POT/ETICS.
- Raport: `outputs/reports/v47_structure_view_slab_edge_audit_v01.md`.

## 2026-10-17 — LOCK fațadă unică (E/S plan · N/V pilastru)

- **E/S:** finit plan; beton = finit−A2 (672,1 / 850,8); ETICS continuu pe stâlpi; proem. în interior.
- **N/V:** interior la linie (baie/living N, dorm/baie V); pilastri pe exterior; fără wrap.
- Util din **aceleași** fețe ca `walls_cm`: P **38,652** · E **37,886** (nu 39,7/38,8 pe bandă-perete).
- POT neschimbat (amprentă finită). Raport: `outputs/reports/v47_facade_alignment_audit_v01.md`.

## 2026-10-17 — LOCK P: placă 20 fără bandă

- Beneficiar: îngheț **placă 20** · **`B_BAND_X320` retras** (min proeminențe).
- Clear plafon **268** · sub grindă **259** · FF→FF **306** neschimbat.
- `C_N_MID` păstrat până la FE (drop = rundă separată).
- Docs: `form_target_R_v01` → țintă P; `frame_recommended_variant_v01`.
- FE pe L≈6,2 rămâne `calcul_lipsă`.

## 2026-10-17 — Calc placă ± bandă (clear nou) → min proeminențe

- Script: `src/calc_v47_frame_slab_band_protrusion_v01.mjs` · raport `outputs/reports/v47_a1_frame_slab_band_protrusion_v01.md`.
- **h≥18–20 fără bandă:** L/d ordin OK pe 6,2 m @K=1,3; clear ≥268.
- **h=15 fără bandă:** FAIL ordin (bandă încă necesară pe 15).
- Optim proem. studiu: **placă ~18–20, fără `B_BAND_X320`**.

## 2026-10-17 — Util + POT pe falie la cheie (N/V vs E/S)

- Contur util pe fețe falie: W/N **30,7** · E **661,9** · S intrare **840,6** · S dorm **654,3**.
- Proem. stâlpi E/S = **+10 cm** față de falie (scăzut din util); N/V = 0.
- **Util P 39,705** · **E 38,812** m² (NECONFIRMAT). Δ vs contur vechi ≈ +0,83 / +0,69.
- **POT 39,99%** pe 147 (amprentă **58,7923** m²) — neschimbat (max extent = anvelopă; falie N/V inset).
- Raport: `outputs/reports/v47_useful_by_level.md`.

## 2026-10-17 — Scară P→E: contratrepă 17 cm (clear +18)

- Rampa 1 + 2: **18 × 17 = 306** cm FF→FF (era 18×16=288).
- Entry / FF P **+48** neschimbat (3×16).
- Clear plafon **273** · sub grindă **259** (≥255).
- Podest SE @ FF+**136**; intrados podest ~+157.

## 2026-10-16 — LOCK N = muchie placă (clarificare audit structură)

- **Decizie unică:** stâlpi N (`C_NW`, `C_N_MID`, `C_NE`) pe **SLAB_N Y=0** (muchie placă), ca restul perimetrului.
- **Supersede** log „Nord NU pe muchie / Y=9,9”.
- Falie N/V vs E/S = zidărie la cheie (nu mută betonul).
- Sync: `axes.X_E = SLAB_E`; etichetă mesh întoarsă **Y575–600** (dy=25).

## 2026-10-16 — Autorizare: 1 cameră (perete dorm jos)

- Beneficiar: la autorizare se demontează peretele dorm↔living → o cameră.
- Nu urmărim pragul 52 m² / 2 camere ca blocaj pe studiu.

## 2026-10-16 — Audit extern: rundă 1 util (fără schimbări plan)

- Preluat feedback audit pe `83f6534` → `decisions/audit_external_feedback_r1_v01.md`.
- **Legal:** 37 m² ≠ PASS locuință 2 camere (Legea 114 Anexa 1); destinație = arhitect.
- **Fix util:** nu mai scădea A6 L din afara `polyE` (dublă scădere ~1,515). Thermal = intersecție cu contur.
- Un tabel canonic P/E: `areas_cm.useful_by_level` = `frame_study_areas`. Etichete = informativ. NECONFIRMAT.
- Backlog: goluri reale, anvelopă N, parcelă finite, scară/beci, FE, planuri unificate.

## 2026-10-16 — LOCK: tot perimetrul pe muchie placă + falie=zidărie

- **Supersede** nota anterioară „Nord NU pe muchie” / flush-ext N@9,9.
- Beneficiar: beton (stâlpi + centuri) pe muchia plăcii pe **N/V/E/S**; umplutura 20 decide la zidărie pe ce parte cade excesul 30−20.
- La cheie: **N/V** — proem. pe exterior; **E/S** — fațadă plană (exces în interior).
- Mesh FRAME: fără wrap ETICS pe stâlpi perimetrali; warning viewer Y575 actualizat (formă întoarsă **închisă**, armare = calcul).
- Docs sync: `form_target_R`, registru `column_thru` / `etics_wrap` / `facade_slab_edge_masonry`, FE brief.
