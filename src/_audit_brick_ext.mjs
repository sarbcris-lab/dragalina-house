import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const svg = fs.readFileSync(path.join(root, "outputs/plans/a1_plan_parter.svg"), "utf8");
const re = /<rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)" fill="url\(#patBrick\)"/g;
const padL = 88;
const padT = 72;
const sc = 1.05;
let m;
const out = [];
while ((m = re.exec(svg))) {
  const x = (+m[1] - padL) / sc;
  const y = (+m[2] - padT) / sc;
  const dx = +m[3] / sc;
  const dy = +m[4] / sc;
  if (dx < 5 && dy < 5) continue;
  // brick on exterior face = starts within ~2cm of finished 0 / EW / NS
  const onExtFace =
    (dy >= 15 && (y < 2 || y + dy > 858)) || (dx >= 15 && (x < 2 || x + dx > 678));
  const cornerPocket = x < 12 || x + dx > 668 || y < 12 || y + dy > 848;
  out.push({
    tag: onExtFace ? "ON_EXT_FACE" : cornerPocket ? "CORNER_ZONE" : "ok",
    x: +x.toFixed(1),
    y: +y.toFixed(1),
    dx: +dx.toFixed(1),
    dy: +dy.toFixed(1),
  });
}
console.log(JSON.stringify(out, null, 2));
console.log(
  "ON_EXT_FACE count",
  out.filter((o) => o.tag === "ON_EXT_FACE").length,
  "CORNER_ZONE",
  out.filter((o) => o.tag === "CORNER_ZONE").length
);
