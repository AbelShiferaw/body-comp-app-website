import { describe, expect, it } from "vitest";

import {
  fatPct,
  frameAt,
  SAMPLE_LATEST,
  SAMPLE_START,
  segment,
  STOPS,
  totals,
  visibility,
} from "../tour";

describe("tour sample numbers", () => {
  it("match the app's sample home screen", () => {
    const t = totals(SAMPLE_LATEST);
    expect(t.fatPct.toFixed(1)).toBe("17.0");
    expect(t.leanKg.toFixed(1)).toBe("64.5");
    expect(SAMPLE_LATEST.visceralG).toBe(340);
  });

  it("show the cut from the first sample scan", () => {
    expect(totals(SAMPLE_START).fatPct.toFixed(1)).toBe("24.0");
    expect(fatPct(SAMPLE_LATEST.android).toFixed(1)).toBe("25.0");
  });
});

describe("tour interpolation", () => {
  const centers = {
    whole: { x: 0, y: 0, z: 0 },
    belly: { x: 0, y: 2, z: 0 },
    arms: { x: 0, y: 3, z: 0 },
    legs: { x: 0, y: -4, z: 0 },
  };
  const none = () => ({ x: 0, y: 0 });

  it("holds still at each stop", () => {
    expect(segment(1)).toEqual({ k: 1, e: 0 });
    expect(segment(1.1).e).toBe(0);
    expect(segment(1.9).e).toBe(1);
    expect(segment(STOPS.length - 1)).toEqual({ k: STOPS.length - 2, e: 1 });
  });

  it("frames the stop's region and shows only its text", () => {
    const f = frameAt(1, centers, none);
    expect(f.focus.dist).toBe(STOPS[1].view.dist);
    expect(f.focus.y).toBe(centers[STOPS[1].view.center].y + STOPS[1].view.dy);
    expect(visibility(1, 1)).toBe(1);
    expect(visibility(1, 2)).toBe(0);
  });
});
