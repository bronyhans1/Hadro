import type { CurrentlyOnLeaveRow, LeaveRequest } from "@/lib/api/leave.api";
import type { UserListItem } from "@/lib/api/users.api";
import { normalizeLeaveStatus } from "@/lib/dashboard/formatters";
import {
  formatLocalYmd,
  getMonthRangeFromParts,
  getTodayYmdLocal,
  isoWeekdayIndex,
} from "@/lib/utils/date";
import { employeeLeaveName } from "@/lib/leave/leaveOverviewUtils";
import {
  leaveDaysRemaining,
  maxTerminateReturnDateYmd,
} from "@/lib/leave/leaveLifecycle";
import { leaveTypeColor, leaveTypeLabel } from "@/lib/leave/leaveTypes";
import { translate } from "@/lib/i18n";

export interface LeaveCalendarEvent {
  id: string;
  leaveId: string;
  userId: string;
  employeeName: string;
  leaveType: string;
  leaveTypeLabel: string;
  startDate: string;
  endDate: string;
  color: { bg: string; border: string; text: string };
}

export interface LeaveCalendarDay {
  date: string;
  inMonth: boolean;
  isToday: boolean;
  events: LeaveCalendarEvent[];
}

export interface LeaveDayDetail {
  leave: LeaveRequest;
  employeeName: string;
  department: string;
  branch: string;
  returnDate: string;
  remainingDays: number | null;
}

export interface LeaveUpcomingGroup {
  id: string;
  label: string;
  items: { id: string; name: string; leaveType: string; dateLabel: string }[];
  emptyLabel: string;
}

export function filterApprovedLeave(requests: LeaveRequest[]): LeaveRequest[] {
  return requests.filter((r) => normalizeLeaveStatus(r.status) === "approved");
}

export function leaveOverlapsRange(
  leave: { start_date: string; end_date: string },
  rangeStart: string,
  rangeEnd: string
): boolean {
  return leave.start_date <= rangeEnd && leave.end_date >= rangeStart;
}

export function leaveOnDate(
  leave: { start_date: string; end_date: string },
  date: string
): boolean {
  return leave.start_date <= date && leave.end_date >= date;
}

export function leaveToAvatarUser(row: LeaveRequest): UserListItem {
  const name = employeeLeaveName(row);
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return {
    id: row.user_id,
    first_name: parts[0] ?? name,
    last_name: parts.slice(1).join(" ") || " ",
    email: row.employee_email ?? "",
    company_id: row.company_id,
    company_name: null,
    branch_id: "",
    status: "active",
    branch: null,
    department: null,
  };
}

export function buildLeaveCalendarEvents(approved: LeaveRequest[]): LeaveCalendarEvent[] {
  return approved.map((leave) => {
    const leaveType = leave.leave_type;
    return {
      id: `${leave.id}-${leave.start_date}`,
      leaveId: leave.id,
      userId: leave.user_id,
      employeeName: employeeLeaveName(leave),
      leaveType,
      leaveTypeLabel: leaveTypeLabel(leaveType),
      startDate: leave.start_date,
      endDate: leave.end_date,
      color: leaveTypeColor(leaveType),
    };
  });
}

export function buildCalendarDays(opts: {
  year: number;
  month: number;
  events: LeaveCalendarEvent[];
  today?: string;
}): LeaveCalendarDay[] {
  const { year, month, events } = opts;
  const today = opts.today ?? getTodayYmdLocal();
  const { start: monthStart, end: monthEnd } = getMonthRangeFromParts(year, month);

  const first = new Date(year, month - 1, 1);
  const leading = isoWeekdayIndex(first);
  const gridStart = new Date(year, month - 1, 1 - leading);

  const days: LeaveCalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    const date = formatLocalYmd(d);
    const inMonth = date >= monthStart && date <= monthEnd;
    const dayEvents = events.filter((e) => e.startDate <= date && e.endDate >= date);
    days.push({
      date,
      inMonth,
      isToday: date === today,
      events: dayEvents,
    });
  }

  return days;
}

export function buildDayDetails(
  date: string,
  approved: LeaveRequest[],
  onLeaveByUserId: Map<string, CurrentlyOnLeaveRow>
): LeaveDayDetail[] {
  return approved
    .filter((leave) => leaveOnDate(leave, date))
    .map((leave) => {
      const onLeave = onLeaveByUserId.get(leave.user_id);
      const returnDate =
        leave.actual_return_date?.trim() || maxTerminateReturnDateYmd(leave.end_date);
      let remainingDays: number | null = null;
      if (onLeave && leaveOnDate(onLeave, date)) {
        remainingDays = onLeave.days_remaining;
      } else if (leaveOnDate(leave, date)) {
        remainingDays = leaveDaysRemaining(leave.end_date, date);
      }

      return {
        leave,
        employeeName: employeeLeaveName(leave),
        department: onLeave?.department ?? "—",
        branch: "—",
        returnDate,
        remainingDays,
      };
    })
    .sort((a, b) => a.employeeName.localeCompare(b.employeeName));
}

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  return formatLocalYmd(dt);
}

export function buildUpcomingLeaveGroups(
  approved: LeaveRequest[],
  currentlyOnLeave: CurrentlyOnLeaveRow[],
  today?: string
): LeaveUpcomingGroup[] {
  const asOf = today ?? getTodayYmdLocal();
  const tomorrow = addDaysYmd(asOf, 1);
  const weekEnd = addDaysYmd(asOf, 7);

  const startsTomorrow = approved
    .filter((l) => l.start_date === tomorrow)
    .map((l) => ({
      id: l.id,
      name: employeeLeaveName(l),
      leaveType: leaveTypeLabel(l.leave_type),
      dateLabel: l.start_date,
    }));

  const startsThisWeek = approved
    .filter((l) => l.start_date > asOf && l.start_date <= weekEnd && l.start_date !== tomorrow)
    .map((l) => ({
      id: l.id,
      name: employeeLeaveName(l),
      leaveType: leaveTypeLabel(l.leave_type),
      dateLabel: l.start_date,
    }));

  const returnsThisWeek = currentlyOnLeave
    .filter((r) => r.days_remaining > 0 && r.days_remaining <= 7)
    .map((r) => ({
      id: r.id,
      name: employeeLeaveName(r),
      leaveType: leaveTypeLabel(r.leave_type),
      dateLabel: r.end_date,
    }));

  return [
    {
      id: "starts-tomorrow",
      label: translate("leave.startsTomorrow"),
      items: startsTomorrow,
      emptyLabel: translate("leave.noLeaveStartingTomorrow"),
    },
    {
      id: "starts-week",
      label: translate("leave.startsThisWeek"),
      items: startsThisWeek,
      emptyLabel: translate("leave.noLeaveStartingThisWeek"),
    },
    {
      id: "returns-week",
      label: translate("leave.returnsThisWeek"),
      items: returnsThisWeek,
      emptyLabel: translate("leave.noReturnsThisWeek"),
    },
  ];
}

export function monthHasApprovedLeave(
  approved: LeaveRequest[],
  year: number,
  month: number
): boolean {
  const { start, end } = getMonthRangeFromParts(year, month);
  return approved.some((l) => leaveOverlapsRange(l, start, end));
}

export function buildAgendaDays(
  year: number,
  month: number,
  days: LeaveCalendarDay[]
): LeaveCalendarDay[] {
  const { start, end } = getMonthRangeFromParts(year, month);
  return days.filter((d) => d.inMonth && d.date >= start && d.date <= end && d.events.length > 0);
}
