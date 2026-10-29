import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  copyFileSync,
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const script = fileURLToPath(
  new URL("./check-push-translations.mjs", import.meta.url),
);
const zero = "0".repeat(40);

test("檢查推送的 commit，並支援新分支、多個分支及刪除分支", () => {
  const fixture = mkdtempSync(path.join(os.tmpdir(), "blog-pre-push-"));
  const repo = path.join(fixture, "checkout");
  const remote = path.join(fixture, "remote.git");
  mkdirSync(repo);
  const runGit = (...args) =>
    spawnSync(
      "git",
      ["-c", `safe.directory=${repo.replaceAll("\\", "/")}`, ...args],
      { cwd: repo, encoding: "utf8" },
    );
  const git = (...args) => {
    const result = runGit(...args);
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  const push = (input) =>
    spawnSync(process.execPath, [script], {
      cwd: repo,
      input,
      encoding: "utf8",
    });
  const update = (sha, ref = "refs/heads/main", remote = zero) =>
    `${ref} ${sha} ${ref} ${remote}\n`;
  const write = (relative) => {
    const file = path.join(repo, relative);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, "---\ntitle: Example\n---\nExample\n");
  };
  const zh = "src/content/posts/巢狀目錄/example.mdx";
  const en = "src/content/posts-en/巢狀目錄/example.mdx";

  try {
    git("init", "--quiet");
    git("config", "user.name", "Hook Test");
    git("config", "user.email", "hook-test@example.invalid");
    git("config", "core.hooksPath", ".githooks");
    mkdirSync(path.join(repo, ".githooks"));
    mkdirSync(path.join(repo, "scripts"));
    const hook = path.join(repo, ".githooks/pre-push");
    copyFileSync(
      fileURLToPath(new URL("../.githooks/pre-push", import.meta.url)),
      hook,
    );
    chmodSync(hook, 0o755);
    copyFileSync(
      script,
      path.join(repo, "scripts/check-push-translations.mjs"),
    );
    git("init", "--bare", "--quiet", remote);
    write(zh);
    git("add", ".");
    git(
      "-c",
      "core.hooksPath=.no-hooks",
      "commit",
      "--quiet",
      "-m",
      "中文文章",
    );
    const untranslated = git("rev-parse", "HEAD");
    let result = push(update(untranslated));
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes(en));
    result = runGit("push", remote, `${untranslated}:refs/heads/main`);
    assert.notEqual(result.status, 0, "Git push 必須實際被 hook 攔下");
    assert.ok(result.stderr.includes(en), result.stderr);
    assert.equal(git("--git-dir", remote, "for-each-ref"), "");

    write(en);
    result = push(update(untranslated));
    assert.equal(result.status, 1, "工作目錄的翻譯不應算進推送版本");
    git("add", ".");
    assert.equal(
      push(update(untranslated)).status,
      1,
      "僅暫存翻譯仍應阻止推送",
    );
    git(
      "-c",
      "core.hooksPath=.no-hooks",
      "commit",
      "--quiet",
      "-m",
      "補齊英文",
    );
    const translated = git("rev-parse", "HEAD");
    assert.equal(push(update(translated)).status, 0, "新分支應檢查最終版本");
    assert.equal(push(update(translated, "HEAD", untranslated)).status, 0);
    git("push", remote, `${translated}:refs/heads/main`);
    assert.equal(
      git("--git-dir", remote, "rev-parse", "refs/heads/main"),
      translated,
    );
    assert.equal(push(update(zero)).status, 0, "刪除分支不需配對檢查");
    assert.equal(push("").status, 0, "沒有推送內容時不需檢查");
    assert.equal(
      push(update(translated) + update(untranslated, "refs/heads/other"))
        .status,
      1,
    );

    rmSync(path.join(repo, zh));
    git("add", ".");
    git(
      "-c",
      "core.hooksPath=.no-hooks",
      "commit",
      "--quiet",
      "-m",
      "移除中文",
    );
    result = push(update(git("rev-parse", "HEAD")));
    assert.equal(result.status, 1, "也應攔住缺少中文版的英文文章");
    assert.ok(result.stderr.includes(zh));
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
