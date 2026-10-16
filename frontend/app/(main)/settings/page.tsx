"use client";

import { useCallback, useEffect, useState } from "react";
import { MainContent } from "@/components/layout/MainContent";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { DateInput, Select } from "@/components/ui/FormControls";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarX, Trash2 } from "lucide-react";
import { ReportsPageHeader } from "@/components/reports/ReportsPageHeader";
import { PayrollSection } from "@/components/payroll/PayrollSection";
import { useAuth } from "@/lib/auth/AuthContext";
import { canUpdateCompanyPolicy, canEditPayrollSchedulePolicy, canAccessAdminFeatures } from "@/lib/auth/roles";
import * as companyPolicyApi from "@/lib/api/companyPolicy.api";
import * as holidaysApi from "@/lib/api/holidays.api";
import { LeaveTypeCompensationSection } from "@/components/leave/LeaveTypeCompensationSection";
import { isApiError } from "@/lib/types/api";
import type { CompanyPolicy } from "@/lib/api/companyPolicy.api";
import type { CompanyHoliday } from "@/lib/api/holidays.api";
import { safeApi } from "@/lib/api/safeApi";
import { translate } from "@/lib/i18n";
import { toUserFacingApiError } from "@/lib/api/userFacingError";
import { useToast } from "@/components/ui/ToastProvider";
import { useSuccessBanner } from "@/hooks/useSuccessBanner";
import {
  ACTIVATED_OVERTIME_POLICY_MODES,
  overtimePolicyModeLabel,
  type OvertimePolicyMode,
} from "@/lib/overtime/overtimePolicyMode";
import {
  normalizeOvertimeCompensationMethod,
  overtimeCompensationMethodLabel,
  type OvertimeCompensationMethod,
} from "@/lib/overtime/overtimeCompensationMethod";

const WEEKDAY_OPTIONS: { v: number; labelKey: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun" }[] = [
  { v: 1, labelKey: "mon" },
  { v: 2, labelKey: "tue" },
  { v: 3, labelKey: "wed" },
  { v: 4, labelKey: "thu" },
  { v: 5, labelKey: "fri" },
  { v: 6, labelKey: "sat" },
  { v: 7, labelKey: "sun" },
];

