import { describe, expect, it } from "vitest";
import { generateSharePassword } from "./ttl";

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
