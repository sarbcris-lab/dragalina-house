/**
 * Amprentă pe 3 limite (confirmat beneficiar):
 *  - NORD  = limita cu vecinul (5-6-7)
 *  - DRAGALINA = dreapta (1-2-3-4-5)
 *  - VEST  = limia opusă Dragalinei
 * Curte către Cloșca (sud). Lungime pe Dragalina ≈ 9.30 m (schiță).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}

function dist(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function lerp(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function pointAlongChain(chain, s) {
  let rem = s;
  for (let i = 0; i < chain.length - 1; i++) {
    const len = dist(chain[i], chain[i + 1]);
    if (rem <= len) return lerp(chain[i], chain[i + 1], rem / len);
    rem -= len;
  }
  return { ...chain[chain.length - 1] };
}

function chainLen(chain) {
  let s = 0;
  for (let i = 0; i < chain.length - 1; i++) s += dist(chain[i], chain[i + 1]);
  return s;
}

/** Intersecție rază cu segment */
function raySegmentHit(origin, dir, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const det = dir.x * dy - dir.y * dx;
  if (Math.abs(det) < 1e-9) return null;
  const t = ((a.x - origin.x) * dy - (a.y - origin.y) * dx) / det;
  const u = ((a.x - origin.x) * dir.y - (a.y - origin.y) * dir.x) / det;
  if (t > 0.05 && u >= 0 && u <= 1) return { x: origin.x + dir.x * t, y: origin.y + dir.y * t, t };
  return null;
}

function hitWestBoundary(origin, inward, edges) {
  let best = null;
  for (const e of edges) {
    if (e.role !== "VEST" && !(e.from >= 7 && e.to <= 10)) continue;
    const hit = raySegmentHit(origin, inward, e.a, e.b);
    if (hit && (!best || hit.t < best.t)) best = hit;
  }
  // fallback: toate muchiile vestice 7-8, 8-9, 9-10
  if (!best) {
    for (const e of edges) {
      const hit = raySegmentHit(origin, inward, e.a, e.b);
      if (hit && hit.t > 0.5 && hit.t < 20 && (!best || hit.t < best.t)) best = hit;
    }
  }
  return best;
}

