import assert from "node:assert/strict";
import { test } from "node:test";
import dateFormat from "../src/lib/utils/dateFormat.ts";

test("發布與更新日期固定依臺北時區顯示，不受建置時區影響", () => {
  const originalTZ = process.env.TZ;
  try {
    for (const zone of ["UTC", "America/Los_Angeles", "Asia/Taipei"]) {
      process.env.TZ = zone;
      const cases = [
        ["2026-10-29T00:00:00+08:00", "29 Oct, 2026"],
        ["2026-10-29T23:59:00+08:00", "29 Oct, 2026"],
        ["2026-10-28", "28 Oct, 2026"],
        ["2026-12-31T16:00:00Z", "01 Jan, 2027"],
        ["2024-02-28T16:00:00Z", "29 Feb, 2024"],
      ];
      for (const [input, expected] of cases) {
        assert.equal(dateFormat(input), expected, `${zone}: ${input}`);
        assert.equal(dateFormat(new Date(input)), expected, `${zone}: Date`);
      }
      assert.throws(() => dateFormat("invalid date"), RangeError);
    }
  } finally {
    if (originalTZ === undefined) delete process.env.TZ;
    else process.env.TZ = originalTZ;
  }
});
