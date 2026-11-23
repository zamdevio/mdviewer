import { describe, expect, it } from "vitest";
import { ROTATE_MANAGE_MAX_IDS } from "./config";
import { hashPassword } from "./password";
import {
  applyManageRotate,
  assertRotateRequest,
} from "./rotate-manage";
import type { ShareMetadata } from "./share-store";

function meta(partial: Partial<ShareMetadata> & { id: string }): ShareMetadata {
  return {
    type: "file",
    filename: "content.md",
    contentType: "text/plain",
    size: 1,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    manageTokenHash: "pending",
    passwordHash: null,
    viewProtected: false,
    protocol: 3,
    ...partial,
  };
}

describe("assertRotateRequest", () => {
  it("rejects over cap", () => {
    const ids = Array.from({ length: ROTATE_MANAGE_MAX_IDS + 1 }, (_, i) =>
      String(i),
    );
    const result = assertRotateRequest(ids, "new-token");
    expect("error" in result).toBe(true);
  });

  it("accepts at cap", () => {
    const ids = Array.from({ length: ROTATE_MANAGE_MAX_IDS }, (_, i) =>
      String(i),
    );
    const result = assertRotateRequest(ids, "new-token");
    expect("error" in result).toBe(false);
  });
});

describe("applyManageRotate", () => {
  it("writes the same newHash to every success (hash-once)", async () => {
    const oldHash = await hashPassword("old-token");
    const newHash = await hashPassword("new-token");
    const a = meta({ id: "a", manageTokenHash: oldHash });
    const b = meta({ id: "b", manageTokenHash: oldHash });
    const { toWrite, failed } = await applyManageRotate({
      metas: [
        { id: "a", meta: a },
        { id: "b", meta: b },
        { id: "missing", meta: null },
      ],
      oldToken: "old-token",
      newHash,
    });
    expect(failed).toEqual([{ id: "missing", error: "not_found" }]);
    expect(toWrite).toHaveLength(2);
    expect(toWrite[0].manageTokenHash).toBe(newHash);
    expect(toWrite[1].manageTokenHash).toBe(newHash);
    expect(toWrite[0].manageTokenHash).toBe(toWrite[1].manageTokenHash);
  });

  it("fails unauthorized when old token does not match", async () => {
    const oldHash = await hashPassword("old-token");
    const newHash = await hashPassword("new-token");
    const { toWrite, failed } = await applyManageRotate({
      metas: [{ id: "a", meta: meta({ id: "a", manageTokenHash: oldHash }) }],
      oldToken: "wrong",
      newHash,
    });
    expect(toWrite).toHaveLength(0);
    expect(failed).toEqual([{ id: "a", error: "unauthorized" }]);
  });
});
