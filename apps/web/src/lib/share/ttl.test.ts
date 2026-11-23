import { describe, expect, it } from "vitest";
import {
  SHARE_TTL_MAX,
  SHARE_TTL_MIN,
  clampShareTtl,
  formatDurationHuman,
  generateSharePassword,
  parseDurationToSeconds,
  resolveShareTtlInput,
} from "./ttl";

describe("generateSharePassword", () => {
  it("returns requested length from the safe alphabet", () => {
    const s = generateSharePassword(24);
    expect(s).toHaveLength(24);
    expect(s).toMatch(/^[A-HJ-NP-Za-km-z2-9]+$/);
  });

  it("does not emit ambiguous 0/O/1/I/l", () => {
    const blob = Array.from({ length: 40 }, () => generateSharePassword(32)).join(
      "",
    );
    expect(blob).not.toMatch(/[0O1Il]/);
  });
});

describe("parseDurationToSeconds", () => {
  it("parses bare seconds and unit suffixes", () => {
    expect(parseDurationToSeconds("90")).toBe(90);
    expect(parseDurationToSeconds("90s")).toBe(90);
    expect(parseDurationToSeconds("5m")).toBe(300);
    expect(parseDurationToSeconds("60min")).toBe(3600);
    expect(parseDurationToSeconds("2h")).toBe(7200);
    expect(parseDurationToSeconds("1.5h")).toBe(5400);
    expect(parseDurationToSeconds("3d")).toBe(3 * 86400);
    expect(parseDurationToSeconds("1w")).toBe(7 * 86400);
  });

  it("sums multiple tokens", () => {
    expect(parseDurationToSeconds("1d 1d 1d")).toBe(3 * 86400);
    expect(parseDurationToSeconds("1h 30m")).toBe(5400);
    expect(parseDurationToSeconds("2d 4h")).toBe(2 * 86400 + 4 * 3600);
  });

  it("returns null for garbage", () => {
    expect(parseDurationToSeconds("")).toBeNull();
    expect(parseDurationToSeconds("nope")).toBeNull();
  });
});

describe("clampShareTtl / resolveShareTtlInput", () => {
  it("caps below min and above max", () => {
    expect(clampShareTtl(1)).toBe(SHARE_TTL_MIN);
    expect(clampShareTtl(SHARE_TTL_MAX + 100)).toBe(SHARE_TTL_MAX);
  });

  it("labels and marks capped inputs", () => {
    const hour = resolveShareTtlInput("60min");
    expect(hour.seconds).toBe(3600);
    expect(hour.label).toBe("1 hour");
    expect(hour.capped).toBe(false);

    const tiny = resolveShareTtlInput("5s");
    expect(tiny.seconds).toBe(SHARE_TTL_MIN);
    expect(tiny.capped).toBe(true);
    expect(tiny.label).toBe("1 minute");
  });

  it("formatDurationHuman uses week/day/hour/minute parts", () => {
    expect(formatDurationHuman(60)).toBe("1 minute");
    expect(formatDurationHuman(3600)).toBe("1 hour");
    expect(formatDurationHuman(86400)).toBe("1 day");
    expect(formatDurationHuman(7 * 86400)).toBe("1 week");
    expect(formatDurationHuman(6 * 86400 + 2 * 3600 + 60)).toBe(
      "6 days, 2 hours, 1 minute",
    );
    expect(formatDurationHuman(7 * 86400 + 6 * 86400 + 2 * 3600 + 60)).toBe(
      "1 week, 6 days, 2 hours, 1 minute",
    );
  });
});
