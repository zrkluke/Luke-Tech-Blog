import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const roots = ["src/content/posts/", "src/content/posts-en/"];
const updates = readFileSync(0, "utf8").trim();
const checked = new Set();
let failed = false;

for (const update of updates ? updates.split(/\r?\n/) : []) {
  const [localRef, localSha] = update.split(/\s+/);
  if (/^0+$/.test(localSha) || checked.has(localSha)) continue;
  checked.add(localSha);

  const result = spawnSync(
    "git",
    [
      "-c",
      `safe.directory=${process.cwd().replaceAll("\\", "/")}`,
      "ls-tree",
      "-r",
      "--name-only",
      "-z",
      localSha,
      "--",
      ...roots,
    ],
    { encoding: "utf8" },
  );
  if (result.status !== 0) {
    console.error(`無法讀取推送版本：${localRef}`);
    console.error(result.stderr || result.error?.message || "Git 執行失敗");
    process.exit(1);
  }

  const files = new Set(
    result.stdout.split("\0").filter((file) => /\.(md|mdx)$/.test(file)),
  );
  for (const file of files) {
    const language = file.startsWith(roots[0]) ? 0 : 1;
    const counterpart =
      roots[1 - language] + file.slice(roots[language].length);
    if (files.has(counterpart)) continue;
    failed = true;
    console.error(`${localRef} 缺少對應文章：${counterpart}`);
  }
}

if (failed) {
  console.error("已中止推送。請補齊中英文文章並提交；未提交的檔案不會被推送。");
  process.exit(1);
}

console.log("中英文文章配對檢查通過。");
