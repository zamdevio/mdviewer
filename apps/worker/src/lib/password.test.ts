import { describe, expect, it } from "vitest";
import {
  hashPassword,
  readManageToken,
  readSharePassword,
  requireManageToken,
  verifyPassword,
} from "./password";

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

describe("readManageToken", () => {
  it("prefers Authorization Bearer over X-Share-Manage-Token", () => {
    const req = new Request("https://api.example/upload", {
      headers: {
        Authorization: "Bearer from-bearer",
        "X-Share-Manage-Token": "from-header",
      },
    });
    expect(readManageToken(req)).toBe("from-bearer");
  });

  it("falls back to X-Share-Manage-Token", () => {
    const req = new Request("https://api.example/upload", {
      headers: { "X-Share-Manage-Token": "from-header" },
    });
    expect(readManageToken(req)).toBe("from-header");
  });

  it("returns null when missing", () => {
    expect(readManageToken(new Request("https://api.example/upload"))).toBe(
      null,
    );
  });
});

describe("requireManageToken", () => {
  it("401 when token missing", async () => {
    const hash = await hashPassword("secret");
    const err = await requireManageToken(
      hash,
      new Request("https://api.example/x"),
    );
    expect(err?.status).toBe(401);
  });

  it("401 when token wrong", async () => {
    const hash = await hashPassword("secret");
    const err = await requireManageToken(
      hash,
      new Request("https://api.example/x", {
        headers: { Authorization: "Bearer wrong" },
      }),
    );
    expect(err?.status).toBe(401);
  });

  it("403 when manageTokenHash missing", async () => {
    const err = await requireManageToken(
      null,
      new Request("https://api.example/x", {
        headers: { Authorization: "Bearer anything" },
      }),
    );
    expect(err?.status).toBe(403);
  });

  it("null when token matches", async () => {
    const hash = await hashPassword("secret");
    const err = await requireManageToken(
      hash,
      new Request("https://api.example/x", {
        headers: { Authorization: "Bearer secret" },
      }),
    );
    expect(err).toBeNull();
  });
});

describe("readSharePassword", () => {
  it("reads X-Share-Password only", () => {
    const req = new Request("https://api.example/share/1", {
      headers: { "X-Share-Password": "view-secret" },
    });
    expect(readSharePassword(req)).toBe("view-secret");
  });
});
