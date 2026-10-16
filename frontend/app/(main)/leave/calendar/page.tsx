"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MainContent } from "@/components/layout/MainContent";
import { LoadingState } from "@/components/ui/LoadingState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAuth } from "@/lib/auth/AuthContext";
import { canAccessManagerFeatures } from "@/lib/auth/roles";
import * as leaveApi from "@/lib/api/leave.api";
import { isApiError } from "@/lib/types/api";
import type { CurrentlyOnLeaveRow, LeaveRequest } from "@/lib/api/leave.api";
import { LeaveSection } from "@/components/leave/LeaveSection";
import { LeaveCalendarPageHeader } from "@/components/leave/calendar/LeaveCalendarPageHeader";
import { LeaveCalendarMonthView } from "@/components/leave/calendar/LeaveCalendarMonthView";
import { LeaveCalendarAgendaView } from "@/components/leave/calendar/LeaveCalendarAgendaView";
import { LeaveCalendarDayPanel } from "@/components/leave/calendar/LeaveCalendarDayPanel";
import { LeaveCalendarUpcoming } from "@/components/leave/calendar/LeaveCalendarUpcoming";
import { LeaveCalendarLegend } from "@/components/leave/calendar/LeaveCalendarLegend";
import { safeApi } from "@/lib/api/safeApi";
import { translate } from "@/lib/i18n";
import { toUserFacingApiError } from "@/lib/api/userFacingError";
import {
  buildAgendaDays,
  buildCalendarDays,
  buildDayDetails,
  buildLeaveCalendarEvents,
  buildUpcomingLeaveGroups,
  filterApprovedLeave,
  monthHasApprovedLeave,
} from "@/lib/leave/leaveCalendarUtils";
import {
  addMonths,
  formatMonthLabel,
  getTodayYmdLocal,
  getYearMonthPreset,
} from "@/lib/utils/date";

