import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceDir = path.join(root, ".skills");
const targetDirs = [
  path.join(root, ".claude", "skills"),
  path.join(root, ".agents", "skills"),
];
const checkOnly = process.argv.includes("--check");
const expected = new Map();

for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const source = path.join(sourceDir, entry.name, "SKILL.md");
  if (!fs.existsSync(source)) continue;

  const content = fs.readFileSync(source, "utf8");
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (
    !frontmatter ||
    !/^name:\s*\S+/m.test(frontmatter[1]) ||
    !/^description:/m.test(frontmatter[1])
  ) {
    throw new Error(
      `${path.relative(root, source)} 必須包含 name 與 description frontmatter`,
    );
  }

  expected.set(
    entry.name,
    `---\n${frontmatter[1]}\n---\n\n# Canonical Skill\n\n完整 workflow 在 \`.skills/${entry.name}/SKILL.md\`。**先讀該檔，再依其步驟執行。**\n`,
  );
}

const stale = [];
for (const targetDir of targetDirs) {
  for (const [name, content] of expected) {
    const target = path.join(targetDir, name, "SKILL.md");
    if (fs.existsSync(target) && fs.readFileSync(target, "utf8") === content)
      continue;
    if (checkOnly) stale.push(path.relative(root, target));
    else {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, content);
    }
  }
}

if (stale.length > 0) {
  console.error(
    `需要同步 skill adapter：\n${stale.map((file) => `- ${file}`).join("\n")}`,
  );
  process.exit(1);
}

console.log(checkOnly ? "skill adapter 已同步" : "skill adapter 已產生");
