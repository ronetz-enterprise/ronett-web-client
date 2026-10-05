// Garde-fou du budget couleur (docs/frontend-refonte-plan.md §2).
// Les sélecteurs d'attribut ([stroke='#ccc']) qui neutralisent les couleurs par défaut d'une librairie sont permis.
// Échoue sur toute couleur hors tokens du thème : palette Tailwind nommée, hexadécimal, oklch/rgb/hsl en dur.
/* global console, process */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = "src";
const THEME = join("src", "app", "styles", "app.css");
const PALETTE =
  "red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone";
const RULES = [
  {
    name: "couleur Tailwind nommée",
    re: new RegExp(
      `\\b(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|divide|shadow|accent|caret)-(?:${PALETTE})-\\d{2,3}\\b`,
      "g",
    ),
  },
  {
    name: "couleur hexadécimale",
    re: /(?<![\w&]|='|=")#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b(?![\w-])/g,
  },
  { name: "fonction couleur en dur", re: /\b(?:oklch|rgba?|hsla?)\(/g },
];

function files(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(tsx?|css)$/.test(name) && !/\.test\.tsx?$/.test(name)
      ? [path]
      : [];
  });
}

const problems = [];
for (const file of files(ROOT)) {
  if (file === THEME) continue;
  readFileSync(file, "utf8")
    .split("\n")
    .forEach((line, index) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
      for (const rule of RULES)
        for (const match of line.matchAll(rule.re))
          problems.push(
            `${relative(".", file)}:${index + 1}  ${rule.name} « ${match[0]} »`,
          );
    });
}

if (problems.length) {
  console.error(
    `Budget couleur : ${problems.length} couleur(s) hors thème. Utilisez les tokens (bg-primary/10, chart-1…5, success…).\n`,
  );
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("Budget couleur : aucune couleur hors thème.");
