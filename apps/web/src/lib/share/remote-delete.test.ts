import { describe, expect, it } from "vitest";
import { ApiRequestError } from "@/lib/api-errors";
import { isRemoteShareGone } from "./share-gone";

describe("isRemoteShareGone", () => {
  it("is true for HTTP 404", () => {
    expect(isRemoteShareGone(new ApiRequestError("http", "Share not found.", 404))).toBe(
      true,
    );
  });

  it("is false for other errors", () => {
    expect(isRemoteShareGone(new ApiRequestError("http", "nope", 401))).toBe(false);
    expect(isRemoteShareGone(new Error("Share not found."))).toBe(false);
  });
});
