// Garde-fou de performance (docs/frontend-refonte-plan.md, Lot 9).
// Après `npm run build` : 1) Recharts ne fait pas partie du chargement initial ;
// 2) le chargement initial (entrée client et ses imports statiques) ne dépasse pas
// la référence enregistrée de plus de 10 %. `--update` réécrit la référence.
/* global console, process */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const assets = "build/client/assets";
const baselineFile = "scripts/bundle-baseline.json";
if (!existsSync(assets)) {
  console.error("Lancez d’abord `npm run build`.");
  process.exit(1);
}
const files = readdirSync(assets).filter((f) => f.endsWith(".js"));
const entry = files.find((f) => f.startsWith("entry.client-"));
const staticImports = (file) =>
  [
    ...readFileSync(join(assets, file), "utf8").matchAll(
      /(?:from|import)\s*"\.\/([\w.-]+\.js)"/g,
    ),
  ].map((m) => m[1]);

const initial = new Set();
const queue = [entry];
while (queue.length) {
  const file = queue.pop();
  if (!file || initial.has(file)) continue;
  initial.add(file);
  queue.push(...staticImports(file));
}
const size = [...initial].reduce(
  (total, file) => total + readFileSync(join(assets, file)).length,
  0,
);
const charts = [...initial].filter((file) =>
  /recharts|ResponsiveContainer/.test(readFileSync(join(assets, file), "utf8")),
);

let failed = false;
if (charts.length) {
  console.error(`Recharts est chargé au démarrage : ${charts.join(", ")}`);
  failed = true;
}
if (process.argv.includes("--update") || !existsSync(baselineFile)) {
  writeFileSync(
    baselineFile,
    JSON.stringify({ initialBytes: size }, null, 2) + "\n",
  );
  console.log(`Référence enregistrée : ${size} octets au chargement initial.`);
} else {
  const { initialBytes } = JSON.parse(readFileSync(baselineFile, "utf8"));
  const growth = (size - initialBytes) / initialBytes;
  console.log(
    `Chargement initial : ${size} octets (${(growth * 100).toFixed(1)} % vs référence).`,
  );
  if (growth > 0.1) {
    console.error(
      "Le chargement initial dépasse la référence de plus de 10 %.",
    );
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
