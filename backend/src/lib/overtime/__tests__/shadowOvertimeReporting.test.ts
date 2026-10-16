import {
  buildShadowOvertimeForRecord,
  sumShadowOvertimeTotals,
} from "../shadowOvertimeReporting";

describe("buildShadowOvertimeForRecord", () => {
  const shiftMap = new Map<string, number | null>([
    ["sess-1", 30],
    ["sess-2", 0],
  ]);

  test("hourly session exposes duration OT from payroll and shift OT from session", () => {
    expect(
      buildShadowOvertimeForRecord(
        {
          record_type: "session_hourly",
          overtime_minutes: 120,
          session_id: "sess-1",
        },
        shiftMap
      )
    ).toEqual({
      duration_ot_minutes: 120,
      shift_ot_minutes: 30,
    });
  });

  test("salary daily rows have null shadow fields", () => {
    expect(
      buildShadowOvertimeForRecord(
        { record_type: "salary_daily", overtime_minutes: 0, session_id: null },
        shiftMap
      )
    ).toEqual({
      duration_ot_minutes: null,
      shift_ot_minutes: null,
    });
  });

  test("missing session id yields null shift OT", () => {
    expect(
      buildShadowOvertimeForRecord(
        { record_type: "session_hourly", overtime_minutes: 60, session_id: null },
        shiftMap
      )
    ).toEqual({
      duration_ot_minutes: 60,
      shift_ot_minutes: null,
    });
  });
});

describe("sumShadowOvertimeTotals", () => {
  test("sums duration and shift OT across records", () => {
    expect(
      sumShadowOvertimeTotals([
        {
          shadow_overtime: { duration_ot_minutes: 60, shift_ot_minutes: 30 },
        },
        {
          shadow_overtime: { duration_ot_minutes: 120, shift_ot_minutes: 15 },
        },
        {
          shadow_overtime: { duration_ot_minutes: null, shift_ot_minutes: null },
        },
      ])
    ).toEqual({
      total_duration_ot_minutes: 180,
      total_shift_ot_minutes: 45,
    });
  });
});
