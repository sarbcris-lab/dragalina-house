/**
 * Contururi libere interioare (fețe pereți din walls_cm) — nu dreptunghiuri rooms_cm.
 * Folosit de planurile FRAME pentru cote / m² etichetate.
 */
function wallById(walls, id) {
  return (walls || []).find((w) => w.id === id && !w.removed);
}

function shoelaceM2(verts) {
  let a = 0;
  for (let i = 0; i < verts.length - 1; i++) {
    a += verts[i][0] * verts[i + 1][1] - verts[i + 1][0] * verts[i][1];
  }
  return Math.abs(a) / 2 / 10000;
}

function polyAreaParts(parts) {
  return parts.reduce((s, p) => s + (p.dx * p.dy) / 10000, 0);
}

/**
 * @param {object} study v47_a1_frame_study.json
 * @param {"P"|"E"} level
 */
export function computeInteriorFreeSpaces(study, level = "E") {
  const walls = study.walls_cm || [];
  const W = (id) => wallById(walls, id);
  const nord = W("nord");
  const vest = W("vest");
  const comun = W("perete_comun_est");
  const nisaSp = W("nisa_dulap_spate");
  const nisaEst = W("nisa_dulap_est");
  const dormBaieN = W("dorm_baie_nord");
  const dormSud = W("dormitor_sud");
  const ov = level === "E" ? study.etaj_room_overrides_cm || {} : {};

  // Fețe interioare (cm)
  const xW = (vest?.x ?? 0) + (vest?.dx ?? 31.3); // 31.3
  const yN = (nord?.y ?? 0) + (nord?.dy ?? 30); // 30
  const xComunW = comun?.x ?? 348.8; // față vest perete comun (= est baie/dorm)
  const yNisaSpN = nisaSp?.y ?? 187.5; // față nord perete spate nișă
  const yNisaSpS = yNisaSpN + (nisaSp?.dy ?? 15); // 202.5
  const xNisaEstW = nisaEst?.x ?? 148.8; // față vest perete est nișă
  const xNisaEstE = xNisaEstW + (nisaEst?.dx ?? 15); // 163.8
  const yDormBaieN = dormBaieN?.y ?? 267.5; // față nord perete baie/dorm
  const yDormBaieS = yDormBaieN + (dormBaieN?.dy ?? 15); // 282.5
  const yDormS = dormSud?.y ?? 645; // față nord zid sud dorm

  // Baie L: sus plin + prelungire E de nișă (fără volumul nișei, fără grosimi pereți nișă)
  const bathUpper = { x: xW, y: yN, dx: xComunW - xW, dy: yNisaSpN - yN };
  const bathExt = {
    x: xNisaEstE,
    y: yNisaSpN,
    dx: xComunW - xNisaEstE,
    dy: yDormBaieN - yNisaSpN,
  };
  const bathParts = [bathUpper, bathExt];
  const bathM2 = polyAreaParts(bathParts);
  // poligon L pentru etichetă centru
  const bathPoly = [
    [xW, yN],
    [xComunW, yN],
    [xComunW, yDormBaieN],
    [xNisaEstE, yDormBaieN],
    [xNisaEstE, yNisaSpN],
    [xW, yNisaSpN],
    [xW, yN],
  ];

  // Nișă: fețe libere între vest, est nișă, sud spate, nord dorm_baie
  const nisa = {
    x: xW,
    y: yNisaSpS,
    dx: xNisaEstW - xW,
    dy: yDormBaieN - yNisaSpS,
  };
  const nisaM2 = (nisa.dx * nisa.dy) / 10000;

  // Dormitor: S de perete baie, N de zid sud, V–comun
  const dorm = {
    x: xW,
    y: yDormBaieS,
    dx: xComunW - xW,
    dy: yDormS - yDormBaieS,
  };
  const dormM2 = (dorm.dx * dorm.dy) / 10000;

  // Living / buc / circulație — override etaj unde există (încă rect; deliminate separat)
  const liv = ov.living || study.rooms_cm?.find((r) => r.id === "living");
  const buc = ov.bucatarie || study.rooms_cm?.find((r) => r.id === "bucatarie");
  const leg = ov.legatura_lb || study.rooms_cm?.find((r) => r.id === "legatura_lb");

  const spaces = [
    {
      id: "baie",
      kind: "free_L",
      parts: bathParts,
      poly: bathPoly,
      m2: +bathM2.toFixed(3),
      label_m2: bathM2,
      dim_note: `L: ${bathUpper.dx.toFixed(1)}×${bathUpper.dy.toFixed(1)} + ${bathExt.dx.toFixed(1)}×${bathExt.dy.toFixed(1)}`,
      cx: (xW + xComunW) / 2,
      cy: (yN + yNisaSpN) / 2,
      dims: [
        { type: "H", x0: bathUpper.x, x1: bathUpper.x + bathUpper.dx, y: bathUpper.y },
        { type: "V", y0: bathUpper.y, y1: bathUpper.y + bathUpper.dy, x: bathUpper.x },
        { type: "H", x0: bathExt.x, x1: bathExt.x + bathExt.dx, y: bathExt.y + bathExt.dy },
        { type: "V", y0: bathExt.y, y1: bathExt.y + bathExt.dy, x: bathExt.x + bathExt.dx },
      ],
    },
    {
      id: "nisa_dulap",
      kind: "free_rect",
      ...nisa,
      m2: +nisaM2.toFixed(3),
      label_m2: nisaM2,
      cx: nisa.x + nisa.dx / 2,
      cy: nisa.y + nisa.dy / 2,
      dims: [
        { type: "H", x0: nisa.x, x1: nisa.x + nisa.dx, y: nisa.y },
        { type: "V", y0: nisa.y, y1: nisa.y + nisa.dy, x: nisa.x },
      ],
    },
    {
      id: "dormitor",
      kind: "free_rect",
      ...dorm,
      m2: +dormM2.toFixed(3),
      label_m2: dormM2,
      cx: dorm.x + dorm.dx / 2,
      cy: dorm.y + dorm.dy / 2,
      dims: [
        { type: "H", x0: dorm.x, x1: dorm.x + dorm.dx, y: dorm.y },
        { type: "V", y0: dorm.y, y1: dorm.y + dorm.dy, x: dorm.x },
      ],
    },
  ];

  if (liv?.dx > 0) {
    spaces.push({
      id: "living",
      kind: "rect_ref",
      x: liv.x,
      y: liv.y,
      dx: liv.dx,
      dy: liv.dy,
      m2: +((liv.dx * liv.dy) / 10000).toFixed(3),
      label_m2: (liv.dx * liv.dy) / 10000,
      note: "dreptunghi ref. (override etaj) — nu = util total studio",
      cx: liv.x + liv.dx / 2,
      cy: liv.y + liv.dy / 2,
      dims: [
        { type: "H", x0: liv.x, x1: liv.x + liv.dx, y: liv.y },
        { type: "V", y0: liv.y, y1: liv.y + liv.dy, x: liv.x },
      ],
    });
  }
  if (buc?.dx > 0 && level === "E") {
    spaces.push({
      id: "bucatarie",
      kind: "rect_ref",
      x: buc.x,
      y: buc.y,
      dx: buc.dx,
      dy: buc.dy,
      m2: +((buc.dx * buc.dy) / 10000).toFixed(3),
      label_m2: (buc.dx * buc.dy) / 10000,
      note: "dreptunghi ref. etaj",
      cx: buc.x + buc.dx / 2,
      cy: buc.y + buc.dy / 2,
      dims: [
        { type: "H", x0: buc.x, x1: buc.x + buc.dx, y: buc.y },
        { type: "V", y0: buc.y, y1: buc.y + buc.dy, x: buc.x },
      ],
    });
  }
  if (leg?.dx > 0 && level === "E") {
    spaces.push({
      id: "circulatie",
      kind: "rect_ref",
      x: leg.x,
      y: leg.y,
      dx: leg.dx,
      dy: leg.dy,
      m2: +((leg.dx * leg.dy) / 10000).toFixed(3),
      label_m2: (leg.dx * leg.dy) / 10000,
      note: "între living și bucătărie — calculată separat",
      cx: leg.x + leg.dx / 2,
      cy: leg.y + leg.dy / 2,
      dims: [
        { type: "H", x0: leg.x, x1: leg.x + leg.dx, y: leg.y },
        { type: "V", y0: leg.y, y1: leg.y + leg.dy, x: leg.x },
      ],
    });
  }

  const st = study.stair_cm || {};
  const clear = st.width_clear_cm || 105;
  const bx = st.band_x ?? 565;
  spaces.push({
    id: "scara_liber",
    kind: "stair_clear",
    x: bx,
    y: 590,
    dx: clear,
    dy: 200,
    m2: null,
    label_m2: null,
    note: "lățime liberă finisaje — NU aria bandei 115",
    cx: bx + clear / 2,
    cy: 700,
    dims: [{ type: "H", x0: bx, x1: bx + clear, y: 650 }],
  });

  const frame = study.areas_cm?.frame_study_areas || {};
  const aptIds = new Set(["baie", "nisa_dulap", "dormitor", "living", "bucatarie", "circulatie"]);
  const sumLabels = spaces
    .filter((s) => aptIds.has(s.id) && s.m2 != null)
    .reduce((a, s) => a + Number(s.m2), 0);
  return {
    level,
    method:
      "fețe pereți walls_cm (baie L, nișă, dorm); living/buc/circulație = rect ref. delimitate; scară = clear cm",
    spaces,
    totals: {
      bath_free_m2: +bathM2.toFixed(3),
      nisa_free_m2: +nisaM2.toFixed(3),
      dorm_free_m2: +dormM2.toFixed(3),
      dorm_plus_nisa_m2: +(dormM2 + nisaM2).toFixed(3),
      bath_poly_shoelace_m2: +shoelaceM2(bathPoly).toFixed(3),
      useful_etaj_labels_sum_m2: +sumLabels.toFixed(3),
      /** Informativ — nu înlocuiește useful geometric din frame_study_areas. */
      useful_etaj_studio_m2: frame.useful_etaj_m2 ?? null,
      useful_etaj_shoelace_ref_m2: frame.useful_etaj_m2 ?? frame.useful_etaj_shoelace_m2 ?? null,
      palier_scara_rece_m2: frame.palier_scara_rece_m2 ?? null,
      note:
        "Etichete libere = informativ. Util geometric canonic = areas_cm.frame_study_areas / useful_by_level (NECONFIRMAT).",
    },
  };
}

export default computeInteriorFreeSpaces;
