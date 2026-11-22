import { describe, expect, it } from "vitest";
import { getFairUseFingerprint, isAgentShapedRequest } from "./fair-use";

describe("isAgentShapedRequest", () => {
  it("flags mcp header and bot UAs", () => {
    expect(
      isAgentShapedRequest(
        new Request("https://x", { headers: { "X-MDViewer-Client": "mcp" } }),
      ),
    ).toBe(true);
    expect(
      isAgentShapedRequest(
        new Request("https://x", { headers: { "User-Agent": "curl/8.0" } }),
      ),
    ).toBe(true);
    expect(
      isAgentShapedRequest(
        new Request("https://x", {
          headers: { "User-Agent": "Mozilla/5.0 Chrome/120" },
        }),
      ),
    ).toBe(false);
  });
});

describe("getFairUseFingerprint", () => {
  it("includes ip + ua", () => {
    const fp = getFairUseFingerprint(
      new Request("https://x", {
        headers: {
          "CF-Connecting-IP": "1.2.3.4",
          "User-Agent": "TestAgent",
        },
      }),
    );
    expect(fp).toContain("1.2.3.4");
    expect(fp).toContain("TestAgent");
  });
});
