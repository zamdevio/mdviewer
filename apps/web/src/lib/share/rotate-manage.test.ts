import { describe, expect, it } from "vitest";
import {
  isRotateTombstone,
  partitionRotateFails,
  shouldPersistNewManageToken,
} from "./rotate-manage";

describe("rotate-manage commit rules", () => {
  it("treats not_found and expired as tombstones", () => {
    expect(isRotateTombstone("not_found")).toBe(true);
    expect(isRotateTombstone("expired")).toBe(true);
    expect(isRotateTombstone("unauthorized")).toBe(false);
  });

  it("persists when any share was re-keyed", () => {
    expect(
      shouldPersistNewManageToken(
        ["a"],
        [{ id: "b", error: "unauthorized" }],
      ),
    ).toBe(true);
  });

  it("persists when failures are only tombstones", () => {
    expect(
      shouldPersistNewManageToken(
        [],
        [
          { id: "a", error: "not_found" },
          { id: "b", error: "expired" },
        ],
      ),
    ).toBe(true);
  });

  it("keeps old token when nothing updated and a live failure remains", () => {
    expect(
      shouldPersistNewManageToken([], [{ id: "b", error: "unauthorized" }]),
    ).toBe(false);
  });

  it("partitions tombstones vs live", () => {
    const { tombstones, live } = partitionRotateFails([
      { id: "1", error: "not_found" },
      { id: "2", error: "unauthorized" },
    ]);
    expect(tombstones).toEqual([{ id: "1", error: "not_found" }]);
    expect(live).toEqual([{ id: "2", error: "unauthorized" }]);
  });
});
