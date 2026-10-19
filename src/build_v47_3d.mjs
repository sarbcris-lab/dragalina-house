/**
 * 3D EXACT V47 — pereți, camere, mobilier, P+1 pe poligon CF.
 * Local V47 (cm): NV origine, X→est, Y→sud.
 * Sit: x est, y nord.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function write(rel, obj) {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
  return p;
}

const m = (cm) => cm / 100;

/**
 * S1 / A1.170: subsol 3D din modelul curat A1 (nu camere V47 hol_subsol / reintrant).
 * Retenție = structure_box + walls + stair.pit; scară = stair A1.
 */
function basementFromA1(a1Bm, v47Bm) {
  const st = a1Bm.stair || {};
  const pit = st.pit || {};
  const door = st.door_to_magazie || null;
  const thA11 =
    a1Bm.walls?.find((w) => w.id === "subsol_reten_n")?.dy ||
    a1Bm.walls?.find((w) => w.role === "retaining")?.dx ||
    32.6;
  const openSh = st.open_shaft || null;
  return {
    source: "a1_architecture",
    a1_clean: true,
    status: a1Bm.status,
    structure_box: a1Bm.structure_box,
    rooms: a1Bm.rooms || [],
    walls: [...(a1Bm.walls || []), ...(pit.walls || [])],
    levels_vs_ff_parter_cm: {
      courtyard_general: 0,
      access_landing: st.levels_cm?.access_landing ?? -95,
      basement_ff: a1Bm.z_ff_cm ?? -250,
      slab_soffit_cm: st.levels_cm?.slab_soffit_target ?? -30,
      clear_height_cm: a1Bm.clear_target_cm ?? 220,
      floor_slab_th_cm: 15,
      status: "from_a1",
    },
    wall_thickness_study_cm: {
      retaining_ba_cm: thA11,
      perimeter_structure_cm: thA11,
      partition_cm: 12.5,
      shaft_west_cm: thA11,
      shaft_east_cm: thA11,
      shaft_north_cm: thA11,
    },
    door_to_rooms: door
      ? {
          id: door.id,
          x: door.x,
          y: door.y,
          dx: door.dx,
          dy: door.dy,
          opening_h_cm: 200,
          lintel_reserve_cm: 15,
        }
      : null,
    internal_doors: [],
    lower_landing: st.lower_landing || null,
    upper_landing: st.upper_landing || null,
    local_court_drop: st.upper_landing || null,
    stair: st.flight
      ? {
          ...st.flight,
          x: st.flight.x,
          y: st.flight.y,
          dx: st.flight.dx,
          dy: st.flight.dy,
        }
      : null,
    ramp2_ref: openSh,
    open_shaft_cm: openSh,
    open_shaft_under_ramp2: !!openSh,
    shaft_enclosure_cm: pit.x0 != null
      ? { y0: pit.y0, y1: pit.y1, x0: pit.x0, x1: pit.x1 }
      : undefined,
    // trepte curte: încă din V47/FRAME până le modelăm în A1
    court_to_access_steps: v47Bm?.court_to_access_steps || null,
    s1_note: a1Bm.s1_handoff?.frame_mesh || "A1 envelope",
  };
}

