import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));

const jobs = [
  ["visual-map.svg", "visual-map.png", 2360],
  ["projects.svg", "projects.png", 2360],
  ["neofetch.svg", "neofetch.png", 1960],
];

for (const [src, dest, w] of jobs) {
  const svg = fs.readFileSync(path.join(dir, src));
  const png = new Resvg(svg, { fitTo: { mode: "width", value: w } }).render().asPng();
  fs.writeFileSync(path.join(dir, dest), png);
  console.log("ok", dest, png.length);
}
