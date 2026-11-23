import { describe, expect, it } from "vitest";
import {
  FAIR_USE_AGENT_MAX_REQUESTS,
  FAIR_USE_MAX_REQUESTS,
  FAIR_USE_WINDOW_SECONDS,
  MAX_FILE_SIZE,
  ROTATE_MANAGE_MAX_IDS,
  TTL_DEFAULT_SECONDS,
  TTL_MAX_SECONDS,
  TTL_MIN_SECONDS,
} from "./config";

describe("config", () => {
  it("exposes protocol-3 operator caps", () => {
    expect(TTL_MIN_SECONDS).toBe(60);
    expect(TTL_DEFAULT_SECONDS).toBe(7 * 24 * 60 * 60);
    expect(TTL_MAX_SECONDS).toBe(30 * 24 * 60 * 60);
    expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
    expect(ROTATE_MANAGE_MAX_IDS).toBe(50);
    expect(FAIR_USE_WINDOW_SECONDS).toBe(60);
    expect(FAIR_USE_MAX_REQUESTS).toBe(10);
    expect(FAIR_USE_AGENT_MAX_REQUESTS).toBe(3);
  });
});
