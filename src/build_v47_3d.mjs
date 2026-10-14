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

  // FF = fața SUPERIOARĂ a pardoselii finite; grosimi sub FF. 288 = 18×16.
  const ht = v47.heights_cm;
  const st = v47.stair_cm;
  const riser = m(ht.riser_cm);
  const ffToFf = m(ht.ff_to_ff_cm);
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

  // Curte engleză = groapă ÎNCHISĂ pe E (Dragalina=beton) și pe verticală spre curte
  // (deasupra terenului). Gol în teren DOAR pe fântâna exterioară (Y≥ns), NU pe puțul sub casă.
  const ecOpen = v47.courtyard_cm?.english_court;
  const bmEarly = v47.basement_cm;
  const ctsEarly = bmEarly?.court_to_access_steps;
  const upEarly = bmEarly?.upper_landing || bmEarly?.local_court_drop;
  const r2ref = bmEarly?.ramp2_ref || st.ramp2;
  // puț deschis A1: open_shaft_cm acoperă și palierul jos; altfel ramp2_ref
  const shaftRef = bmEarly?.open_shaft_cm || r2ref;
  const ewCm = v47.envelope_cm.ew;
  const nsCm = v47.envelope_cm.ns;
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

  // 2 trepte: de pe alee (sud) → FF terasă. Desenate mai jos din nou (după placă) ca să rămână vizibile.
  function pushEntrySteps() {
    const es = st.entry_steps;
    if (!es || !es.steps) return;
    const stepDy = es.dy / es.steps;
    // Y crește spre sud: treapta cea mai sudică = cotă 0, urcă spre nord (spre terasă).
    // Placa se oprește la es.y (Y975) — treptele sunt SUD de placă, vizibile.
    for (let i = 0; i < es.steps; i++) {
      const ySouth = es.y + es.dy - (i + 1) * stepDy;
      const z0s = riser * i;
      const z1s = z0s + Math.max(riser, 0.05);
      meshes.push({
        id: `acces_treapta_${i}`,
        type: "extrude",
        polygon: rectPoly(es.x, ySouth, es.dx, stepDy),
        z0_m: z0s,
        z1_m: z1s + 0.03,
        color: i % 2 === 0 ? "#e8a020" : "#d4890a",
        label: `treaptă acces ${i + 1}/2 (sud de terasă)`,
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
      if (w.kind !== "ext") continue;
      // nu soclu pe P pentru ziduri doar-etaj (ex. living_palier)
      if (w.levels && !w.levels.includes(0)) continue;
      meshes.push({
        id: `soclu_${w.id}`,
        type: "extrude",
        polygon: rectPoly(w.x, w.y, w.dx, w.dy),
        z0_m: 0,
        z1_m: zSocle,
        color: mosaicColors[0],
        finish: "mozaic",
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
      });
    }

    for (const w of v47.walls_cm) {
      if (w.kind === "parapet") continue;
      if (w.levels && !w.levels.includes(level)) continue;
      const isExt = w.kind === "ext";
      // Pe P: sub palierul de intrare etaj (est, Y470–590 X535–650) = living deschis.
      // Păstrăm doar peretele pe limita de proprietate (est_recuperat_p).
      if (
        level === 0 &&
        w.id !== "est_recuperat_p" &&
        w.x < 680 &&
        w.x + w.dx > 535 &&
        w.y < 590 &&
        w.y + w.dy > 470
      ) {
        continue;
      }
      meshes.push({
        id: `zid_${w.id}_${suffix}`,
        type: "extrude",
        polygon: rectPoly(w.x, w.y, w.dx, w.dy),
        z0_m: zFf,
        z1_m: z1,
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

  // Acoperiș corp + terasă + bucătărie (fără placă planșeu pe golul scării)
  const roofZ0 = zEtaj + H;
  const roofZ1 = roofZ0 + 0.22;
  const bandX = st.band_x;
  meshes.push({
    id: "acoperis_vest",
    type: "extrude",
    polygon: rectPoly(0, 0, bandX, v47.envelope_cm.ns),
    z0_m: roofZ0,
    z1_m: roofZ1,
    color: "#5c564e",
    label: "Acoperiș corp / terasă / bucătărie",
  });
  meshes.push({
    id: "acoperis_est_nord",
    type: "extrude",
    polygon: rectPoly(bandX, 0, st.band_dx, st.ramp2.y),
    z0_m: roofZ0,
    z1_m: roofZ1,
    color: "#5c564e",
    label: "Acoperiș est nord",
  });

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
  const tread = st.tread_cm || 30;
  const nTread180 = n180 - 1;
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

  // Podest SE: față sus = FF + 128 cm (8×16)
  const zPod = zParter + riser * n180;
  meshes.push({
    id: "podest_se",
    type: "extrude",
    polygon: rectPoly(pod.x, pod.y, pod.dx, pod.dy),
    z0_m: zPod - floorTh,
    z1_m: zPod,
    color: "#c4b496",
    label: "Podest SE (FF=+128 cm)",
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
      // plăcuță vizibilă pe față
      meshes.push({
        id: `treapta_r2_${i}`,
        type: "extrude",
        polygon: rectPoly(r2.x, ySouth, st.width_clear_cm, tread),
        z0_m: zTopStep - treadTh,
        z1_m: zTopStep,
        color: i % 2 === 0 ? "#8a93a0" : "#7a8390",
        label: "Rampă est (FF treaptă = sus)",
      });
      // structură treaptă (doară grosimea scării — NU umplutură până la FF parter)
      meshes.push({
        id: `structura_r2_${i}`,
        type: "extrude",
        polygon: rectPoly(r2.x, ySouth, r2.dx, tread),
        z0_m: zTopStep - rampStruct,
        z1_m: zTopStep - treadTh,
        color: "#5a6570",
        label: `Structură rampă ${st.ramp2_structure_cm || 20} cm`,
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
      // depozit sub r2 eliminat (V47): spațiu liber pentru coborâre beci
      if (storageUnderRamp2) {
        const zFill = Math.max(zParter, zTopStep - rampStruct);
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
  }
  // Copertină pe rampa 2 (acoperită) — nu e placă de planșeu
  meshes.push({
    id: "copertina_rampa2",
    type: "extrude",
    polygon: rectPoly(r2.x, r2.y, r2.dx, r2.dy),
    z0_m: roofZ0,
    z1_m: roofZ1,
    color: "#7a7368",
    label: "Copertină rampă 2 (acoperită)",
    opacity: 0.88,
  });

  // Palier superior = vestibul INTERIOR sub acoperiș (puț scară), nu podest în aer
  meshes.push({
    id: "palier_superior",
    type: "extrude",
    polygon: rectPoly(palSup.x, palSup.y, palSup.dx, palSup.dy),
    z0_m: zEtaj - floorTh,
    z1_m: zEtaj,
    color: "#e4ddd0",
    label: "Palier superior INTERIOR FF etaj",
  });
  const palWallT = 15;
  const palDoorW = 90;
  const palDoorX = palSup.x + (palSup.dx - palDoorW) / 2;
  // Zid est plin până la acoperiș
  meshes.push({
    id: "zid_palier_sup_est",
    type: "extrude",
    polygon: rectPoly(st.band_x + st.band_dx - palWallT, palSup.y, palWallT, palSup.dy),
    z0_m: zEtaj,
    z1_m: roofZ0,
    color: "#d8d2c6",
    label: "Zid est vestibul palier",
  });
  // Zid sud cu gol ușă din rampă 2 acoperită → vestibul
  const palSudY = palSup.y + palSup.dy - palWallT;
  meshes.push({
    id: "zid_palier_sup_sud_st",
    type: "extrude",
    polygon: rectPoly(palSup.x, palSudY, Math.max(0, palDoorX - palSup.x), palWallT),
    z0_m: zEtaj,
    z1_m: roofZ0,
    color: "#d8d2c6",
    label: "Zid sud vestibul (stânga ușă)",
  });
  meshes.push({
    id: "zid_palier_sup_sud_dr",
    type: "extrude",
    polygon: rectPoly(
      palDoorX + palDoorW,
      palSudY,
      Math.max(0, palSup.x + palSup.dx - (palDoorX + palDoorW)),
      palWallT
    ),
    z0_m: zEtaj,
    z1_m: roofZ0,
    color: "#d8d2c6",
    label: "Zid sud vestibul (dreapta ușă)",
  });
  meshes.push({
    id: "zid_palier_sup_sud_buiandrug",
    type: "extrude",
    polygon: rectPoly(palDoorX, palSudY, palDoorW, palWallT),
    z0_m: zEtaj + 2.1,
    z1_m: roofZ0,
    color: "#d8d2c6",
    label: "Buiandrug ușă rampă→palier",
  });
  meshes.push({
    id: "gol_usa_rampa_palier",
    type: "extrude",
    polygon: rectPoly(palDoorX, palSudY, palDoorW, palWallT),
    z0_m: zEtaj,
    z1_m: zEtaj + 2.1,
    color: "#87a0b8",
    opacity: 0.35,
    label: "Ușă rampă 2 → vestibul etaj",
  });

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
    const poly = rectPoly(o.x, o.y, Math.max(o.dx, 8), Math.max(o.dy, 8));
    const sill = o.id.includes("geam") ? 0.9 : 0;
    const oh = o.id.includes("geam") ? 1.5 : 2.1;
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
        opacity: 0.5,
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
    meshes.push({
      id: "gard_vest",
      type: "ribbon",
      centerline: [byId[10], byId[9], byId[8], byId[7]],
      width_m: fT,
      z0_m: 0,
      z1_m: fH,
      color: fCol,
      opacity: 0.65,
      site_layer: "imprejmuire",
      label: "Gard vest → colț NV parcelă (P7)",
    });
    // P7 → NV casă (pe nord): leagă gardul de zidul-nord al casei
    meshes.push({
      id: "gard_nord_vest_colt",
      type: "ribbon",
      centerline: [byId[7], nwSite],
      width_m: fT,
      z0_m: 0,
      z1_m: fH,
      color: fCol,
      opacity: 0.65,
      site_layer: "imprejmuire",
      label: "Gard colț NV (P7 → casă)",
    });

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


  // Subsol — scară coboară −95 → −250; camere FF→soffit (clear 208)
  {
    const bm = v47.basement_cm;
    if (bm?.rooms) {
      const abs = bm.absolute_from_grade_cm || {};
      const lv = bm.levels_vs_ff_parter_cm || {};
      const zB = m(abs.basement_ff_cm ?? lv.basement_ff ?? -250);
      const zSoffit = m(abs.slab_soffit_cm ?? lv.slab_soffit_cm ?? -42);
      const zAccess = m(abs.access_landing_cm ?? lv.access_landing ?? -95);
      const zCourt = m(abs.grade_cm ?? lv.courtyard_general ?? 0);
      const floorThB = m(abs.floor_slab_th_cm ?? lv.floor_slab_th_cm ?? 15);

      // Pardoseală camere (culori distincte) — FĂRĂ volume opace (ascundeau planul)
      const floorColor = {
        camera_tehnica: "#4f7f94",
        depozit_subsol: "#9a8458",
        hol_subsol: "#d4a84a",
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
      const wallPerim = th.perimeter_structure_cm ?? 30;
      const wallT = th.partition_cm ?? 12.5;
      const wallTopR = zSoffit; // full clear to soffit
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
      function pushStructWall(id, x, y, dx, dy, label) {
        pushWallFull(id, x, y, dx, dy, label, {
          color: "#b0a898",
          site_layer: "structura",
        });
      }
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
          label: `${d.id} buiandrug`,
        });
      }

      // perimetru structură (studiu) — contur complet camere + legătură CT est
      const lowLand = bm.lower_landing || { y: 520, dy: 80 };
      const shaftWest = th.shaft_west_cm ?? 30;
      const shaftEast = th.shaft_east_cm ?? 15;
      const shaftNorthTh = th.shaft_north_cm ?? wallT;
      const landY0 = lowLand.y ?? 520;
      const landY1 = landY0 + (lowLand.dy ?? 80);
      const thickX0p = 535;
      const thinEX0p = ewCm - shaftEast; // 665 dacă 15

      pushStructWall("subsol_zid_perim_n", 30, 30 - wallPerim, 505, wallPerim, "perim N CT");
      pushStructWall("subsol_zid_perim_w", 30 - wallPerim, 30, wallPerim, 600, "perim W");
      pushStructWall("subsol_zid_perim_s_dep", 30, 630, 320, wallPerim, "perim S depozit");
      pushStructWall("subsol_zid_perim_s_hol", 350, 685, 185, wallPerim, "perim S hol");
      // Colțuri / reintrant — umplere goluri L (audit: lipsă stâlpi/colțuri)
      pushStructWall("subsol_zid_colt_nw", 0, 0, wallPerim, wallPerim, "colț NW 30×30");
      pushStructWall("subsol_zid_colt_sw_dep", 0, 630, wallPerim, wallPerim, "colț SW depozit 30×30");
      pushStructWall("subsol_zid_colt_ne_ct", 535, 0, wallPerim, wallPerim, "colț NE CT 30×30");
      // Hol protrude S de depozit: față vest reintrantă X320–350 Y630–685
      pushStructWall(
        "subsol_zid_hol_vest_reintrant",
        350 - wallPerim,
        630,
        wallPerim,
        55,
        "hol vest reintrant Y630–685"
      );
      // est CT: continuare buc_est până la palier (închidere exterioară est CT)
      pushStructWall(
        "subsol_zid_ct_est",
        thickX0p,
        30,
        shaftWest,
        Math.max(0, landY0 - shaftNorthTh - 30),
        `CT est ${shaftWest} cm (=buc_est)`
      );
      // CT | depozit+hol — cu gol ușă
      {
        const yWall = 430 - wallT / 2;
        if (doorCt) {
          const x0 = 30;
          const xD0 = doorCt.x;
          const xD1 = doorCt.x + doorCt.dx;
          const x1 = 30 + 505;
          pushWallFull("subsol_zid_ct_sud_w", x0, yWall, Math.max(0, xD0 - x0), wallT);
          pushWallFull("subsol_zid_ct_sud_e", xD1, yWall, Math.max(0, x1 - xD1), wallT);
          pushDoorOpening(doorCt);
        } else {
          pushWallFull("subsol_zid_ct_sud", 30, yWall, 505, wallT);
        }
      }
      // depozit | hol — cu gol ușă
      {
        const xWall = 350 - wallT / 2;
        if (doorDep) {
          const y0 = 430;
          const yD0 = doorDep.y;
          const yD1 = doorDep.y + doorDep.dy;
          const y1 = 630;
          pushWallFull("subsol_zid_dep_hol_n", xWall, y0, wallT, Math.max(0, yD0 - y0));
          pushWallFull("subsol_zid_dep_hol_s", xWall, yD1, wallT, Math.max(0, y1 - yD1));
          pushDoorOpening(doorDep);
        } else {
          pushWallFull("subsol_zid_dep_hol", xWall, 430, wallT, 200);
        }
      }
      // hol est = fața vest a zidului gros de puț (nu perete 12.5 duplicat pe X535)
      // segmente hol–puț N/S de ușă sunt modelate pe zidul gros (subsol_put_zid_w_*)
      // Pardoseală continuă hol → prag ușă → podest (același plan −250)
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

      // Planșeu / intrados — gol pe puțul sub rampă 2 (scară beci deschisă)
      meshes.push({
        id: "subsol_intrados_placa",
        type: "extrude",
        polygon: rectPoly(0, 0, v47.envelope_cm.ew, v47.envelope_cm.ns),
        holes: bm.open_shaft_under_ramp2 ? [shaftHole] : [],
        z0_m: zSoffit,
        z1_m: zSoffit + m(lv.floor_slab_th_cm ?? 15),
        color: "#8b8680",
        opacity: 0.4,
        site_layer: "structura",
        label: "intrados planșeu parter (gol sub r2)",
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
          color: "#a8a296",
          opacity: 0.97,
          site_layer: layer || "structura",
          label,
        });
      }

      // —— VEST GROS (continuare buc_est) pe tot puțul Y520→860 + gol ușă Y530–600
      {
        const y0 = shaftY0;
        const doorY0 = dr?.y ?? 530;
        const doorY1 = doorY0 + (dr?.dy ?? 70);
        // gol pe TOATĂ lățimea ușii — fără clamp la vechiul shaftY0=590
        const d0 = doorY0;
        const d1 = doorY1;
        if (d0 > y0) {
          pushWallSeg(
            "subsol_put_zid_w_gros_n",
            thickX0,
            thickDx,
            y0,
            d0 - y0,
            zB,
            zShaftTop,
            `zid gros ${thickDx} cm W N de ușă`,
            null
          );
        }
        if (d1 < shaftYHouse1) {
          pushWallSeg(
            "subsol_put_zid_w_gros_s",
            thickX0,
            thickDx,
            d1,
            shaftYHouse1 - d1,
            zB,
            zShaftTop,
            `zid gros ${thickDx} cm W S de ușă`,
            null
          );
        }
        if (d1 > d0) {
          pushWallSeg(
            "subsol_put_zid_w_buiandrug",
            thickX0,
            thickDx,
            d0,
            d1 - d0,
            zB + doorH,
            zB + doorH + doorLintel,
            `buiandrug ușă hol→puț Y${d0}–${d1} (gol ${dr?.opening_h_cm ?? 200}+${dr?.lintel_reserve_cm ?? 15})`,
            null
          );
        }
        if (shaftYWell1 > shaftYHouse1) {
          pushWallSeg(
            "subsol_fantana_zid_w_gros",
            thickX0,
            thickDx,
            shaftYHouse1,
            shaftYWell1 - shaftYHouse1,
            zB,
            zWellTop,
            "zid gros vest fântână (=buc_est)",
            "curte"
          );
        }
      }

      // —— EST din JSON (15 cm studiu) — pe puț + fântână până la noul capăt
      pushWallSeg(
        "subsol_put_zid_e_subtire",
        thinEX0,
        thinEDx,
        shaftY0,
        shaftYWell1 - shaftY0,
        zB,
        zWellTop,
        `zid EST ${thinEDx} cm (JSON shaft_east)`,
        "curte"
      );

      // —— NORD puț = N de palierul jos (nu mai blochează Y590)
      pushWallSeg(
        "subsol_put_zid_n",
        thickX0,
        thinEX0 + thinEDx - thickX0,
        shaftY0 - shaftNorthTh,
        shaftNorthTh,
        zB,
        zNorthTop,
        `zid puț N @ Y${shaftY0 - shaftNorthTh}–${shaftY0} (palier liber S)`,
        null
      );

      // Reazem planșeu la Y590 (sud zonă acoperită / nord puț deschis)
      if (bm.slab_coordination_cm?.edge_beam_y != null) {
        const by = bm.slab_coordination_cm.edge_beam_y;
        meshes.push({
          id: "subsol_grindă_planșeu_y590",
          type: "extrude",
          polygon: rectPoly(thickX0, by - 15, thinEX0 + thinEDx - thickX0, 15),
          z0_m: zSoffit - 0.25,
          z1_m: zSoffit,
          color: "#6a6358",
          site_layer: "structura",
          label: "grindă reazem planșeu @ Y590 (studiu)",
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
            site_layer: "curte",
            label: `treaptă ${i + 1}/${nRisers} curte engleză z=${zTopCm.toFixed(1)} Y${yS}–${yS + stepDy}`,
          });
          meshes.push({
            id: `subsol_racord_riser_${i}`,
            type: "extrude",
            polygon: rectPoly(stepX, yS + stepDy - 6, stepDx, 6),
            z0_m: zTop - m(riserCm),
            z1_m: zTop,
            color: "#c4b496",
            site_layer: "curte",
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

      // Straturi intrados −30 → FF parter +32 (modelate, nu doar scădere)
      const sandwich = bm.floor_sandwich_cm || abs.floor_sandwich_cm || [];
      for (const layer of sandwich) {
        if (!(layer.th_cm > 0)) continue;
        meshes.push({
          id: `sandwich_${layer.id}`,
          type: "extrude",
          polygon: rectPoly(0, 0, ewCm, nsCm),
          holes: bm.open_shaft_under_ramp2 ? [shaftHole] : [],
          z0_m: m(layer.z0_cm),
          z1_m: m(layer.z1_cm),
          color: layer.color || "#b0a090",
          opacity: 0.35,
          label: `sandwich ${layer.id} ${layer.th_cm} cm`,
        });
      }

      // Fundație pe BETON: termosistem 8+2 = 10 cm ÎN AFARA liniei de talpă.
      // Fața finită anvelopă ≠ fața pe care stă fundația.
      const termoOut = th.foundation_thermosystem_outside_cm ?? 10;
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
        note: "talpă beton; 8+2 în afara fundației",
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

  const isStudyA1 = (v47.meta?.study_variant === "A1") || inputRel.includes("a1_study");
  const absD = v47.basement_cm?.absolute_from_grade_cm;

  // —— Audit fundație: talpă beton (finit − termosistem + mică ieșire), nu +15 peste finit
  const thFound = v47.basement_cm?.wall_thickness_study_cm || {};
  const termoOutA = thFound.foundation_thermosystem_outside_cm ?? 10;
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
      id: isStudyA1 ? "volume_v47_a1_study" : "volume_v47_exact",
      generated: new Date().toISOString(),
      status: isStudyA1 ? "3D_STUDIU_A1" : "3D_EXACT_V47",
      source_plan: inputRel,
      based_on: isStudyA1 ? "v47_exact (referință neatinsă)" : "v46_exact r7g",
      study_variant: isStudyA1 ? "A1" : undefined,
      levels_note: "subsol (L-1) + parter + etaj",
      warning: isStudyA1
        ? `STUDIU A1: datum absolut teren=0. Clear ${absD?.clear_height_cm ?? 220} (ușă ${absD?.door_to_rooms_opening_h_cm ?? 200}+buiandrug ${absD?.door_lintel_reserve_cm ?? 15}). Referință v47_exact neatinsă. Nu autorizabil.`
        : "V47 concept: FF=față sus. Subsol scară −95→−250. Clear subsol 208→soffit −42 (ipoteză). Nu autorizabil / nu verificat structural. Elevație +32=ipoteză.",
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
      foundation_model: "beton; termosistem 8+2 în afara talpii",
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
      walls: "ext 30 / int 12.5 / palier 12.5 neconfirmat",
      levels: "L-1 subsol + P + E; FF→FF 288 cm; subsol clear 208 cm (ipoteză soffit −42)",
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

  if (outVolRel === "viewer/data/volume_v47.json") {
    write("outputs/plans/04_volume_concept_v47.json", volume);
  } else {
    write("outputs/plans/04_volume_concept_v47_a1_study.json", volume);
  }
  write(outVolRel, volume);
  if (outVolRel !== "viewer/data/volume_v47.json") {
    console.log(`[build_v47_3d] study volume → ${outVolRel}`);
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
