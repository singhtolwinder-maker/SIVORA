import { it } from "node:test";
import assert from "node:assert/strict";

it("rejects a wildcard CLIENT_ORIGINS setting", async () => {
  const previousOrigins = process.env.CLIENT_ORIGINS;
  process.env.CLIENT_ORIGINS = "*";

  try {
    await assert.rejects(
      import("../src/config/env.js?wildcard-origin-test"),
      /wildcard origins are not allowed/,
    );
  } finally {
    if (previousOrigins === undefined) delete process.env.CLIENT_ORIGINS;
    else process.env.CLIENT_ORIGINS = previousOrigins;
  }
});
