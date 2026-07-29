#!/usr/bin/env node
import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const svg = fs.readFileSync(path.join(dir, "projects.svg"));
const png = new Resvg(svg, { fitTo: { mode: "width", value: 2360 } }).render().asPng();
fs.writeFileSync(path.join(dir, "projects.png"), png);
console.log("ok projects.png", png.length);