function normalizeWeekdays(raw: unknown): number[] {
  if (!Array.isArray(raw) || raw.length === 0) return [1, 2, 3, 4, 5];
  const nums = raw
    .map((x) => (typeof x === "number" ? x : Number(x)))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 7);
  const uniq = Array.from(new Set(nums)).sort((a, b) => a - b);
  return uniq.length ? uniq : [1, 2, 3, 4, 5];
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const success = useSuccessBanner();
  const canEdit = canUpdateCompanyPolicy(user?.roles);
  const canEditSchedule = canEditPayrollSchedulePolicy(user?.roles);
  const canEditCurrency = canAccessAdminFeatures(user?.roles);

  const [policy, setPolicy] = useState<CompanyPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [defaultDailyHours, setDefaultDailyHours] = useState<number>(8);
  const [overtimeMultiplier, setOvertimeMultiplier] = useState<number>(1.5);
  const [latenessTrackingEnabled, setLatenessTrackingEnabled] = useState(true);
  const [latePayDeductionEnabled, setLatePayDeductionEnabled] = useState(false);
  const [latePayDeductionEffectiveFrom, setLatePayDeductionEffectiveFrom] = useState("");
  const [workingWeekdays, setWorkingWeekdays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [currencyCode, setCurrencyCode] = useState<"GHS" | "USD">("GHS");
  const [payrollEnabled, setPayrollEnabled] = useState(true);
  const [businessTimezone, setBusinessTimezone] = useState("Africa/Accra");
  const [attendanceDayClassificationEnabled, setAttendanceDayClassificationEnabled] = useState(false);
  const [minMinutesCounted, setMinMinutesCounted] = useState(60);
  const [fullDayMinutes, setFullDayMinutes] = useState(480);
  /** Server: cannot turn payroll off when records or wage rows exist. */
  const [payrollDisableBlocked, setPayrollDisableBlocked] = useState(false);
  const [overnightShiftsEnabled, setOvernightShiftsEnabled] = useState(false);
  const [remoteAttendanceEnabled, setRemoteAttendanceEnabled] = useState(false);
  const [overtimePolicyMode, setOvertimePolicyMode] = useState<OvertimePolicyMode>("duration");
  const [overtimeCompensationMethod, setOvertimeCompensationMethod] =
    useState<OvertimeCompensationMethod>("multiplier");
  const [fixedOvertimeHourlyRate, setFixedOvertimeHourlyRate] = useState<number>(20);

  const [holidayYear, setHolidayYear] = useState(() => new Date().getFullYear());
  const [holidayMonth, setHolidayMonth] = useState(() => new Date().getMonth() + 1);
  const [holidays, setHolidays] = useState<CompanyHoliday[]>([]);
  const [holidaysLoading, setHolidaysLoading] = useState(false);
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayPaid, setHolidayPaid] = useState(true);
  const [holidayBusy, setHolidayBusy] = useState(false);
  const [holidayError, setHolidayError] = useState<string | null>(null);

  const loadHolidays = useCallback(async () => {
    setHolidaysLoading(true);
    try {
      const res = await safeApi(holidaysApi.listHolidays(holidayYear, holidayMonth));
      if (isApiError(res)) {
        setHolidays([]);
        return;
      }
      setHolidays(res.data ?? []);
    } catch {
      setHolidays([]);
    } finally {
      setHolidaysLoading(false);
    }
  }, [holidayYear, holidayMonth]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await safeApi(companyPolicyApi.getPolicy());
      if (isApiError(res)) {
        setError(res.error);
        setPolicy(null);
        return;
      }
      const p = res.data;
      setPolicy(p);
      if (p) {
        setDefaultDailyHours(p.default_daily_hours);
        setOvertimeMultiplier(p.overtime_multiplier);
        setLatenessTrackingEnabled(p.lateness_tracking_enabled !== false);
        setLatePayDeductionEnabled(p.late_pay_deduction_enabled === true);
        setLatePayDeductionEffectiveFrom(
          typeof p.late_pay_deduction_effective_from === "string"
            ? p.late_pay_deduction_effective_from.slice(0, 10)
            : ""
        );
        setWorkingWeekdays(normalizeWeekdays(p.working_weekdays));
        if (p.currency_code === "USD" || p.currency_code === "GHS") setCurrencyCode(p.currency_code);
        setPayrollEnabled(p.payroll_enabled !== false);
        setPayrollDisableBlocked(p.payroll_disable_blocked === true);
        if (typeof p.business_timezone === "string" && p.business_timezone.trim()) {
          setBusinessTimezone(p.business_timezone.trim());
        }
        setAttendanceDayClassificationEnabled(p.attendance_day_classification_enabled === true);
        if (typeof p.minimum_minutes_for_counted_day === "number") setMinMinutesCounted(p.minimum_minutes_for_counted_day);
        if (typeof p.full_day_minutes_threshold === "number") setFullDayMinutes(p.full_day_minutes_threshold);
        setOvernightShiftsEnabled(p.overnight_shifts_enabled === true);
        setRemoteAttendanceEnabled(p.remote_attendance_enabled === true);
        if (
          p.overtime_policy_mode === "duration" ||
          p.overtime_policy_mode === "none"
        ) {
          setOvertimePolicyMode(p.overtime_policy_mode);
        }
        setOvertimeCompensationMethod(
          normalizeOvertimeCompensationMethod(p.overtime_compensation_method)
        );
        if (
          typeof p.fixed_overtime_hourly_rate === "number" &&
          p.fixed_overtime_hourly_rate > 0
        ) {
          setFixedOvertimeHourlyRate(p.fixed_overtime_hourly_rate);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : translate("settings.failedLoadPolicy"));
      setPolicy(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadHolidays();
  }, [loadHolidays]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setSaveError(null);
    success.clearSuccess();
    const hours = Number(defaultDailyHours);
    const multiplier = Number(overtimeMultiplier);
    if (!Number.isFinite(hours) || hours < 1 || hours > 24) {
      setSaveError(translate("settings.hoursRange"));
      return;
    }
    if (!Number.isFinite(multiplier) || multiplier < 1 || multiplier > 3) {
      setSaveError(translate("settings.multiplierRange"));
      return;
    }
    const fixedRate = Number(fixedOvertimeHourlyRate);
    if (overtimeCompensationMethod === "fixed_rate") {
      if (!Number.isFinite(fixedRate) || fixedRate <= 0) {
        setSaveError(translate("settings.fixedRatePositive"));
        return;
      }
    }
    if (
      canEditCurrency &&
      attendanceDayClassificationEnabled &&
      fullDayMinutes < minMinutesCounted
    ) {
      setSaveError(translate("settings.fullDayThreshold"));
      return;
    }
    if (latePayDeductionEnabled && !latePayDeductionEffectiveFrom.trim()) {
      setSaveError(translate("settings.effectiveDateRequired"));
      return;
    }
    setSaving(true);
    try {
      const res = await safeApi(companyPolicyApi.updatePolicy({
        default_daily_hours: hours,
        overtime_multiplier: multiplier,
        overtime_policy_mode: overtimePolicyMode,
        overtime_compensation_method: overtimeCompensationMethod,
        ...(overtimeCompensationMethod === "fixed_rate"
          ? { fixed_overtime_hourly_rate: fixedRate }
          : {}),
        lateness_tracking_enabled: latenessTrackingEnabled,
        late_pay_deduction_enabled: latePayDeductionEnabled,
        late_pay_deduction_effective_from: latePayDeductionEnabled
          ? latePayDeductionEffectiveFrom.trim().slice(0, 10)
          : latePayDeductionEffectiveFrom.trim()
            ? latePayDeductionEffectiveFrom.trim().slice(0, 10)
            : null,
        ...(canEditCurrency
          ? {
              currency_code: currencyCode,
              payroll_enabled: payrollEnabled,
              business_timezone: businessTimezone.trim() || "Africa/Accra",
              overnight_shifts_enabled: overnightShiftsEnabled,
              remote_attendance_enabled: remoteAttendanceEnabled,
              attendance_day_classification_enabled: attendanceDayClassificationEnabled,
              minimum_minutes_for_counted_day: minMinutesCounted,
              full_day_minutes_threshold: fullDayMinutes,
            }
          : {}),
        ...(canEditSchedule ? { working_weekdays: workingWeekdays } : {}),
      }));
      if (isApiError(res)) {
        setSaveError(res.error ?? translate("settings.failedUpdatePolicy"));
        return;
      }
      const saved = res.data ?? null;
      setPolicy(saved);
      if (saved?.working_weekdays) setWorkingWeekdays(normalizeWeekdays(saved.working_weekdays));
      if (saved?.currency_code === "USD" || saved?.currency_code === "GHS") setCurrencyCode(saved.currency_code);
      if (saved) {
        setPayrollEnabled(saved.payroll_enabled !== false);
        setPayrollDisableBlocked(saved.payroll_disable_blocked === true);
        setLatenessTrackingEnabled(saved.lateness_tracking_enabled !== false);
        setLatePayDeductionEnabled(saved.late_pay_deduction_enabled === true);
        setLatePayDeductionEffectiveFrom(
          typeof saved.late_pay_deduction_effective_from === "string"
            ? saved.late_pay_deduction_effective_from.slice(0, 10)
            : ""
        );
        if (typeof saved.business_timezone === "string" && saved.business_timezone.trim()) {
          setBusinessTimezone(saved.business_timezone.trim());
        }
        setAttendanceDayClassificationEnabled(saved.attendance_day_classification_enabled === true);
        if (typeof saved.minimum_minutes_for_counted_day === "number") setMinMinutesCounted(saved.minimum_minutes_for_counted_day);
        if (typeof saved.full_day_minutes_threshold === "number") setFullDayMinutes(saved.full_day_minutes_threshold);
        setOvernightShiftsEnabled(saved.overnight_shifts_enabled === true);
        setRemoteAttendanceEnabled(saved.remote_attendance_enabled === true);
        if (
          saved.overtime_policy_mode === "duration" ||
          saved.overtime_policy_mode === "none"
        ) {
          setOvertimePolicyMode(saved.overtime_policy_mode);
        }
      }
      await refreshUser();
      success.showSuccess({
        title: translate("leave.changesSaved"),
        description: translate("settings.savedDescription"),
      });
      setSaveError(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : translate("settings.failedUpdatePolicy"));
    } finally {
      setSaving(false);
    }
  }

  async function handleAddHoliday() {
    setHolidayError(null);
    if (!holidayDate.trim()) {
      setHolidayError(translate("settings.holidayDateRequired"));
      return;
    }
    if (!holidayName.trim()) {
      setHolidayError(translate("settings.holidayNameRequired"));
      return;
    }
    setHolidayBusy(true);
    try {
      const res = await safeApi(holidaysApi.createHoliday({
        holiday_date: holidayDate.trim(),
        name: holidayName.trim(),
        is_paid: holidayPaid,
      }));
      if (isApiError(res)) {
        setHolidayError(res.error ?? translate("settings.failedAddHoliday"));
        return;
      }
      setHolidayName("");
      setHolidayDate("");
      setHolidayError(null);
      await loadHolidays();
    } finally {
      setHolidayBusy(false);
    }
  }

  if (loading && !policy) {
    return (
      <MainContent>
        <LoadingState message={translate("settings.loading")} className="min-h-[240px]" />
      </MainContent>
    );
  }

  if (error) {
    return (
      <MainContent>
        <ErrorState message={toUserFacingApiError(error)} onRetry={load} />
      </MainContent>
    );
  }

  return (
    <MainContent>
      <div className="space-y-8">
        <ReportsPageHeader
          title={translate("navigation.settings")}
          subtitle={translate("settings.subtitle")}
        />

        {success.banner}
        {saveError && (
          <div className="alert-error max-w-3xl px-3 py-2">{saveError}</div>
        )}

        <div className="max-w-3xl space-y-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <PayrollSection title={translate("payroll.payrollConfiguration")}>
              <Card>
            <div className="space-y-4">
              {canEditCurrency ? (
                <>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={payrollEnabled}
                      onChange={(e) => {
                        const next = e.target.checked;
                        if (!next && payrollDisableBlocked) {
                            setSaveError(translate("payroll.payrollCannotDisable"));
                          return;
                        }
                        setSaveError(null);
                        setPayrollEnabled(next);
                      }}
                      disabled={!canEdit}
                      className="mt-1 h-4 w-4 rounded border border-[color:var(--border-soft)] disabled:opacity-50"
                    />
                    <span>
                      <span className="block text-sm font-medium text-theme">{translate("payroll.enablePayroll")}</span>
                      <span className="mt-0.5 block text-xs text-theme-muted">
                        {translate("payroll.enablePayrollHelp")}
                      </span>
                      {payrollDisableBlocked && payrollEnabled ? (
                        <div className="callout-warning mt-2 text-xs font-medium" role="note">
                          {translate("payroll.payrollCannotDisableWhileData")}
                        </div>
                      ) : null}
                    </span>
                  </label>

                  <div>
                    <label htmlFor="currency_code" className="mb-1 block text-sm font-medium text-theme">
                      {translate("payroll.currency")}
                    </label>
                    <Select
                      id="currency_code"
                      value={currencyCode}
                      onChange={(e) => setCurrencyCode(e.target.value as "GHS" | "USD")}
                      disabled={!canEdit}
                    >
                      <option value="GHS">GHS</option>
                      <option value="USD">USD</option>
                    </Select>
                    <p className="mt-1 text-xs text-theme-muted">
                      {translate("payroll.currencyChangeBlocked")}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="business_timezone" className="mb-1 block text-sm font-medium text-theme">
                      {translate("payroll.businessTimeZone")}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <div className="min-w-[220px] flex-1">
                        <Select
                          value={businessTimezone}
                          onChange={(e) => setBusinessTimezone(e.target.value)}
                          disabled={!canEdit}
                          aria-label={translate("payroll.businessTimeZonePresets")}
                        >
                          <option value="Africa/Accra">Africa/Accra (Ghana)</option>
                          <option value="UTC">UTC</option>
                          <option value="Africa/Lagos">Africa/Lagos</option>
                          <option value="Africa/Nairobi">Africa/Nairobi</option>
                          <option value="Europe/London">Europe/London</option>
                        </Select>
                      </div>
                      <input
                        id="business_timezone"
                        type="text"
                        value={businessTimezone}
                        onChange={(e) => setBusinessTimezone(e.target.value)}
                        disabled={!canEdit}
                        placeholder={translate("payroll.customTimezonePlaceholder")}
                        className="input-field min-w-[220px] flex-1"
                      />
                    </div>
                    <p className="mt-1 text-xs text-theme-muted">
                      {translate("payroll.businessTimeZoneHelp")}
                    </p>
                  </div>
                </>
              ) : null}

              <div className="border-t pt-4" style={{ borderColor: "var(--border-soft)" }}>
                <p className="text-sm font-medium text-theme">{translate("payroll.workingWeek")}</p>
                <p className="mt-1 text-xs text-theme-muted">
                  {translate("payroll.workingWeekHelp")}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {WEEKDAY_OPTIONS.map((d) => (
                    <label key={d.v} className="flex cursor-pointer items-center gap-2 text-sm text-theme">
                      <input
                        type="checkbox"
                        checked={workingWeekdays.includes(d.v)}
                        disabled={!canEdit || !canEditSchedule}
                        onChange={(e) => {
                          if (!canEditSchedule) return;
                          if (e.target.checked) {
                            setWorkingWeekdays(Array.from(new Set([...workingWeekdays, d.v])).sort((a, b) => a - b));
                          } else {
                            setWorkingWeekdays(workingWeekdays.filter((x) => x !== d.v));
                          }
                        }}
                        className="h-4 w-4 rounded border border-[color:var(--border-soft)] disabled:opacity-50"
                      />
                      {translate(`leave.weekdays.${d.labelKey}`)}
                    </label>
                  ))}
                </div>
                {!canEditSchedule && (
                  <p className="mt-2 text-xs text-theme-muted">{translate("payroll.onlyAdminHrSchedule")}</p>
                )}
              </div>
            </div>
              </Card>
            </PayrollSection>

            <PayrollSection title={translate("settings.attendanceConfiguration")}>
              <Card>
            <div className="space-y-4">
              {canEditCurrency ? (
                <>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={remoteAttendanceEnabled}
                      onChange={(e) => setRemoteAttendanceEnabled(e.target.checked)}
                      disabled={!canEdit}
                      className="mt-1 h-4 w-4 rounded border border-[color:var(--border-soft)] disabled:opacity-50"
                      aria-label={translate("settings.enableRemoteAttendance")}
                    />
                    <span>
                      <span className="block text-sm font-medium text-theme">{translate("settings.remoteAttendance")}</span>
                      <span className="mt-0.5 block text-xs text-theme-muted">
                        {translate("settings.remoteAttendanceHelp")}
                      </span>
                    </span>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={overnightShiftsEnabled}
                      onChange={(e) => setOvernightShiftsEnabled(e.target.checked)}
                      disabled={!canEdit}
                      className="mt-1 h-4 w-4 rounded border border-[color:var(--border-soft)] disabled:opacity-50"
                    />
                    <span>
                      <span className="block text-sm font-medium text-theme">{translate("settings.overnightShifts")}</span>
                      <span className="mt-0.5 block text-xs text-theme-muted">
                        {translate("settings.overnightShiftsHelp")}
                      </span>
                    </span>
                  </label>

                  <div className="border-t pt-4" style={{ borderColor: "var(--border-soft)" }}>
                    <p className="text-sm font-medium text-theme">{translate("settings.attendanceDayClassification")}</p>
                    <p className="mt-1 text-xs text-theme-muted">
                      {translate("settings.attendanceDayClassificationHelp")}
                    </p>
                    <label className="mt-3 flex cursor-pointer items-start gap-2">
                      <input
                        type="checkbox"
                        checked={attendanceDayClassificationEnabled}
                        onChange={(e) => setAttendanceDayClassificationEnabled(e.target.checked)}
                        disabled={!canEdit}
                        className="mt-1 h-4 w-4 rounded border border-[color:var(--border-soft)] disabled:opacity-50"
                      />
                      <span>
                        <span className="block text-sm font-medium text-theme">{translate("settings.enableAttendanceDayClassification")}</span>
                        <span className="mt-0.5 block text-xs text-theme-muted">
                          {translate("settings.enableAttendanceDayClassificationHelp")}
                        </span>
                      </span>
                    </label>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-theme-muted">
                          {translate("settings.minimumMinutesCounted")}
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={1440}
                          step={1}
                          value={minMinutesCounted}
                          onChange={(e) => setMinMinutesCounted(Number(e.target.value) || 0)}
                          disabled={!canEdit}
                          className="input-field w-full"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-theme-muted">
                          {translate("settings.fullDayThresholdMinutes")}
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={1440}
                          step={1}
                          value={fullDayMinutes}
                          onChange={(e) => setFullDayMinutes(Number(e.target.value) || 0)}
                          disabled={!canEdit}
                          className="input-field w-full"
                        />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-theme-muted">
                      {translate("settings.classificationTip")}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-theme-muted">
                  {translate("settings.onlyAdminAttendance")}
                </p>
              )}

              <div className="space-y-3 border-t pt-4" style={{ borderColor: "var(--border-soft)" }}>
                <label className="flex cursor-pointer items-start gap-2">
                  <input
                    id="lateness_tracking_enabled"
                    type="checkbox"
                    checked={latenessTrackingEnabled}
                    onChange={(e) => setLatenessTrackingEnabled(e.target.checked)}
                    disabled={!canEdit}
                    className="mt-1 h-4 w-4 rounded border border-[color:var(--border-soft)] disabled:opacity-50"
                  />
                  <span>
                    <span className="text-sm font-medium text-theme">{translate("settings.latenessTracking")}</span>
                    <span className="mt-0.5 block text-xs text-theme-muted">
                      {translate("settings.latenessTrackingHelp")}
                    </span>
                  </span>
                </label>
                <label className={`flex items-start gap-2 ${payrollEnabled ? "cursor-pointer" : "opacity-60"}`}>
                  <input
                    id="late_pay_deduction_enabled"
                    type="checkbox"
                    checked={latePayDeductionEnabled}
                    onChange={(e) => setLatePayDeductionEnabled(e.target.checked)}
                    disabled={!canEdit || !payrollEnabled}
                    className="mt-1 h-4 w-4 rounded border border-[color:var(--border-soft)] disabled:opacity-50"
                  />
                  <span>
                    <span className="text-sm font-medium text-theme">{translate("settings.latePayDeduction")}</span>
                    <span className="mt-0.5 block text-xs text-theme-muted">
                      {translate("settings.latePayDeductionHelp")}
                    </span>
                    {!payrollEnabled ? (
                      <div className="callout-warning mt-2 text-xs font-medium" role="note">
                        {translate("settings.turnOnPayrollForDeductions")}
                      </div>
                    ) : null}
                  </span>
                </label>
                {latePayDeductionEnabled ? (
                  <div className="pl-6">
                    <DateInput
                      id="late_pay_deduction_effective_from"
                      label={translate("settings.effectivePolicyDate")}
                      value={latePayDeductionEffectiveFrom}
                      onChange={(e) => setLatePayDeductionEffectiveFrom(e.target.value)}
                      disabled={!canEdit || !payrollEnabled}
                      required
                      hint={translate("settings.effectivePolicyDateHint")}
                    />
                  </div>
                ) : null}
              </div>
            </div>
              </Card>
            </PayrollSection>

            <PayrollSection title={translate("payroll.overtimeConfiguration")}>
              <Card>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-theme">{translate("payroll.overtimePolicy")}</p>
                <p className="mt-1 text-xs text-theme-muted">
                  {translate("payroll.overtimePolicyHelp")}
                </p>
                <fieldset className="mt-3 space-y-2" disabled={!canEdit}>
                  <legend className="mb-1 text-xs font-medium text-theme-muted">{translate("payroll.activeModes")}</legend>
                  {ACTIVATED_OVERTIME_POLICY_MODES.map((mode) => (
                    <label
                      key={mode}
                      className="flex cursor-pointer items-start gap-2 rounded-md border border-theme-border px-3 py-2"
                    >
                      <input
                        type="radio"
                        name="overtime_policy_mode"
                        value={mode}
                        checked={overtimePolicyMode === mode}
                        onChange={() => setOvertimePolicyMode(mode)}
                        className="mt-1"
                      />
                      <span className="text-sm text-theme">
                        {overtimePolicyModeLabel(mode)}
                        {mode === "duration" ? (
                          <span className="ml-1 text-xs text-theme-muted">{translate("payroll.dailyAggregation")}</span>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </fieldset>
              </div>

              <div className="border-t pt-4" style={{ borderColor: "var(--border-soft)" }}>
                <p className="text-sm font-medium text-theme">{translate("payroll.otCompensationMethod")}</p>
                <p className="mt-1 text-xs text-theme-muted">
                  {translate("payroll.otCompensationHelp")}
                </p>
                <fieldset className="mt-3 space-y-2" disabled={!canEdit}>
                  {(["multiplier", "fixed_rate"] as const).map((method) => (
                    <label
                      key={method}
                      className="flex cursor-pointer items-start gap-2 rounded-md border border-theme-border px-3 py-2"
                    >
                      <input
                        type="radio"
                        name="overtime_compensation_method"
                        value={method}
                        checked={overtimeCompensationMethod === method}
                        onChange={() => setOvertimeCompensationMethod(method)}
                        className="mt-1"
                      />
                      <span className="text-sm text-theme">
                        {overtimeCompensationMethodLabel(method)}
                      </span>
                    </label>
                  ))}
                </fieldset>
              </div>

              {overtimeCompensationMethod === "fixed_rate" ? (
                <div>
                  <label
                    htmlFor="fixed_overtime_hourly_rate"
                    className="mb-1 block text-sm font-medium text-theme"
                  >
                    {translate("payroll.fixedOtRate")}
                  </label>
                  <input
                    id="fixed_overtime_hourly_rate"
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={fixedOvertimeHourlyRate}
                    onChange={(e) =>
                      setFixedOvertimeHourlyRate(Number(e.target.value) || 0)
                    }
                    disabled={!canEdit}
                    className="input-field w-full"
                  />
                  <p className="mt-0.5 text-xs text-theme-muted">
                    {translate("payroll.fixedOtExample", { values: { example: `${currencyCode}20` } })}
                  </p>
                </div>
              ) : (
                <div>
                  <label htmlFor="overtime_multiplier" className="mb-1 block text-sm font-medium text-theme">
                    {translate("payroll.overtimeMultiplier")}
                  </label>
                  <input
                    id="overtime_multiplier"
                    type="number"
                    min={1}
                    max={3}
                    step={0.1}
                    value={overtimeMultiplier}
                    onChange={(e) => setOvertimeMultiplier(Number(e.target.value) || 1.5)}
                    disabled={!canEdit}
                    className="input-field w-full"
                  />
                  <p className="mt-0.5 text-xs text-theme-muted">{translate("payroll.overtimeMultiplierHelp")}</p>
                </div>
              )}

              <div className="border-t pt-4" style={{ borderColor: "var(--border-soft)" }}>
                <label htmlFor="default_daily_hours" className="mb-1 block text-sm font-medium text-theme">
                  {translate("payroll.defaultDailyHours")}
                </label>
                <input
                  id="default_daily_hours"
                  type="number"
                  min={1}
                  max={24}
                  step={0.5}
                  value={defaultDailyHours}
                  onChange={(e) => setDefaultDailyHours(Number(e.target.value) || 8)}
                  disabled={!canEdit}
                  className="input-field w-full"
                />
                <p className="mt-0.5 text-xs text-theme-muted">{translate("payroll.defaultDailyHoursHelp")}</p>
              </div>
            </div>
              </Card>
            </PayrollSection>

            {canEdit && (
              <div>
                <Button type="submit" loading={saving}>
                  {translate("settings.saveChanges")}
                </Button>
              </div>
            )}
            {!canEdit && (
              <p className="text-sm text-theme-muted">{translate("payroll.viewPolicyOnly")}</p>
            )}
          </form>

          <PayrollSection title={translate("leave.companyHolidays")}>
            <Card>
          <div className="space-y-4">
            <p className="text-xs text-theme-muted">
              {translate("settings.holidaysHelp")}
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-theme-muted" htmlFor="holiday-year">
                  {translate("leave.year")}
                </label>
                <input
                  id="holiday-year"
                  type="number"
                  min={2000}
                  max={2100}
                  value={holidayYear}
                  onChange={(e) => setHolidayYear(Number(e.target.value) || holidayYear)}
                  className="input-field w-24 py-1.5"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-theme-muted" htmlFor="holiday-month">
                  {translate("leave.month")}
                </label>
                <Select
                  id="holiday-month"
                  value={String(holidayMonth)}
                  onChange={(e) => setHolidayMonth(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {holidayError ? (
              <div className="alert-error px-3 py-2 text-sm">{holidayError}</div>
            ) : null}

            {canEditSchedule ? (
              <div className="surface-callout grid gap-3 p-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <DateInput
                    id="holiday-date"
                    label={translate("payroll.date")}
                    value={holidayDate}
                    onChange={(e) => {
                      setHolidayDate(e.target.value);
                      setHolidayError(null);
                    }}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-theme-muted" htmlFor="holiday-name">
                    {translate("departments.name")}
                  </label>
                  <input
                    id="holiday-name"
                    value={holidayName}
                    onChange={(e) => {
                      setHolidayName(e.target.value);
                      setHolidayError(null);
                    }}
                    className="input-field mt-1 w-full py-1.5"
                    placeholder={translate("settings.holidayNamePlaceholder")}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-theme">
                  <input
                    type="checkbox"
                    checked={holidayPaid}
                    onChange={(e) => setHolidayPaid(e.target.checked)}
                  />
                  {translate("settings.paidHoliday")}
                </label>
                <div className="flex items-end">
                  <Button
                    type="button"
                    size="sm"
                    disabled={holidayBusy}
                    loading={holidayBusy}
                    onClick={() => void handleAddHoliday()}
                  >
                    {translate("settings.addHoliday")}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-theme-muted">{translate("settings.onlyAdminHrHolidays")}</p>
            )}

            {holidaysLoading ? (
              <p className="text-sm text-theme-muted">{translate("settings.loadingHolidays")}</p>
            ) : holidays.length === 0 ? (
              <EmptyState
                title={translate("settings.noHolidays")}
                description={translate("settings.noHolidaysMonth")}
                icon={<CalendarX className="h-5 w-5" />}
              />
            ) : (
              <ul
                className="divide-y divide-[color:var(--border-soft)] rounded-md border"
                style={{ borderColor: "var(--border-soft)", background: "var(--surface)" }}
              >
                {holidays.map((h) => (
                  <li key={h.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="font-medium text-theme">
                      {h.holiday_date} — {h.name}{" "}
                      <span className="text-theme-muted">({h.is_paid ? translate("settings.paid") : translate("settings.unpaid")})</span>
                    </span>
                    {canEditSchedule ? (
                      <Button
                        type="button"
                        variant="dangerGhost"
                        size="sm"
                        leftIcon={<Trash2 className="h-3.5 w-3.5" aria-hidden />}
                        onClick={async () => {
                          if (!confirm(translate("settings.removeHolidayConfirm"))) return;
                          const res = await safeApi(holidaysApi.deleteHoliday(h.id));
                          if (isApiError(res)) {
                            toast.error(res.error);
                            return;
                          }
                          await loadHolidays();
                        }}
                      >
                        {translate("settings.remove")}
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
            </Card>
          </PayrollSection>

          <LeaveTypeCompensationSection canEdit={canEditSchedule} />
        </div>
      </div>
    </MainContent>
  );
}
