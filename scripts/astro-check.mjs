import { spawnSync } from "node:child_process";
import path from "node:path";

const astroBin = path.join(
  process.cwd(),
  "node_modules",
  "astro",
  "bin",
  "astro.mjs",
);

const result = spawnSync(
  process.execPath,
  [astroBin, "check", ...process.argv.slice(2)],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      ASTRO_TELEMETRY_DISABLED: "1",
    },
  },
);

process.exit(result.status ?? 1);
