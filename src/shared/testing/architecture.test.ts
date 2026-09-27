import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import ts from "typescript";
import { expect, it } from "vitest";
function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(resolve(dir, entry.name))
      : /\.tsx?$/.test(entry.name) && !/\.test\./.test(entry.name)
        ? [resolve(dir, entry.name)]
        : [],
  );
}
it("enforces resolved architecture boundaries, including relative imports", () => {
  const violations: string[] = [];
  for (const file of files("src")) {
    const source = relative(resolve("src"), file).split("/");
    const ast = ts.createSourceFile(
      file,
      readFileSync(file, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    for (const node of ast.statements) {
      if (
        !ts.isImportDeclaration(node) ||
        !ts.isStringLiteral(node.moduleSpecifier)
      )
        continue;
      const specifier = node.moduleSpecifier.text;
      const targetPath = specifier.startsWith("@/")
        ? resolve("src", specifier.slice(2))
        : specifier.startsWith(".")
          ? resolve(dirname(file), specifier)
          : undefined;
      if (!targetPath) continue;
      const target = relative(resolve("src"), targetPath).split("/");
      if (
        source[0] === "shared" &&
        ["app", "pages", "features"].includes(target[0])
      )
        violations.push(file + " -> " + specifier);
      if (source[0] === "features" && ["app", "pages"].includes(target[0]))
        violations.push(file + " -> " + specifier);
      if (
        source[0] === "features" &&
        target[0] === "features" &&
        target[1] !== source[1] &&
        target.length > 2
      )
        violations.push(file + " -> " + specifier);
      if (source[0] === "pages" && target[0] === "app")
        violations.push(file + " -> " + specifier);
    }
    if (source[0] === "features" && source.includes("pages"))
      violations.push(file);
  }
  expect(violations).toEqual([]);
});