export default function LeaveCalendarPage() {
  const { user } = useAuth();
  const isManager = canAccessManagerFeatures(user?.roles);

  const initial = getYearMonthPreset("this_month");
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [selectedDate, setSelectedDate] = useState<string | null>(getTodayYmdLocal());

  const [leaveRows, setLeaveRows] = useState<LeaveRequest[]>([]);
  const [currentlyOnLeave, setCurrentlyOnLeave] = useState<CurrentlyOnLeaveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      if (isManager) {
        const [leaveRes, onLeaveRes] = await Promise.all([
          safeApi(leaveApi.getCompanyLeaveRequests("approved")),
          safeApi(leaveApi.getCurrentlyOnLeave()),
        ]);
        if (isApiError(leaveRes)) {
          setError(leaveRes.error ?? translate("leave.failedLoadLeave"));
          setLeaveRows([]);
        } else {
          setLeaveRows(leaveRes.data ?? []);
        }
        if (!isApiError(onLeaveRes)) {
          setCurrentlyOnLeave(onLeaveRes.data ?? []);
        } else {
          setCurrentlyOnLeave([]);
        }
      } else {
        const leaveRes = await safeApi(leaveApi.getMyLeaveRequests());
        if (isApiError(leaveRes)) {
          setError(leaveRes.error ?? translate("leave.failedLoadLeave"));
          setLeaveRows([]);
        } else {
          setLeaveRows(leaveRes.data ?? []);
        }
        setCurrentlyOnLeave([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : translate("leave.failedLoadLeaveCalendar"));
      setLeaveRows([]);
      setCurrentlyOnLeave([]);
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => {
    void load();
  }, [load]);

  const approvedLeave = useMemo(() => filterApprovedLeave(leaveRows), [leaveRows]);

  const calendarEvents = useMemo(
    () => buildLeaveCalendarEvents(approvedLeave),
    [approvedLeave]
  );

  const calendarDays = useMemo(
    () => buildCalendarDays({ year, month, events: calendarEvents }),
    [year, month, calendarEvents]
  );

  const agendaDays = useMemo(
    () => buildAgendaDays(year, month, calendarDays),
    [year, month, calendarDays]
  );

  const onLeaveByUserId = useMemo(
    () => new Map(currentlyOnLeave.map((row) => [row.user_id, row])),
    [currentlyOnLeave]
  );

  const dayDetails = useMemo(
    () =>
      selectedDate ? buildDayDetails(selectedDate, approvedLeave, onLeaveByUserId) : [],
    [selectedDate, approvedLeave, onLeaveByUserId]
  );

  const upcomingGroups = useMemo(
    () => buildUpcomingLeaveGroups(approvedLeave, currentlyOnLeave),
    [approvedLeave, currentlyOnLeave]
  );

  const monthLabel = useMemo(() => formatMonthLabel(year, month), [year, month]);
  const hasMonthLeave = useMemo(
    () => monthHasApprovedLeave(approvedLeave, year, month),
    [approvedLeave, year, month]
  );

  function goToToday() {
    const today = getTodayYmdLocal();
    const [y, m] = today.split("-").map(Number);
    setYear(y);
    setMonth(m);
    setSelectedDate(today);
  }

  function goPreviousMonth() {
    const next = addMonths(year, month, -1);
    setYear(next.year);
    setMonth(next.month);
    setSelectedDate(null);
  }

  function goNextMonth() {
    const next = addMonths(year, month, 1);
    setYear(next.year);
    setMonth(next.month);
    setSelectedDate(null);
  }

  function handleMonthChange(nextYear: number, nextMonth: number) {
    setYear(nextYear);
    setMonth(nextMonth);
    setSelectedDate(null);
  }

  if (loading && leaveRows.length === 0) {
    return (
      <MainContent>
        <LoadingState message={translate("leave.loadingLeaveCalendar")} className="min-h-[240px]" />
      </MainContent>
    );
  }

  return (
    <MainContent>
      <div className="space-y-8">
        <LeaveCalendarPageHeader
          year={year}
          month={month}
          onToday={goToToday}
          onPreviousMonth={goPreviousMonth}
          onNextMonth={goNextMonth}
          onMonthChange={handleMonthChange}
        />

        {error ? <ErrorState message={toUserFacingApiError(error)} onRetry={() => void load()} /> : null}

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <LeaveSection
              title={translate("leave.calendar")}
              description={
                isManager
                  ? translate("leave.calendarManagerDescription")
                  : translate("leave.calendarMineDescription")
              }
            >
              {!hasMonthLeave && !loading ? (
                <EmptyState
                  title={translate("leave.noLeaveThisMonth")}
                  description={translate("leave.noApprovedInMonth", { values: { month: monthLabel } })}
                />
              ) : (
                <>
                  <div className="hidden md:block">
                    <LeaveCalendarMonthView
                      days={calendarDays}
                      selectedDate={selectedDate}
                      onSelectDate={setSelectedDate}
                      monthLabel={monthLabel}
                    />
                  </div>
                  <div className="md:hidden">
                    <LeaveCalendarAgendaView
                      days={agendaDays}
                      selectedDate={selectedDate}
                      onSelectDate={setSelectedDate}
                      monthLabel={monthLabel}
                    />
                  </div>
                </>
              )}
            </LeaveSection>

            <div className="xl:hidden">
              <LeaveCalendarDayPanel
                selectedDate={selectedDate}
                year={year}
                month={month}
                details={dayDetails}
              />
            </div>

            <LeaveCalendarLegend />
          </div>

          <div className="space-y-6">
            <div className="hidden xl:block">
              <LeaveCalendarDayPanel
                selectedDate={selectedDate}
                year={year}
                month={month}
                details={dayDetails}
              />
            </div>
            <LeaveCalendarUpcoming groups={upcomingGroups} />
          </div>
        </div>
      </div>
    </MainContent>
  );
}
