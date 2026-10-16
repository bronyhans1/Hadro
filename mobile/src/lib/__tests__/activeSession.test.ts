import {
  isActiveSessionRow,
  pickActiveSession,
  pickActiveSessionWithSource,
  toSessionRecord,
} from "../activeSession";

describe("activeSession (mobile)", () => {
  it("detects ACTIVE status", () => {
    expect(isActiveSessionRow({ id: "1", status: "ACTIVE", check_in: "2026-04-01T01:00:00Z" })).toBe(true);
  });

  it("prefers today list over history", () => {
    const today = [{ id: "t1", status: "ACTIVE", check_in: "2026-04-01T08:00:00Z" }];
    const history = [{ id: "h1", status: "ACTIVE", check_in: "2026-03-31T22:00:00Z" }];
    expect(pickActiveSession(today, history)?.id).toBe("t1");
  });

  it("falls back to history when today omits overnight open session", () => {
    const history = [
      {
        id: "overnight",
        status: "ACTIVE",
        check_in: "2026-04-01T01:00:00Z",
        attendance_date: "2026-03-31",
      },
    ];
    expect(pickActiveSession([], history)?.id).toBe("overnight");
    const { source } = pickActiveSessionWithSource([], history);
    expect(source).toBe("history");
  });

  it("returns null when no open session", () => {
    expect(
      pickActiveSession(
        [{ id: "1", status: "COMPLETED", check_in: "x", check_out: "y" }],
        []
      )
    ).toBeNull();
  });

  it("preserves remote attendance fields in toSessionRecord", () => {
    const row = toSessionRecord({
      id: "s1",
      status: "ACTIVE",
      check_in: "2026-04-01T08:00:00Z",
      attendance_mode: "remote",
      remote_approval_status: "pending",
    });
    expect(row.attendance_mode).toBe("remote");
    expect(row.remote_approval_status).toBe("pending");
  });
});
