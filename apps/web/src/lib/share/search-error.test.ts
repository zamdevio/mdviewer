import { describe, expect, it } from "vitest";
import { ApiRequestError } from "@/lib/api-errors";
import { classifySearchError } from "./search-error";

describe("classifySearchError", () => {
  it("routes 401 to the password branch", () => {
    expect(classifySearchError(new ApiRequestError("http", "password required", 401))).toBe(
      "password",
    );
  });

  it("routes 404 to the missing branch", () => {
    expect(classifySearchError(new ApiRequestError("http", "not found", 404))).toBe("missing");
  });

  it("routes everything else to other", () => {
    expect(classifySearchError(new ApiRequestError("http", "boom", 500))).toBe("other");
    expect(classifySearchError(new ApiRequestError("network", "offline"))).toBe("other");
    expect(classifySearchError(new Error("plain"))).toBe("other");
    expect(classifySearchError(null)).toBe("other");
    expect(classifySearchError(undefined)).toBe("other");
  });
});
