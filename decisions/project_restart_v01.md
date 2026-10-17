# Restart proiect — de la zero (fără amestec)

**Dată:** 2026-10-17  
**Status:** ACTIV — V47 A1 FRAME = **arhivat / înghețat** (nu se mai petecează)  
**Motiv:** ciclu infinit de corecții pe același model amestecat (arhitectură ↔ structură ↔ etichete)

---

## 1. Regulă de lucru (obligatorie)

1. **O versiune = o geometrie.** Schimbare mare → `A2` / `S1`, nu „fix pe A1”.
2. **O rundă = un owner.** Arhitectură *sau* structură *sau* instalații — nu toate odată.
3. **3D / viewer = control**, nu sursa de adevăr. Adevărul = planuri cotate + JSON pe versiune.
4. **Trei contururi explicite** (niciodată un singur dreptunghi cu 5 sensuri):
   - **Finit** (POT / fațadă)
   - **Beton / structură**
   - **Util** (fețe interioare)
5. **Poartă între etape:** nu începe etapa N+1 până etapa N e „înghețată” (Da/Nu pe checklist).

---

## 2. Etape (ordine fixă)

| # | Etapă | Livrabil înghețat | Planșe / view |
|---|--------|-------------------|---------------|
| **0** | Brief | 1 pagină confirmată | — |
| **1** | Amplasament | amprentă + POT țintă pe CF | plan situație |
| **2** | Concept ARH | volum P+E, scară, terasă | planuri schiță, 1–2 secțiuni |
| **3** | ARH de lucru **A1** | pereți, goluri, FF, util, tabele | plan P, plan E, secțiuni, fațade |
| **4** | Structură **S1** pe A1 | stâlpi, grinzi, plăci, fundații (studiu) | plan fundații, planșee, secțiuni R |
| **5** | Instalații **I1** pe A1+S1 | trasee + goluri | planuri pe nivel + scheme |
| **6** | Detalii / PT | noduri, memorii | după ce 3–5 sunt stabile |

**Interzis:** mutarea unui stâlp în rundă de arhitectură; mutarea unui perete de living în rundă de FE; „corectăm și POT și PV și clear” în același chat.

---

## 3. Ce se întâmplă cu V47

| | |
|--|--|
| **Status** | ARHIVĂ — lecții + date, **nu** bază de editare |
| **Nu se mai** | `study:frame` ca „încă o corecție”; patch pe `study_v47_frame_schema.mjs` pentru formă nouă |
| **Permis** | citire, export pentru brief, copiere selectivă de cifre **în documente noi** |
| **Folder logic** | tot ce e `v47_a1_frame*` = generație precedentă |

Lecții păstrate (nu geometria petecită):

- Fără amestec finit / beton / util pe același contur.
- EST pe limita Dragalina → finit nu crește afară; ETICS pe E/S în buget.
- Clear locuire ≥255; FF→FF și scară trebuie sincronizate o singură dată.
- Consolă palier = decizie explicită (cu/fără stâlp în living).
- FE semnat ≠ predimensionare în chat.

---

## 4. Brief seed (de confirmat — Etapa 0)

Valori **candidate** din proiectul vechi. Marchează: **PĂSTREAZĂ** / **SCHIMBĂ** / **DECIDE ULTERIOR**.

### Sit
- [x] Parcelă **147 m²** (ridicare topo 2011) · Turda · Dragalina + Cloșca — **172 scos** (acte vechi eronate)
- [ ] Orientare: **Dragalina = EST (dreapta)** · **Cloșca = SUD (jos)** · curte spre Cloșca
- [ ] Pe **limita Dragalina** + aliniere vecini N · demolare C1 existent

### Program
- [ ] **P+1** (parter + etaj)
- [ ] Amenajare tip studio / open · la autorizare: perete dorm↔living demontabil → **1 cameră**
- [ ] Acces auto + poartă (din plan integrat existent ca referință, nu ca geometrie locked)
- [ ] Subsol / beci: **da / nu / partial** — DECIDE

### Gabarit (doar după Etapa 1)
- [ ] Amprentă țintă: _de stabilit pe sit_ (nu mai copia 682,6×861,3 orb)
- [ ] POT pe 147: țintă _%_ (max RLU = necunoscut încă)

### Stil / materiale (poate rămâne)
- [ ] Belgian · cărămidă + tencuială
- [ ] Klinker Ströher Riegel 50 · Weber ETICS · EB20 + vată 80

### Structură (doar Etapa 4 — nu acum)
- [ ] Preferință: **cadre BA** (Varianta A) vs diafragme (B)
- [ ] Acoperiș: șarpantă ușoară + PV (intenție) vs BA
- [ ] Placă / clear: _de calcul pe A1 înghețat_

### Instalații (doar Etapa 5)
- [ ] Încălzire, ACS, electrice, PV — după S1

---

## 5. Checklist poartă Etapa 0 → 1

Înainte de amplasament nou:

- [ ] Brief confirmat (secțiunea 4 completată)
- [ ] Lista „PĂSTREAZĂ / SCHIMBĂ” agreată
- [ ] Confirmare: **nu mai edităm V47 FRAME**
- [ ] Nume versiune nouă: propunere **`A0`** (amplasament) → **`A1`** (arhitectură)

---

## 6. Structură fișiere (nouă — când începe A0)

```
decisions/
  project_restart_v01.md          ← acest fișier
  brief_A0_v01.md                 ← brief înghețat (următorul)
data/building/
  a0_site.json                    ← doar sit + amprentă (viitor)
  a1_architecture.json            ← doar ARH (viitor)
  s1_structure.json               ← doar structură pe A1 (viitor)
outputs/plans/
  a0_…  a1_…  s1_…                ← prefix pe versiune
```

Vechiul `v47_*` rămâne pe loc până la o rundă de arhivare fizică (opțional).

---

## 7. Următorul pas

**Etapa 0:** CONFIRMAT → `decisions/brief_A0_v01.md`  
**Etapa 1:** plan situație A0 + POT (corp 680×860 + pilastri N/V). Zero patch pe FRAME.
