import { describe, expect, it } from "vitest";
import { HERMES_CORE_VERSION } from "../src/index.js";

describe("sanity", () => {
  it("exports version constant", () => {
    expect(HERMES_CORE_VERSION).toBe("0.0.0");
  });
});
