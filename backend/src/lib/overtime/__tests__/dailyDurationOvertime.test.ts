import {
  aggregateDailyDurationOvertime,
  aggregateShiftAwareDailyOvertime,
  computeSessionDurationOvertime,
} from "../dailyDurationOvertime";

describe("computeSessionDurationOvertime", () => {
  test("matches per-session duration cap (current payroll behavior)", () => {
    expect(computeSessionDurationOvertime(600, 8)).toEqual({
      regularMinutes: 480,
      overtimeMinutes: 120,
    });
  });

  test("no OT under cap", () => {
    expect(computeSessionDurationOvertime(300, 8)).toEqual({
      regularMinutes: 300,
      overtimeMinutes: 0,
    });
  });
});

describe("aggregateDailyDurationOvertime", () => {
  test("two 5h sessions same day yield 2h OT with 8h daily cap", () => {
    const days = aggregateDailyDurationOvertime(
      [
        { sessionId: "s1", durationMinutes: 300, dayKey: "2026-05-01", orderMs: 1 },
        { sessionId: "s2", durationMinutes: 300, dayKey: "2026-05-01", orderMs: 2 },
      ],
      8
    );
    expect(days).toHaveLength(1);
    expect(days[0]).toMatchObject({
      dayKey: "2026-05-01",
      totalMinutes: 600,
      regularMinutes: 480,
      overtimeMinutes: 120,
    });
    expect(days[0]!.bySession).toEqual([
      {
        sessionId: "s1",
        durationMinutes: 300,
        allocatedRegularMinutes: 300,
        allocatedOvertimeMinutes: 0,
      },
      {
        sessionId: "s2",
        durationMinutes: 300,
        allocatedRegularMinutes: 180,
        allocatedOvertimeMinutes: 120,
      },
    ]);
  });

  test("separate days aggregated independently", () => {
    const days = aggregateDailyDurationOvertime(
      [
        { sessionId: "a", durationMinutes: 600, dayKey: "2026-05-01" },
        { sessionId: "b", durationMinutes: 600, dayKey: "2026-05-02" },
      ],
      8
    );
    expect(days).toHaveLength(2);
    expect(days[0]!.overtimeMinutes).toBe(120);
    expect(days[1]!.overtimeMinutes).toBe(120);
  });

  test("ignores negative durations", () => {
    const days = aggregateDailyDurationOvertime(
      [{ sessionId: "x", durationMinutes: -10, dayKey: "2026-05-01" }],
      8
    );
    expect(days).toHaveLength(0);
  });
});

describe("aggregateShiftAwareDailyOvertime", () => {
  test("matches legacy daily aggregation when no shift is assigned", () => {
    const legacy = aggregateDailyDurationOvertime(
      [
        { sessionId: "s1", durationMinutes: 300, dayKey: "2026-05-01", orderMs: 1 },
        { sessionId: "s2", durationMinutes: 300, dayKey: "2026-05-01", orderMs: 2 },
      ],
      8
    );
    const shiftAware = aggregateShiftAwareDailyOvertime(
      [
        { sessionId: "s1", durationMinutes: 300, dayKey: "2026-05-01", orderMs: 1 },
        { sessionId: "s2", durationMinutes: 300, dayKey: "2026-05-01", orderMs: 2 },
      ],
      8
    );
    expect(shiftAware).toEqual(legacy);
  });

  test("6h overnight shift duration with 8h51m worked", () => {
    const days = aggregateShiftAwareDailyOvertime(
      [
        {
          sessionId: "s1",
          durationMinutes: 531,
          dayKey: "2026-05-01",
          scheduledShiftMinutes: 360,
        },
      ],
      8
    );
    expect(days[0]!.bySession[0]).toMatchObject({
      allocatedRegularMinutes: 360,
      allocatedOvertimeMinutes: 171,
    });
  });
});
