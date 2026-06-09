import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const prettierExtensions = new Set([
  ".astro",
  ".css",
  ".cjs",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mdx",
  ".mjs",
  ".scss",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);

const staged = spawnSync(
  "git",
  [
    "-c",
    `safe.directory=${process.cwd().replaceAll("\\", "/")}`,
    "diff",
    "--cached",
    "--name-only",
    "--diff-filter=ACMR",
    "-z",
  ],
  { encoding: "utf8" },
);

if (staged.status !== 0) {
  process.stderr.write(staged.stderr ?? "");
  process.exit(staged.status ?? 1);
}

const files = staged.stdout
  .split("\0")
  .filter(Boolean)
  .filter((file) => prettierExtensions.has(path.extname(file)))
  .filter((file) => fs.existsSync(file));

if (files.length === 0) {
  console.log("No staged files need Prettier checks.");
  process.exit(0);
}

const prettierBin = path.join(
  process.cwd(),
  "node_modules",
  "prettier",
  "bin",
  "prettier.cjs",
);

const result = spawnSync(process.execPath, [prettierBin, "-c", ...files], {
  stdio: "inherit",
});

process.exit(result.status ?? 1);
