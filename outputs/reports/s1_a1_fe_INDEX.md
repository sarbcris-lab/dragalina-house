# Pachet FE — Dragalina 131 A1 · INDEX

**Predare pentru structurist** · studiu din repo · **NU** proiect semnat  
**Versiune:** v03 · A1.187+ · 2026-10-19

## Citește în ordinea asta

| # | Fișier | Rol |
|---|--------|-----|
| 1 | **[s1_a1_fe_handoff_v03.md](./s1_a1_fe_handoff_v03.md)** | Brief principal: lock-uri, încărcări, geometrie, PASS ledger |
| 2 | **[s1_a1_fe_checklist_v03.md](./s1_a1_fe_checklist_v03.md)** | Checklist P1–P3 de bifat |
| 3 | [s1_a1_fe_handoff_v03.json](./s1_a1_fe_handoff_v03.json) | Același brief, mașină |

## Date de model

| Rol | Cale |
|-----|------|
| Schemă structurală | `data/building/a1_architecture.json` → `structure_a1_study_cm` |
| Alias curat | `data/building/a1_structure_study.json` |
| Amenajare / acoperiș | `data/building/v47_a1_study.json` |
| Volum 3D | `viewer/data/volume_a1.json` (view Structură / Acoperiș) |

**Nu folosi** `v47_a1_frame_study` (STALE).

## Rapoarte ordin (suport)

| Domeniu | Raport |
|---------|--------|
| Grinzi / placă / SE / stâlpi | `s1_a1_calc_100_v01` |
| Gaps / consolă | `s1_a1_calc_gaps_v01` |
| Vânt / flambaj / EC5 | `s1_a1_wind_buckling_ec5_v01` |
| Max in-repo | `s1_a1_max_inrepo_v01` |
| Clear ≥255 | `s1_a1_clear255_levels_v01` |
| Fundații q=221 | `s1_a1_foundations_geo120_v01` |
| Sens 180/221/250 | `s1_a1_foundations_sens_v01` |
| Hint armare | `s1_a1_rebar_hint_v01` |
| Nod C_E_PAL | `s1_a1_node_ce_pal_v01` |
| BOM șarpantă | `s1_a1_roof_bom_v01` |
| Uplift streșină | `s1_a1_eaves_uplift_v01` |
| Retenție+apă+seism | `s1_a1_retaining_seis_v01` |
| CR0 bare | `s1_a1_cr0_members_v01` |
| Talpă alunecare/răsturnare | `s1_a1_footing_stability_v01` (dacă există) |
| Confinare P100 | `s1_a1_p100_confinement_v01` (dacă există) |

## Lock-uri de respectat

- Clear **≥255** pretutindeni (nu 241)
- Acoperiș **2 ape · 30° · PV** ambele ape · D3a
- **Fără** `C_E_LAMELE` în cadru
- Fundații studiu **q_allow=221** până la geo 131
- Stâlp ≥ **30 cm**

## Regenerare

```
npm run calc:a1
npm run fe:handoff
```

## Due-diligence cumpărare (beneficiar)

→ [s1_a1_due_diligence_buy_v01.md](./s1_a1_due_diligence_buy_v01.md)
