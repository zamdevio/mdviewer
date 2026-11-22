import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password hash/verify", () => {
  it("round-trips a password", async () => {
    const hash = await hashPassword("correct-horse");
    expect(hash.startsWith("pbkdf2-sha256:")).toBe(true);
    expect(await verifyPassword("correct-horse", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("rejects missing or malformed stored hash", async () => {
    expect(await verifyPassword("x", null)).toBe(false);
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
  });
});
