import { describe, expect, it } from "vitest";
import {
  effectiveAllowedOrigins,
  parseAllowedOrigins,
  resolveRequestOrigins,
} from "./origins";
import type { Env } from "../env";

function env(origins: string): Env {
  return {
    ALLOWED_ORIGINS: origins,
    R2_BUCKET: {} as R2Bucket,
    RATE_LIMITER: {} as DurableObjectNamespace,
  };
}

describe("parseAllowedOrigins", () => {
  it("drops unexpanded Appflare placeholders", () => {
    expect(parseAllowedOrigins(env("{{appUrl}},https://a.example"))).toEqual([
      "https://a.example",
    ]);
  });
});

describe("effectiveAllowedOrigins", () => {
  it("always includes this Worker origin", () => {
    const req = new Request("https://mdviewer.example.workers.dev/api/health");
    const list = effectiveAllowedOrigins(
      env("http://127.0.0.1:8787"),
      req,
    );
    expect(list).toContain("https://mdviewer.example.workers.dev");
    expect(list).toContain("http://127.0.0.1:8787");
  });
});

describe("resolveRequestOrigins", () => {
  it("prefers same-origin browser Origin for Appflare unified installs", () => {
    const req = new Request("https://app.workers.dev/api/upload", {
      headers: { Origin: "https://app.workers.dev" },
    });
    const r = resolveRequestOrigins(req, [
      "http://127.0.0.1:8787",
      "https://app.workers.dev",
    ]);
    expect(r.corsOrigin).toBe("https://app.workers.dev");
    expect(r.frontendOrigin).toBe("https://app.workers.dev");
  });
});
