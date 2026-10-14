# V46 — secțiuni / rezerve

Vezi și `outputs/plans/15_v46_sections.svg`.

## Date
```json
{
  "A_bath_ew": {
    "id": "sec_A_baie",
    "cut_y": 100,
    "note": "secțiune E–W prin baie la Y100: duș, blat, șine distincte",
    "elements": [
      {
        "id": "duș",
        "x0": 30,
        "x1": 120,
        "z0": 0,
        "z1": 2
      },
      {
        "id": "sticlă_fix",
        "x0": 118,
        "x1": 120,
        "z0": 0,
        "z1": 200
      },
      {
        "id": "sticlă_mobil",
        "x0": 121,
        "x1": 123,
        "z0": 0,
        "z1": 200
      },
      {
        "id": "blat",
        "x0": 135,
        "x1": 337.5,
        "z0": 85,
        "z1": 90
      },
      {
        "id": "perete_est",
        "x0": 347.5,
        "x1": 360,
        "z0": 0,
        "z1": 255
      }
    ]
  },
  "B_living_ns": {
    "id": "sec_B_living",
    "cut_x": 400,
    "note": "secțiune N–S living X400: consolă TV, masă, scaune",
    "elements": [
      {
        "id": "tv_consolă",
        "y0": 55,
        "y1": 145,
        "z0": 0,
        "z1": 55
      },
      {
        "id": "masă",
        "y0": 275,
        "y1": 375,
        "z0": 0,
        "z1": 74
      },
      {
        "id": "canapea",
        "y0": 45,
        "y1": 215,
        "z0": 0,
        "z1": 75
      }
    ]
  },
  "C_stair": {
    "id": "sec_C_scara",
    "note": "scară: riser 16, tread 30, clear 105, parapet 10, FF→FF 288",
    "riser_cm": 16,
    "tread_cm": 30,
    "clear_cm": 105,
    "parapet_cm": 10,
    "ff_to_ff_cm": 288
  }
}
```

## Construcție
```json
{
  "status": "REZERVE — performanțe NECONFIRMATE până la documentare",
  "exterior_wall": {
    "thickness_finished_cm": 30,
    "layers_study": [
      "finisaj interior",
      "zidărie/structură",
      "izolație",
      "fațadă"
    ],
    "note": "alcătuire completă NECONFIRMATĂ; nu adăuga straturi peste net fără recalcul"
  },
  "interior_wall_pocket": {
    "current_cm": 12.5,
    "kit_125_mm": "compatibil grosime — nu = fonic baie",
    "thicken_to_cm": 15,
    "applied": false,
    "area_impact_m2": 0.15375,
    "area_note": "brut 2.5×615/10000=0.15375 înainte de goluri"
  },
  "floor_between_units": {
    "ff_to_ff_cm": 288,
    "buildup": {
      "note": "FF→FF 288 = 255+6+15+3+2+5+2. Neschimbat.",
      "clear_to_false_ceiling_cm": 255,
      "false_ceiling_cm": 6,
      "structural_slab_cm": 15,
      "structural_slab_status": "ipoteză structurist",
      "insulation_under_screed_cm": 3,
      "heating_pipes_zone_cm": 2,
      "screed_above_pipes_cm": 5,
      "finish_complete_cm": 2,
      "floor_buildup_below_ff_cm": 12,
      "ff_to_ff_cm": 288,
      "ff_check_sum": "255+6+15+3+2+5+2=288",
      "stair_risers_ff": 18,
      "riser_cm": 16,
      "wall_to_soffit_cm": 261,
      "entry_steps_to_terrace": 2,
      "entry_step_riser_cm": 16,
      "entry_steps_status": "ipoteză",
      "z_parter_ff_note": "zParter = 2 × riser = ipoteză elevație"
    },
    "floating_screed": "șapă flotantă + bandă perimetrală — REZERVĂ acustică",
    "acoustic_priority": "trafic stradal + între apartamente",
    "status": "structură/ipoteză — NECONFIRMAT"
  },
  "windows": {
    "mount": "montaj etanș + spumă/benzi — REZERVĂ",
    "acoustic": "prioritate trafic Dragalina — Rw NECONFIRMAT"
  },
  "thermal_bridges": {
    "terraces": "continuare izolație / prag — REZERVĂ",
    "stair": "rupere punți — REZERVĂ",
    "joinery": "praguri termice — REZERVĂ"
  }
}
```
