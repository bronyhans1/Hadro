import {
  allocateDailySessionOvertime,
  computeHourlySessionGrossBeforeLate,
} from "../hourlySessionPayroll.engine";
import {
  OVERTIME_POLICY_MODE_DURATION,
  OVERTIME_POLICY_MODE_NONE,
} from "../../../constants/overtimePolicyMode";
import { OVERTIME_COMPENSATION_METHOD_MULTIPLIER } from "../../../constants/overtimeCompensationMethod";

describe("allocateDailySessionOvertime", () => {
  const day = "2026-06-01";

  test("Case 1: 5h + 5h same day → 8h regular, 2h OT total", () => {
    const rows = allocateDailySessionOvertime(
      [
        { sessionId: "s1", durationMinutes: 300, dayKey: day },
        { sessionId: "s2", durationMinutes: 300, dayKey: day },
      ],
      OVERTIME_POLICY_MODE_DURATION,
      8
    );
    const totalRegular = rows.reduce((s, r) => s + r.regularMinutes, 0);
    const totalOt = rows.reduce((s, r) => s + r.overtimeMinutes, 0);
    expect(totalRegular).toBe(480);
    expect(totalOt).toBe(120);
  });

  test("Case 2: 3h + 3h same day → 6h regular, 0 OT", () => {
    const rows = allocateDailySessionOvertime(
      [
        { sessionId: "a", durationMinutes: 180, dayKey: day },
        { sessionId: "b", durationMinutes: 180, dayKey: day },
      ],
      OVERTIME_POLICY_MODE_DURATION,
      8
    );
    expect(rows.reduce((s, r) => s + r.regularMinutes, 0)).toBe(360);
    expect(rows.reduce((s, r) => s + r.overtimeMinutes, 0)).toBe(0);
  });

  test("Case 3: 8h + 4h same day → 8h regular, 4h OT", () => {
    const rows = allocateDailySessionOvertime(
      [
        { sessionId: "long", durationMinutes: 480, dayKey: day, orderMs: 1 },
        { sessionId: "extra", durationMinutes: 240, dayKey: day, orderMs: 2 },
      ],
      OVERTIME_POLICY_MODE_DURATION,
      8
    );
    expect(rows.reduce((s, r) => s + r.regularMinutes, 0)).toBe(480);
    expect(rows.reduce((s, r) => s + r.overtimeMinutes, 0)).toBe(240);
    const extra = rows.find((r) => r.sessionId === "extra");
    expect(extra?.overtimeMinutes).toBe(240);
    expect(extra?.regularMinutes).toBe(0);
  });

  test("Case 4: none mode → OT always zero", () => {
    const rows = allocateDailySessionOvertime(
      [
        { sessionId: "s1", durationMinutes: 300, dayKey: day },
        { sessionId: "s2", durationMinutes: 300, dayKey: day },
      ],
      OVERTIME_POLICY_MODE_NONE,
      8
    );
    expect(rows.every((r) => r.overtimeMinutes === 0)).toBe(true);
    expect(rows.reduce((s, r) => s + r.regularMinutes, 0)).toBe(600);
  });

  test("6h shift, 8h51m worked → 360 regular, 171 OT", () => {
    const rows = allocateDailySessionOvertime(
      [
        {
          sessionId: "overnight",
          durationMinutes: 531,
          dayKey: day,
          scheduledShiftMinutes: 360,
        },
      ],
      OVERTIME_POLICY_MODE_DURATION,
      8
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      regularMinutes: 360,
      overtimeMinutes: 171,
    });
  });

  test("worked less than shift duration → all regular", () => {
    const rows = allocateDailySessionOvertime(
      [
        {
          sessionId: "short",
          durationMinutes: 240,
          dayKey: day,
          scheduledShiftMinutes: 360,
        },
      ],
      OVERTIME_POLICY_MODE_DURATION,
      8
    );
    expect(rows[0]).toMatchObject({ regularMinutes: 240, overtimeMinutes: 0 });
  });

  test("worked exactly shift duration → all regular", () => {
    const rows = allocateDailySessionOvertime(
      [
        {
          sessionId: "exact",
          durationMinutes: 360,
          dayKey: day,
          scheduledShiftMinutes: 360,
        },
      ],
      OVERTIME_POLICY_MODE_DURATION,
      8
    );
    expect(rows[0]).toMatchObject({ regularMinutes: 360, overtimeMinutes: 0 });
  });

  test("missing shift falls back to default daily hours cap", () => {
    const rows = allocateDailySessionOvertime(
      [
        { sessionId: "s1", durationMinutes: 300, dayKey: day, orderMs: 1 },
        { sessionId: "s2", durationMinutes: 300, dayKey: day, orderMs: 2 },
      ],
      OVERTIME_POLICY_MODE_DURATION,
      8
    );
    expect(rows.reduce((s, r) => s + r.regularMinutes, 0)).toBe(480);
    expect(rows.reduce((s, r) => s + r.overtimeMinutes, 0)).toBe(120);
  });

  test("two 6h shifts with 7h worked each — daily cap prevents 12h regular", () => {
    const rows = allocateDailySessionOvertime(
      [
        {
          sessionId: "a",
          durationMinutes: 420,
          dayKey: day,
          orderMs: 1,
          scheduledShiftMinutes: 360,
        },
        {
          sessionId: "b",
          durationMinutes: 420,
          dayKey: day,
          orderMs: 2,
          scheduledShiftMinutes: 360,
        },
      ],
      OVERTIME_POLICY_MODE_DURATION,
      8
    );
    expect(rows.reduce((s, r) => s + r.regularMinutes, 0)).toBe(480);
    expect(rows.reduce((s, r) => s + r.overtimeMinutes, 0)).toBe(360);
    expect(rows.find((r) => r.sessionId === "a")).toMatchObject({
      regularMinutes: 360,
      overtimeMinutes: 60,
    });
    expect(rows.find((r) => r.sessionId === "b")).toMatchObject({
      regularMinutes: 120,
      overtimeMinutes: 300,
    });
  });
});

describe("computeHourlySessionGrossBeforeLate", () => {
  test("uses multiplier on OT portion only", () => {
    const gross = computeHourlySessionGrossBeforeLate({
      regularMinutes: 480,
      overtimeMinutes: 120,
      hourlyRate: 20,
      compensation: {
        method: OVERTIME_COMPENSATION_METHOD_MULTIPLIER,
        overtimeMultiplier: 1.5,
        fixedOvertimeHourlyRate: null,
      },
    });
    expect(gross).toBe(220);
  });

  test("uses fixed OT rate on OT portion only", () => {
    const gross = computeHourlySessionGrossBeforeLate({
      regularMinutes: 480,
      overtimeMinutes: 240,
      hourlyRate: 20,
      compensation: {
        method: "fixed_rate",
        overtimeMultiplier: 1.5,
        fixedOvertimeHourlyRate: 20,
      },
    });
    expect(gross).toBe(240);
  });
});