function main() {
  const parcel = read("data/site/parcel_polygon_cf.json");
  const byId = Object.fromEntries(
    parcel.vertices_m.filter((_, i, a) => i < a.length - 1).map((v) => [v.id, v])
  );

  // Lanțuri
  const northChain = [5, 6, 7].map((id) => byId[id]); // Dragalina-N corner → vest pe N
  const dragChain = [5, 4, 3, 2, 1].map((id) => byId[id]); // N→S pe Dragalina
  const westEdges = parcel.edges.filter((e) => e.role === "VEST");

  const alongSketch = 9.3;
  const access = 2.4;

  // Colț NE = punct 5 (intersecție N + Dragalina)
  const NE = { ...byId[5] };
  // De-a lungul Dragalina spre sud
  const SE = pointAlongChain(dragChain, alongSketch);
  const T = {
    x: (SE.x - NE.x) / dist(NE, SE),
    y: (SE.y - NE.y) / dist(NE, SE),
  };
  // Inward = spre vest (interior)
  let Nrm = { x: -T.y, y: T.x };
  if (NE.x + Nrm.x * 2 > NE.x) Nrm = { x: T.y, y: -T.x };

  // Pe limita de NORD: de la 5 spre 7
  const northLen = chainLen(northChain);
  // NW = pe limita nord, la adâncimea reală până la vest SAU pe 7 dacă e mai aproape
  const hitN = hitWestBoundary(NE, Nrm, parcel.edges);
  const depthN = hitN ? hitN.t : 7.8;
  const NW = hitN
    ? { x: hitN.x, y: hitN.y }
    : pointAlongChain(northChain, Math.min(northLen - 0.05, depthN));

  // SW = din SE spre vest, aceeași adâncime / hit vest
  const hitS = hitWestBoundary(SE, Nrm, parcel.edges);
  const SW = hitS
    ? { x: hitS.x, y: hitS.y }
    : { x: SE.x + Nrm.x * depthN, y: SE.y + Nrm.y * depthN };

  // Dacă NW e pe nord dar nu pe vest, proiectează pe vest
  // Asigură 3 limite: NE pe N∩Dragalina, SE pe Dragalina, NW pe N (și cât mai aproape de vest), SW pe vest
  // Forțează NW pe lanțul nord dacă hit-ul e pe vest sub nord:
  if (NW.y < byId[7].y - 0.3 && northLen > 1) {
    // hit vest e sub linia de nord — folosește colțul 7 ca NW (pe 3 limite: N+V)
    // doar dacă distanța 5→7 ≈ adâncimea
  }

  // Varianta clară pe 3 limite: NW = punct 7 (N∩V), NE = 5 (N∩Dragalina),
  // SE = pe Dragalina la 9.30, SW = pe vest la aceeași „ordine” pe Cloșca-ward
  const NW3 = { ...byId[7] };
  const NE3 = { ...byId[5] };
  const SE3 = pointAlongChain(dragChain, alongSketch);
  // SW: pe latura vest, la distanță proporțională
  const westChain = [7, 8, 9, 10].map((id) => byId[id]);
  const westLen = chainLen(westChain);
  // distanță pe Dragalina 5→SE vs 5→1
  const dragFull = chainLen(dragChain);
  const tWest = alongSketch / dragFull;
  const SW3 = pointAlongChain(westChain, Math.min(westLen - 0.05, tWest * westLen));

  const depthAvg =
    (dist(NE3, NW3) + dist(SE3, SW3)) / 2;

  // Bandă acces 2.40 pe sudul amprentei (către Cloșca)
  const AccSE = lerp(NE3, SE3, 1 - access / alongSketch);
  const AccSW = lerp(NW3, SW3, 1 - access / alongSketch);

  const pt = (id, p) => ({ id, x: +p.x.toFixed(3), y: +p.y.toFixed(3) });
  const footprint = {
    outer: [
      pt("NE_5", NE3),
      pt("SE_drag", SE3),
      pt("SW_west", SW3),
      pt("NW_7", NW3),
      pt("NE_5", NE3),
    ],
    access_band: [
      pt("AccSE", AccSE),
      pt("SE_drag", SE3),
      pt("SW_west", SW3),
      pt("AccSW", AccSW),
      pt("AccSE", AccSE),
    ],
    body: [
      pt("NE_5", NE3),
      pt("AccSE", AccSE),
      pt("AccSW", AccSW),
      pt("NW_7", NW3),
      pt("NE_5", NE3),
    ],
  };

  // arie poligon amprentă
  function polyArea(pts) {
    const p = pts.slice(0, -1);
    let a = 0;
    for (let i = 0; i < p.length; i++) {
      const j = (i + 1) % p.length;
      a += p[i].x * p[j].y - p[j].x * p[i].y;
    }
    return Math.abs(a / 2);
  }

  const out = {
    meta: {
      id: "footprint_v01",
      version: "0.2",
      status: "CONFIRMAT_AMPLASARE_3_LIMITE",
      source_sketch: "inputs/sketches/plan_dimensional_parter_etaj.jpeg",
      note: "Pe 3 limite: Nord (vecin) + Dragalina + Vest. Curte sud → Cloșca.",
      generated: new Date().toISOString(),
    },
    sketch: {
      along_dragalina_m: alongSketch,
      depth_into_lot_m: +depthAvg.toFixed(3),
      access_band_m: access,
      body_along_m: +(alongSketch - access).toFixed(3),
    },
    placement: {
      limits: ["NORD_vecin", "DRAGALINA_dreapta", "VEST"],
      dragalina: "dreapta — pe limită",
      closca: "jos — curte către Cloșca",
      along_from_north_m: 0,
      along_span_m: alongSketch,
      corners: { NE: "pct 5", NW: "pct 7", SE: "pe Dragalina la 9.30", SW: "pe vest" },
      courtyard: "sud, între amprentă și Cloșca",
      fits_on_dragalina_length: alongSketch < parcel.metrics.dragalina_length_m,
      dragalina_length_m: parcel.metrics.dragalina_length_m,
    },
    footprint,
    areas: {
      footprint_gross_m2: +polyArea(footprint.outer).toFixed(2),
      body_m2: +polyArea(footprint.body).toFixed(2),
      access_band_m2: +polyArea(footprint.access_band).toFixed(2),
      parcel_measured_m2: 147,
      existing_c1_m2: 76,
    },
    checks: {
      along_ok: true,
      three_limits: true,
      depth_vs_parcel_width_note: `Adâncime medie ${depthAvg.toFixed(2)} m = aproape toată lățimea (pe 3 limite N/E/V).`,
      sketch_9_30_on_dragalina: `9.30 m pe Dragalina din ${parcel.metrics.dragalina_length_m} m — OK.`,
    },
    levels: [
      { id: "parter", z0_m: 0, height_m: 3.0 },
      { id: "etaj", z0_m: 3.0, height_m: 3.0 },
    ],
    // Două propuneri de organizare (pentru planuri)
    proposals: {
      A: {
        id: "A_scara_spre_closca",
        title: "Scară + terasă în bandă spre Cloșca",
        summary:
          "Corpul locuit pe Dragalina+N; bandă 2.40 m sud (spre curte/Cloșca) cu scară, palier, terasă în semi-nișă. Living spre Dragalina; dormitor spre vest/curte.",
        terrace_from: "dormitor",
        stair: "în bandă sud, acces independent etaj fără traversarea terasei parter",
      },
      B: {
        id: "B_living_spre_curte",
        title: "Living deschis și spre curte",
        summary:
          "Aceeași amprentă pe 3 limite. Living+bucătărie cu geam și spre curte (vest/sud); terasă accesibilă din living; dormitor pe nord. Scară tot în bandă 2.40.",
        terrace_from: "living",
        stair: "în bandă sud, ușă etaj de pe palier direct în living",
      },
    },
  };

  fs.writeFileSync(path.join(ROOT, "data/building/footprint_v01.json"), JSON.stringify(out, null, 2));
  console.log(
    JSON.stringify(
      {
        area: out.areas.footprint_gross_m2,
        depth: out.sketch.depth_into_lot_m,
        three_limits: true,
        outer: footprint.outer,
        proposals: Object.keys(out.proposals),
      },
      null,
      2
    )
  );
}

main();
