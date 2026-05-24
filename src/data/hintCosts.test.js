import { describe, it, expect } from "vitest";
import { getHintCost, formatHintButtonLabel } from "./hintCosts.js";

describe("getHintCost", () => {
  it("returns 5 HP for playing mode stage 0", () => {
    expect(getHintCost("playing", 0)).toEqual({ amount: 5, unit: "HP" });
  });

  it("returns 5 HP for playing mode stage 1", () => {
    expect(getHintCost("playing", 1)).toEqual({ amount: 5, unit: "HP" });
  });

  it("returns 10 HP for playing mode stage 2", () => {
    expect(getHintCost("playing", 2)).toEqual({ amount: 10, unit: "HP" });
  });

  it("returns 5 HP for dailyChallenge mode stage 0", () => {
    expect(getHintCost("dailyChallenge", 0)).toEqual({ amount: 5, unit: "HP" });
  });

  it("returns 5 HP for dailyChallenge mode stage 1", () => {
    expect(getHintCost("dailyChallenge", 1)).toEqual({ amount: 5, unit: "HP" });
  });

  it("returns 10 HP for dailyChallenge mode stage 2", () => {
    expect(getHintCost("dailyChallenge", 2)).toEqual({
      amount: 10,
      unit: "HP",
    });
  });

  it("returns 25 pts for exam mode stage 0", () => {
    expect(getHintCost("exam", 0)).toEqual({ amount: 25, unit: "pts" });
  });

  it("returns 25 pts for exam mode stage 1", () => {
    expect(getHintCost("exam", 1)).toEqual({ amount: 25, unit: "pts" });
  });

  it("returns 50 pts for exam mode stage 2", () => {
    expect(getHintCost("exam", 2)).toEqual({ amount: 50, unit: "pts" });
  });

  it("returns 0 with null unit for replayGate all stages", () => {
    expect(getHintCost("replayGate", 0)).toEqual({ amount: 0, unit: null });
    expect(getHintCost("replayGate", 1)).toEqual({ amount: 0, unit: null });
    expect(getHintCost("replayGate", 2)).toEqual({ amount: 0, unit: null });
  });

  it("returns 0 with null unit for unknown game mode", () => {
    expect(getHintCost("unknown", 0)).toEqual({ amount: 0, unit: null });
  });

  it("returns 0 with null unit for invalid hint stage", () => {
    expect(getHintCost("playing", 5)).toEqual({ amount: 0, unit: null });
  });
});

describe("formatHintButtonLabel", () => {
  it('returns "Get Hint (-5 HP)" for playing stage 0', () => {
    expect(formatHintButtonLabel("playing", 0)).toBe("Get Hint (-5 HP)");
  });

  it('returns "Next Hint (-5 HP)" for playing stage 1', () => {
    expect(formatHintButtonLabel("playing", 1)).toBe("Next Hint (-5 HP)");
  });

  it('returns "Show Solution (-10 HP)" for playing stage 2', () => {
    expect(formatHintButtonLabel("playing", 2)).toBe("Show Solution (-10 HP)");
  });

  it('returns "Get Hint (-5 HP)" for dailyChallenge stage 0', () => {
    expect(formatHintButtonLabel("dailyChallenge", 0)).toBe(
      "Get Hint (-5 HP)"
    );
  });

  it('returns "Next Hint (-5 HP)" for dailyChallenge stage 1', () => {
    expect(formatHintButtonLabel("dailyChallenge", 1)).toBe(
      "Next Hint (-5 HP)"
    );
  });

  it('returns "Show Solution (-10 HP)" for dailyChallenge stage 2', () => {
    expect(formatHintButtonLabel("dailyChallenge", 2)).toBe(
      "Show Solution (-10 HP)"
    );
  });

  it('returns "Get Hint (-25 pts)" for exam stage 0', () => {
    expect(formatHintButtonLabel("exam", 0)).toBe("Get Hint (-25 pts)");
  });

  it('returns "Next Hint (-25 pts)" for exam stage 1', () => {
    expect(formatHintButtonLabel("exam", 1)).toBe("Next Hint (-25 pts)");
  });

  it('returns "Show Solution (-50 pts)" for exam stage 2', () => {
    expect(formatHintButtonLabel("exam", 2)).toBe("Show Solution (-50 pts)");
  });

  it('returns "Get Hint" without cost for replayGate stage 0', () => {
    expect(formatHintButtonLabel("replayGate", 0)).toBe("Get Hint");
  });

  it('returns "Next Hint" without cost for replayGate stage 1', () => {
    expect(formatHintButtonLabel("replayGate", 1)).toBe("Next Hint");
  });

  it('returns "Show Solution" without cost for replayGate stage 2', () => {
    expect(formatHintButtonLabel("replayGate", 2)).toBe("Show Solution");
  });
});