function main() {
  const inputRel = process.argv[2] || "data/building/v47_exact.json";
  const outVolRel = process.argv[3] || "viewer/data/volume_v47.json";
  const v47 = read(inputRel);
  const polygon = read("data/site/parcel_polygon_cf.json");
  const parcel = read("data/site/parcel.json");
  const gate = read("data/site/gate_poarta_v05.json");
  const program = read("data/building/site_program_v05.json");

  const byId = Object.fromEntries(
    polygon.vertices_m.filter((v, i, a) => i < a.length - 1).map((v) => [v.id, v])
  );
  // Front pe Dragalina: axa Y locală urmează lanțul 5→1; X spre vest (în lot).
  // Fațada est (X = ew) stă pe limita Dragalina. Mic offset de la pct 5 ca NV să rămână în parcelă.
  const P5 = byId[5];
  const P7 = byId[7];
  const dragChain = [5, 4, 3, 2, 1].map((id) => byId[id]);

  function dist(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }
  function lerp(a, b, t) {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }
  function pointAlong(chain, s) {
    let rem = s;
    for (let i = 0; i < chain.length - 1; i++) {
      const len = dist(chain[i], chain[i + 1]);
      if (rem <= len) return lerp(chain[i], chain[i + 1], rem / len);
      rem -= len;
    }
    return { ...chain[chain.length - 1] };
  }

  // tangent Dragalina la nord (N→S)
  const t0 = {
    x: dragChain[1].x - dragChain[0].x,
    y: dragChain[1].y - dragChain[0].y,
  };
  const tLen = Math.hypot(t0.x, t0.y) || 1;
  const Tx = t0.x / tLen;
  const Ty = t0.y / tLen;
  // inward = spre vest / interior
  let Ix = -Ty;
  let Iy = Tx;
  if (P5.x + Ix * 2 > P5.x) {
    Ix = -Ix;
    Iy = -Iy;
  }

  const ew = m(v47.envelope_cm.ew);
  const ns = m(v47.envelope_cm.ns);

  function insideParcel(pt) {
    const pts = polygon.vertices_m.slice(0, -1);
    let odd = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const yi = pts[i].y;
      const yj = pts[j].y;
      const xi = pts[i].x;
      const xj = pts[j].x;
      if ((yi > pt.y) !== (yj > pt.y) && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi)
        odd = !odd;
    }
    return odd;
  }

  function distPointToSegment(p, a, b) {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const len2 = abx * abx + aby * aby || 1e-12;
    let t = ((p.x - a.x) * abx + (p.y - a.y) * aby) / len2;
    t = Math.max(0, Math.min(1, t));
    const qx = a.x + t * abx;
    const qy = a.y + t * aby;
    return Math.hypot(p.x - qx, p.y - qy);
  }

  function overflowDistanceM(pt) {
    if (insideParcel(pt)) return 0;
    const pts = polygon.vertices_m.slice(0, -1);
    let dMin = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      dMin = Math.min(dMin, distPointToSegment(pt, a, b));
    }
    return dMin;
  }

  function cornerAt(along0) {
    const to = (lx, ly) => {
      const on = pointAlong(dragChain, along0 + ly);
      const depth = ew - lx;
      return { x: on.x + Ix * depth, y: on.y + Iy * depth };
    };
    return {
      NW: to(0, 0),
      NE: to(ew, 0),
      SE: to(ew, ns),
      SW: to(0, ns),
      to,
    };
  }

  // cel mai mic offset pe Dragalina (de la pct 5) ca toate colțurile să fie în parcelă
  let along0 = 0;
  for (let a = 0; a <= 1.2; a += 0.05) {
    const c = cornerAt(a);
    if ([c.NW, c.NE, c.SE, c.SW].every((pt) => insideParcel(pt))) {
      along0 = a;
      break;
    }
    along0 = a;
  }
  // mic buffer
  along0 = Math.min(along0 + 0.05, 1.0);
  const placed = cornerAt(along0);
  const toSiteXY = placed.to;

  /** local cm → site meters (X vest→est, Y nord→sud; est = pe Dragalina) */
  function toSite(lcmX, lcmY) {
    const p = toSiteXY(m(lcmX), m(lcmY));
    return { x: +p.x.toFixed(4), y: +p.y.toFixed(4) };
  }

  function rectPoly(x, y, dx, dy) {
    const a = toSite(x, y);
    const b = toSite(x + dx, y);
    const c = toSite(x + dx, y + dy);
    const d = toSite(x, y + dy);
    return [a, b, c, d, a];
  }

  /** Contur gol (winding opus) pentru THREE.Shape.holes */
  function rectHole(x, y, dx, dy) {
    return rectPoly(x, y, dx, dy).slice().reverse();
  }

  // Curte engleză = groapă ÎNCHISĂ pe E (Dragalina=beton) și pe verticală spre curte
  // (deasupra terenului). Gol în teren DOAR pe fântâna exterioară (Y≥ns), NU pe puțul sub casă.
  const ecOpen = v47.courtyard_cm?.english_court;
  let a1Basement = null;
  let a1Columns = null;
  let a1Structure = null;
  let a1Stair = null;
  let a1Amenajare = null;
  try {
    const a1p = path.join(ROOT, "data/building/a1_architecture.json");
    if (fs.existsSync(a1p)) {
      const a1 = JSON.parse(fs.readFileSync(a1p, "utf8"));
      if (a1?.basement_cm?.structure_box) a1Basement = a1.basement_cm;
      if (Array.isArray(a1?.columns_cm) && a1.columns_cm.length) a1Columns = a1.columns_cm;
      if (a1?.structure_a1_study_cm?.system === "cadre_beton_armat") {
        a1Structure = a1.structure_a1_study_cm;
      }
      if (a1?.stair_cm?.risers_flight_180) a1Stair = a1.stair_cm;
      if (a1?.walls_cm?.length) {
        a1Amenajare = {
          walls_cm: a1.walls_cm,
          rooms_cm: a1.rooms_cm,
          openings_cm: a1.openings_cm,
          furniture_cm: a1.furniture_cm,
          heights_cm: a1.heights_cm,
          envelope_cm: a1.envelope_cm,
        };
      }
    }
  } catch (_) {
    /* A1 opțional */
  }

  // Amenajare A1 înainte de cote — study rămâne sursă pentru assemblies/roof/site
  {
    const inputIsFrame =
      !!v47.structure_frame_study_cm &&
      v47.structure_frame_study_cm.system === "cadre_beton_armat";
    if (a1Amenajare && a1Basement && !inputIsFrame) {
      if (a1Amenajare.walls_cm?.length) v47.walls_cm = a1Amenajare.walls_cm;
      if (a1Amenajare.rooms_cm?.length) v47.rooms_cm = a1Amenajare.rooms_cm;
      if (a1Amenajare.openings_cm?.length) v47.openings_cm = a1Amenajare.openings_cm;
      if (a1Amenajare.furniture_cm?.length) v47.furniture_cm = a1Amenajare.furniture_cm;
      if (a1Amenajare.heights_cm?.ff_to_ff_cm) {
        v47.heights_cm = { ...v47.heights_cm, ...a1Amenajare.heights_cm };
      }
      if (a1Amenajare.envelope_cm?.ew) {
        v47.envelope_cm = { ...v47.envelope_cm, ...a1Amenajare.envelope_cm };
      }
      v47.amenajare_source = "a1_architecture";
    }
  }

  // FF = fața SUPERIOARĂ a pardoselii finite; grosimi sub FF.
  // A1 curat: stair_cm din a1_architecture (19 ridicări) — V47 avea 18×16=288 vs FF→FF 307.
  const ht = v47.heights_cm;
  const frameStudyEarly = v47.structure_frame_study_cm;
  const isFrameEarly =
    !!frameStudyEarly && frameStudyEarly.system === "cadre_beton_armat";
  const useA1Stair = !!a1Basement && !isFrameEarly && !!a1Stair;
  const st = useA1Stair ? { ...v47.stair_cm, ...a1Stair } : v47.stair_cm;
  const ffToFf = m(ht.ff_to_ff_cm);
  // Ridicare scară P→E = exact FF→FF (clear255 → 307 cm)
  const nRisersPE =
    (st.risers_flight_180 || 0) + (st.risers_flight_330 || 0) ||
    ht.stair_risers_ff ||
    18;
  const riser = ffToFf / nRisersPE;
  const wallH = m(
    ht.wall_to_soffit_cm ??
      ((ht.clear_to_false_ceiling_cm || 0) + (ht.false_ceiling_cm || 0) ||
        ht.ff_to_ff_cm)
  );
  const floorTh = m(ht.floor_buildup_below_ff_cm || 12);
  const treadTh = Math.min(riser, 0.06);
  // Elevație FF parter = ipoteză (2 trepte × riser); nu cotă teren confirmată
  const zParter = (ht.entry_steps_to_terrace || 2) * (m(ht.entry_step_riser_cm || ht.riser_cm));
  const zEtaj = zParter + ffToFf;
  const H = wallH;
  const meshes = [];
  const bmEarly = a1Basement
    ? basementFromA1(a1Basement, v47.basement_cm)
    : v47.basement_cm;
  const ctsEarly = bmEarly?.court_to_access_steps;
  const upEarly = bmEarly?.upper_landing || bmEarly?.local_court_drop;
  const r2ref = bmEarly?.ramp2_ref || st.ramp2;
  // puț deschis: A1 open_shaft, altfel ramp2_ref V47
  const shaftRef = bmEarly?.open_shaft_cm || r2ref;
  const ewCm = v47.envelope_cm.ew;
  const nsCm = v47.envelope_cm.ns;
  /**
   * Schelet studiu — IPOTZE (nu dovadă de rezistență).
   * A1 aprobat: grilă cadru simplificată (legacy).
   * A1_FRAME (structure_frame_study_cm): cadre BA, stâlpi dreptunghiulari pe pereți,
   *   fără pereți structurali P/E, fără pal_nw/ne pe placă, fără axă X320.
   */
  const WALL_FINISHED = 30;
  const assy = v47.construction_assemblies?.exterior_wall_heated || {};
  const assyCatalog = v47.construction_assemblies?.catalog || {};
  const THERMO_OUT = assy.etics_outside_brick_cm ?? 9.2;
  const frameStudy = v47.structure_frame_study_cm;
  const isFrameStudy = !!frameStudy && frameStudy.system === "cadre_beton_armat";
  /**
   * Model A1 curat = amenajare + subsol A1 + structure_a1_study_cm (S1 geometric).
   * Fără schelet FRAME V47.
   */
  const architectureOnly = !!a1Basement && !isFrameStudy;
  /** Placă structurală FRAME = muchie beton (nu anvelopa finită cu ETICS). */
  const structFp = isFrameStudy ? frameStudy.structural_footprint_cm : null;
  const slabStructPoly = () =>
    structFp
      ? rectPoly(structFp.x0 ?? 0, structFp.y0 ?? 0, structFp.ew, structFp.ns)
      : rectPoly(0, 0, ewCm, nsCm);
  const COL_BETON = isFrameStudy
    ? frameStudy.column_section_hypothesis_cm?.through_wall_cm ??
      frameStudy.column_section_hypothesis_cm?.through_wall ??
      30
    : 20;
  const COL = COL_BETON;
  const I = THERMO_OUT;
  const frameColumns = isFrameStudy ? frameStudy.columns || [] : null;
  const frameBeams = isFrameStudy
    ? (frameStudy.beams || []).filter(
        (b) => !/S_soffit|S_inverted/i.test((b.levels || []).join())
      )
    : null;
  // O singură geometrie: preferă grinda din listă (cu GEO_X0); inverted_edge_beam trebuie să fie același obiect
  const invertedEdgeBeam =
    isFrameStudy &&
    ((frameStudy.beams || []).find((b) => (b.levels || []).includes("S_inverted") || b.id === "B_Y590_EDGE_INVERTED") ||
      frameStudy.inverted_edge_beam);
  /** Z inferior stâlpi FRAME (pe talpa fundației) — un singur corp până la acoperiș. */
  let frameColumnZ0 = -0.3;
  // Legacy A1 (amenajare) — neschimbat de varianta frame
  const structNodesContinuous = [
    { id: "nw", x: I, y: I },
    { id: "n_part", x: 320, y: I },
    { id: "n_buc", x: 535, y: I },
    { id: "n_est", x: 650, y: I },
    { id: "w_mid", x: I, y: 400 },
    { id: "w_dorm", x: I, y: 645 },
    { id: "part_dorm", x: 320, y: 645 },
    { id: "est_y440", x: 650, y: 440 },
    { id: "est_y590", x: 650, y: 590 },
    { id: "s_buc_w", x: 360, y: 830 },
    { id: "s_buc_e", x: 535, y: 830 },
  ];
  const structNodesNoParter = [
    { id: "buc_y590", x: 535, y: 590 },
    { id: "part_mid", x: 328, y: 400 },
  ];
  const structNodesEtajOnly = isFrameStudy
    ? []
    : [
        { id: "pal_nw", x: 535, y: 470, note: "legacy A1 — în frame: interzis" },
        { id: "pal_ne", x: 650, y: 470, note: "legacy A1 — în frame: C_E_PAL continuu" },
      ];
  const STRUCT_HYPOTHESIS = isFrameStudy
    ? `FRAME studiu: cadre BA + EB20 + vată 80; stâlpi ${COL}×${frameStudy.column_section_hypothesis_cm?.along_wall_cm ?? 40} pe muchie placă (falie=zidărie) — de confirmat calcul/normativ. Neconstruibil. Fără pereți structurali P/E.`
    : "Structură studiu A1: COL_BETON=20 pe falie; EB20+ISOVER FASSADE. Dimensiuni ipoteză.";

  /** Straturi catalog int→ext → ordine exterior→interior pentru extrudare. */
  function layersFromOutside(catalogId) {
    const entry =
      assyCatalog[catalogId] ||
      (catalogId === "A2" ? v47.construction_assemblies?.exterior_wall_klinker : null) ||
      assy;
    const listed =
      entry?.layers_interior_to_exterior_mm || assy.layers_interior_to_exterior_mm || [];
    if (!Array.isArray(listed) || !listed.length) {
      return [
        { id: "grund_decorativa", name: "grund și decorativă", th_mm: 2 },
        { id: "strat_armat", name: "strat armat", th_mm: 5 },
        { id: "vata_isover_fassade", name: "ISOVER FASSADE", th_mm: 80 },
        { id: "adeziv_etics", name: "adeziv ETICS", th_mm: 5 },
        { id: "caramida_eb20", name: "EB20 Akustik", th_mm: 200 },
        { id: "tencuiala_int", name: "tencuială", th_mm: 6 },
        { id: "finisare_vopsea", name: "finisare/vopsea", th_mm: 1 },
      ];
    }
    const rev = [...listed].reverse();
    const paintIdx = rev.findIndex((L) => /vopsea|finisare/i.test(L.id || L.name || ""));
    const plasIdx = rev.findIndex((L) => /tencuiala_int|tencuială interioară/i.test(L.id || L.name || ""));
    if (paintIdx >= 0 && plasIdx >= 0 && paintIdx < plasIdx) {
      const p = rev[paintIdx];
      rev.splice(paintIdx, 1);
      rev.splice(plasIdx, 0, p);
    }
    return rev;
  }
  function resolveWallCatalogId(w, opts = {}) {
    if (opts.catalogId) return opts.catalogId;
    if (w.catalog_id) return w.catalog_id;
    if (w.id === "nord_heated" || w.catalog_id_heated) return w.catalog_id_heated || "A1";
    if (w.id === "nord_cold_stair" || w.thermal === "cold_stair") return w.catalog_id_cold || "A4";
    if (w.thermal === "house_stair_separator" || /buc_est/i.test(w.id || "")) return "A6";
    if (w.kind === "int") {
      if (/baie|nisa_dulap/i.test(w.id || "")) return "A8";
      return "A7";
    }
    // E/S/V heated → A2 klinker; N heated → A1
    const out = opts.outward || wallOutward(w);
    if (out === "north") return "A1";
    if (["vest", "est_living", "est_recuperat_p", "sud_bucatarie", "dormitor_sud"].includes(w.id))
      return "A2";
    if (out === "east" || out === "west" || out === "south") return "A2";
    return "A1";
  }
  const LAYER_COLORS = {
    grund_decorativa: "#8a8680",
    strat_armat: "#a8b0b8",
    vata_isover_fassade: "#e2d18a",
    adeziv_etics: "#b0a898",
    caramida_eb20: "#c4a070",
    tencuiala_int: "#e8e0d4",
    finisare_vopsea: "#f4f0e8",
    placaj_klinker: "#c4a882",
    placaj_klinker_curte: "#b8956e",
    tencuiala_scara: "#d4cfc4",
    miez_scara: "#a89880",
    miez_parapet: "#9a9590",
    tencuiala_fata_1: "#e8e0d4",
    tencuiala_fata_2: "#e8e0d4",
    faianata: "#e8eef2",
    adeziv_faianata: "#c5d0d8",
    gk_vopsea_1: "#f0ebe3",
    gk_vopsea_1a: "#f0ebe3",
    gk_vopsea_1b: "#ebe6dc",
    gk_vopsea_2: "#f0ebe3",
    gk_vopsea_2a: "#f0ebe3",
    gk_vopsea_2b: "#ebe6dc",
    gkbi_hidro: "#dde8f0",
    montanti_vata_fono: "#d8d090",
  };
  function wallOutward(w) {
    const eps = 0.6;
    if (w.y <= eps) return "north";
    if (w.x <= eps) return "west";
    if (Math.abs(w.x + w.dx - ewCm) <= eps) return "east";
    if (Math.abs(w.y + w.dy - nsCm) <= eps) return "south";
    // living_palier / reintrante: față nord a benzii
    if (w.dy >= w.dx) return w.x + w.dx / 2 > ewCm / 2 ? "east" : "west";
    return "north";
  }
  function isHeatedExteriorWall(w) {
    if (w.kind !== "ext") return false;
    if (w.thermal === "cold_stair" || w.assembly === "cold_stair") return false;
    if (w.thermal === "heated_thermosystem") return true;
    if (w.assembly && /EB20|ISOVER|FASSADE|20_sono/i.test(w.assembly)) return true;
    // contur încălzit: nu banda scară X565–680 pe nord
    if (w.id === "nord") return true; // layered doar pe segmentul încălzit — vezi split
    return ["vest", "est_living", "sud_bucatarie", "dormitor_sud"].includes(w.id);
  }
  function expandWallOutward(w, outward, trueThCm) {
    const oldTh = outward === "north" || outward === "south" ? w.dy : w.dx;
    const grow = Math.max(0, trueThCm - oldTh);
    // Geometria din JSON poate fi deja la grosimea catalog (după apply_geometry) — nu dubla
    if (grow < 0.05) return { ...w, _trueThCm: Math.max(oldTh, trueThCm) };
    if (outward === "north") return { ...w, y: w.y - grow, dy: oldTh + grow, _trueThCm: trueThCm };
    if (outward === "south") return { ...w, dy: oldTh + grow, _trueThCm: trueThCm };
    if (outward === "west") return { ...w, x: w.x - grow, dx: oldTh + grow, _trueThCm: trueThCm };
    return { ...w, dx: oldTh + grow, _trueThCm: trueThCm }; // east
  }
  /** Goluri în poligonul stratului de perete (ca să se vadă geamuri/uși pe P+E). */
  function openingHolesInWallLayer(w, outward, lx, ly, ldx, ldy) {
    const holes = [];
    for (const o of v47.openings_cm || []) {
      if (o.removed) continue;
      const ox0 = o.x;
      const oy0 = o.y;
      const ox1 = o.x + (o.dx || 8);
      const oy1 = o.y + (o.dy || 8);
      if (outward === "east" || outward === "west") {
        if (oy1 <= ly + 1 || oy0 >= ly + ldy - 1) continue;
        if (outward === "east" && ox1 < w.x - 2) continue;
        if (outward === "west" && ox0 > w.x + w.dx + 2) continue;
        const hy0 = Math.max(ly + 0.5, oy0);
        const hy1 = Math.min(ly + ldy - 0.5, oy1);
        if (hy1 - hy0 < 8) continue;
        holes.push(rectHole(lx - 1, hy0, ldx + 2, hy1 - hy0));
      } else {
        if (ox1 <= lx + 1 || ox0 >= lx + ldx - 1) continue;
        if (outward === "south" && oy0 < w.y - 2) continue;
        if (outward === "north" && oy1 > w.y + w.dy + 2) continue;
        const hx0 = Math.max(lx + 0.5, ox0);
        const hx1 = Math.min(lx + ldx - 0.5, ox1);
        if (hx1 - hx0 < 8) continue;
        holes.push(rectHole(hx0, ly - 1, hx1 - hx0, ldy + 2));
      }
    }
    return holes;
  }
  function pushLayeredExteriorWall(w, z0, z1, suffix, opts = {}) {
    const catalogId = resolveWallCatalogId(w, opts);
    const layers = layersFromOutside(catalogId);
    const outward = opts.outward || wallOutward(w);
    const sumMm = layers.reduce((s, L) => s + (L.th_mm || 0), 0);
    const trueThCm = sumMm / 10;
    const W = expandWallOutward(w, outward, trueThCm);
    // Fără auto-scale: straturile rămân la mm din catalog (evită A4/A7 „umflate” pe lungime)
    let accMm = 0;
    for (const L of layers) {
      const thMm = L.th_mm || 0;
      if (thMm < 0.05) continue;
      const aCm = accMm / 10;
      const bCm = (accMm + thMm) / 10;
      accMm += thMm;
      let x = W.x;
      let y = W.y;
      let dx = W.dx;
      let dy = W.dy;
      if (outward === "north") {
        y = W.y + aCm;
        dy = Math.max(0.05, bCm - aCm);
        dx = W.dx;
        x = W.x;
      } else if (outward === "south") {
        y = W.y + W.dy - bCm;
        dy = Math.max(0.05, bCm - aCm);
        dx = W.dx;
        x = W.x;
      } else if (outward === "west") {
        x = W.x + aCm;
        dx = Math.max(0.05, bCm - aCm);
        dy = W.dy;
        y = W.y;
      } else {
        x = W.x + W.dx - bCm;
        dx = Math.max(0.05, bCm - aCm);
        dy = W.dy;
        y = W.y;
      }
      const isFill = /caramida|eb20|miez_scara|miez_parapet|miez_gard/i.test(L.id);
      const isFono = /montanti_vata|vata_isover/i.test(L.id);
      const holes = openingHolesInWallLayer(w, outward, x, y, dx, dy);
      // umplutura = miez; anvelopa = ETICS/klinker/tencuială — ambele vizibile în „2 · + Pereți”
      const siteLayer = isFill
        ? "umplutura"
        : w.kind === "int" || /tencuiala_int|finisare_vopsea|faianata/i.test(L.id)
          ? "finisaj"
          : "anvelopa";
      meshes.push({
        id: `zid_${w.id}_${L.id}_${suffix}`,
        type: "extrude",
        polygon: rectPoly(x, y, dx, dy),
        holes: holes.length ? holes : undefined,
        z0_m: z0,
        z1_m: z1,
        color: LAYER_COLORS[L.id] || "#d8d2c6",
        label: `${w.id} [${catalogId}]: ${L.name || L.id} (${L.th_mm} mm)`,
        kind: w.kind || "ext",
        wall_layer: L.id,
        catalog_id: catalogId,
        assembly: catalogId,
        site_layer: siteLayer,
        group: w.kind === "ext" ? "fatada" : "compartimentare",
        opacity: isFono ? 0.85 : 0.97,
      });
    }
  }
  // până la fațada est (Dragalina), nu inset 670
  const pitX = shaftRef.x;
  const pitX1 = ewCm;
  const pitY = Math.min(shaftRef.y, upEarly?.y ?? 780, ecOpen?.y ?? 850);
  const pitY1 = Math.max(
    (ecOpen?.y ?? 850) + (ecOpen?.dy ?? 114),
    (ctsEarly?.y ?? 860) + (ctsEarly?.dy ?? 84),
    shaftRef.y + shaftRef.dy
  );
  const pitDx = Math.max(1, pitX1 - pitX);
  const pitDy = Math.max(1, pitY1 - pitY);
  // Goluri ORIZONTALE — trebuie integral ÎN parcelă CF, altfel THREE ignoră gaura (= capac!)
  function rectHoleInside(x, y, dx, dy) {
    let hx = x;
    let hy = y;
    let hdx = dx;
    let hdy = dy;
    for (let i = 0; i < 50; i++) {
      const hole = rectHole(hx, hy, hdx, hdy);
      const corners = hole.filter((p, idx) => idx === 0 || idx < hole.length - 1);
      // exclude duplicate close point
      const pts = hole.slice(0, -1);
      if (pts.length >= 3 && pts.every((p) => insideParcel(p))) return hole;
      hx += 3;
      hy += 3;
      hdx -= 6;
      hdy -= 6;
      if (hdx < 25 || hdy < 25) break;
    }
    return null;
  }
  // puț sub casă + fântână ca goluri separate (validate în CF)
  const shaftHole =
    rectHoleInside(
      shaftRef.x + 2,
      shaftRef.y + 2,
      shaftRef.dx - 4,
      Math.min(shaftRef.dy, nsCm - shaftRef.y) - 4
    ) ||
    rectHole(
      shaftRef.x + 5,
      shaftRef.y + 5,
      shaftRef.dx - 10,
      Math.min(shaftRef.dy, nsCm - shaftRef.y) - 10
    );
  const wellHole = rectHoleInside(pitX + 2, nsCm, pitDx - 4, Math.max(20, pitY1 - nsCm - 2));
  const terenHoles = [shaftHole, wellHole].filter(Boolean);

  meshes.push({
    id: "teren_cf",
    type: "extrude",
    polygon: polygon.vertices_m,
    holes: terenHoles,
    z0_m: -0.05,
    z1_m: 0.02,
    color: "#6d7f5c",
    label: `Parcelă CF (goluri canal validate CF ×${terenHoles.length})`,
  });

  const env = rectPoly(0, 0, ewCm, nsCm);
  meshes.push({
    id: "amprenta_v44",
    type: "extrude",
    polygon: env,
    holes: [shaftHole],
    z0_m: 0.02,
    z1_m: 0.04,
    color: "#9aa7b5",
    label: `Amprentă V47 ${ewCm / 100}×${nsCm / 100} m (gol puț)`,
    opacity: 0.35,
  });

  // Trepte acces: DOAR n mesh-uri (călcări). Ridicările totale = entry_steps_to_terrace (≥ n).
  // Ex.: 2 trepte (+16, +32) + a 3-a ridicare pe palier/terasă (FF = +48).
  function pushEntrySteps() {
    const es = st.entry_steps;
    if (!es || !es.steps) return;
    const n = es.steps;
    const stepDy = es.dy / n;
    const entryR = m(es.riser_cm || ht.entry_step_riser_cm || ht.riser_cm);
    const nRise = ht.entry_steps_to_terrace || n;
    // Y crește spre sud: treapta cea mai sudică jos, urcă spre nord (spre terasă).
    for (let i = 0; i < n; i++) {
      const ySouth = es.y + es.dy - (i + 1) * stepDy;
      const z0s = entryR * i;
      const z1s = entryR * (i + 1);
      meshes.push({
        id: `acces_treapta_${i}`,
        type: "extrude",
        polygon: rectPoly(es.x, ySouth, es.dx, stepDy),
        z0_m: z0s,
        z1_m: z1s + 0.02,
        color: i % 2 === 0 ? "#e8a020" : "#d4890a",
        site_layer: "structura",
        group: "scara_acces",
        label: `treaptă acces ${i + 1}/${n} (sus +${Math.round(z1s * 100)}; FF palier +${Math.round(zParter * 100)} = ridicare ${nRise})`,
      });
    }
  }
  // Palier: față sus = FF
  {
    const pal = st.palier_parter;
    meshes.push({
      id: "palier_parter",
      type: "extrude",
      polygon: rectPoly(pal.x, pal.y, pal.dx, pal.dy),
      z0_m: zParter - floorTh,
      z1_m: zParter,
      color: "#c4b496",
      site_layer: "finisaj",
      group: "scara_acces",
      label: "Palier FF (față sus = FF parter)",
    });
  }

  // Soclu mozaic + umplere elevație (teren → h soclu) — doar parter / fațadă
  {
    const socle = v47.facade_cm?.soclu || {};
    const zSocle = m(socle.h_cm || 60);
    const mosaicColors = socle.colors || [
      "#a89878",
      "#8a8070",
      "#b0a088",
      "#7a7060",
      "#c4b49a",
      "#6e6658",
    ];
    const tile = Math.max(socle.tile_cm || 18, 16);
    const hCm = socle.h_cm || 60;

    function mosaicFace(idBase, x, y, dx, dy, outward) {
      // bandă subțire pe fața exterioară + tile-uri
      const face = outward === "south"
        ? { x, y: y + dy - 3, dx, dy: 3 }
        : outward === "north"
          ? { x, y, dx, dy: 3 }
          : outward === "east"
            ? { x: x + dx - 3, y, dx: 3, dy }
            : { x, y, dx: 3, dy }; // west
      const alongX = face.dx >= face.dy;
      const len = alongX ? face.dx : face.dy;
      const nT = Math.max(1, Math.ceil(len / tile));
      const nZ = Math.max(1, Math.ceil(hCm / tile));
      for (let i = 0; i < nT; i++) {
        for (let iz = 0; iz < nZ; iz++) {
          const tlen = Math.min(tile - 1, len - i * tile); // rost ~1 cm
          const th = Math.min(tile - 1, hCm - iz * tile);
          if (tlen < 2 || th < 2) continue;
          const ox = alongX ? face.x + i * tile : face.x;
          const oy = alongX ? face.y : face.y + i * tile;
          const odx = alongX ? tlen : face.dx;
          const ody = alongX ? face.dy : tlen;
          meshes.push({
            id: `${idBase}_${i}_${iz}`,
            type: "extrude",
            polygon: rectPoly(ox, oy, odx, ody),
            z0_m: m(iz * tile),
            z1_m: m(iz * tile + th),
            color: mosaicColors[(i * 2 + iz * 3) % mosaicColors.length],
            finish: "mozaic",
            label: "mozaic soclu",
          });
        }
      }
    }

    // Plintă sub terasa parter — umple elevația sub placă
    const tl = v47.terrace_by_level?.[0];
    if (tl) {
      meshes.push({
        id: "terasa_plinta_elevatie",
        type: "extrude",
        polygon: rectPoly(tl.x, tl.y, tl.dx, tl.dy),
        z0_m: 0,
        z1_m: Math.max(zParter - 0.02, 0.08),
        color: mosaicColors[1],
        finish: "mozaic",
        label: "plintă terasă — umple elevație",
      });
      mosaicFace("mozaic_terasa_sud", tl.x, tl.y, tl.dx, tl.dy, "south");
      mosaicFace("mozaic_terasa_vest", tl.x, tl.y, tl.dx, tl.dy, "west");
      mosaicFace("mozaic_terasa_est", tl.x, tl.y, tl.dx, tl.dy, "east");
    }

    // Soclu pe pereții exteriori (umple golul sub FF + bandă ~60 cm)
    for (const w of v47.walls_cm) {
      if (w.removed) continue;
      if (w.kind !== "ext") continue;
      // nu soclu pe P pentru ziduri doar-etaj
      if (w.levels && !w.levels.includes(0)) continue;
      meshes.push({
        id: `soclu_${w.id}`,
        type: "extrude",
        polygon: rectPoly(w.x, w.y, w.dx, w.dy),
        z0_m: 0,
        z1_m: zSocle,
        color: mosaicColors[0],
        finish: "mozaic",
        site_layer: "anvelopa",
        group: "fatada",
        label: `soclu mozaic ${w.id}`,
      });
    }
    // Mozaic pe elevațiile principale (N, S dorm, V, E living)
    const dormSud = v47.walls_cm.find((w) => w.id === "dormitor_sud");
    const nord = v47.walls_cm.find((w) => w.id === "nord");
    const vest = v47.walls_cm.find((w) => w.id === "vest");
    const estLiv = v47.walls_cm.find((w) => w.id === "est_living");
    if (dormSud) mosaicFace("mozaic_fatada_sud", dormSud.x, dormSud.y, dormSud.dx, dormSud.dy, "south");
    if (nord) mosaicFace("mozaic_fatada_nord", nord.x, nord.y, nord.dx, nord.dy, "north");
    if (vest) mosaicFace("mozaic_fatada_vest", vest.x, vest.y, vest.dx, vest.dy, "west");
    if (estLiv) mosaicFace("mozaic_fatada_est", estLiv.x, estLiv.y, estLiv.dx, estLiv.dy, "east");
  }

  for (let level = 0; level < v47.levels; level++) {
    const zFf = level === 0 ? zParter : zEtaj;
    const z1 = zFf + H;
    const suffix = level === 0 ? "p" : "e";

    const etajOv = v47.etaj_room_overrides_cm || {};
    for (const r of v47.rooms_cm) {
      if (r.id === "scara") continue;
      const onLevel = !r.levels || r.levels.includes(level);
      const etajFoot = level === 1 && etajOv[r.id];
      if (!onLevel && !etajFoot) continue;
      // Overlay / zone (dining_p etc.)
      if (r.exclude_from_area) {
        if (level === 0 && onLevel) {
          meshes.push({
            id: `pardoseala_${r.id}_${suffix}`,
            type: "extrude",
            polygon: rectPoly(r.x, r.y, r.dx, r.dy),
            z0_m: zFf,
            z1_m: zFf + 0.03,
            color: r.floor || "#e8dcc8",
            label: `${r.label || r.id} (zonă P)`,
            opacity: 0.55,
          });
        }
        continue;
      }
      if (r.outdoor) {
        if (!onLevel) continue;
        const tl = v47.terrace_by_level?.[level];
        const tx = tl?.x ?? r.x;
        const ty = tl?.y ?? r.y;
        const tdx = tl?.dx ?? r.dx;
        const tdy = tl?.dy ?? r.dy;
        meshes.push({
          id: `${r.id}_${suffix}`,
          type: "extrude",
          polygon: rectPoly(tx, ty, tdx, tdy),
          z0_m: zFf - floorTh,
          z1_m: zFf,
          color: level === 0 ? "#c8d8b0" : r.floor,
          label: level === 0 ? "TERASĂ parter mărită FF" : "TERASĂ etaj FF",
        });
        if (level === 0 && r.parts?.uncovered_south) {
          const u = r.parts.uncovered_south;
          meshes.push({
            id: `terasa_neacoperita_${suffix}`,
            type: "extrude",
            polygon: rectPoly(u.x, u.y, u.dx, u.dy),
            z0_m: zFf - 0.01,
            z1_m: zFf + 0.02,
            color: "#b8c898",
            opacity: 0.85,
            label: "terasă NEACOPERITĂ",
          });
        }
        continue;
      }
      let rx = r.x,
        ry = r.y,
        rdx = r.dx,
        rdy = r.dy;
      let label = r.label;
      if (etajFoot) {
        rx = etajOv[r.id].x ?? rx;
        ry = etajOv[r.id].y ?? ry;
        rdx = etajOv[r.id].dx ?? rdx;
        rdy = etajOv[r.id].dy ?? rdy;
        label = `${r.label || r.id} (etaj frozen)`;
      } else if (!onLevel) {
        continue;
      }
      meshes.push({
        id: `pardoseala_${r.id}_${suffix}`,
        type: "extrude",
        polygon: rectPoly(rx, ry, rdx, rdy),
        z0_m: zFf - floorTh,
        z1_m: zFf,
        color: r.floor,
        label: `${label} ${suffix} (FF=sus)`,
        opacity: 0.92,
        site_layer: "finisaj",
        group: "pardoseli",
      });
    }

    for (const w of v47.walls_cm) {
      if (w.removed) continue;
      if (w.kind === "parapet") continue;
      if (w.levels && !w.levels.includes(level)) continue;
      const isExt = w.kind === "ext";
      // Pe P: sub palier = living deschis, except închiderea termică (frame study).
      if (
        level === 0 &&
        w.id !== "est_recuperat_p" &&
        w.id !== "living_put_thermal_y590" &&
        w.id !== "palier_inchidere_sud_p" &&
        w.x < 680 &&
        w.x + w.dx > 535 &&
        w.y < 590 &&
        w.y + w.dy > 470
      ) {
        continue;
      }
      // Perete N: A1 pe casă X0–565; A4 scară rece X565–680
      if (isExt && w.id === "nord") {
        const heated = {
          ...w,
          id: "nord_heated",
          x: 0,
          dx: 565,
          thermal: "heated_thermosystem",
          catalog_id: "A1",
        };
        const cold = {
          ...w,
          id: "nord_cold_stair",
          x: 565,
          dx: 115,
          thermal: "cold_stair",
          catalog_id: "A4",
        };
        pushLayeredExteriorWall(heated, zFf, z1, suffix, { outward: "north", catalogId: "A1" });
        pushLayeredExteriorWall(cold, zFf, z1, suffix, { outward: "north", catalogId: "A4" });
        continue;
      }
      if (
        isExt &&
        (w.thermal === "house_stair_separator" ||
          /buc_est|palier_A6/i.test(w.id || "") ||
          w.catalog_id === "A6")
      ) {
        // A6: outward = spre scară/palier rece (implicit est pe picior V; sud pe picior N)
        const outA6 = w.outward_hint || (w.dx >= w.dy ? "south" : "east");
        pushLayeredExteriorWall(w, zFf, z1, suffix, {
          outward: outA6,
          catalogId: "A6",
        });
        continue;
      }
      if (isExt && isHeatedExteriorWall(w)) {
        pushLayeredExteriorWall(w, zFf, z1, suffix);
        continue;
      }
      if (!isExt && (w.catalog_id === "A7" || w.catalog_id === "A8" || w.kind === "int")) {
        const cid = w.catalog_id || (/baie|nisa_dulap/i.test(w.id || "") ? "A8" : "A7");
        // thickness axis: long in X → stack N/S; long in Y → stack E/W
        const out = w.dx >= w.dy ? "south" : "east";
        pushLayeredExteriorWall(w, zFf, z1, suffix, { outward: out, catalogId: cid });
        continue;
      }
      meshes.push({
        id: `zid_${w.id}_${suffix}`,
        type: "extrude",
        polygon: rectPoly(w.x, w.y, w.dx, w.dy),
        z0_m: zFf,
        z1_m: z1,
        site_layer: isExt ? "anvelopa" : "finisaj",
        group: isExt ? "fatada" : "compartimentare",
        color: isExt ? "#d8d2c6" : "#ebe6dc",
        label: w.id,
        kind: w.kind,
      });
    }

    for (const f of v47.furniture_cm) {
      if (f.levels && !f.levels.includes(level)) continue;
      if (f.status === "overlay" || f.not_furniture_count) {
        meshes.push({
          id: `overlay_${f.id}_${suffix}`,
          type: "extrude",
          polygon: rectPoly(f.x, f.y, f.dx, f.dy),
          z0_m: zFf,
          z1_m: zFf + 0.05,
          color: f.color || "#a8b898",
          opacity: 0.25,
          site_layer: "mobilier",
          group: "mobilier",
          label: `${f.id} (gabarit)`,
        });
        continue;
      }
      meshes.push({
        id: `mob_${f.id}_${suffix}`,
        type: "extrude",
        polygon: rectPoly(f.x, f.y, f.dx || 10, f.dy || 10),
        z0_m: zFf,
        z1_m: zFf + m(f.h || 40),
        color: f.color,
        site_layer: "mobilier",
        group: "mobilier",
        label: f.id,
      });
    }

    // Parapete terasă (filtrate pe nivel dacă e specificat)
    if (v47.parapets_cm) {
      for (const p of v47.parapets_cm) {
        if (p.levels && !p.levels.includes(level)) continue;
        if (p.gap || !(p.h > 0)) continue; // gol acces (ex. cele 2 scari)
        meshes.push({
          id: `parapet_${p.id}_${suffix}`,
          type: "extrude",
          polygon: rectPoly(p.x, p.y, p.dx, p.dy),
          z0_m: zFf,
          z1_m: zFf + m(p.h || 105),
          color: p.color || "#8a939e",
          site_layer: "anvelopa",
          group: "fatada",
          label: p.id,
        });
      }
    }
  }

  // evidențiere parapet izolator terasă (dacă lipsește din loop pe gap)
  {
    const iso = (v47.parapets_cm || []).find((p) => p.id === "terasa_parapet_est_neacoperit");
    if (iso && iso.h > 0) {
      const exists = meshes.some((m) => m.id === "parapet_terasa_parapet_est_neacoperit_p");
      if (!exists) {
        meshes.push({
          id: "parapet_terasa_parapet_est_neacoperit_p",
          type: "extrude",
          polygon: rectPoly(iso.x, iso.y, iso.dx, iso.dy),
          z0_m: zParter,
          z1_m: zParter + m(iso.h),
          color: iso.color || "#1faa3a",
          label: "parapet izolator terasă P (stânga trepte → ușă)",
        });
      }
    }
  }

  // Acoperiș 2 ape real (triangles): coamă pe latura 6,8 m (EW), ape N/S, PV pe ambele.
  // Acoperă anvelopa 680×860 inclusiv banda scară; NU podest SE / rampă 1 (Y≥860, neacoperite).
  const roofMeta = v47.roof_cm || {};
  const cover = roofMeta.covers_cm || {};
  const x0r = cover.x0 ?? 0;
  const x1r = cover.x1 ?? v47.envelope_cm.ew;
  const y0r = cover.y0 ?? 0;
  const y1r = cover.y1 ?? v47.envelope_cm.ns;
  const ridgeY = roofMeta.ridge?.y_cm ?? (y0r + y1r) / 2;
  const riseCm = roofMeta.rise_cm ?? 140; // ~18° pe run 4,3 m — ipoteză PV
  const roofTh = m(roofMeta.shell_cm ?? 18);
  const eaveZ = zEtaj + H;
  const ridgeZ = eaveZ + m(riseCm);
  const runN = Math.abs(ridgeY - y0r);
  const pitchDeg = (Math.atan2(m(riseCm), m(runN || 1)) * 180) / Math.PI;

  function siteVert(lcmX, lcmY, zM) {
    const p = toSite(lcmX, lcmY);
    return { x: p.x, y: p.y, z: +(+zM).toFixed(4) };
  }
  function pushTriMesh(id, verts, faces, color, label, extra = {}) {
    const zs = verts.map((v) => v.z);
    meshes.push({
      id,
      type: "triangles",
      vertices: verts,
      faces,
      color,
      label,
      site_layer: extra.site_layer || "structura",
      z0_m: Math.min(...zs),
      z1_m: Math.max(...zs),
      ...extra,
    });
  }
  function zOnPitch(yLocal, yA, zA, yB, zB) {
    const t = (yLocal - yA) / (yB - yA || 1);
    return zA + t * (zB - zA);
  }

  // Apa N (Y nord → coamă)
  {
    const v0 = siteVert(x0r, y0r, eaveZ);
    const v1 = siteVert(x1r, y0r, eaveZ);
    const v2 = siteVert(x1r, ridgeY, ridgeZ);
    const v3 = siteVert(x0r, ridgeY, ridgeZ);
    const v0b = siteVert(x0r, y0r, eaveZ - roofTh);
    const v1b = siteVert(x1r, y0r, eaveZ - roofTh);
    const v2b = siteVert(x1r, ridgeY, ridgeZ - roofTh);
    const v3b = siteVert(x0r, ridgeY, ridgeZ - roofTh);
    pushTriMesh(
      "acoperis_apa_N",
      [v0, v1, v2, v3, v0b, v1b, v2b, v3b],
      [
        [0, 1, 2],
        [0, 2, 3],
        [4, 6, 5],
        [4, 7, 6],
        [0, 4, 5],
        [0, 5, 1],
        [3, 2, 6],
        [3, 6, 7],
        [0, 3, 7],
        [0, 7, 4],
        [1, 5, 6],
        [1, 6, 2],
      ],
      "#6e5040",
      `Acoperiș apa N — ~${pitchDeg.toFixed(0)}°, coamă EW 6,8 m`
    );
  }
  // Apa S (coamă → Y sud)
  {
    const v0 = siteVert(x0r, ridgeY, ridgeZ);
    const v1 = siteVert(x1r, ridgeY, ridgeZ);
    const v2 = siteVert(x1r, y1r, eaveZ);
    const v3 = siteVert(x0r, y1r, eaveZ);
    const v0b = siteVert(x0r, ridgeY, ridgeZ - roofTh);
    const v1b = siteVert(x1r, ridgeY, ridgeZ - roofTh);
    const v2b = siteVert(x1r, y1r, eaveZ - roofTh);
    const v3b = siteVert(x0r, y1r, eaveZ - roofTh);
    pushTriMesh(
      "acoperis_apa_S",
      [v0, v1, v2, v3, v0b, v1b, v2b, v3b],
      [
        [0, 1, 2],
        [0, 2, 3],
        [4, 6, 5],
        [4, 7, 6],
        [0, 4, 5],
        [0, 5, 1],
        [3, 2, 6],
        [3, 6, 7],
        [0, 3, 7],
        [0, 7, 4],
        [1, 5, 6],
        [1, 6, 2],
      ],
      "#6e5040",
      `Acoperiș apa S — ~${pitchDeg.toFixed(0)}°, coamă EW 6,8 m`
    );
  }
  // Frontoane W / E (închidere fronton)
  {
    const nW = siteVert(x0r, y0r, eaveZ);
    const sW = siteVert(x0r, y1r, eaveZ);
    const rW = siteVert(x0r, ridgeY, ridgeZ);
    const nE = siteVert(x1r, y0r, eaveZ);
    const sE = siteVert(x1r, y1r, eaveZ);
    const rE = siteVert(x1r, ridgeY, ridgeZ);
    pushTriMesh(
      "acoperis_fronton_W",
      [nW, sW, rW],
      [[0, 1, 2]],
      "#5a4236",
      "Fronton vest"
    );
    pushTriMesh(
      "acoperis_fronton_E",
      [nE, rE, sE],
      [[0, 1, 2]],
      "#5a4236",
      "Fronton est (Dragalina)"
    );
  }
  // PV pe ambele ape (inset, deasupra învelitorii)
  if (roofMeta.pv?.both_pitches !== false) {
    const inset = roofMeta.pv?.inset_cm ?? 40;
    const pvOff = m(roofMeta.pv?.above_roof_cm ?? 6);
    const xa = x0r + inset;
    const xb = x1r - inset;
    // Apa N
    {
      const ya = y0r + inset;
      const yb = ridgeY - inset;
      const za = zOnPitch(ya, y0r, eaveZ, ridgeY, ridgeZ) + pvOff;
      const zb = zOnPitch(yb, y0r, eaveZ, ridgeY, ridgeZ) + pvOff;
      pushTriMesh(
        "pv_apa_N",
        [
          siteVert(xa, ya, za),
          siteVert(xb, ya, za),
          siteVert(xb, yb, zb),
          siteVert(xa, yb, zb),
        ],
        [
          [0, 1, 2],
          [0, 2, 3],
        ],
        "#1a2330",
        "PV apa N",
        { site_layer: "pv", roughness: 0.35, metalness: 0.55, opacity: 0.95 }
      );
    }
    // Apa S
    {
      const ya = ridgeY + inset;
      const yb = y1r - inset;
      const za = zOnPitch(ya, ridgeY, ridgeZ, y1r, eaveZ) + pvOff;
      const zb = zOnPitch(yb, ridgeY, ridgeZ, y1r, eaveZ) + pvOff;
      pushTriMesh(
        "pv_apa_S",
        [
          siteVert(xa, ya, za),
          siteVert(xb, ya, za),
          siteVert(xb, yb, zb),
          siteVert(xa, yb, zb),
        ],
        [
          [0, 1, 2],
          [0, 2, 3],
        ],
        "#1a2330",
        "PV apa S",
        { site_layer: "pv", roughness: 0.35, metalness: 0.55, opacity: 0.95 }
      );
    }
  }

  // —— STRUCTURĂ ACOPERIȘ: coamă + solbancuri + căpriori pe pantă (FRAME + A1 S1)
  if (isFrameStudy || (architectureOnly && a1Structure)) {
    const rs = roofMeta.structure_cm || {};
    const ridgeSec = rs.ridge_beam?.section_cm || [20, 35];
    const plateSec = rs.wall_plate?.section_cm || [20, 25];
    const rafSec = rs.rafter?.section_cm || [12, 25];
    const spacing = rs.rafter?.spacing_cm || 120;
    const dropUnderShell = roofTh * 0.35; // sub învelitoare
    const roofBeams = isFrameStudy ? frameStudy.beams || [] : a1Structure.beams || [];
    // A1: cutie beton ~X/Y 10…(ew/ns−10); FRAME: structural_footprint
    const roofFp = structFp ||
      (architectureOnly
        ? {
            x0: 10,
            y0: 10,
            x1: ewCm - 10,
            ew: ewCm - 20,
            ns: nsCm - 20,
          }
        : null);
    const boxFaces = [
      [0, 1, 2],
      [0, 2, 3],
      [4, 6, 5],
      [4, 7, 6],
      [0, 4, 5],
      [0, 5, 1],
      [3, 2, 6],
      [3, 6, 7],
      [0, 3, 7],
      [0, 7, 4],
      [1, 5, 6],
      [1, 6, 2],
    ];
    function pushPitchBeam(id, xa, xb, yA, zA, yB, zB, thZcm, color, label) {
      const zAt = zA - dropUnderShell;
      const zBt = zB - dropUnderShell;
      const zAb = zAt - m(thZcm);
      const zBb = zBt - m(thZcm);
      pushTriMesh(
        id,
        [
          siteVert(xa, yA, zAt),
          siteVert(xb, yA, zAt),
          siteVert(xb, yB, zBt),
          siteVert(xa, yB, zBt),
          siteVert(xa, yA, zAb),
          siteVert(xb, yA, zAb),
          siteVert(xb, yB, zBb),
          siteVert(xa, yB, zBb),
        ],
        boxFaces,
        color,
        label,
        { site_layer: "structura" }
      );
    }
    // Grindă coamă (orizontală pe Y ridge)
    {
      const by = ridgeSec[0];
      const hz = ridgeSec[1];
      meshes.push({
        id: "acoperis_coama_BA",
        type: "extrude",
        polygon: rectPoly(
          roofFp?.x0 ?? x0r,
          ridgeY - by / 2,
          roofFp?.ew ?? x1r - x0r,
          by
        ),
        z0_m: ridgeZ - dropUnderShell - m(hz),
        z1_m: ridgeZ - dropUnderShell,
        color: "#d4a84b",
        opacity: 0.98,
        site_layer: "structura",
        label: `grindă coamă ${ridgeSec[0]}×${ridgeSec[1]} cm · Y${ridgeY} (lemn studiu)`,
      });
    }
    // Solbancuri streșină N / S — pe muchie CONC
    {
      const by = plateSec[0];
      const hz = plateSec[1];
      const sx0 = roofFp?.x0 ?? x0r;
      const sy0 = roofFp?.y0 ?? y0r;
      const sew = roofFp?.ew ?? x1r - x0r;
      const sns = roofFp?.ns ?? y1r - y0r;
      meshes.push({
        id: "acoperis_solbanc_N",
        type: "extrude",
        polygon: rectPoly(sx0, sy0, sew, by),
        z0_m: eaveZ - m(hz),
        z1_m: eaveZ,
        color: "#c4983e",
        site_layer: "structura",
        label: `solbanc N ${plateSec[0]}×${plateSec[1]} cm pe CONC`,
      });
      meshes.push({
        id: "acoperis_solbanc_S",
        type: "extrude",
        polygon: rectPoly(sx0, sy0 + sns - by, sew, by),
        z0_m: eaveZ - m(hz),
        z1_m: eaveZ,
        color: "#c4983e",
        site_layer: "structura",
        label: `solbanc S ${plateSec[0]}×${plateSec[1]} cm pe CONC`,
      });
    }
    // Căpriori pe ape N și S — pas egal pe lățimea CONC (nu rest inegal la est)
    {
      const w = rafSec[0];
      const hz = rafSec[1];
      const rx0 = roofFp?.x0 ?? x0r;
      const rx1 = roofFp?.x1 ?? x1r;
      const clearW = Math.max(w, rx1 - rx0 - w); // zonă utilă între fețe
      // n intervale ca pas ≤ spacing nominal; n+1 căpriori, inset w/2 de la fețe
      const nBay = Math.max(1, Math.ceil(clearW / spacing));
      const step = clearW / nBay;
      const rafXs = [];
      for (let i = 0; i <= nBay; i++) {
        rafXs.push(rx0 + w / 2 + i * step);
      }
      let idx = 0;
      for (const x of rafXs) {
        const xa = x - w / 2;
        const xb = x + w / 2;
        pushPitchBeam(
          `acoperis_caprior_N_${idx}`,
          xa,
          xb,
          y0r,
          eaveZ,
          ridgeY,
          ridgeZ,
          hz,
          "#b8893a",
          `căprior N @ X${Math.round(x)}`
        );
        pushPitchBeam(
          `acoperis_caprior_S_${idx}`,
          xa,
          xb,
          ridgeY,
          ridgeZ,
          y1r,
          eaveZ,
          hz,
          "#b8893a",
          `căprior S @ X${Math.round(x)}`
        );
        idx += 1;
      }
    }
    // Stâlpișori fronton W/E pe B_W / B_E
    {
      const ps = rs.gable_posts?.section_cm || [20, 20];
      const bW = roofBeams.find((b) => b.id === "B_W");
      const bE = roofBeams.find((b) => b.id === "B_E");
      const postW = bW
        ? bW.x + Math.max(0, (bW.dx - ps[0]) / 2)
        : (roofFp?.x0 ?? x0r) + Math.max(0, (30 - ps[0]) / 2);
      const postE = bE
        ? bE.x + bE.dx - ps[0] - Math.max(0, (bE.dx - ps[0]) / 2)
        : (roofFp?.x1 ?? x1r) - ps[0];
      const xE = bE ? bE.x + bE.dx - ps[0] : postE;
      const xW = bW ? bW.x : postW;
      for (const [tag, x] of [
        ["W", xW],
        ["E", xE],
      ]) {
        meshes.push({
          id: `acoperis_structura_fronton_${tag}`,
          type: "extrude",
          polygon: rectPoly(x, ridgeY - ps[1] / 2, ps[0], ps[1]),
          z0_m: eaveZ,
          z1_m: ridgeZ - dropUnderShell,
          color: "#a87830",
          site_layer: "structura",
          label: `stâlpișor fronton ${tag} pe ${tag === "W" ? "B_W" : "B_E"} (coamă↔streșină)`,
        });
      }
    }
  }

  const r2 = st.ramp2;
  const f180 = st.flight_180;
  const pod = st.podest_se;
  const palSup = st.palier_superior;
  const n180 = st.risers_flight_180;
  const n330 = st.risers_flight_330;

  // Parapet pe muchia liberă — urcă odată cu fiecare treaptă (nu zid plin pe toată înălțimea)
  const parapetH = m(st.parapet_h_cm || 105);
  const parapetT = st.parapet_thick_cm || 10;

  // Rampă 1 (sud→est): NU e terasă — culoare scară, separat de placa terasă (X≤340)
  // FRAME: sistem explicit = trepte pe plăci BA treaptă-cu-treaptă + vanguri pe muchii care se reazemă în placa podestului.
  const tread = st.tread_cm || 30;
  const nTread180 = n180 - 1;
  const rampStruct180 = m(st.ramp2_structure_cm || 20);
  const stringerTh = 12; // cm — vanguri pe muchii (FRAME)
  const stairBearCm = 15; // cm — reazem în placa podestului
  const zPod = zParter + riser * n180;
  const podSlabThCm = 15; // BA structural — separat de pachetul de finisaj
  const podFinishTh = floorTh; // 12 cm pachet superior
  const zPodConcreteTop = zPod - podFinishTh; // +148 dacă FF=+160
  const zPodConcreteBot = zPodConcreteTop - m(podSlabThCm); // +133
  const boxFacesBeam = [
    [0, 1, 2],
    [0, 2, 3],
    [4, 6, 5],
    [4, 7, 6],
    [0, 4, 5],
    [0, 5, 1],
    [3, 2, 6],
    [3, 6, 7],
    [0, 3, 7],
    [0, 7, 4],
    [1, 5, 6],
    [1, 6, 2],
  ];

  for (let i = 0; i < nTread180; i++) {
    const xWest = f180.x + i * tread;
    const zTop = zParter + riser * (i + 1);
    meshes.push({
      id: `treapta_rampa180_${i}`,
      type: "extrude",
      polygon: rectPoly(xWest, f180.y, tread, st.width_clear_cm),
      z0_m: zTop - treadTh,
      z1_m: zTop,
      color: i % 2 === 0 ? "#6a8498" : "#5a7488",
      label: "SCARĂ rampă 1 (nu terasă)",
    });
    // Placă BA sub fiecare treaptă — contact pe tot intradosul (nu doar coarda înclinată)
    meshes.push({
      id: `structura_r180_${i}`,
      type: "extrude",
      polygon: rectPoly(xWest, f180.y, tread, st.width_clear_cm),
      z0_m: zTop - treadTh - rampStruct180,
      z1_m: zTop - treadTh,
      color: "#5a6570",
      opacity: 0.9,
      site_layer: "structura",
      label: isFrameStudy
        ? `Placă BA treaptă rampă 1 (${st.ramp2_structure_cm || 20} cm) — sistem trepte pe vanguri`
        : `Structură rampă 1 ${st.ramp2_structure_cm || 20} cm`,
    });
    meshes.push({
      id: `parapet_r180_${i}`,
      type: "extrude",
      polygon: rectPoly(xWest, f180.y + f180.dy - parapetT, tread, parapetT),
      z0_m: zTop,
      z1_m: zTop + parapetH,
      color: "#4a6070",
      label: "Parapet rampă 1 (scară)",
    });
  }
  if (isFrameStudy && nTread180 > 0) {
    // Vanguri: fața de sus = linia nasurilor (intrados la nas); reazem E în placa podestului
    const zTopW = zParter + riser - treadTh;
    const zTopE = zParter + riser * nTread180 - treadTh;
    const x0 = f180.x;
    const xRun1 = f180.x + nTread180 * tread; // = muchia W podest
    const x1 = Math.min(pod.x + stairBearCm, pod.x + pod.dx); // pătrundere în placă
    // La reazem: vangul intră în grosimea plăcii podest (+133…+148)
    const zTopBear = zPodConcreteTop;
    const zBotW = zTopW - rampStruct180;
    const zBotBear = zPodConcreteBot;
    function pushRamp180Stringer(id, y0, dy, label) {
      const y1 = y0 + dy;
      meshes.push({
        id,
        type: "triangles",
        vertices: [
          siteVert(x0, y0, zTopW),
          siteVert(x1, y0, zTopBear),
          siteVert(x1, y1, zTopBear),
          siteVert(x0, y1, zTopW),
          siteVert(x0, y0, zBotW),
          siteVert(x1, y0, zBotBear),
          siteVert(x1, y1, zBotBear),
          siteVert(x0, y1, zBotW),
        ],
        faces: boxFacesBeam,
        color: "#4a5560",
        opacity: 0.92,
        site_layer: "structura",
        label,
      });
    }
    pushRamp180Stringer(
      "structura_rampa180_continua_N",
      f180.y,
      stringerTh,
      `Vang N rampă 1 — reazem podest X${xRun1}→${x1} (BA ${podSlabThCm} cm)`
    );
    pushRamp180Stringer(
      "structura_rampa180_continua_S",
      f180.y + st.width_clear_cm - stringerTh,
      stringerTh,
      `Vang S rampă 1 — reazem podest`
    );
  }

  // Podest SE: BA structural SEPARAT de pachetul de finisaj (nu 15−12=3)
  meshes.push({
    id: "podest_se_placa",
    type: "extrude",
    polygon: rectPoly(pod.x, pod.y, pod.dx, pod.dy),
    z0_m: zPodConcreteBot,
    z1_m: zPodConcreteTop,
    color: "#8b8680",
    opacity: 0.9,
    site_layer: "structura",
    label: `Podest SE — placă BA ${podSlabThCm} cm (+${Math.round(zPodConcreteBot * 100)}→+${Math.round(zPodConcreteTop * 100)}; neconfirmat calcul)`,
  });
  meshes.push({
    id: "podest_se",
    type: "extrude",
    polygon: rectPoly(pod.x, pod.y, pod.dx, pod.dy),
    z0_m: zPodConcreteTop,
    z1_m: zPod,
    color: "#c4b496",
    site_layer: "finisaj",
    label: `Podest SE — pachet finisaj ${Math.round(podFinishTh * 100)} cm (FF=+${Math.round(zPod * 100)})`,
  });
  meshes.push({
    id: "parapet_podest_sud",
    type: "extrude",
    polygon: rectPoly(pod.x, pod.y + pod.dy - parapetT, pod.dx, parapetT),
    z0_m: zPod,
    z1_m: zPod + parapetH,
    color: "#8a939e",
    label: "Parapet podest SE",
  });
  meshes.push({
    id: "parapet_podest_est",
    type: "extrude",
    polygon: rectPoly(pod.x + pod.dx - parapetT, pod.y, parapetT, pod.dy - parapetT),
    z0_m: zPod,
    z1_m: zPod + parapetH,
    color: "#8a939e",
    label: "Parapet podest SE",
  });

  // Rampă est: 10 ridicări → 9 călcări × 30; FF treaptă = sus
  // FĂRĂ depozit/placă sub rampă 2 — gol pe verticală pentru scară beci (curte engleză → −95 → −250)
  const rampStruct = m(st.ramp2_structure_cm || 20);
  const storageUnderRamp2 = st.storage_under?.under_ramp2 === true;
  {
    const nTread330 = n330 - 1;
    const ySouthEdge = r2.y + r2.dy;
    for (let i = 0; i < nTread330; i++) {
      const ySouth = ySouthEdge - (i + 1) * tread;
      const zTopStep = zPod + riser * (i + 1);
      meshes.push({
        id: `treapta_r2_${i}`,
        type: "extrude",
        polygon: rectPoly(r2.x, ySouth, st.width_clear_cm, tread),
        z0_m: zTopStep - treadTh,
        z1_m: zTopStep,
        color: i % 2 === 0 ? "#8a93a0" : "#7a8390",
        label: "Rampă est (FF treaptă = sus)",
      });
      meshes.push({
        id: `structura_r2_${i}`,
        type: "extrude",
        polygon: rectPoly(r2.x, ySouth, r2.dx, tread),
        z0_m: zTopStep - treadTh - rampStruct,
        z1_m: zTopStep - treadTh,
        color: "#5a6570",
        label: isFrameStudy
          ? `Placă BA treaptă rampă 2 (${st.ramp2_structure_cm || 20} cm)`
          : `Structură rampă ${st.ramp2_structure_cm || 20} cm`,
        opacity: 0.9,
        site_layer: "structura",
      });
      meshes.push({
        id: `parapet_r2_${i}`,
        type: "extrude",
        polygon: rectPoly(r2.x + r2.dx - parapetT, ySouth, parapetT, tread),
        z0_m: zTopStep,
        z1_m: zTopStep + parapetH,
        color: "#8a939e",
        label: "Parapet rampa 2",
      });
      if (storageUnderRamp2) {
        const zFill = Math.max(zParter, zTopStep - treadTh - rampStruct);
        if (zFill > zParter + 0.05) {
          meshes.push({
            id: `depozit_sub_r2_${i}`,
            type: "extrude",
            polygon: rectPoly(r2.x, ySouth, r2.dx, tread),
            z0_m: zParter,
            z1_m: zFill,
            color: i % 2 === 0 ? "#c4b8a0" : "#b8ac94",
            label: "Depozit sub rampă 2",
            opacity: 0.92,
          });
        }
      }
    }
    if (isFrameStudy && nTread330 > 0) {
      // Vanguri pe muchii: sud = reazem podest; nord = reazem în placa palier (Y590)
      const zTopN = zPod + riser * nTread330 - treadTh;
      const zTopFirst = zPod + riser - treadTh;
      const runDy2 = nTread330 * tread;
      const yRun0 = ySouthEdge - runDy2; // nord (muchie S palier = Y590)
      const yBear0 = ySouthEdge; // muchie N podest
      const yBear1 = Math.min(ySouthEdge + stairBearCm, pod.y + pod.dy); // în placă spre sud
      const yPalBear1 = yRun0; // Y590
      const yPalBear0 = yRun0 - stairBearCm; // în placă palier spre nord
      const zBotN = zTopN - rampStruct;
      // Cote placă palier (alin. levels_cm dacă există)
      const lvPal = frameStudy?.levels_cm;
      const zPalSlabTop = lvPal?.slab_top_etaj != null ? m(lvPal.slab_top_etaj) : zEtaj - floorTh;
      const zPalSlabBot = lvPal?.slab_soffit_etaj != null ? m(lvPal.slab_soffit_etaj) : zPalSlabTop - m(15);
      function pushInclinedStringer(id, x0, dx, label) {
        const x1 = x0 + dx;
        meshes.push({
          id: `${id}_reazem_podest`,
          type: "extrude",
          polygon: rectPoly(x0, yBear0, dx, yBear1 - yBear0),
          z0_m: zPodConcreteBot,
          z1_m: zPodConcreteTop,
          color: "#4a5560",
          opacity: 0.95,
          site_layer: "structura",
          label: `Reazem vang rampă 2 pe placă podest BA`,
        });
        // Reazem nord în placa palier (închide golul structural palier↔rampă)
        meshes.push({
          id: `${id}_reazem_palier`,
          type: "extrude",
          polygon: rectPoly(x0, yPalBear0, dx, yPalBear1 - yPalBear0),
          z0_m: zPalSlabBot,
          z1_m: zPalSlabTop,
          color: "#4a5560",
          opacity: 0.95,
          site_layer: "structura",
          label: `Reazem vang rampă 2 în placă palier BA @ Y590`,
        });
        // Segment înclinat: podest → muchie palier (intrados în zona plăcii)
        meshes.push({
          id,
          type: "triangles",
          vertices: [
            siteVert(x0, yBear0, zPodConcreteTop),
            siteVert(x1, yBear0, zPodConcreteTop),
            siteVert(x1, yRun0, zPalSlabTop),
            siteVert(x0, yRun0, zPalSlabTop),
            siteVert(x0, yBear0, zPodConcreteBot),
            siteVert(x1, yBear0, zPodConcreteBot),
            siteVert(x1, yRun0, zPalSlabBot),
            siteVert(x0, yRun0, zPalSlabBot),
          ],
          faces: boxFacesBeam,
          color: "#4a5560",
          opacity: 0.92,
          site_layer: "structura",
          label,
        });
      }
      pushInclinedStringer(
        "structura_rampa2_continua_W",
        r2.x,
        stringerTh,
        `Vang W rampă 2 — podest → placă palier (+${Math.round(zPalSlabTop * 100)})`
      );
      pushInclinedStringer(
        "structura_rampa2_continua_E",
        r2.x + r2.dx - stringerTh,
        stringerTh,
        `Vang E rampă 2 — reazem podest + palier`
      );
      // Bandă BA pe toată lățimea clară: legătură placă palier → prima placă treaptă
      meshes.push({
        id: "palier_ramp2_reazem_placa",
        type: "extrude",
        polygon: rectPoly(r2.x, yPalBear0, st.width_clear_cm || 105, stairBearCm + 15),
        z0_m: zPalSlabBot,
        z1_m: zPalSlabTop,
        color: "#6a6560",
        opacity: 0.7,
        site_layer: "structura",
        label: "Bandă BA legătură palier↔rampă2 (gol Y590)",
      });
      void zTopFirst;
      void zTopN;
      void zBotN;
    }
  }

  // Palier superior = placă pe SCARA RECE sub acoperiș 2 ape.
  // NU vestibul interior, NU ziduri de cameră, NU ușă rampă→vestibul (eliminat).
  // Jos = plafon living P. Sus = circulație scară. Podest SE = neacoperit (în afara Y0–860).
  if (isFrameStudy && frameStudy?.levels_cm) {
    const lvP = frameStudy.levels_cm;
    // Buildup 12 cm: XPS 5 + impact 1 + șapă 4 + finisaj 2 — living cald jos / circulație rece sus (performanțe NECONFIRMATE)
    const landXpsCm = 5;
    const landImpactCm = 1;
    const landScreedCm = 4;
    const landFinishCm = 2;
    const landBuild = landXpsCm + landImpactCm + landScreedCm + landFinishCm;
    if (Math.abs(landBuild - floorTh * 100) > 0.2) {
      console.warn(
        `[build_v47_3d] palier buildup ${landBuild} cm ≠ floorTh ${Math.round(floorTh * 100)} — conflict cote`
      );
    }
    const zSlabTop = m(lvP.slab_top_etaj);
    const zXps1 = zSlabTop + m(landXpsCm);
    const zImpact1 = zXps1 + m(landImpactCm);
    const zScreed1 = zImpact1 + m(landScreedCm);
    meshes.push({
      id: "palier_superior_placa",
      type: "extrude",
      polygon: rectPoly(palSup.x, palSup.y, palSup.dx, palSup.dy),
      z0_m: m(lvP.slab_soffit_etaj),
      z1_m: zSlabTop,
      color: "#8b8680",
      opacity: 0.55,
      site_layer: "structura",
      label: `Palier scară — placă BA +${lvP.slab_soffit_etaj}→+${lvP.slab_top_etaj} (plafon living P)`,
    });
    meshes.push({
      id: "palier_superior_izolatie_fono",
      type: "extrude",
      polygon: rectPoly(palSup.x, palSup.y, palSup.dx, palSup.dy),
      z0_m: zSlabTop,
      z1_m: zXps1,
      color: "#e2d18a",
      opacity: 0.75,
      site_layer: "finisaj",
      label: `Palier — XPS 300 ${landXpsCm} cm (termic; ipoteză)`,
    });
    meshes.push({
      id: "palier_superior_membrana_impact",
      type: "extrude",
      polygon: rectPoly(palSup.x, palSup.y, palSup.dx, palSup.dy),
      z0_m: zXps1,
      z1_m: zImpact1,
      color: "#c4a35a",
      opacity: 0.8,
      site_layer: "finisaj",
      label: `Palier — membrană impact ${landImpactCm} cm (Regupol/Schöck-type; Lnw NECONFIRMAT)`,
    });
    meshes.push({
      id: "palier_superior_sapa",
      type: "extrude",
      polygon: rectPoly(palSup.x, palSup.y, palSup.dx, palSup.dy),
      z0_m: zImpact1,
      z1_m: zScreed1,
      color: "#b8b0a4",
      opacity: 0.85,
      site_layer: "finisaj",
      label: `Palier — șapă ${landScreedCm} cm`,
    });
    meshes.push({
      id: "palier_superior_pardoseala",
      type: "extrude",
      polygon: rectPoly(palSup.x, palSup.y, palSup.dx, palSup.dy),
      z0_m: zScreed1,
      z1_m: zEtaj,
      color: "#c8c2b6",
      site_layer: "finisaj",
      label: `Palier — finisaj ${landFinishCm} cm; racord grindă/perete/prag = secțiune`,
    });
    // Aceeași stivă pe banda palier↔rampă2 (golul de la Y590) — nu doar un prag monolitic
    if (st.palier_ramp2_nosing) {
      const nos = st.palier_ramp2_nosing;
      const np = (id, z0, z1, color, opacity, layer, label) =>
        meshes.push({
          id,
          type: "extrude",
          polygon: rectPoly(nos.x, nos.y, nos.dx, nos.dy),
          z0_m: z0,
          z1_m: z1,
          color,
          opacity,
          site_layer: layer,
          label,
        });
      np(
        "palier_ramp2_prag_placa",
        m(lvP.slab_soffit_etaj),
        zSlabTop,
        "#8b8680",
        0.55,
        "structura",
        "Prag palier→rampă2 — placă BA (continuare)"
      );
      np(
        "palier_ramp2_prag_izolatie",
        zSlabTop,
        zXps1,
        "#e2d18a",
        0.75,
        "finisaj",
        `Prag — XPS ${landXpsCm} cm`
      );
      np(
        "palier_ramp2_prag_membrana",
        zXps1,
        zImpact1,
        "#c4a35a",
        0.8,
        "finisaj",
        `Prag — membrană impact ${landImpactCm} cm`
      );
      np(
        "palier_ramp2_prag_sapa",
        zImpact1,
        zScreed1,
        "#b8b0a4",
        0.85,
        "finisaj",
        `Prag — șapă ${landScreedCm} cm`
      );
      np(
        "palier_ramp2_prag",
        zScreed1,
        zEtaj,
        "#c8c2b6",
        1,
        "finisaj",
        "Prag palier→rampă2 — finisaj (închide gol Y590)"
      );
    }
  } else {
    meshes.push({
      id: "palier_superior",
      type: "extrude",
      polygon: rectPoly(palSup.x, palSup.y, palSup.dx, palSup.dy),
      z0_m: zEtaj - floorTh,
      z1_m: zEtaj,
      color: "#c8c2b6",
      site_layer: "structura",
      label: "Palier scară acoperit (fără vestibul)",
    });
    // A1 + studiu: prag + ultima ridicare vizibilă (altfel gol ~1 riser între ultima treaptă și FF etaj)
    const nos =
      st.palier_ramp2_nosing ||
      (r2 && palSup
        ? {
            x: r2.x,
            y: Math.max(palSup.y, r2.y - Math.min(20, tread)),
            dx: st.width_clear_cm || r2.dx,
            dy: Math.min(20, Math.max(10, r2.y - palSup.y)),
          }
        : null);
    if (nos && nos.dy > 0) {
      meshes.push({
        id: "palier_ramp2_prag",
        type: "extrude",
        polygon: rectPoly(nos.x, nos.y, nos.dx, nos.dy),
        z0_m: zEtaj - floorTh,
        z1_m: zEtaj,
        color: "#c8c2b6",
        site_layer: "finisaj",
        label: "Prag palier→rampă2 (închide gol)",
      });
    }
    // Contrapasă finală (față verticală): ultima călcăre R2 → FF palier (= a n-a ridicare)
    if (r2 && n330 > 1) {
      const zLast = zPod + riser * (n330 - 1);
      const riserFaceDy = 4; // cm — față vizibilă la muchia N a ultimei trepte
      meshes.push({
        id: "treapta_r2_contrapasa_final",
        type: "extrude",
        polygon: rectPoly(r2.x, r2.y - riserFaceDy, st.width_clear_cm || r2.dx, riserFaceDy),
        z0_m: zLast,
        z1_m: zEtaj,
        color: "#6a7580",
        label: `Contrapasă finală R2 → palier (h=${Math.round(riser * 100)} cm)`,
      });
    }
  }

  // Sub rampă 2: FĂRĂ depozit / FĂRĂ placă FF — puț deschis pentru scară beci
  // (curte engleză −48 → palier −95 → scară −250). Living sub palier (Y470–590) rămâne.
  if (storageUnderRamp2) {
    const depY0 = r2.y;
    const depY1 = r2.y + r2.dy;
    const depDy = depY1 - depY0;
    meshes.push({
      id: "depozit_pardoseala",
      type: "extrude",
      polygon: rectPoly(st.band_x, depY0, st.band_dx, depDy),
      z0_m: zParter - floorTh,
      z1_m: zParter,
      color: "#d5c9b0",
      label: "Depozit sub rampă2 — pardoseală FF",
    });
  } else {
    // marker subtil pe conturul puțului (zidurile beton definesc volumul)
    meshes.push({
      id: "put_scara_beci_sub_r2",
      type: "extrude",
      polygon: rectPoly(r2.x + 2, r2.y + 2, r2.dx - 4, r2.dy - 4),
      z0_m: m(v47.basement_cm?.levels_vs_ff_parter_cm?.basement_ff ?? -250),
      z1_m: m(v47.basement_cm?.levels_vs_ff_parter_cm?.basement_ff ?? -250) + 0.04,
      color: "#3d4a55",
      opacity: 0.2,
      site_layer: "curte",
      label: "Puț deschis sub rampă 2 → beci (fără placă/depozit)",
    });
  }

  // Opening markers (față jos pe FF) + casete pocket (studiu)
  for (const o of v47.openings_cm) {
    if (o.removed) continue;
    const poly = rectPoly(o.x, o.y, Math.max(o.dx, 8), Math.max(o.dy, 8));
    const isWin =
      o.id.includes("geam") ||
      o.kind === "window" ||
      o.type === "window" ||
      /glisant|ferestr/i.test(o.id || "");
    const sill =
      o.sill_cm != null
        ? m(o.sill_cm)
        : o.sill_m != null
          ? o.sill_m
          : isWin
            ? 0.9
            : 0;
    const oh =
      o.height_cm != null
        ? m(o.height_cm)
        : o.clear_height_cm != null
          ? m(o.clear_height_cm)
          : isWin
            ? 1.5
            : 2.1;
    const feas = o.feasibility?.status;
    const doorColor =
      feas === "NOT_FEASIBLE_AS_DRAWN"
        ? "#e8a0a0"
        : feas === "CONDITIONAL"
          ? "#f0d090"
          : o.id.includes("geam")
            ? "#8ecae6"
            : "#c9e4ef";
    for (let level = 0; level < v47.levels; level++) {
      if (o.levels && !o.levels.includes(level)) continue;
      // Nu desena „goluri-fantomă” ca ziduri transparente pe P (sub palier)
      if (
        level === 0 &&
        (o.id === "gol_living_sub_palier_p" ||
          o.id === "gol_living_palier_p" ||
          o.role === "interior_living")
      ) {
        continue;
      }
      const zBase = level === 0 ? zParter : zEtaj;
      const isEntry = o.role === "entrance" || o.id.includes("intrare");
      meshes.push({
        id: `gol_${o.id}_L${level}`,
        type: "extrude",
        polygon: poly,
        z0_m: zBase + sill,
        z1_m: zBase + sill + oh,
        color: isEntry ? "#6aaf7a" : doorColor,
        opacity: isWin ? 0.55 : 0.5,
        site_layer: "goluri",
        group: "fatada_goluri",
        label: o.id,
      });
      if (o.pocket?.cassette) {
        const c = o.pocket.cassette;
        meshes.push({
          id: `casetă_${o.id}_L${level}`,
          type: "extrude",
          polygon: rectPoly(c.x, c.y, c.dx, c.dy),
          z0_m: zBase,
          z1_m: zBase + 2.1,
          color: feas === "NOT_FEASIBLE_AS_DRAWN" || feas === "NOT_FEASIBLE_POCKET_WITH_WC_APPROVED" ? "#c07070" : "#c4a060",
          opacity: 0.35,
          site_layer: "goluri",
          group: "fatada_goluri",
          label: `casetă ${o.id} (${feas || "study"})`,
        });
      }
    }
  }

  // MEP studiu: PRANA + AC + extract/coloane (doar parter)
  const bePos = v47.mep_cm?.bath_extract?.position_study;
  if (bePos?.dx) {
    meshes.push({
      id: "extract_baie",
      type: "extrude",
      polygon: rectPoly(bePos.x, bePos.y, bePos.dx, bePos.dy),
      z0_m: zParter + 2.3,
      z1_m: zParter + 2.55,
      color: "#90c8a8",
      opacity: 0.7,
      label: "extract baie",
    });
  }
  for (const key of ["stack_bath", "stack_kitchen"]) {
    const s = v47.mep_cm?.risers_p_plus_1?.water_sewer?.[key];
    if (!s) continue;
    meshes.push({
      id: key,
      type: "extrude",
      polygon: rectPoly(s.x, s.y, s.dx, s.dy),
      z0_m: zParter,
      z1_m: zEtaj + 2.5,
      color: "#a08060",
      opacity: 0.4,
      label: key,
    });
  }
  if (v47.mep_cm?.prana?.positions) {
    for (const p of v47.mep_cm.prana.positions) {
      meshes.push({
        id: p.id,
        type: "extrude",
        polygon: rectPoly(p.x, p.y, p.dx, p.dy),
        z0_m: zParter + 2.0,
        z1_m: zParter + 2.35,
        color: "#6ab0c8",
        opacity: 0.7,
        label: p.id,
      });
    }
  }
  if (v47.mep_cm?.ac?.indoor) {
    for (const a of v47.mep_cm.ac.indoor) {
      meshes.push({
        id: a.id,
        type: "extrude",
        polygon: rectPoly(a.x, a.y, a.dx, a.dy),
        z0_m: zParter + 2.2,
        z1_m: zParter + 2.5,
        color: "#a8c8e8",
        opacity: 0.65,
        label: a.id,
      });
    }
  }
  if (v47.mep_cm?.ac?.outdoor) {
    for (const a of v47.mep_cm.ac.outdoor) {
      meshes.push({
        id: a.id,
        type: "extrude",
        polygon: rectPoly(a.x, a.y, a.dx, a.dy),
        z0_m: zParter + 0.8,
        z1_m: zParter + 1.5,
        color: "#8aa0b0",
        opacity: 0.55,
        label: a.id,
      });
    }
  }

  // --- sit: împrejmuire + poartă auto Cloșca + poartă pietonală Dragalina + alee + parcări ---
  const siteAcc = v47.site_access_cm || {};
  const fenceCfg = siteAcc.fence || {};
  const ped = siteAcc.pedestrian || {};
  const parkCfg = siteAcc.auto?.parking || {};
  const gateClearM = siteAcc.auto?.gate?.clear_opening_m ?? 6;

  const c0 = byId[10];
  const c1 = byId[1];
  const alongC = { x: c1.x - c0.x, y: c1.y - c0.y };
  const cLen = Math.hypot(alongC.x, alongC.y);
  const Cx = alongC.x / cLen;
  const Cy = alongC.y / cLen;
  let Nx = -Cy;
  let Ny = Cx;
  if (Ny < 0) {
    Nx = -Nx;
    Ny = -Ny;
  }

  // Împrejmuire:
  // EST + NORD = egal cu clădirea (front Dragalina / vecin) — fără gard separat pe amprentă
  // VEST + Cloșca + Dragalina sud de SE = gard + porți
  {
    const fH = m(fenceCfg.height_cm || 180);
    const fT = m(fenceCfg.thickness_cm || 8);
    const fCol = fenceCfg.color || "#8a7d6b";
    const wallCol = fenceCfg.building_limit_color || "#9a9080";
    const pedW = m(ped.gate?.width_cm || ped.gate?.local_cm?.dy || 150);
    const ewCm = v47.envelope_cm.ew;
    const nsCm = v47.envelope_cm.ns;
    // Fundație gard: talpă beton pe traseu (în Structură; gardul rămâne imprejmuire)
    const fenceFootW = Math.max(fT * 3, 0.32);
    const fenceFootZ0 = -0.55;
    const fenceFootZ1 = 0.05;
    function pushFenceFoundation(id, centerline, label) {
      if (!centerline || centerline.length < 2) return;
      meshes.push({
        id,
        type: "ribbon",
        centerline: centerline.map((p) => ({ x: p.x, y: p.y })),
        width_m: fenceFootW,
        z0_m: fenceFootZ0,
        z1_m: fenceFootZ1,
        color: "#5e5a54",
        opacity: 0.92,
        site_layer: "structura",
        label: label || "fundație gard",
      });
    }

    // Marcaje limită = zid casă (est/nord) — DOAR view Împrejmuire (nu în P+E)
    meshes.push({
      id: "limit_est_zid",
      type: "extrude",
      polygon: rectPoly(ewCm - 8, 0, 8, nsCm),
      z0_m: 0,
      z1_m: fH,
      color: wallCol,
      opacity: 0.75,
      site_layer: "imprejmuire",
      imprejmuire_only: true,
      label: "Limită EST = zid casă (front Dragalina)",
    });
    meshes.push({
      id: "limit_nord_zid",
      type: "extrude",
      polygon: rectPoly(0, 0, ewCm, 8),
      z0_m: 0,
      z1_m: fH,
      color: wallCol,
      opacity: 0.75,
      site_layer: "imprejmuire",
      imprejmuire_only: true,
      label: "Limită NORD = zid casă (vecin)",
    });

    // Gard VEST pe contur CF până la colțul NV parcelă (P7) — închidere corectă
    const nwSite = toSite(0, 0);
    const clVest = [byId[10], byId[9], byId[8], byId[7]];
    meshes.push({
      id: "gard_vest",
      type: "ribbon",
      centerline: clVest,
      width_m: fT,
      z0_m: 0,
      z1_m: fH,
      color: fCol,
      opacity: 0.65,
      site_layer: "imprejmuire",
      label: "Gard vest → colț NV parcelă (P7)",
    });
    pushFenceFoundation("fundatie_gard_vest", clVest, "fundație gard vest");
    // P7 → NV casă (pe nord): leagă gardul de zidul-nord al casei
    const clNw = [byId[7], nwSite];
    meshes.push({
      id: "gard_nord_vest_colt",
      type: "ribbon",
      centerline: clNw,
      width_m: fT,
      z0_m: 0,
      z1_m: fH,
      color: fCol,
      opacity: 0.65,
      site_layer: "imprejmuire",
      label: "Gard colț NV (P7 → casă)",
    });
    pushFenceFoundation("fundatie_gard_nord_vest_colt", clNw, "fundație gard colț NV");

    // Dragalina: sud de SE + gol poartă = exact banda aleii (centrat, fără loc liber)
    const dragPts = [5, 4, 3, 2, 1].map((id) => byId[id]);
    function accDragLen() {
      let s = 0;
      for (let i = 0; i < dragPts.length - 1; i++) s += dist(dragPts[i], dragPts[i + 1]);
      return s;
    }
    function alongDrag(pt) {
      let best = Infinity;
      let sAt = 0;
      let acc = 0;
      for (let i = 0; i < dragPts.length - 1; i++) {
        const a = dragPts[i];
        const b = dragPts[i + 1];
        const len = dist(a, b);
        const abx = b.x - a.x;
        const aby = b.y - a.y;
        const t = Math.max(
          0,
          Math.min(1, ((pt.x - a.x) * abx + (pt.y - a.y) * aby) / (len * len || 1))
        );
        const d = Math.hypot(pt.x - (a.x + abx * t), pt.y - (a.y + aby * t));
        if (d < best) {
          best = d;
          sAt = acc + t * len;
        }
        acc += len;
      }
      return sAt;
    }
    function pointAlongDrag(sTarget) {
      let rem = sTarget;
      for (let i = 0; i < dragPts.length - 1; i++) {
        const a = dragPts[i];
        const b = dragPts[i + 1];
        const len = dist(a, b);
        if (rem <= len) return lerp(a, b, rem / len);
        rem -= len;
      }
      return { ...dragPts[dragPts.length - 1] };
    }
    function collectAlong(s0, s1) {
      const out = [];
      let rem = 0;
      for (let i = 0; i < dragPts.length - 1; i++) {
        const a = dragPts[i];
        const b = dragPts[i + 1];
        const len = dist(a, b);
        const seg0 = rem;
        const seg1 = rem + len;
        if (seg1 < s0 - 1e-9 || seg0 > s1 + 1e-9) {
          rem += len;
          continue;
        }
        const t0 = Math.max(0, (s0 - seg0) / len);
        const t1 = Math.min(1, (s1 - seg0) / len);
        if (t0 < t1 - 1e-9) {
          if (!out.length) out.push(lerp(a, b, t0));
          out.push(lerp(a, b, t1));
        }
        rem += len;
      }
      return out;
    }

    const seSite = toSite(ewCm, nsCm);
    const sSE = alongDrag(seSite);
    // Gol poartă = proiecția aleii pe Dragalina (aceeași bandă Y)
    const alleySeg =
      (ped.path?.segments_cm || []).find((s) => /alee|langa_scari/i.test(s.id || "")) ||
      ped.path?.segments_cm?.[0];
    const aY0 = alleySeg?.y ?? 1038;
    const aDy = alleySeg?.dy ?? pedW * 100;
    const aY1 = aY0 + aDy;
    // puncte pe fața est a aleii → proiecție pe lanțul Dragalina
    const eastX = Math.min(ewCm - 2, (alleySeg?.x ?? 210) + (alleySeg?.dx ?? 450));
    const sAlleyN = alongDrag(toSite(eastX, aY0));
    const sAlleyS = alongDrag(toSite(eastX, aY1));
    let gapStart = Math.min(sAlleyN, sAlleyS);
    let gapEnd = Math.max(sAlleyN, sAlleyS);
    // asigură lățime min = poarta (1.5 m) centrată pe alee
    const gapMid = (gapStart + gapEnd) / 2;
    const halfW = Math.max(pedW / 2, (gapEnd - gapStart) / 2);
    gapStart = Math.max(sSE + 0.02, gapMid - halfW);
    gapEnd = Math.min(accDragLen() - 0.02, gapMid + halfW);

    // Poartă pe linia golului (centrată pe alee), apoi gardurile lipite de ea
    let insetIn = 0.02;
    const gA0raw = pointAlongDrag(gapStart);
    const gA1raw = pointAlongDrag(gapEnd);
    const makeGateLine = (ins) => [
      { x: gA0raw.x + Ix * ins, y: gA0raw.y + Iy * ins },
      { x: gA1raw.x + Ix * ins, y: gA1raw.y + Iy * ins },
    ];
    let gateLine = makeGateLine(insetIn);
    if (!gateLine.every((pt) => insideParcel(pt))) {
      insetIn = 0.08;
      gateLine = makeGateLine(insetIn);
    }

    const dragToGate = collectAlong(sSE, gapStart);
    if (dragToGate.length >= 2) {
      dragToGate[dragToGate.length - 1] = { ...gateLine[0] };
      meshes.push({
        id: "gard_dragalina_sud_casa",
        type: "ribbon",
        centerline: dragToGate,
        width_m: fT,
        z0_m: 0,
        z1_m: fH,
        color: fCol,
        opacity: 0.65,
        site_layer: "imprejmuire",
        label: "Gard Dragalina (sud casă → poartă)",
      });
      pushFenceFoundation(
        "fundatie_gard_dragalina_sud_casa",
        dragToGate,
        "fundație gard Dragalina (→ poartă)"
      );
    }
    const dragPastGate = collectAlong(gapEnd, accDragLen());
    if (dragPastGate.length >= 2) {
      dragPastGate[0] = { ...gateLine[1] };
      meshes.push({
        id: "gard_dragalina_s",
        type: "ribbon",
        centerline: dragPastGate,
        width_m: fT,
        z0_m: 0,
        z1_m: fH,
        color: fCol,
        opacity: 0.65,
        site_layer: "imprejmuire",
        label: "Gard Dragalina (S de poartă)",
      });
      pushFenceFoundation("fundatie_gard_dragalina_s", dragPastGate, "fundație gard Dragalina S");
    }
    meshes.push({
      id: "poarta_pietonala_dragalina",
      type: "ribbon",
      centerline: gateLine,
      width_m: Math.max(fT, 0.1),
      z0_m: 0,
      z1_m: m(ped.gate?.height_cm || 190),
      color: ped.gate?.color || "#6aaf7a",
      opacity: 0.9,
      site_layer: "imprejmuire",
      label: "Poartă pietonală (centrată pe alee)",
      gap_m: [gapStart, gapEnd],
    });
    // prag/fundatie sub poarta pietonală + stâlpi la gol
    pushFenceFoundation("fundatie_poarta_pietonala", gateLine, "fundație / prag poartă pietonală");
    for (const [sid, pt] of [
      ["stalp_poarta_pietonala_n", gateLine[0]],
      ["stalp_poarta_pietonala_s", gateLine[1]],
    ]) {
      if (!pt) continue;
      meshes.push({
        id: sid,
        type: "extrude",
        polygon: [
          { x: pt.x - 0.12, y: pt.y - 0.12 },
          { x: pt.x + 0.12, y: pt.y - 0.12 },
          { x: pt.x + 0.12, y: pt.y + 0.12 },
          { x: pt.x - 0.12, y: pt.y + 0.12 },
          { x: pt.x - 0.12, y: pt.y - 0.12 },
        ],
        z0_m: fenceFootZ0,
        z1_m: fH,
        color: "#6e6a64",
        opacity: 0.95,
        site_layer: "structura",
        label: "stâlp poartă pietonală",
      });
    }

    // Cloșca: rest scurt lângă poarta auto largă
    const closcaRemain = cLen - gateClearM;
    if (closcaRemain > 0.45) {
      const gA = {
        x: c0.x + Cx * gateClearM + Nx * 0.1,
        y: c0.y + Cy * gateClearM + Ny * 0.1,
      };
      const gB = {
        x: c1.x - Cx * 0.08 + Nx * 0.1,
        y: c1.y - Cy * 0.08 + Ny * 0.1,
      };
      meshes.push({
        id: "gard_closca_est",
        type: "ribbon",
        centerline: [gA, gB],
        width_m: fT,
        z0_m: 0,
        z1_m: fH,
        color: fCol,
        opacity: 0.55,
        site_layer: "imprejmuire",
        label: "Gard scurt Cloșca E",
      });
      pushFenceFoundation("fundatie_gard_closca_est", [gA, gB], "fundație gard Cloșca E");
    }
    // Stâlpi + fundație pe golul porții auto (capete)
    {
      const pAuto0 = {
        x: c0.x + Nx * 0.1,
        y: c0.y + Ny * 0.1,
      };
      const pAuto1 = {
        x: c0.x + Cx * gateClearM + Nx * 0.1,
        y: c0.y + Cy * gateClearM + Ny * 0.1,
      };
      pushFenceFoundation("fundatie_poarta_auto", [pAuto0, pAuto1], "fundație prag poartă auto Cloșca");
      for (const [sid, pt] of [
        ["stalp_poarta_auto_w", pAuto0],
        ["stalp_poarta_auto_e", pAuto1],
      ]) {
        meshes.push({
          id: sid,
          type: "extrude",
          polygon: [
            { x: pt.x - 0.15, y: pt.y - 0.15 },
            { x: pt.x + 0.15, y: pt.y - 0.15 },
            { x: pt.x + 0.15, y: pt.y + 0.15 },
            { x: pt.x - 0.15, y: pt.y + 0.15 },
            { x: pt.x - 0.15, y: pt.y - 0.15 },
          ],
          z0_m: fenceFootZ0,
          z1_m: fH * 0.55,
          color: "#6e6a64",
          opacity: 0.95,
          site_layer: "structura",
          label: "stâlp / reazem poartă auto",
        });
      }
    }
  }

  // Parcări — pe sud (Cloșca), grupate vest; fiecare iese înainte pe stradă; NU spre casă, NU până la est
  {
    const fromWest = parkCfg.from_west_m ?? 0.35;
    const inset = parkCfg.inset_from_closca_m ?? 0.25; // aproape de latura sudică
    const gap = parkCfg.stall_gap_m ?? 0.45;
    const eastClear = parkCfg.max_east_clear_m ?? 2.0;
    const sw = m(parkCfg.stalls?.[0]?.w_cm || program.parking.stall_w_m * 100) || program.parking.stall_w_m;
    const sd = m(parkCfg.stalls?.[0]?.d_cm || program.parking.stall_d_m * 100) || program.parking.stall_d_m;
    const op = parkCfg.opacity ?? 0.45;
    // nu depăși zona vest-centrală (lasă ~2 m spre Dragalina)
    const maxSpan = Math.max(sw, cLen - fromWest - eastClear);
    const origin = {
      x: c0.x + Cx * fromWest + Nx * inset,
      y: c0.y + Cy * fromWest + Ny * inset,
    };
    function stall(i) {
      const along = i * (sw + gap);
      if (along + sw > maxSpan + 0.05) return null;
      const ox = origin.x + Cx * along;
      const oy = origin.y + Cy * along;
      // adâncime spre nord (în curte); fața stallului pe Cloșca = ieșire directă sud
      return [
        { x: ox, y: oy },
        { x: ox + Cx * sw, y: oy + Cy * sw },
        { x: ox + Cx * sw + Nx * sd, y: oy + Cy * sw + Ny * sd },
        { x: ox + Nx * sd, y: oy + Ny * sd },
        { x: ox, y: oy },
      ];
    }
    for (let i = 0; i < 2; i++) {
      const poly = stall(i);
      if (!poly) continue;
      meshes.push({
        id: `auto_${i + 1}`,
        type: "extrude",
        polygon: poly,
        z0_m: 0.02,
        z1_m: 0.05,
        color: "#5a6570",
        opacity: op,
        label: `Auto ${i + 1} — ieșire direct Cloșca`,
        study: true,
        site_layer: "curte",
      });
    }
  }

  // Poartă auto — aproape tot frontul Cloșca (trotuar îngust / 1 bandă)
  const gateSpan = Math.min(gateClearM, cLen - 0.2);
  const closedLine = [
    { x: c0.x + Cx * 0.08 + Nx * 0.1, y: c0.y + Cy * 0.08 + Ny * 0.1 },
    { x: c0.x + Cx * gateSpan + Nx * 0.1, y: c0.y + Cy * gateSpan + Ny * 0.1 },
  ];
  meshes.push({
    id: "poarta_inchisa",
    type: "ribbon",
    centerline: closedLine,
    width_m: gate.thickness_m,
    z0_m: 0,
    z1_m: gate.height_m,
    color: "#c4a35a",
    state: "closed",
    site_layer: "imprejmuire",
    label: `Poartă auto Cloșca ~${gateSpan.toFixed(1)} m`,
  });
  // deschisă: retrasă pe vest (nu în curte/spre casă)
  const openStart = {
    x: c0.x + Cx * 0.12 + Nx * 0.15,
    y: c0.y + Cy * 0.12 + Ny * 0.15,
  };
  const westDir = { x: byId[9].x - byId[10].x, y: byId[9].y - byId[10].y };
  const wL = Math.hypot(westDir.x, westDir.y) || 1;
  const Wx = westDir.x / wL;
  const Wy = westDir.y / wL;
  const retract = Math.min(gate.retract_along_west_m || 7.5, gateSpan);
  const openEnd = {
    x: openStart.x + Wx * retract,
    y: openStart.y + Wy * retract,
  };
  meshes.push({
    id: "poarta_deschisa",
    type: "ribbon",
    centerline: [openStart, openEnd],
    width_m: gate.thickness_m,
    z0_m: 0,
    z1_m: gate.height_m,
    color: "#e8d5a3",
    state: "open",
    opacity: 0.6,
    site_layer: "imprejmuire",
    label: "Poartă auto deschisă (pe vest)",
  });

  // Alee pietonală — aceeași bandă Y ca poarta (centrare)
  {
    for (const seg of ped.path?.segments_cm || []) {
      let sx = seg.x;
      let sy = seg.y;
      let sdx = seg.dx;
      let sdy = seg.dy;
      // nu trece de X668 (în contur); capătul est sub poartă
      const eastCap = v47.envelope_cm.ew - 12;
      if (sx + sdx > eastCap) sdx = eastCap - sx;
      meshes.push({
        id: seg.id?.startsWith("alee") ? seg.id : `alee_${seg.id || "seg"}`,
        type: "extrude",
        polygon: rectPoly(sx, sy, sdx, sdy),
        z0_m: 0.01,
        z1_m: 0.04,
        color: ped.path.color || "#c5b89a",
        opacity: 0.75,
        site_layer: "curte",
        label: seg.note || "Alee pietonală",
      });
    }
  }

  // Amenajare curte (dale/verde) — PE SOL (z≈0), NU la −48 (asta e doar curtea engleză)
  // Vizibile doar în view Curte (curte_only)
  {
    const cz = v47.courtyard_cm;
    for (const z of cz?.zones || []) {
      const zTop = m(z.z_ff_cm ?? 0); // pe teren, nu sub sol
      meshes.push({
        id: `curte_zona_${z.id}`,
        type: "extrude",
        polygon: rectPoly(z.x, z.y, z.dx, z.dy),
        z0_m: zTop + 0.01,
        z1_m: zTop + 0.04,
        color: z.color || (z.kind === "green" ? "#6a8f5a" : "#b8b09a"),
        opacity: z.kind === "green" ? 0.65 : 0.5,
        site_layer: "curte",
        curte_only: true,
        label: z.kind === "green" ? `plantare studiu: ${z.id}` : `dale studiu: ${z.id}`,
      });
    }
  }

  // Paravan / balustradă terasă (distinct de parapet)
  for (const g of v47.terrace_guards_cm || []) {
    if (g.kind !== "paravan" && g.kind !== "balustrada") continue;
    if (!(g.h > 0)) continue;
    meshes.push({
      id: `guard_${g.id}`,
      type: "extrude",
      polygon: rectPoly(g.x, g.y, g.dx, g.dy),
      z0_m: zParter,
      z1_m: zParter + m(g.h),
      color: g.color || (g.kind === "paravan" ? "#00aa33" : "#8d99ae"),
      label: `${g.kind} ${g.id}`,
    });
  }


  // Subsol — scară coboară −95 → −250; camere FF→soffit
  // S1: preferă envelope A1 (cutie curată); V47 rooms = legacy fallback
  {
    const bm = a1Basement
      ? basementFromA1(a1Basement, v47.basement_cm)
      : v47.basement_cm;
    if (bm?.rooms) {
      const abs = bm.absolute_from_grade_cm || {};
      const lv = bm.levels_vs_ff_parter_cm || {};
      const zB = m(abs.basement_ff_cm ?? lv.basement_ff ?? -250);
      const zSoffit = m(abs.slab_soffit_cm ?? lv.slab_soffit_cm ?? -42);
      const zAccess = m(abs.access_landing_cm ?? lv.access_landing ?? -95);
      const zCourt = m(abs.grade_cm ?? lv.courtyard_general ?? 0);
      const floorThB = m(abs.floor_slab_th_cm ?? lv.floor_slab_th_cm ?? 15);
      const a1Clean = !!bm.a1_clean;

      // Pardoseală camere (culori distincte) — FĂRĂ volume opace (ascundeau planul)
      const floorColor = {
        camera_tehnica: "#4f7f94",
        depozit_subsol: "#9a8458",
        magazie_subsol: "#d4a84a",
        hol_subsol: "#d4a84a", // legacy V47
      };
      for (const r of bm.rooms) {
        meshes.push({
          id: `subsol_pardoseala_${r.id}`,
          type: "extrude",
          polygon: rectPoly(r.x, r.y, r.dx, r.dy),
          z0_m: zB - floorThB,
          z1_m: zB,
          color: floorColor[r.id] || "#5a6268",
          label: `FF subsol ${r.id}`,
        });
      }
      // Contur + pereți — geometrie COMPLETĂ (secționarea e doar în viewer)
      const th = bm.wall_thickness_study_cm || {};
      const wallPerim = th.perimeter_structure_cm ?? (isFrameStudy ? 20 : 30);
      const retainBa = isFrameStudy && (th.retaining_ba_cm ?? wallPerim);
      const wallT = th.partition_cm ?? 12.5;
      // A1: retenție până la cota teren (0) — fără gol orizontal −30…0 sub soclu
      const wallTopR = a1Clean ? Math.max(zSoffit, zCourt) : zSoffit;
      const doorY0i = bm.door_to_rooms?.y ?? 600;
      const doorY1i = doorY0i + (bm.door_to_rooms?.dy ?? 80);
      const intDoors = bm.internal_doors || [];
      const doorCt = intDoors.find((d) => d.id === "usa_hol_ct");
      const doorDep = intDoors.find((d) => d.id === "usa_hol_dep");

      function pushWallFull(id, x, y, dx, dy, label, opts = {}) {
        if (dx < 1 || dy < 1) return;
        meshes.push({
          id,
          type: "extrude",
          polygon: rectPoly(x, y, dx, dy),
          z0_m: zB,
          z1_m: wallTopR,
          color: opts.color || "#d8d0c0",
          opacity: 0.98,
          label: label || id,
          ...(opts.site_layer ? { site_layer: opts.site_layer } : {}),
        });
      }
      // Umplutură sono — layer „+ Pereți”; NU în view Structură
      function pushUmpluturaWall(id, x, y, dx, dy, label) {
        pushWallFull(id, x, y, dx, dy, label, {
          color: "#d8d0c0",
          site_layer: "umplutura",
        });
      }
      /** Retenție BA — layer Structură. A1: coboară pe talpă (fără gol orizontal). */
      function pushRetainingBA(id, x, y, dx, dy, label, z0Override) {
        const z0w = z0Override != null ? z0Override : zB;
        if (dx < 1 || dy < 1) return;
        meshes.push({
          id,
          type: "extrude",
          polygon: rectPoly(x, y, dx, dy),
          z0_m: z0w,
          z1_m: wallTopR,
          color: "#6e6a64",
          opacity: 0.98,
          site_layer: "structura",
          label: label || id,
        });
      }
      const pushPerim = retainBa ? pushRetainingBA : pushUmpluturaWall;
      const perimTh = retainBa ? retainBa : wallPerim;
      function pushDoorOpening(d) {
        if (!d) return;
        const hOpen = m(d.opening_h_cm ?? 200);
        const lintel = m(d.lintel_reserve_cm ?? 15);
        meshes.push({
          id: d.id,
          type: "extrude",
          polygon: rectPoly(d.x, d.y, d.dx, d.dy),
          z0_m: zB + hOpen,
          z1_m: Math.min(wallTopR, zB + hOpen + lintel),
          color: "#a89880",
          site_layer: "umplutura",
          label: `${d.id} buiandrug`,
        });
      }

      const lowLand = bm.lower_landing || { y: 520, dy: 80 };
      const shaftWest = th.shaft_west_cm ?? 30;
      const shaftEast = th.shaft_east_cm ?? 15;
      const shaftNorthTh = th.shaft_north_cm ?? wallT;
      const landY0 = lowLand.y ?? 520;
      const thickX0p = 535;
      // Beton pe falie = COL (20), nu wallPerim finit (30). Termo 8+2 rămâne afară.
      const col = COL;
      const beamH = 0.4; // m — IPOTZĂ adâncime; nu micșorată ca să „salveze” clear
      const zFoundTop = zB - floorThB; // −265
      const zFoundBot = zFoundTop - 0.45; // −310
      const zColBot = zFoundBot;
      const zBeam0 = zSoffit - beamH;
      const zBeam1 = zSoffit;
      // Clear sub grindă pe FF −250: (−70)−(−250)=180 cm — raportat, nu „reparat” prin subțiere

      function pushBeton(id, x, y, dx, dy, z0, z1, label, color) {
        if (dx < 1 || dy < 1 || z1 <= z0 + 0.01) return;
        meshes.push({
          id,
          type: "extrude",
          polygon: rectPoly(x, y, dx, dy),
          z0_m: z0,
          z1_m: z1,
          color: color || "#8a8580",
          opacity: 0.97,
          site_layer: "structura",
          label,
        });
      }
      function pushStalp(id, x, y, label) {
        // Fără talpă locală 50×50: depășeau parcela la colțuri.
        // Reazem = grinzi de fundație pe contur (soluție limită = NP112 / geotehnic — neconfirmat).
        pushBeton(id, x, y, col, col, zColBot, zSoffit, label, "#7a7670");
      }
      function pushGrindă(id, x, y, dx, dy, label) {
        pushBeton(id, x, y, dx, dy, zBeam0, zBeam1, label, "#6a6358");
      }

      // —— SCHELT BETON subsol (omis pe A1 curat — fără FRAME/V47 vechi)
      if (isFrameStudy && frameColumns) {
        // Stâlpii continui se extrudează o singură dată (fundație→acoperiș) în blocul P/E — nu stub-uri aici.
        frameColumnZ0 = zColBot;
        // Soffit L-1: grinzi pe traseu subsol/cadru continuu.
        // Include: levels "S", sau "P"+"E" (centură pe stâlpi).
        // Exclude: doar ["P"]; S_inverted; exclude_basement (bordură palier LOCK-1).
        for (const b of frameStudy.beams || []) {
          const lv = b.levels || [];
          const tag = lv.join();
          if (/S_inverted/i.test(tag)) continue;
          if (b.exclude_basement) continue;
          const hasS = lv.includes("S");
          const hasP = lv.includes("P");
          const hasE = lv.includes("E");
          if (!hasS && !(hasP && hasE)) continue;
          pushGrindă(
            `subsol_grinda_${b.id}`,
            b.x,
            b.y,
            b.dx,
            b.dy,
            b.note || `grindă legătură ${b.id}`
          );
        }
        // Nod plin = amprenta fiecărui stâlp (închide centura pe nod)
        for (const c of frameColumns) {
          pushGrindă(
            `subsol_grinda_node_${c.id}`,
            c.x,
            c.y,
            c.dx,
            c.dy,
            `nod centură pe ${c.id}`
          );
        }
      } else if (!architectureOnly) {
        for (const p of structNodesContinuous) {
          pushStalp(`subsol_stalp_${p.id}`, p.x, p.y, `stâlp ${p.id} (${COL}×${COL} beton)`);
        }
        for (const p of structNodesNoParter) {
          pushStalp(`subsol_stalp_${p.id}`, p.x, p.y, `stâlp ${p.id} (puț — nu pe P)`);
        }
        pushGrindă("subsol_grinda_n", col, I, 650 - col, col, "grindă N");
        pushGrindă("subsol_grinda_w", I, col, col, 645 - col, "grindă W");
        pushGrindă("subsol_grinda_part", 320, col, col, 645 - col, "grindă ~perete_comun X320");
        pushGrindă("subsol_grinda_buc_n", 535, I, col, 30, "grindă X535 doar la N (în zid)");
        pushGrindă("subsol_grinda_buc_put", 535, 590, col, 270, "grindă X535 Y590+ (separator scară)");
        pushGrindă("subsol_grinda_est", 650, I, col, 590 - I, "grindă X650 est");
        pushGrindă("subsol_grinda_y400", col, 400, 320 - col, col, "grindă Y400");
        pushGrindă("subsol_grinda_y440", 320, 440, 330, col, "grindă Y440");
        pushGrindă("subsol_grinda_y645", col, 645, 320 - col, col, "grindă Y645 dorm S");
        pushGrindă("subsol_grinda_y830", 360, 830, 175, col, "grindă Y830 sud buc");
      }
      const zFg0 = zFoundBot;
      const zFg1 = zFoundTop;
      if (isFrameStudy && frameColumns) {
        const fgStudy = frameStudy.foundations_study_cm || {};
        const stripW = fgStudy.strip_width_cm ?? 60;
        const padSide = fgStudy.pad_side_cm ?? 80;
        const eastEcc = fgStudy.east_eccentric_inward !== false;
        /** Lărgește bandă FG față de grindă, centrată pe axă. */
        function stripRect(b) {
          const alongX = b.dx >= b.dy;
          if (alongX) {
            const cy = b.y + b.dy / 2;
            return { x: b.x, y: cy - stripW / 2, dx: b.dx, dy: stripW };
          }
          const cx = b.x + b.dx / 2;
          return { x: cx - stripW / 2, y: b.y, dx: stripW, dy: b.dy };
        }
        /** Talpă padSide×padSide; pe EST (hotar) excentrică spre vest (interior). */
        function padRect(c) {
          const cx = c.x + c.dx / 2;
          const cy = c.y + c.dy / 2;
          const eastish = /C_E_|C_NE|C_S_INTRARE_E|C_CASA_SCARA|C_SHAFT/.test(c.id);
          if (eastEcc && eastish) {
            const x1 = c.x + c.dx; // față est beton
            return { x: x1 - padSide, y: cy - padSide / 2, dx: padSide, dy: padSide };
          }
          return { x: cx - padSide / 2, y: cy - padSide / 2, dx: padSide, dy: padSide };
        }
        // Fundație pe axe cadre (S sau P+E). Nu pe bordură palier / întoarse / exclude_basement.
        for (const b of frameStudy.beams || []) {
          const lv = b.levels || [];
          const tag = lv.join();
          if (/S_inverted/i.test(tag)) continue;
          if (b.exclude_basement) continue;
          const hasS = lv.includes("S");
          const hasP = lv.includes("P");
          const hasE = lv.includes("E");
          if (!hasS && !(hasP && hasE)) continue;
          // Pad B_X360: păstrează amprenta geometrică a pad-ului (dx=70), nu strip pe toată lățimea
          if (b.id === "B_X360_DORM_INTRARE") {
            pushBeton(
              `subsol_fg_${b.id}`,
              b.x,
              b.y,
              b.dx,
              b.dy,
              zFg0,
              zFg1,
              `fg pad ${b.id}`,
              "#5e5a54"
            );
            continue;
          }
          const r = stripRect(b);
          pushBeton(
            `subsol_fg_${b.id}`,
            r.x,
            r.y,
            r.dx,
            r.dy,
            zFg0,
            zFg1,
            `fg bandă ${stripW} pe ${b.id}`,
            "#5e5a54"
          );
        }
        for (const c of frameColumns) {
          if (c.id === "C_SHAFT_E_PIER") {
            pushBeton(
              `subsol_fg_pad_${c.id}`,
              c.x,
              c.y,
              Math.max(c.dx, col),
              Math.max(c.dy, col),
              zFg0,
              zFg1,
              `talpă pier ${c.id}`,
              "#6a6660"
            );
            continue;
          }
          const r = padRect(c);
          pushBeton(
            `subsol_fg_pad_${c.id}`,
            r.x,
            r.y,
            r.dx,
            r.dy,
            zFg0,
            zFg1,
            `talpă ${padSide}×${padSide} ${c.id}`,
            "#6a6660"
          );
        }
        // Grindă întoarsă: legătură vizibilă pier → grindă (nu „în aer”)
        const pier = frameColumns.find((c) => c.id === "C_SHAFT_E_PIER");
        if (pier && invertedEdgeBeam) {
          pushBeton(
            "subsol_fg_pad_C_SHAFT_E_PIER_up",
            pier.x,
            pier.y,
            pier.dx,
            pier.dy,
            zFg1,
            m(invertedEdgeBeam.z0_cm ?? -30),
            "piedestal pier → grindă întoarsă",
            "#5a8f6a"
          );
        }
      } else if (!architectureOnly) {
        pushBeton("subsol_fg_n", I, I, 680 - 2 * I, col, zFg0, zFg1, "grindă fundație N (ipoteză)", "#5e5a54");
        pushBeton("subsol_fg_w", I, I, col, 675 - I, zFg0, zFg1, "grindă fundație W (ipoteză)", "#5e5a54");
        pushBeton("subsol_fg_e535", 535, I, col, 860 - I, zFg0, zFg1, "grindă fundație X535 (ipoteză)", "#5e5a54");
        pushBeton("subsol_fg_e650", 650, I, col, 620 - I, zFg0, zFg1, "grindă fundație X650 (ipoteză)", "#5e5a54");
        pushBeton("subsol_fg_s", I, 645, 360 - I, col, zFg0, zFg1, "grindă fundație S dorm (ipoteză)", "#5e5a54");
      }

      // A1 S1: grinzi + FG pe schema structure_a1_study_cm (subsol)
      if (architectureOnly && a1Structure) {
        const a1Beams = a1Structure.beams || [];
        const a1ColsS = a1Structure.columns || [];
        const fg = a1Structure.foundations_study_cm || {};
        const stripW = fg.strip_width_cm ?? 60;
        const padByCol = a1Structure.foundation_pad_adopt_cm || fg.pad_by_column_cm || {};
        const padSideDefault = fg.pad_side_cm ?? 80;
        const beamHS = m(a1Structure.levels_cm?.basement_beam_h_cm ?? 40);
        const zBeam0S = zSoffit - beamHS;
        for (const b of a1Beams) {
          const blv = b.levels || [];
          if (blv.includes("S_inverted")) continue; // emis în blocul P/E A1
          if (!blv.includes("S")) continue;
          pushBeton(
            `subsol_grinda_${b.id}`,
            b.x,
            b.y,
            b.dx,
            b.dy,
            zBeam0S,
            zSoffit,
            b.note || `grindă S ${b.id}`,
            "#6a6358"
          );
          const alongX = b.dx >= b.dy;
          if (alongX) {
            const cy = b.y + b.dy / 2;
            pushBeton(
              `subsol_fg_${b.id}`,
              b.x,
              cy - stripW / 2,
              b.dx,
              stripW,
              zFg0,
              zFg1,
              `fg bandă ${stripW} pe ${b.id}`,
              "#5e5a54"
            );
          } else {
            const cx = b.x + b.dx / 2;
            pushBeton(
              `subsol_fg_${b.id}`,
              cx - stripW / 2,
              b.y,
              stripW,
              b.dy,
              zFg0,
              zFg1,
              `fg bandă ${stripW} pe ${b.id}`,
              "#5e5a54"
            );
          }
        }
        for (const c of a1ColsS) {
          if (!(c.levels || []).includes("S")) continue;
          const padSide = padByCol[c.id] ?? padSideDefault;
          const cx = c.x + c.dx / 2;
          const cy = c.y + c.dy / 2;
          const eastish = /C_E_|C_NE|C_S_INTRARE_E|C_CASA_SCARA|C_E_LAMELE/.test(c.id);
          let px;
          let py;
          if (fg.east_eccentric_inward !== false && eastish) {
            px = c.x + c.dx - padSide;
            py = cy - padSide / 2;
          } else {
            px = cx - padSide / 2;
            py = cy - padSide / 2;
          }
          pushBeton(
            `subsol_fg_pad_${c.id}`,
            px,
            py,
            padSide,
            padSide,
            zFg0,
            zFg1,
            `talpă ${padSide}×${padSide} ${c.id}`,
            "#6a6660"
          );
        }
      }

      // Contur subsol
      if (a1Clean && bm.walls?.length) {
        // A1.185: talpă perimetru sub retenție + elevație = zid pe talpă (ipoteză geo120)
        const perimStrip =
          a1Structure?.foundations_study_cm?.perimeter_strip_width_cm ?? 80;
        /** Talpă excentrică spre INTERIOR — fața exterioară = fața zidului (finit pe front, nu în stradă). */
        function perimFootingInward(w, strip) {
          const id = w.id || "";
          let outward;
          if (/reten_n|_n$|put_reten_n/i.test(id)) outward = "north";
          else if (/reten_s|_s$|put_reten_s/i.test(id)) outward = "south";
          else if (/reten_e|_e$|put_reten_e/i.test(id)) outward = "east";
          else if (/reten_w|_w$|put_reten_w/i.test(id)) outward = "west";
          else if (w.dx >= w.dy) outward = w.y < 400 ? "north" : "south";
          else outward = w.x > 400 ? "east" : "west";
          if (outward === "east") {
            const outer = w.x + w.dx;
            return { fx: outer - strip, fy: w.y, fdx: strip, fdy: w.dy, outward };
          }
          if (outward === "west") {
            return { fx: w.x, fy: w.y, fdx: strip, fdy: w.dy, outward };
          }
          if (outward === "north") {
            return { fx: w.x, fy: w.y, fdx: w.dx, fdy: strip, outward };
          }
          const outer = w.y + w.dy;
          return { fx: w.x, fy: outer - strip, fdx: w.dx, fdy: strip, outward };
        }
        for (const w of bm.walls) {
          if (w.role === "retaining" || w.role === "stair_pit") {
            const ft = perimFootingInward(w, perimStrip);
            pushBeton(
              `subsol_fg_perim_${w.id}`,
              ft.fx,
              ft.fy,
              ft.fdx,
              ft.fdy,
              zFg0,
              zFg1,
              `talpă ${perimStrip} cm sub ${w.id} (excentrică ${ft.outward}→interior; finit pe front)`,
              "#5c5852"
            );
            // elevație: pe fața tălpii (−265) → teren (0) pe A1 — fără gol sub soclu
            pushRetainingBA(w.id, w.x, w.y, w.dx, w.dy, w.note || w.id, zFg1);
          } else {
            pushUmpluturaWall(w.id, w.x, w.y, w.dx, w.dy, w.note || w.id);
          }
        }
        if (bm.door_to_rooms) {
          pushDoorOpening(bm.door_to_rooms);
          const dr = bm.door_to_rooms;
          meshes.push({
            id: "subsol_prag_usa_magazie",
            type: "extrude",
            polygon: rectPoly(dr.x, dr.y, dr.dx, dr.dy),
            z0_m: zB - floorThB,
            z1_m: zB,
            color: floorColor.magazie_subsol,
            label: "prag ușă magazie→puț (−250)",
          });
        }
      } else {
        // LEGACY V47 — hol_subsol / reintrant (nu mai e sursa de adevăr)
        const perimTag = retainBa ? "retenție BA" : "umplutură perim";
        const idN = retainBa ? "subsol_reten_ba_n" : "subsol_zid_perim_n";
        const idW = retainBa ? "subsol_reten_ba_w" : "subsol_zid_perim_w";
        pushPerim(idN, col, 0, 535 - col, perimTh, `${perimTag} N`);
        pushPerim(idW, 0, col, perimTh, 645 - col, `${perimTag} W`);
        {
          const depR = bm.rooms?.find((r) => r.id === "depozit_subsol");
          const holR = bm.rooms?.find((r) => r.id === "hol_subsol");
          const depDx = depR?.dx ?? (isFrameStudy ? 330 : 320);
          const holX = holR?.x ?? (isFrameStudy ? 360 : 350);
          pushPerim(
            retainBa ? "subsol_reten_ba_s_dep" : "subsol_zid_perim_s_dep",
            col,
            645,
            depDx - col,
            perimTh,
            `${perimTag} S (~dorm)`
          );
          pushPerim(
            retainBa ? "subsol_reten_ba_s_hol" : "subsol_zid_perim_s_hol",
            holX,
            685,
            185,
            perimTh,
            `${perimTag} S hol`
          );
          pushPerim(
            retainBa ? "subsol_reten_ba_hol_vest_reintrant" : "subsol_zid_hol_vest_reintrant",
            holX - 40,
            645,
            perimTh,
            40,
            `${perimTag} hol vest reintrant`
          );
        }
        pushPerim(
          retainBa ? "subsol_reten_ba_ct_est" : "subsol_zid_ct_est",
          thickX0p,
          col,
          shaftWest,
          Math.max(0, landY0 - shaftNorthTh - col),
          retainBa ? `retenție BA CT est ${shaftWest} cm` : `umplutură CT est ${shaftWest} cm`
        );
        {
          const ct = bm.rooms?.find((r) => r.id === "camera_tehnica");
          const dep = bm.rooms?.find((r) => r.id === "depozit_subsol");
          const hol = bm.rooms?.find((r) => r.id === "hol_subsol");
          const ySplit = ct ? ct.y + ct.dy : 400;
          const xSplit = hol ? hol.x : dep ? dep.x + dep.dx : 360;
          const yWall = ySplit - wallT / 2;
          const xWall = xSplit - wallT / 2;
          if (doorCt) {
            const x0 = ct?.x ?? 30;
            const xD0 = doorCt.x;
            const xD1 = doorCt.x + doorCt.dx;
            const x1 = x0 + (ct?.dx ?? 505);
            pushUmpluturaWall("subsol_zid_ct_sud_w", x0, yWall, Math.max(0, xD0 - x0), wallT, "part. CT sud W");
            pushUmpluturaWall("subsol_zid_ct_sud_e", xD1, yWall, Math.max(0, x1 - xD1), wallT, "part. CT sud E");
            pushDoorOpening(doorCt);
          } else {
            pushUmpluturaWall("subsol_zid_ct_sud", ct?.x ?? 30, yWall, ct?.dx ?? 505, wallT, "part. CT sud");
          }
          if (doorDep) {
            const y0 = ySplit;
            const yD0 = doorDep.y;
            const yD1 = doorDep.y + doorDep.dy;
            const y1 = y0 + (dep?.dy ?? hol?.dy ?? 245);
            pushUmpluturaWall("subsol_zid_dep_hol_n", xWall, y0, wallT, Math.max(0, yD0 - y0), "part. dep|hol N");
            pushUmpluturaWall("subsol_zid_dep_hol_s", xWall, yD1, wallT, Math.max(0, y1 - yD1), "part. dep|hol S");
            pushDoorOpening(doorDep);
          } else {
            pushUmpluturaWall("subsol_zid_dep_hol", xWall, ySplit, wallT, dep?.dy ?? 245, "part. dep|hol");
          }
        }
        {
          const dr = bm.door_to_rooms;
          const dxDoor = dr?.dx ?? 30;
          const xDoor = dr?.x ?? 535;
          meshes.push({
            id: "subsol_prag_usa_hol",
            type: "extrude",
            polygon: rectPoly(xDoor, doorY0i, dxDoor, Math.max(1, doorY1i - doorY0i)),
            z0_m: zB - floorThB,
            z1_m: zB,
            color: floorColor.hol_subsol,
            label: "prag ușă hol→puț (−250)",
          });
        }
      }

      // Placă structurală unică: 15 cm din soffit (−30→−15). Sandwich-ul de mai jos
      // nu mai adaugă un al doilea strat „structural” pe același interval.
      const slabStructTh = m(ht.structural_slab_cm ?? abs.floor_slab_th_cm ?? 15);
      meshes.push({
        id: "subsol_intrados_placa",
        type: "extrude",
        polygon: slabStructPoly(),
        holes: bm.open_shaft_under_ramp2 ? [shaftHole] : [],
        z0_m: zSoffit,
        z1_m: zSoffit + slabStructTh,
        color: "#8b8680",
        opacity: 0.45,
        site_layer: "structura",
        label: isFrameStudy
          ? `placă structurală ${Math.round(slabStructTh * 100)} cm pe muchie beton (${structFp?.ew}×${structFp?.ns}; ETICS afară; gol sub r2)`
          : `placă structurală ${Math.round(slabStructTh * 100)} cm (−30→−15; gol sub r2)`,
      });

      // Puț scară + fântână (rev32):
      // - VEST: zid GROS 30 cm = continuare buc_est (stânga puțului)
      // - EST: sprijin SUBȚIRE spre Dragalina (nu fațadă 30 pe scară)
      // - Închidere VERTICALĂ la Y=ns (sud casă) doar de la TEREN în sus
      // - Canalul sub cotă (−95) RĂMÂNE DESCHIS orizontal: fântână → puț (intrare)
      const cts = bm.court_to_access_steps;
      const zGrade = 0;
      const stB = bm.stair;
      const up = bm.upper_landing || bm.local_court_drop;
      const low = bm.lower_landing;
      const dr = bm.door_to_rooms;
      const r2b = bm.ramp2_ref || r2ref;
      const openSh = bm.open_shaft_cm || {
        x: r2b.x,
        y: r2b.y,
        dx: r2b.dx,
        dy: r2b.dy,
      };
      const encSh = bm.shaft_enclosure_cm || {
        y0: low?.y ?? openSh.y,
        y1: nsCm,
      };
      const bucEst = (v47.walls_cm || []).find((w) => w.id === "buc_est");
      const thShaft = bm.wall_thickness_study_cm || {};
      // Zid gros stânga = buc_est (X535×30), continuat pe subsol
      const thickX0 = bucEst?.x ?? 535;
      const thickDx = thShaft.shaft_west_cm ?? bucEst?.dx ?? 30;
      const clearX0 = openSh.x; // 565
      const thinEDx = thShaft.shaft_east_cm ?? 15;
      const thinEX0 = ewCm - thinEDx; // 665
      const clearDx = thinEX0 - clearX0;
      const stairX0 = clearX0;
      // pereți pe tot enclosure (palier+puț); gol planșeu = doar open_shaft
      const shaftY0 = encSh.y0 ?? low?.y ?? openSh.y;
      const shaftYHouse1 = nsCm; // 860
      const shaftYWell1 = pitY1;
      const doorH = m(dr?.opening_h_cm ?? 200);
      const doorLintel = m(dr?.lintel_reserve_cm ?? 15);
      const zWellTop = zGrade + 0.9;
      const zShaftTop = Math.max(zSoffit + 0.05, zAccess + doorH + doorLintel);
      const zNorthTop = zSoffit;

      function pushWallSeg(id, x, dx, y, dy, z0, z1, label, layer) {
        if (dx < 1 || dy < 1 || z1 <= z0 + 0.01) return;
        meshes.push({
          id,
          type: "extrude",
          polygon: rectPoly(x, y, dx, dy),
          z0_m: z0,
          z1_m: z1,
          color: layer === "umplutura" ? "#a8a296" : "#7a7670",
          opacity: 0.97,
          // puț/fântână = beton reazem/retenție → structura (legat de cadru)
          site_layer: layer || "structura",
          label,
        });
      }

      // —— Ziduri puț: pe A1 deja în bm.walls (retenție E cutie + put_reten_n/e).
      // Legacy V47: diafragme W/E/N separate (hol_subsol era pe altă geometrie).
      if (!a1Clean) {
        {
          const y0 = shaftY0;
          const doorY0 = dr?.y ?? 530;
          const doorY1 = doorY0 + (dr?.dy ?? 70);
          const d0 = doorY0;
          const d1 = doorY1;
          if (d0 > y0) {
            pushWallSeg(
              "subsol_put_beton_w_n",
              thickX0,
              thickDx,
              y0,
              d0 - y0,
              zColBot,
              zShaftTop,
              `diafragmă beton W N de ușă ${thickDx} cm`,
              "structura"
            );
          }
          if (d1 < shaftYHouse1) {
            pushWallSeg(
              "subsol_put_beton_w_s",
              thickX0,
              thickDx,
              d1,
              shaftYHouse1 - d1,
              zColBot,
              zShaftTop,
              `diafragmă beton W S de ușă ${thickDx} cm`,
              "structura"
            );
          }
          if (d1 > d0) {
            pushWallSeg(
              "subsol_put_beton_w_buiandrug",
              thickX0,
              thickDx,
              d0,
              d1 - d0,
              zB + doorH,
              zB + doorH + doorLintel,
              `buiandrug beton ușă hol→puț Y${d0}–${d1}`,
              "structura"
            );
          }
          if (shaftYWell1 > shaftYHouse1) {
            pushWallSeg(
              "subsol_fantana_beton_w",
              thickX0,
              thickDx,
              shaftYHouse1,
              shaftYWell1 - shaftYHouse1,
              zColBot,
              zWellTop,
              "diafragmă beton vest fântână",
              "structura"
            );
          }
        }
        pushWallSeg(
          "subsol_put_beton_e",
          thinEX0,
          thinEDx,
          shaftY0,
          shaftYWell1 - shaftY0,
          zColBot,
          zWellTop,
          `diafragmă beton EST ${thinEDx} cm`,
          "structura"
        );
        pushWallSeg(
          "subsol_put_beton_n",
          thickX0,
          thinEX0 + thinEDx - thickX0,
          shaftY0 - shaftNorthTh,
          shaftNorthTh,
          zColBot,
          zNorthTop,
          `diafragmă beton N @ Y${shaftY0 - shaftNorthTh}–${shaftY0}`,
          "structura"
        );
      }

      // Muchie planșeu Y590: legacy = grindă coborâtă; FRAME = grindă întoarsă din schemă (X565, z−30…−5).
      if (isFrameStudy && invertedEdgeBeam) {
        const ib = invertedEdgeBeam;
        meshes.push({
          id: "subsol_grinda_y590_inverted",
          type: "extrude",
          polygon: rectPoly(ib.x, ib.y, ib.dx, ib.dy),
          z0_m: m(ib.z0_cm ?? -30),
          z1_m: m(ib.z1_cm ?? -5),
          color: "#3ecf7a",
          opacity: 1,
          site_layer: "structura",
          highlight: "inverted_beam",
          label:
            "GRINDĂ ÎNTOARSĂ Y575–600 (verde) — sub placă, deasupra ușii beci; formă închisă; armare = calcul",
        });
      } else if (bm.slab_coordination_cm?.edge_beam_y != null) {
        const by = bm.slab_coordination_cm.edge_beam_y; // 590
        const edgeTh = 15; // lățime pe Y, în zona acoperită
        meshes.push({
          id: "subsol_grindă_planșeu_y590",
          type: "extrude",
          polygon: rectPoly(thickX0, by - edgeTh, thinEX0 + thinEDx - thickX0, edgeTh),
          z0_m: zSoffit - beamH,
          z1_m: zSoffit,
          color: "#6a6358",
          site_layer: "structura",
          label: "grindă unică reazem planșeu Y575–600 dy=25 (nu peste scară; clear sub≈180 cm — ipoteză)",
        });
      }

      // Fără închidere verticală la sud casă — bloca intrarea în puț.
      // Canalul fântână→puț rămâne liber pe clar (orizontala −95 + pe verticală).

      // —— Fântână S de casă: fund + trepte; FĂRĂ zid pe clarul de intrare
      // Origine trepte = court_to_access_steps.y (nu nsCm/Y860 fix)
      const stepsY0 = cts?.y ?? shaftYHouse1;
      if (cts?.count && shaftYWell1 > Math.min(shaftYHouse1, stepsY0)) {
        const wellY = Math.min(shaftYHouse1, stepsY0);
        const wellDy = shaftYWell1 - wellY;
        meshes.push({
          id: "subsol_curte_engleza_fund",
          type: "extrude",
          polygon: rectPoly(thickX0, wellY, thinEX0 + thinEDx - thickX0, wellDy),
          z0_m: zAccess - 0.1,
          z1_m: zAccess,
          color: "#9a958c",
          site_layer: "curte",
          label: "pardoseală fântână −95",
        });
        const stepX = clearX0;
        const stepDx = clearDx;
        // Trepte CONTINUE teren (0) → palier (−95); fără gol vizual
        const fromZcm = cts.from_z_cm ?? 0;
        const toZcm = cts.to_z_cm ?? -95;
        const nRisers = cts.count || 6;
        const riserCm = Math.abs(toZcm - fromZcm) / nRisers;
        const stepDy = cts.tread_cm || 28;
        const runDy = nRisers * stepDy;
        const stepsSouth = stepsY0 + runDy;
        // pereți laterali + coronamente până la noul capăt al coborârii
        for (const w of [
          { id: "e", x: thinEX0, y: wellY, dx: thinEDx, dy: Math.max(wellDy, stepsSouth - wellY) },
          { id: "w", x: thickX0, y: wellY, dx: thickDx, dy: Math.max(wellDy, stepsSouth - wellY) },
        ]) {
          meshes.push({
            id: `curte_engleza_coping_${w.id}`,
            type: "extrude",
            polygon: rectPoly(w.x, w.y, w.dx, w.dy),
            z0_m: zGrade,
            z1_m: zGrade + 0.08,
            color: "#c4bdae",
            site_layer: "curte",
            label: `coronament fântână ${w.id}`,
          });
        }
        for (let i = 0; i < nRisers; i++) {
          // i=0 cea mai de sus (sud), z = fromZ - riser
          const yS = stepsY0 + runDy - (i + 1) * stepDy;
          const zTopCm = fromZcm - riserCm * (i + 1);
          const zTop = m(zTopCm);
          // volum plin treaptă (nu doar placă subțire) — vizibil în fântână
          meshes.push({
            id: `subsol_racord_curte_${i}`,
            type: "extrude",
            polygon: rectPoly(stepX, yS, stepDx, stepDy),
            z0_m: zTop - m(riserCm) * 0.92,
            z1_m: zTop,
            color: i % 2 ? "#f0e2b8" : "#e0c888",
            site_layer: "structura",
            label: `treaptă ${i + 1}/${nRisers} curte engleză z=${zTopCm.toFixed(1)} Y${yS}–${yS + stepDy}`,
          });
          meshes.push({
            id: `subsol_racord_riser_${i}`,
            type: "extrude",
            polygon: rectPoly(stepX, yS + stepDy - 6, stepDx, 6),
            z0_m: zTop - m(riserCm),
            z1_m: zTop,
            color: "#c4b496",
            site_layer: "structura",
            label: `contratrepă ${i + 1}/${nRisers}`,
          });
        }
        // prag subțire la cota teren — se oprește la sudul rampei (racord alee, nu palier fictiv)
        meshes.push({
          id: "subsol_curte_engleza_prag",
          type: "extrude",
          polygon: rectPoly(stepX, stepsSouth - 4, stepDx, 4),
          z0_m: zGrade - 0.02,
          z1_m: zGrade + 0.05,
          color: "#b8b09a",
          site_layer: "curte",
          label: `prag racord @ Y${stepsSouth} (cota teren → alee)`,
        });
      }

      // Palier −95 pe clar — continuă până la originea treptelor (cts.y), fără gol 8 cm
      {
        const upY = up?.y ?? 800;
        const landEndY = stepsY0;
        meshes.push({
          id: "subsol_palier_acces",
          type: "extrude",
          polygon: rectPoly(clearX0, upY, clearDx, Math.max(up?.dy ?? 68, landEndY - upY)),
          z0_m: zAccess - 0.08,
          z1_m: zAccess,
          color: "#8aa4b8",
          site_layer: "structura",
          label: `palier −95 Y${upY}–${landEndY} (continuu cu trepte)`,
        });
      }

      // Scară beci pe clar 90
      if (stB?.treads) {
        const riserCm = stB.riser_cm;
        const treadCm = stB.tread_cm;
        const fromZ = stB.from_z_cm;
        const toZcm = stB.to_z_cm ?? lv.basement_ff ?? -250;
        const ySouth = stB.y + stB.dy;
        const treadTh = Math.min(m(riserCm) * 0.35, 0.06);
        for (let i = 0; i < stB.treads; i++) {
          const yS = ySouth - (i + 1) * treadCm;
          const zTopCm = fromZ - riserCm * (i + 1);
          const zTop = m(zTopCm);
          meshes.push({
            id: `subsol_scara_${i}`,
            type: "extrude",
            polygon: rectPoly(stairX0, yS, clearDx, treadCm),
            z0_m: zTop - treadTh,
            z1_m: zTop,
            color: i % 2 ? "#8a93a0" : "#9aa3ad",
            site_layer: "structura",
            label: `scară subsol călcare ${i + 1}/${stB.treads}`,
          });
        }
        const lastTopCm = fromZ - riserCm * stB.treads;
        meshes.push({
          id: "subsol_scara_riser_final",
          type: "extrude",
          polygon: rectPoly(stairX0, stB.y, clearDx, Math.min(treadCm, 8)),
          z0_m: m(toZcm),
          z1_m: m(lastTopCm),
          color: "#7a8490",
          site_layer: "structura",
          label: `contratrepă finală → ${toZcm}`,
        });
      }

      // Palier jos − din JSON (A1: liber N de scară, nu sub scară)
      {
        const lowY = low?.y ?? shaftY0 + 12;
        const lowDy = low?.dy ?? 90;
        meshes.push({
          id: "subsol_palier_jos",
          type: "extrude",
          polygon: rectPoly(thickX0, lowY, thinEX0 + thinEDx - thickX0, lowDy),
          z0_m: zB - floorThB,
          z1_m: zB,
          color: "#e8c56a",
          site_layer: "structura",
          label: low?.note || "palier inferior",
        });
      }

      // Echipamente — înălțime declarată (secționarea e în viewer)
      for (const eq of bm.equipment || []) {
        meshes.push({
          id: `subsol_eq_${eq.id}`,
          type: "extrude",
          polygon: rectPoly(eq.x, eq.y, eq.w_cm, eq.d_cm),
          z0_m: zB,
          z1_m: zB + m(eq.h_cm || 80),
          color: "#5a6a78",
          opacity: 0.85,
          label: eq.label || eq.id,
        });
      }

      // Straturi NESTRUCTURALE peste placa −30→−15 (placa e deja subsol_intrados_placa).
      // Nu mai extrudăm structural_slab / residual — o singură alcătuire.
      const sandwich = bm.floor_sandwich_cm || abs.floor_sandwich_cm?.layers || [];
      for (const layer of sandwich) {
        if (!(layer.th_cm > 0)) continue;
        if (/structural_slab|intrados_placa|residual|make_up/i.test(layer.id || "")) continue;
        meshes.push({
          id: `sandwich_${layer.id}`,
          type: "extrude",
          polygon: rectPoly(0, 0, ewCm, nsCm),
          holes: bm.open_shaft_under_ramp2 ? [shaftHole] : [],
          z0_m: m(layer.z0_cm),
          z1_m: m(layer.z1_cm),
          color: layer.color || "#b0a090",
          opacity: 0.35,
          label: `sandwich ${layer.id} ${layer.th_cm} cm (nestructural)`,
        });
      }

      // Fundație pe BETON: ETICS (92 mm) ÎN AFARA feței cărămizii/structurii.
      // Fața finită anvelopă ≠ fața pe care stă fundația.
      const termoOut = th.foundation_thermosystem_outside_cm ?? THERMO_OUT ?? 9.2;
      const footBeyond = th.foundation_footing_beyond_structure_cm ?? th.foundation_projection_beyond_wall_cm ?? 5;
      // fața structură/umplutură sub termo = finit inset termoOut; talpa poate ieși footBeyond spre exterior
      // → fața exterioară talpă față de finit = termoOut - footBeyond (pozitiv = înăuntrul finitului)
      const insetFromFinished = Math.max(0, termoOut - footBeyond);
      const foundZ0 = zB - floorThB - 0.45;
      const foundZ1 = zB - floorThB;
      // ring pe conturul talpii (înăuntrul feței finite pe fațade cu termosistem)
      const fx0 = insetFromFinished;
      const fy0 = insetFromFinished;
      const fx1 = ewCm - insetFromFinished;
      const fy1 = nsCm - insetFromFinished;
      function maxExtraOut(axis) {
        // eventuală ieșire suplimentară spre exterior față de talpa de bază, clipată în parcelă
        let lo = 0;
        let hi = 20;
        for (let i = 0; i < 14; i++) {
          const mid = (lo + hi) / 2;
          const pts =
            axis === "N"
              ? [toSite(fx0, fy0 - mid), toSite((fx0 + fx1) / 2, fy0 - mid), toSite(fx1, fy0 - mid)]
              : axis === "S"
                ? [toSite(fx0, fy1 + mid), toSite((fx0 + fx1) / 2, fy1 + mid), toSite(fx1, fy1 + mid)]
                : axis === "W"
                  ? [toSite(fx0 - mid, fy0), toSite(fx0 - mid, (fy0 + fy1) / 2), toSite(fx0 - mid, fy1)]
                  : [toSite(fx1 + mid, fy0), toSite(fx1 + mid, (fy0 + fy1) / 2), toSite(fx1 + mid, fy1)];
          if (pts.every((p) => insideParcel(p))) lo = mid;
          else hi = mid;
        }
        return +lo.toFixed(2);
      }
      const foundClip = {
        N: maxExtraOut("N"),
        S: maxExtraOut("S"),
        W: maxExtraOut("W"),
        E: maxExtraOut("E"),
        inset_from_finished_cm: insetFromFinished,
        thermosystem_outside_cm: termoOut,
        footing_beyond_structure_cm: footBeyond,
        target_cm: footBeyond,
        note: "talpă beton; ETICS 9.2 cm în afara fundației (EB20+ISOVER — de confirmat)",
      };
      v47._foundation_clip_cm = foundClip;
      const ox0 = fx0 - foundClip.W;
      const oy0 = fy0 - foundClip.N;
      const ox1 = fx1 + foundClip.E;
      const oy1 = fy1 + foundClip.S;
      const foundOuter = [
        { id: "N", x: ox0, y: oy0, dx: ox1 - ox0, dy: fy0 - oy0 },
        { id: "S", x: ox0, y: fy1, dx: ox1 - ox0, dy: oy1 - fy1 },
        { id: "W", x: ox0, y: fy0, dx: fx0 - ox0, dy: fy1 - fy0 },
        { id: "E", x: fx1, y: fy0, dx: ox1 - fx1, dy: fy1 - fy0 },
      ].filter((f) => f.dx >= 0.5 && f.dy >= 0.5);
      // FRAME / A1 curat: nu duplica inelul fundatie_N/S/W/E
      if (!isFrameStudy && !architectureOnly) {
        for (const f of foundOuter) {
          meshes.push({
            id: `fundatie_${f.id}`,
            type: "extrude",
            polygon: rectPoly(f.x, f.y, f.dx, f.dy),
            z0_m: foundZ0,
            z1_m: foundZ1,
            color: "#6e6a62",
            opacity: 0.9,
            site_layer: "structura",
            label: `fundație beton ${f.id} (finit−${insetFromFinished}, termo ${termoOut} afară)`,
          });
        }
      }
    }
  }

  // —— SCHELT PARTER + ETAJ — pe planul real; living sub palier liber pe P
  {
    const col = COL;
    const lvFrame = frameStudy?.levels_cm;
    const slabStructTh = m(
      isFrameStudy && lvFrame?.slab_th_hypothesis
        ? lvFrame.slab_th_hypothesis
        : ht.structural_slab_cm || 15
    );
    // FRAME: cote din JSON (placă +293→+308; grindă totală 35 → intrados +273). Legacy: FF−15.
    const slabZ0 =
      isFrameStudy && lvFrame?.slab_soffit_etaj != null
        ? m(lvFrame.slab_soffit_etaj)
        : zEtaj - slabStructTh;
    const slabZ1 =
      isFrameStudy && lvFrame?.slab_top_etaj != null
        ? m(lvFrame.slab_top_etaj)
        : zEtaj;
    const beamH = m(
      isFrameStudy && lvFrame?.beam_h_total_including_slab_zone
        ? lvFrame.beam_h_total_including_slab_zone
        : 35
    );
    const beamSoffitZ =
      isFrameStudy && lvFrame?.beam_soffit_over_parter != null
        ? m(lvFrame.beam_soffit_over_parter)
        : slabZ0 - beamH;
    const beamTopZ = isFrameStudy ? slabZ1 : slabZ0;
    const zBotP = isFrameStudy ? frameColumnZ0 : -0.3;
    const zTopP = isFrameStudy ? zEtaj : slabZ0; // FRAME: prin placă+buildup până la FF etaj
    const zBotE = zEtaj;
    const zTopE = eaveZ;
    function pushPE(id, x, y, dx, dy, z0, z1, label, color) {
      if (dx < 1 || dy < 1 || z1 <= z0 + 0.02) return;
      meshes.push({
        id,
        type: "extrude",
        polygon: rectPoly(x, y, dx, dy),
        z0_m: z0,
        z1_m: z1,
        color: color || "#7a7670",
        opacity: 0.95,
        site_layer: "structura",
        label,
      });
    }
    const colHoles = [];
    if (architectureOnly && (a1Structure?.columns?.length || a1Columns?.length)) {
      // S1: stâlpi + centuri P/E + placă pe schema A1 (nu FRAME)
      const a1Cols = a1Structure?.columns?.length ? a1Structure.columns : a1Columns;
      const a1Beams = a1Structure?.beams || [];
      const lvA1 = a1Structure?.levels_cm;
      const zA1Bot = -3.1;
      const slabThA1 = m(lvA1?.slab_th_hypothesis ?? 15);
      const slabZ0A1 = lvA1?.slab_soffit_etaj != null ? m(lvA1.slab_soffit_etaj) : zEtaj - slabThA1;
      const slabZ1A1 = lvA1?.slab_top_etaj != null ? m(lvA1.slab_top_etaj) : zEtaj;
      const beamHA1default = m(lvA1?.beam_h_total_including_slab_zone ?? 35);
      const beamTopA1 = slabZ1A1;
      function beamHFor(b) {
        const hCm = b.h_cm ?? a1Structure?.beam_height_adopt_cm?.[b.id] ?? lvA1?.beam_h_total_including_slab_zone ?? 35;
        return m(hCm);
      }
      const invA1 = a1Beams.find((b) => (b.levels || []).includes("S_inverted"));
      for (const c of a1Cols) {
        const lv = c.levels || ["S", "P", "E"];
        const hasP = lv.includes("P");
        const hasE = lv.includes("E");
        const sOnly = lv.includes("S") && !hasP && !hasE;
        const z0 = lv.includes("S") || hasP ? zA1Bot : zEtaj;
        const z1 = hasE
          ? zTopE
          : hasP
            ? slabZ0A1
            : sOnly
              ? m(invA1?.z1_cm ?? -5)
              : zTopE;
        pushPE(
          sOnly ? `subsol_pier_${c.id}` : `stalp_a1_${c.id}`,
          c.x,
          c.y,
          c.dx,
          c.dy,
          z0,
          z1,
          sOnly
            ? `pier S ${c.id} — reazem grindă întoarsă`
            : `A1 S1 ${c.id} ${c.section_cm || `${c.dx}×${c.dy}`} — FE confirmă`,
          sOnly ? "#5a8f6a" : "#7a9e6a"
        );
        if (hasP && hasE) colHoles.push(rectHole(c.x, c.y, c.dx, c.dy));
      }
      for (const b of a1Beams) {
        const lv = b.levels || [];
        const bH = beamHFor(b);
        if (lv.includes("P")) {
          const zSoffitP = beamTopA1 - bH;
          pushPE(
            `parter_centura_${b.id}`,
            b.x,
            b.y,
            b.dx,
            b.dy,
            zSoffitP,
            beamTopA1,
            b.note || `centură P ${b.id}`,
            "#5a554e"
          );
        }
        if (lv.includes("E")) {
          const zRb0 = zTopE - bH;
          pushPE(
            `etaj_centura_${b.id}`,
            b.x,
            b.y,
            b.dx,
            b.dy,
            zRb0,
            zTopE,
            b.note || `centură E ${b.id}`,
            "#5a554e"
          );
        }
        if (lv.includes("S_inverted")) {
          pushPE(
            `subsol_grinda_${b.id}`,
            b.x,
            b.y,
            b.dx,
            b.dy,
            m(b.z0_cm ?? -30),
            m(b.z1_cm ?? -5),
            b.note || `grindă întoarsă ${b.id}`,
            "#5a8f6a"
          );
        }
      }
      const pitA1 = a1Structure?.pit_cm || a1Basement?.stair?.pit;
      const etajSlabHoleA1 = pitA1
        ? rectHole(pitA1.x0, pitA1.y0, pitA1.x1 - pitA1.x0, pitA1.y1 - pitA1.y0)
        : rectHoleInside(r2.x + 2, r2.y + 2, r2.dx - 4, Math.min(r2.dy, nsCm - r2.y) - 4) ||
          rectHole(r2.x + 5, r2.y + 5, r2.dx - 10, Math.min(r2.dy, nsCm - r2.y) - 10);
      meshes.push({
        id: "etaj_placa_structura",
        type: "extrude",
        polygon: slabStructPoly(),
        holes: [etajSlabHoleA1, ...colHoles].filter(Boolean),
        z0_m: slabZ0A1,
        z1_m: slabZ1A1,
        color: "#8b8680",
        opacity: 0.5,
        site_layer: "structura",
        label: `A1 S1 placă ${Math.round(slabThA1 * 100)} cm (gol puț; FE confirmă)`,
      });
      // Fațadă pe stâlpi de perimetru — ETICS/klinker ca pe FRAME (continuitate anvelopă)
      {
        const box = a1Structure?.structure_box_cm || {
          x0: 0,
          y0: 0,
          x1: ewCm,
          y1: nsCm,
        };
        const tol = 40;
        const outLayersA1 = layersFromOutside("A1").filter(
          (L) => !/caramida|eb20|tencuiala_int|finisare_vopsea|faianata|adeziv/i.test(L.id || "")
        );
        const outLayersA2 = layersFromOutside("A2").filter(
          (L) => !/caramida|eb20|tencuiala_int|finisare_vopsea|faianata|adeziv/i.test(L.id || "")
        );
        for (const c of a1Cols) {
          const bands = [];
          if (Math.abs(c.x - (box.x0 ?? 0)) < tol)
            bands.push({ outward: "west", along0: c.y, along1: c.y + c.dy, face: c.x });
          if (Math.abs(c.x + c.dx - (box.x1 ?? ewCm)) < tol)
            bands.push({ outward: "east", along0: c.y, along1: c.y + c.dy, face: c.x + c.dx });
          if (Math.abs(c.y - (box.y0 ?? 0)) < tol)
            bands.push({ outward: "north", along0: c.x, along1: c.x + c.dx, face: c.y });
          if (Math.abs(c.y + c.dy - (box.y1 ?? nsCm)) < tol)
            bands.push({ outward: "south", along0: c.x, along1: c.x + c.dx, face: c.y + c.dy });
          // scară E: C_E_PAL pe fațadă est
          if (c.id === "C_E_PAL" && !bands.some((b) => b.outward === "east")) {
            bands.push({ outward: "east", along0: c.y, along1: c.y + c.dy, face: c.x + c.dx });
          }
          for (const band of bands) {
            const cat = band.outward === "north" ? "A1" : "A2";
            const layers = cat === "A1" ? outLayersA1 : outLayersA2;
            let accMm = 0;
            for (const L of layers) {
              const thMm = L.th_mm || 0;
              if (thMm < 0.05) continue;
              const aCm = accMm / 10;
              const bCm = (accMm + thMm) / 10;
              accMm += thMm;
              let x;
              let y;
              let dx;
              let dy;
              const span = Math.max(0.05, band.along1 - band.along0);
              if (band.outward === "east") {
                x = band.face + aCm;
                dx = Math.max(0.05, bCm - aCm);
                y = band.along0;
                dy = span;
              } else if (band.outward === "west") {
                x = band.face - bCm;
                dx = Math.max(0.05, bCm - aCm);
                y = band.along0;
                dy = span;
              } else if (band.outward === "south") {
                y = band.face + aCm;
                dy = Math.max(0.05, bCm - aCm);
                x = band.along0;
                dx = span;
              } else {
                y = band.face - bCm;
                dy = Math.max(0.05, bCm - aCm);
                x = band.along0;
                dx = span;
              }
              meshes.push({
                id: `col_facade_${c.id}_${band.outward}_${L.id}`,
                type: "extrude",
                polygon: rectPoly(x, y, dx, dy),
                z0_m: zA1Bot,
                z1_m: zTopE,
                color: LAYER_COLORS[L.id] || "#d8d2c6",
                opacity: /vata/i.test(L.id || "") ? 0.85 : 0.97,
                site_layer: "anvelopa",
                group: "fatada",
                wall_layer: L.id,
                catalog_id: cat,
                label: `${c.id} [${cat} ${band.outward}]: ${L.name || L.id}`,
              });
            }
          }
        }
      }
    } else if (isFrameStudy && frameColumns) {
      for (const c of frameColumns) {
        const lv = c.levels || [];
        const hasP = lv.includes("P");
        const hasE = lv.includes("E");
        if (hasP && hasE) {
          // Un singur corp: fundație/P → prin placă+pardoseală → etaj (fără gap +293…+320)
          pushPE(
            `stalp_continuu_${c.id}`,
            c.x,
            c.y,
            c.dx,
            c.dy,
            zBotP,
            zTopE,
            `stâlp ${c.id} fundație→acoperiș (${c.dx}×${c.dy}), legat pe grinzi fg+centuri`,
            "#6e6a64"
          );
          colHoles.push(rectHole(c.x, c.y, c.dx, c.dy));
        } else {
          if (hasP && !hasE) {
            // S+P (ex. C_E_LAND_SP): fundație → FF etaj / soffit placă — NU urcă în volumul E
            pushPE(
              `stalp_SP_${c.id}`,
              c.x,
              c.y,
              c.dx,
              c.dy,
              zBotP,
              zTopP,
              `stâlp S+P ${c.id} (oprire sub etaj — ${c.why_not_E || "fără E"})`,
              "#7a9e6a"
            );
            colHoles.push(rectHole(c.x, c.y, c.dx, c.dy));
          } else if (hasP) {
            pushPE(
              `parter_stalp_${c.id}`,
              c.x,
              c.y,
              c.dx,
              c.dy,
              zBotP,
              zTopP,
              `stâlp P ${c.id}`,
              "#6e6a64"
            );
          }
          if (hasE) {
            pushPE(
              `etaj_stalp_${c.id}`,
              c.x,
              c.y,
              c.dx,
              c.dy,
              zBotE,
              zTopE,
              `stâlp E ${c.id}`,
              "#6e6a64"
            );
          }
          // Pier/subsol-only (ex. C_SHAFT_E_PIER sub grindă întoarsă)
          if (!hasP && !hasE && (lv.includes("S") || c.role)) {
            const pierTop = m(invertedEdgeBeam?.z1_cm ?? -5);
            pushPE(
              `subsol_pier_${c.id}`,
              c.x,
              c.y,
              c.dx,
              c.dy,
              zBotP,
              pierTop,
              `pier ${c.id} — reazem grindă întoarsă`,
              "#5a8f6a"
            );
          }
        }
        const cold = c.etics_cold_band_cm;
        if (cold) {
          meshes.push({
            id: `separator_vata_${c.id}`,
            type: "extrude",
            polygon: rectPoly(cold.x0, c.y, cold.x1 - cold.x0, c.dy),
            z0_m: zBotP,
            z1_m: zTopE,
            color: "#e2d18a",
            opacity: 0.8,
            site_layer: "umplutura",
            label: `vată față rece ${c.id} (nu beton în scară)`,
          });
        }
      }
      /** Pe stâlp: doar straturile din afara cărămizii (beton = miez). */
      function columnOutsideLayers(catalogId) {
        return layersFromOutside(catalogId).filter(
          (L) => !/caramida|eb20|tencuiala_int|finisare_vopsea|faianata|adeziv_faianata/i.test(L.id || "")
        );
      }
      function columnInteriorLayers(catalogId) {
        const entry =
          assyCatalog[catalogId] ||
          (catalogId === "A2" ? v47.construction_assemblies?.exterior_wall_klinker : null) ||
          assy;
        const listed = entry?.layers_interior_to_exterior_mm || assy.layers_interior_to_exterior_mm || [];
        return (listed || []).filter((L) => /tencuiala_int|finisare_vopsea/i.test(L.id || L.name || ""));
      }
      function resolveBandOutward(c, band) {
        if (band.outward) return band.outward;
        if (band.x0 != null && band.x1 != null && (band.y0 == null || Math.abs((band.y1 ?? 0) - (band.y0 ?? 0) - c.dy) < 1)) {
          const mid = ((band.x0 ?? 0) + (band.x1 ?? 0)) / 2;
          return mid >= c.x + c.dx - 0.5 ? "east" : "west";
        }
        if (band.y0 != null && band.y1 != null) {
          const mid = ((band.y0 ?? 0) + (band.y1 ?? 0)) / 2;
          return mid >= c.y + c.dy - 0.5 ? "south" : "north";
        }
        return "east";
      }
      function pushColumnLayerStack(c, outward, faceCm, along0, along1, layers, z0, z1, sideTag, fromFaceOutward) {
        let accMm = 0;
        for (const L of layers) {
          const thMm = L.th_mm || 0;
          if (thMm < 0.05) continue;
          const aCm = accMm / 10;
          const bCm = (accMm + thMm) / 10;
          accMm += thMm;
          let x;
          let y;
          let dx;
          let dy;
          const span = Math.max(0.05, along1 - along0);
          if (outward === "east") {
            x = fromFaceOutward ? faceCm + aCm : faceCm - bCm;
            dx = Math.max(0.05, bCm - aCm);
            y = along0;
            dy = span;
          } else if (outward === "west") {
            x = fromFaceOutward ? faceCm - bCm : faceCm + aCm;
            dx = Math.max(0.05, bCm - aCm);
            y = along0;
            dy = span;
          } else if (outward === "south") {
            y = fromFaceOutward ? faceCm + aCm : faceCm - bCm;
            dy = Math.max(0.05, bCm - aCm);
            x = along0;
            dx = span;
          } else {
            y = fromFaceOutward ? faceCm - bCm : faceCm + aCm;
            dy = Math.max(0.05, bCm - aCm);
            x = along0;
            dx = span;
          }
          const isFono = /vata_isover/i.test(L.id || "");
          meshes.push({
            id: `col_facade_${c.id}_${sideTag}_${L.id}`,
            type: "extrude",
            polygon: rectPoly(x, y, dx, dy),
            z0_m: z0,
            z1_m: z1,
            color: LAYER_COLORS[L.id] || "#d8d2c6",
            opacity: isFono ? 0.85 : 0.97,
            // umplutură → vizibile în „2 · + Pereți” (beton stâlp rămâne în Structură)
            site_layer: "umplutura",
            wall_layer: L.id,
            catalog_id: c.facade_catalog || "A2",
            label: `${c.id} [${c.facade_catalog || "A2"} ${sideTag}]: ${L.name || L.id} (${L.th_mm} mm)`,
          });
        }
      }
      function pushColumnFacadeWrap(c) {
        const defaultCat = c.facade_catalog || "A2";
        const faceCat = c.facade_catalog_by_face || {};
        const bands = c.etics_outside_bands_cm?.length
          ? c.etics_outside_bands_cm
          : c.etics_outside_band_cm
            ? [c.etics_outside_band_cm]
            : [];
        for (const band of bands) {
          const outward = resolveBandOutward(c, band);
          const catalogId = faceCat[outward] || defaultCat;
          const outLayers = columnOutsideLayers(catalogId);
          let faceCm;
          let along0;
          let along1;
          if (outward === "east") {
            faceCm = c.x + c.dx;
            along0 = band.y0 != null ? band.y0 : c.y;
            along1 = band.y1 != null ? band.y1 : c.y + c.dy;
          } else if (outward === "west") {
            faceCm = c.x;
            along0 = band.y0 != null ? band.y0 : c.y;
            along1 = band.y1 != null ? band.y1 : c.y + c.dy;
          } else if (outward === "south") {
            faceCm = c.y + c.dy;
            along0 = band.x0 != null ? band.x0 : c.x;
            along1 = band.x1 != null ? band.x1 : c.x + c.dx;
          } else {
            faceCm = c.y;
            along0 = band.x0 != null ? band.x0 : c.x;
            along1 = band.x1 != null ? band.x1 : c.x + c.dx;
          }
          const cFace = { ...c, facade_catalog: catalogId };
          // layersFromOutside = exterior→interior; pe stâlp extrudăm din față beton spre afară → reverse
          pushColumnLayerStack(
            cFace,
            outward,
            faceCm,
            along0,
            along1,
            [...outLayers].reverse(),
            zBotP,
            zTopE,
            `out_${outward}`,
            true
          );
        }
        const intLayers = columnInteriorLayers(defaultCat);
        // Finisaj interior pe fețele opuse (flush cu peretele; colț = 2 fețe)
        if (!bands.length || !intLayers.length) return;
        const opp = (d) =>
          d === "east" ? "west" : d === "west" ? "east" : d === "south" ? "north" : "south";
        const doneInt = new Set();
        for (const band of bands) {
          const inward = opp(resolveBandOutward(c, band));
          if (doneInt.has(inward)) continue;
          doneInt.add(inward);
          let iFace;
          let i0;
          let i1;
          if (inward === "west") {
            iFace = c.x;
            i0 = c.y;
            i1 = c.y + c.dy;
          } else if (inward === "east") {
            iFace = c.x + c.dx;
            i0 = c.y;
            i1 = c.y + c.dy;
          } else if (inward === "north") {
            iFace = c.y;
            i0 = c.x;
            i1 = c.x + c.dx;
          } else {
            iFace = c.y + c.dy;
            i0 = c.x;
            i1 = c.x + c.dx;
          }
          pushColumnLayerStack(c, inward, iFace, i0, i1, intLayers, zBotP, zTopE, `int_${inward}`, true);
        }
      }
      for (const c of frameColumns) {
        if (c.etics_outside_band_cm || c.etics_outside_bands_cm?.length) pushColumnFacadeWrap(c);
      }
    } else if (!architectureOnly) {
      for (const n of structNodesContinuous) {
        pushPE(`parter_stalp_${n.id}`, n.x, n.y, col, col, zBotP, slabZ0, `stâlp P ${n.id}`, "#6e6a64");
        pushPE(`etaj_stalp_${n.id}`, n.x, n.y, col, col, zBotE, zTopE, `stâlp E ${n.id}`, "#6e6a64");
      }
      for (const n of structNodesNoParter) {
        pushPE(`etaj_stalp_${n.id}`, n.x, n.y, col, col, zBotE, zTopE, `stâlp E ${n.id} (nu pe P)`, "#6e6a64");
      }
      for (const n of structNodesEtajOnly) {
        pushPE(`etaj_stalp_${n.id}`, n.x, n.y, col, col, zBotE, zTopE, `stâlp E-only ${n.id}`, "#6e6a64");
      }
    }
    const zB0 = beamSoffitZ;
    if (isFrameStudy) {
      // Grinzi P din schemă (niveluri P) — cote Z din levels_cm
      for (const b of frameStudy.beams || []) {
        if (!(b.levels || []).includes("P")) continue;
        pushPE(
          `parter_centura_${b.id}`,
          b.x,
          b.y,
          b.dx,
          b.dy,
          zB0,
          beamTopZ,
          `${b.note || b.id} (intrados ${Math.round(beamSoffitZ * 100)})`,
          "#5a554e"
        );
      }
    } else if (!architectureOnly) {
      pushPE("parter_centura_n", I, I, 650 - I, col, zB0, zTopP, "centură P N", "#5a554e");
      pushPE("parter_centura_w", I, I, col, 645 - I, zB0, zTopP, "centură P W", "#5a554e");
      pushPE("parter_centura_x320", 320, I, col, 645 - I, zB0, zTopP, "centură P ~perete comun", "#5a554e");
      pushPE("parter_centura_x535_put", 535, 590, col, 270, zB0, zTopP, "centură P X535 Y590+", "#5a554e");
      pushPE("parter_centura_x650_n", 650, I, col, 440 - I, zB0, zTopP, "centură P X650 N", "#5a554e");
      pushPE("parter_centura_x650_s", 650, 590, col, 240, zB0, zTopP, "centură P X650 S", "#5a554e");
      pushPE("parter_centura_y440", 320, 440, 330, col, zB0, zTopP, "centură P Y440", "#5a554e");
      pushPE("parter_centura_y590", 320, 590 - col, 360, col, zB0, zTopP, "centură P Y590", "#5a554e");
      pushPE("parter_centura_y645", I, 645, 320 - I, col, zB0, zTopP, "centură P Y645", "#5a554e");
      pushPE("parter_centura_y830", 360, 830, 175, col, zB0, zTopP, "centură P Y830", "#5a554e");
    }
    if (!architectureOnly) {
      const etajSlabHole =
        rectHoleInside(r2.x + 2, r2.y + 2, r2.dx - 4, Math.min(r2.dy, nsCm - r2.y) - 4) ||
        rectHole(r2.x + 5, r2.y + 5, r2.dx - 10, Math.min(r2.dy, nsCm - r2.y) - 10);
      // Gol exact pe conturul palierului (complementar — fără bandă de overlap)
      const palHole =
        isFrameStudy && palSup ? rectHole(palSup.x, palSup.y, palSup.dx, palSup.dy) : null;
      meshes.push({
        id: "etaj_placa_structura",
        type: "extrude",
        polygon: slabStructPoly(),
        holes: [etajSlabHole, palHole, ...colHoles].filter(Boolean),
        z0_m: slabZ0,
        z1_m: slabZ1,
        color: "#8b8680",
        opacity: 0.5,
        site_layer: "structura",
        label: isFrameStudy
          ? `placă ${Math.round(slabStructTh * 100)} cm pe muchie beton ${structFp?.ew}×${structFp?.ns} (+${lvFrame?.slab_soffit_etaj ?? 293}→+${lvFrame?.slab_top_etaj ?? 308}; ETICS afară; gol palier)`
          : `planșeu etaj structural ${Math.round(slabStructTh * 100)} cm (nu buildup ${Math.round(floorTh * 100)} cm)`,
      });
      const zRb0 = zTopE - beamH;
      if (isFrameStudy) {
        for (const b of frameStudy.beams || []) {
          if (!(b.levels || []).includes("E")) continue;
          pushPE(
            `etaj_centura_${b.id}`,
            b.x,
            b.y,
            b.dx,
            b.dy,
            zRb0,
            zTopE,
            b.note || `centură E ${b.id}`,
            "#5a554e"
          );
        }
      } else {
        pushPE("etaj_centura_n", I, I, 650 - I, col, zRb0, zTopE, "centură E N", "#5a554e");
        pushPE("etaj_centura_w", I, I, col, 830 - I, zRb0, zTopE, "centură E W", "#5a554e");
        pushPE("etaj_centura_x535", 535, I, col, 860 - I, zRb0, zTopE, "centură E casă–scară", "#5a554e");
        pushPE("etaj_centura_x650", 650, I, col, 590 - I, zRb0, zTopE, "centură E X650", "#5a554e");
        pushPE("etaj_centura_y470", 535, 470, 145, col, zRb0, zTopE, "centură E Y470 bordură palier scară", "#5a554e");
        pushPE("etaj_centura_y590", 535, 590 - col, 145, col, zRb0, zTopE, "centură E Y590", "#5a554e");
      }
    }
    // Acoperiș 2 ape = mesh triangles (apa N/S + frontoane) emis mai sus — fără dublură corp-only
  }

  // Treptele de acces — ultimele, ca să rămână vizibile peste placă/plintă
  pushEntrySteps();

  const corners = {
    NW: toSite(0, 0),
    NE: toSite(v47.envelope_cm.ew, 0),
    SE: toSite(v47.envelope_cm.ew, v47.envelope_cm.ns),
    SW: toSite(0, v47.envelope_cm.ns),
  };
  const cornersInside = Object.fromEntries(
    Object.entries(corners).map(([k, pt]) => [k, insideParcel(pt)])
  );
  const cornerOverflow_m = Object.fromEntries(
    Object.entries(corners).map(([k, pt]) => {
      const inside = insideParcel(pt);
      const d = overflowDistanceM(pt);
      // PIP false cu d≈0 → pe contur / eroare numerică — raportat explicit
      return [k, { inside, dist_m: +d.toFixed(3), note: !inside && d < 0.02 ? "PIP=false, dist≈0 (contur/numeric)" : null }];
    })
  );
  // anexă scară SE (podest) — punct exterior local
  const stairSeLocal = {
    x: st.band_x + st.band_dx,
    y: st.podest_se.y + st.podest_se.dy,
  };
  const stairSeSite = toSite(stairSeLocal.x, stairSeLocal.y);
  const stairSeInside = insideParcel(stairSeSite);
  const stairSeOverflow_m = +overflowDistanceM(stairSeSite).toFixed(3);

  const isStudyA1Frame =
    v47.meta?.study_variant === "A1_FRAME" || inputRel.includes("a1_frame");
  const isStudyA1 =
    isStudyA1Frame ||
    v47.meta?.study_variant === "A1" ||
    (inputRel.includes("a1_study") && !inputRel.includes("frame"));
  const absD = v47.basement_cm?.absolute_from_grade_cm;

  // —— Audit fundație: talpă beton (finit − termosistem + mică ieșire), nu +15 peste finit
  const thFound = v47.basement_cm?.wall_thickness_study_cm || {};
  const termoOutA = thFound.foundation_thermosystem_outside_cm ?? THERMO_OUT ?? 9.2;
  const footA = thFound.foundation_footing_beyond_structure_cm ?? thFound.foundation_projection_beyond_wall_cm ?? 5;
  const insetA = Math.max(0, termoOutA - footA);
  const foundClip = v47._foundation_clip_cm || {
    N: 0,
    S: 0,
    W: 0,
    E: 0,
    inset_from_finished_cm: insetA,
    thermosystem_outside_cm: termoOutA,
    footing_beyond_structure_cm: footA,
    target_cm: footA,
  };
  function auditFoundCorners(label, x0, y0, x1, y1) {
    const corners = [
      { id: `${label}_NW`, x: x0, y: y0 },
      { id: `${label}_NE`, x: x1, y: y0 },
      { id: `${label}_SE`, x: x1, y: y1 },
      { id: `${label}_SW`, x: x0, y: y1 },
      { id: `${label}_N_mid`, x: (x0 + x1) / 2, y: y0 },
      { id: `${label}_E_mid`, x: x1, y: (y0 + y1) / 2 },
      { id: `${label}_S_mid`, x: (x0 + x1) / 2, y: y1 },
      { id: `${label}_W_mid`, x: x0, y: (y0 + y1) / 2 },
    ];
    return corners.map((c) => {
      const site = toSite(c.x, c.y);
      const inside = insideParcel(site);
      return {
        id: c.id,
        local_cm: { x: c.x, y: c.y },
        site_m: site,
        inside,
        overflow_m: +overflowDistanceM(site).toFixed(3),
      };
    });
  }
  // țintă greșită veche: +15 peste finit (pentru comparație)
  const foundationLegacyWrong = auditFoundCorners("legacy_plus15_finished", -15, -15, ewCm + 15, nsCm + 15);
  const bx0 = insetA - (foundClip.W || 0);
  const by0 = insetA - (foundClip.N || 0);
  const bx1 = ewCm - insetA + (foundClip.E || 0);
  const by1 = nsCm - insetA + (foundClip.S || 0);
  const foundationParcel = auditFoundCorners("concrete_footing", bx0, by0, bx1, by1);
  const foundationAllInside = foundationParcel.every((p) => p.inside || p.overflow_m < 0.02);
  const foundationTargetAllInside = foundationLegacyWrong.every((p) => p.inside);
  delete v47._foundation_clip_cm;
  const volume = {
    meta: {
      id: isStudyA1Frame
        ? "volume_v47_a1_frame_study"
        : architectureOnly
          ? "volume_a1_curat"
          : isStudyA1
            ? "volume_v47_a1_study"
            : "volume_v47_exact",
      generated: new Date().toISOString(),
      status: isStudyA1Frame
        ? "3D_STUDIU_A1_FRAME_CADRE"
        : architectureOnly
          ? "3D_A1_CURAT_AMENAJARE"
          : isStudyA1
            ? "3D_STUDIU_A1"
            : "3D_EXACT_V47",
      source_plan: inputRel,
      a1_architecture: architectureOnly ? "data/building/a1_architecture.json" : undefined,
      amenajare_source: architectureOnly
        ? v47.amenajare_source || "a1_architecture"
        : undefined,
      based_on: isStudyA1Frame
        ? "STALE — cadre V47; amenajare A1 separat în volume_a1"
        : architectureOnly
          ? "a1_architecture (amenajare P/E + subsol cutie) — fără cadre FRAME"
          : isStudyA1
            ? "v47_exact (referință neatinsă)"
            : "v46_exact r7g",
      study_variant: isStudyA1Frame
        ? "A1_FRAME_STALE"
        : architectureOnly
          ? "A1_CURAT"
          : isStudyA1
            ? "A1"
            : undefined,
      architecture_only: architectureOnly || undefined,
      declared_buildable: isStudyA1Frame || architectureOnly ? false : undefined,
      levels_note: "subsol (L-1) + parter + etaj",
      warning: isStudyA1Frame
        ? `STALE / FRAME vechi: ${STRUCT_HYPOTHESIS} Nu e modelul A1 curat. Deschide ?v=a1 pentru amenajare+subsol nou.`
        : architectureOnly
          ? a1Structure
            ? `A1 S1: amenajare + subsol cutie + cadre pe axe A1 (grinzi/FG/placă). Secțiuni PROVIZORIU — FE confirmă. FRAME V47 = STALE.`
            : `A1 CURAT: amenajare + subsol; rulează npm run structure:a1 pentru cadre.`
          : isStudyA1
            ? `STUDIU A1: ${STRUCT_HYPOTHESIS} Clear țintă ${absD?.clear_height_cm ?? 220}; sub grinzi beci ≈180 cm. Nu autorizabil.`
            : "V47 concept: FF=față sus. Nu autorizabil / nu verificat structural.",
      structure_hypothesis: architectureOnly
        ? a1Structure
          ? "A1 S1: cadre pe structure_a1_study_cm (stâlpi/grinzi/FG/placă) — geometric, FE confirmă"
          : "A1 curat: stâlpi PROVIZORIU din columns_cm (fără structure_a1 încă)"
        : isStudyA1
          ? STRUCT_HYPOTHESIS
          : undefined,
      structure_a1_ref: architectureOnly && a1Structure ? "structure_a1_study_cm" : undefined,
      finished_wall_vs_column_cm: isStudyA1
        ? {
            finished_envelope_cm: WALL_FINISHED,
            finished_nominal_mm: assy.thickness_nominal_mm ?? 299,
            concrete_column_cm: COL_BETON,
            etics_outside_brick_cm: THERMO_OUT,
            assembly: "EB20_Akustik_200_ISOVER_FASSADE_80",
            note: "30 = finit max (nom. 299 mm); stâlpul ≠ 30; de confirmat ETICS/proiectant",
          }
        : undefined,
      exterior_wall_assembly: isStudyA1
        ? {
            ref: "construction_assemblies.exterior_wall_heated",
            products: assy.products,
            sum_mm: assy.sum_layers_mm ?? 299,
            max_mm: assy.thickness_finished_max_mm ?? 300,
            validation_status: assy.validation_status,
            not_validated: assy.not_validated,
            conflicts: assy.conflicts_reported,
            tiled_interior: assy.interior_finish_tiled_zones,
            envelope_kept_cm: { ew: ewCm, ns: nsCm },
          }
        : undefined,
      gate_default_state: "closed",
      gate_clear_m: v47.site_access_cm?.auto?.gate?.clear_opening_m ?? 6,
      units: "meters",
      ff_definition: "top_of_finished_floor",
      level_height_m: H,
      floor_buildup_below_ff_m: floorTh,
      z_parter_ff_m: zParter,
      z_etaj_ff_m: zEtaj,
      z_parter_status: "ipoteză (2×riser), nu măsurătoare teren",
      stair: {
        risers_from_ff: 18,
        flight_180: st.risers_flight_180,
        flight_330: st.risers_flight_330,
        riser_cm: ht.riser_cm,
        entry: "2 trepte ⊥ pe palier, de pe aleea pietonală",
        palier_parter: "la cota elevației, pe lângă terasă",
        layout: "L: 8 sud (start vest) + podest SE → 10 est → palier/ușă (+60 sud)",
        covers: "buc+terasă+rampă2 acoperite; 2 trepte+palier elevație+180 descoperite",
      },
      envelope_m: {
        ew: m(v47.envelope_cm.ew),
        ns: m(v47.envelope_cm.ns),
        area_m2: m(v47.envelope_cm.ew) * m(v47.envelope_cm.ns),
      },
    },
    site: {
      polygon_metrics: polygon.metrics,
      confirmed_areas: {
        measured_m2: parcel.confirmed.area_measured_m2,
        from_acts_m2: parcel.confirmed.area_from_acts_m2,
        existing_built_m2: parcel.confirmed.existing_built_ground_m2,
      },
      cf_vertices: polygon.vertices_m,
      footprint_vertices: env,
      v44_corners: corners,
      origin_local: "EST pe Dragalina (lanț 5→1); adâncime spre vest",
      along_dragalina_from_pct5_m: +along0.toFixed(3),
      corners_inside: cornersInside,
      corner_overflow_m: cornerOverflow_m,
      stair_se_site: stairSeSite,
      stair_se_inside: stairSeInside,
      stair_se_overflow_m: stairSeOverflow_m,
      foundation_model: "beton; ETICS 9.2 cm (ISOVER FASSADE) în afara feței cărămizii — de confirmat",
      foundation_inset_from_finished_cm: insetA,
      foundation_clip_cm: foundClip,
      foundation_corners_legacy_plus15_finished: foundationLegacyWrong,
      foundation_legacy_plus15_all_inside: foundationTargetAllInside,
      foundation_corners: foundationParcel,
      foundation_all_inside: foundationAllInside,
      parcel_area_status: "aproximativ (reconstruit ≠ 147 m² declarați)",
      transform: { P5, P7, Ix, Iy, Tx, Ty, along0, ew, ns },
    },
    building_summary: {
      footprint_gross_m2: +(m(v47.envelope_cm.ew) * m(v47.envelope_cm.ns)).toFixed(2),
      useful_interior_m2: v47.areas_cm?.useful_interior_m2 ?? null,
      terrace_libera_m2: v47.areas_cm?.terrace_libera_m2 ?? null,
      useful_note: "shoelace pe interior_polygon_cm — vezi docs:v47",
      walls:
        "A1/A6≈300; A2 klinker 312 (vată80); A4 scară≈150; A7 fono125; A8 baie≈150 — assemblies_v01",
      levels: `L-1 subsol + P + E; FF→FF ${ht.ff_to_ff_cm ?? 288} cm; subsol clear 208 cm (ipoteză soffit −42)`,
      basement_m2: v47.basement_cm?.areas?.total_brut_rooms_m2 ?? null,
      parking: "2 × 2.50×5.00 Cloșca (studiu, departate)",
      gate: `auto Cloșca clear ${v47.site_access_cm?.auto?.gate?.clear_opening_m ?? 6} m + pietonală Dragalina`,
      fence: "EST+NORD=zid casă; VEST+Cloșca+Dragalina S=gard+porți",
      courtyard: "view Curte: curte engleză deschisă (gol teren) −48→−95",
      pedestrian_path: "alee Dragalina → scări",
      source: `V47 exact rev${v47.meta?.rev || 1}`,
      covers: "corp+buc+terasă+rampă2 acoperite; rampă1+podest SE neacoperite",
      heights: "255+6+15+3+2+5+2; elevație teren ipoteză",
    },
    meshes,
  };

  // Secțiuni straturi A1 + A2 (catalog locked)
  if (isStudyA1) {
    function writeWallSectionSvg(catalogId, svgRel, title) {
      const entry = assyCatalog[catalogId] || (catalogId === "A1" ? assy : null);
      const layersIntExt = entry?.layers_interior_to_exterior_mm;
      if (!Array.isArray(layersIntExt)) return null;
      const sum = layersIntExt.reduce((s, L) => s + (L.th_mm || 0), 0);
      const Wsvg = 960;
      const Hsvg = 480;
      const x0 = 80;
      const y0 = 70;
      const Hbar = 260;
      const scale = 2.2;
      let x = x0;
      const parts = [];
      parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
      parts.push(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${Wsvg}" height="${Hsvg}" viewBox="0 0 ${Wsvg} ${Hsvg}">`
      );
      parts.push(`<rect width="100%" height="100%" fill="#f7f4ef"/>`);
      parts.push(
        `<text x="40" y="28" font-size="14" font-weight="600" font-family="IBM Plex Sans,Segoe UI,sans-serif">${title}</text>`
      );
      parts.push(
        `<text x="40" y="48" font-size="10" fill="#444" font-family="IBM Plex Sans,Segoe UI,sans-serif">interior → exterior · sumă ${sum} mm · assemblies_v01 CONFIRMAT · vată 80 neschimbată</text>`
      );
      for (const L of layersIntExt) {
        const ww = (L.th_mm || 0) * scale;
        const col = LAYER_COLORS[L.id] || "#ccc";
        parts.push(
          `<rect x="${x}" y="${y0}" width="${ww}" height="${Hbar}" fill="${col}" stroke="#333" stroke-width="0.8"/>`
        );
        parts.push(
          `<text x="${x + ww / 2}" y="${y0 + Hbar + 18}" text-anchor="middle" font-size="8" font-family="IBM Plex Sans,Segoe UI,sans-serif">${L.th_mm}</text>`
        );
        parts.push(
          `<text x="${x + ww / 2}" y="${y0 + Hbar / 2}" text-anchor="middle" font-size="7" transform="rotate(-90 ${x + ww / 2} ${y0 + Hbar / 2})" font-family="IBM Plex Sans,Segoe UI,sans-serif">${(L.name || L.id).slice(0, 28)}</text>`
        );
        x += ww;
      }
      parts.push(
        `<text x="40" y="${Hsvg - 28}" font-size="8" fill="#555" font-family="IBM Plex Sans,Segoe UI,sans-serif">catalog ${catalogId} · decisions/assemblies_catalog_v01.md</text>`
      );
      parts.push(`</svg>`);
      fs.mkdirSync(path.join(ROOT, "outputs/plans"), { recursive: true });
      fs.writeFileSync(path.join(ROOT, svgRel), parts.join("\n"));
      return svgRel;
    }
    volume.meta.exterior_wall_section_svg = writeWallSectionSvg(
      "A1",
      "outputs/plans/35_v47_a1_exterior_wall_section.svg",
      "V47 · A1 Ext. tencuială (N) — EB20 200 + ISOVER 80 ≈ 300 mm"
    );
    volume.meta.exterior_wall_klinker_section_svg = writeWallSectionSvg(
      "A2",
      "outputs/plans/35b_v47_a2_klinker_wall_section.svg",
      "V47 · A2 Ext. klinker (E/S/V) — EB20 200 + ISOVER 80 + klinker 15 = 312 mm"
    );
  }

  if (outVolRel === "viewer/data/volume_v47.json") {
    write("outputs/plans/04_volume_concept_v47.json", volume);
  } else if (isStudyA1Frame || outVolRel.includes("a1_frame")) {
    write("outputs/plans/04_volume_concept_v47_a1_frame.json", volume);
  } else {
    write("outputs/plans/04_volume_concept_v47_a1_study.json", volume);
  }
  write(outVolRel, volume);
  // Alias clar pentru modelul nou (viewer default)
  if (architectureOnly && (outVolRel.includes("volume_v47_a1.json") || outVolRel.includes("volume_a1"))) {
    write("viewer/data/volume_a1.json", volume);
    write("outputs/plans/04_volume_a1_curat.json", volume);
  }
  if (outVolRel !== "viewer/data/volume_v47.json") {
    console.log(
      `[build_v47_3d] ${architectureOnly ? "A1 CURAT" : isFrameStudy ? "FRAME STALE" : "study"} → ${outVolRel}`
    );
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        id: volume.meta.id,
        envelope_m2: volume.building_summary.footprint_gross_m2,
        meshes: meshes.length,
        corners,
      },
      null,
      2
    )
  );
}

main();
