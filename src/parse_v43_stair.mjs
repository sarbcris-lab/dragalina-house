/** Extrage din audit SVG cotele rampei (cm). */
import fs from "node:fs";

const html = fs.readFileSync(new URL("../inputs/Audit_V43_dimensiuni_si_cazare.html", import.meta.url), "utf8");
const ox = 105;
const oy = 170;
const s = 0.95; // px/cm

function toCm(x, y, w, h) {
  return {
    x: +((x - ox) / s).toFixed(1),
    y: +((y - oy) / s).toFixed(1),
    dx: +(w / s).toFixed(1),
    dy: +(h / s).toFixed(1),
  };
}

const rects = [...html.matchAll(/<rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/g)].map((m) => ({
  x: +m[1],
  y: +m[2],
  w: +m[3],
  h: +m[4],
}));

// zona sud scară (sub gabarit ~ y svg 841+)
const south = rects
  .filter((r) => r.y >= 840 && r.x >= 400 && r.w > 40 && r.h > 40)
  .map((r) => ({ svg: r, cm: toCm(r.x, r.y, r.w, r.h) }));

console.log(JSON.stringify(south, null, 2));
