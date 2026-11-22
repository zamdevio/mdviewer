import { describe, expect, it } from "vitest";
import {
  TTL_DEFAULT_SECONDS,
  TTL_MAX_SECONDS,
  TTL_MIN_SECONDS,
  clampTtlSeconds,
  expiresAtFromTtl,
  isExpired,
} from "./ttl";

describe("clampTtlSeconds", () => {
  it("defaults when nullish", () => {
    expect(clampTtlSeconds(null)).toBe(TTL_DEFAULT_SECONDS);
    expect(clampTtlSeconds(undefined)).toBe(TTL_DEFAULT_SECONDS);
    expect(clampTtlSeconds(Number.NaN)).toBe(TTL_DEFAULT_SECONDS);
  });

  it("clamps to min/max", () => {
    expect(clampTtlSeconds(1)).toBe(TTL_MIN_SECONDS);
    expect(clampTtlSeconds(TTL_MAX_SECONDS + 100)).toBe(TTL_MAX_SECONDS);
    expect(clampTtlSeconds(3600)).toBe(3600);
  });
});

describe("expiresAt / isExpired", () => {
  it("sets wipe time from now + ttl", () => {
    const from = new Date("2026-01-01T00:00:00.000Z");
    const expires = expiresAtFromTtl(60, from);
    expect(expires).toBe("2026-01-01T00:01:00.000Z");
  });

  it("detects expiry", () => {
    expect(isExpired("2000-01-01T00:00:00.000Z", new Date("2026-01-01"))).toBe(
      true,
    );
    expect(isExpired("2099-01-01T00:00:00.000Z", new Date("2026-01-01"))).toBe(
      false,
    );
  });
});
