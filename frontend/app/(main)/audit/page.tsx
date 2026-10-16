"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MainContent } from "@/components/layout/MainContent";
import { Card } from "@/components/ui/Card";
import { DateRangeFilter } from "@/components/ui/DateRangeFilter";
import { DataTable } from "@/components/ui/DataTable";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { AccessDeniedState } from "@/components/ui/AccessDeniedState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ReportDatePresetButtons } from "@/components/ui/ReportDatePresetButtons";
import { PayrollSection } from "@/components/payroll/PayrollSection";
import { ReportsPageHeader } from "@/components/reports/ReportsPageHeader";
import { ReportsFilterSubsection } from "@/components/reports/ReportsFilterSubsection";
import { useAuth } from "@/lib/auth/AuthContext";
import { hasRole, AUDIT_VIEW_ROLES } from "@/lib/auth/roles";
import * as auditApi from "@/lib/api/audit.api";
import * as usersApi from "@/lib/api/users.api";
import { isApiError } from "@/lib/types/api";
import { translate } from "@/lib/i18n";
import { getCurrentMonthRange } from "@/lib/utils/date";
import type { AuditLog } from "@/lib/api/audit.api";
import { buildEmployeeDisplayById, presentAuditLog } from "@/lib/audit/auditPresentation";
import { formatBusinessDateTime } from "@/lib/utils/businessDateTime";
import { safeApi } from "@/lib/api/safeApi";

function ActorCell({ name, email }: { name?: string | null; email?: string | null }) {
  const displayName = name?.trim() || null;
  const displayEmail = email?.trim() || null;

  if (!displayName && !displayEmail) {
    return <span className="text-sm text-theme-muted">—</span>;
  }

  if (displayName && displayEmail) {
    return (
      <div>
        <div className="font-medium text-theme">{displayName}</div>
        <div className="text-xs text-theme-muted">{displayEmail}</div>
      </div>
    );
  }

  return <div className="font-medium text-theme">{displayName ?? displayEmail}</div>;
}

export default function AuditActivityPage() {
  const { user, isLoading } = useAuth();
  const businessTz = user?.businessTimeZone ?? "Africa/Accra";

  const canViewAudit = hasRole(user?.roles, AUDIT_VIEW_ROLES);
  const { start: defaultStart, end: defaultEnd } = getCurrentMonthRange();

  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [actorId, setActorId] = useState("");
  const [actionType, setActionType] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<auditApi.AuditLog[]>([]);
  const [employeeDisplayById, setEmployeeDisplayById] = useState<ReadonlyMap<string, string>>(
    () => new Map()
  );

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [logsRes, usersRes] = await Promise.all([
        safeApi(auditApi.getCompanyAuditLogs()),
        safeApi(usersApi.getUsers()),
      ]);
      if (isApiError(logsRes)) {
        setError(logsRes.error);
        setLogs([]);
      } else {
        setLogs(logsRes.data);
      }
      if (!isApiError(usersRes)) {
        setEmployeeDisplayById(buildEmployeeDisplayById(usersRes.data));
      } else {
        setEmployeeDisplayById(new Map());
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : translate("audit.failedLoadActivity"));
      setLogs([]);
      setEmployeeDisplayById(new Map());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;
    if (!canViewAudit) return;
    load();
  }, [isLoading, canViewAudit, load]);

  const filteredLogs = useMemo(() => {
    const actorQuery = actorId.trim().toLowerCase();
    const actionQuery = actionType.trim().toLowerCase();
    const startMs = new Date(start + "T00:00:00").getTime();
    const endMs = new Date(end + "T23:59:59.999").getTime();

    return logs.filter((l) => {
      const ts = new Date(l.created_at).getTime();
      if (!Number.isNaN(startMs) && !Number.isNaN(endMs)) {
        if (Number.isNaN(ts) || ts < startMs || ts > endMs) return false;
      }
      if (actorQuery && !(l.actor_id ?? "").toLowerCase().includes(actorQuery)) {
        return false;
      }
      if (actionQuery && !(l.action ?? "").toLowerCase().includes(actionQuery)) {
        return false;
      }
      return true;
    });
  }, [logs, start, end, actorId, actionType]);

  const auditPresentationOpts = useMemo(() => ({ employeeDisplayById }), [employeeDisplayById]);

  const presentedLogs = useMemo(() => {
    return filteredLogs.map((log) => {
      const presented = presentAuditLog(log, auditPresentationOpts);
      return {
        ...log,
        presentedActionLabel: presented.actionLabel,
        presentedTargetLabel: presented.targetLabel,
        presentedDetail: presented.detail,
      };
    });
  }, [filteredLogs, auditPresentationOpts]);

  const columns = useMemo<
    { key: string; header: string; render?: (row: AuditLog & {
      presentedActionLabel: string;
      presentedTargetLabel: string;
      presentedDetail?: string | null;
    }) => React.ReactNode }[]
  >(
    () => [
      {
        key: "created_at",
        header: translate("audit.timestamp"),
        render: (row) => (
          <span className="whitespace-nowrap text-sm text-theme">
            {formatBusinessDateTime(row.created_at, businessTz)}
          </span>
        ),
      },
      {
        key: "action",
        header: translate("audit.action"),
        render: (row) => <span className="text-sm text-theme">{row.presentedActionLabel}</span>,
      },
      {
        key: "actor_id",
        header: translate("audit.actor"),
        render: (row) => <ActorCell name={row.actor_name} email={row.actor_email} />,
      },
      {
        key: "entity_type",
        header: translate("audit.target"),
        render: (row) => <span className="max-w-[280px] text-sm text-theme">{row.presentedTargetLabel}</span>,
      },
      {
        key: "metadata",
        header: translate("audit.details"),
        render: (row) =>
          row.presentedDetail ? (
            <span className="max-w-[520px] text-sm text-theme">{row.presentedDetail}</span>
          ) : (
            <span className="text-sm text-theme-muted">—</span>
          ),
      },
    ],
    [businessTz]
  );

  if (isLoading || loading) {
    return (
      <MainContent>
        <LoadingState message={translate("audit.loadingActivity")} className="min-h-[240px]" />
      </MainContent>
    );
  }

  if (!canViewAudit) {
    return (
      <MainContent title={translate("audit.auditAndActivity")}>
        <AccessDeniedState />
      </MainContent>
    );
  }

  if (error) {
    return (
      <MainContent>
        <ErrorState message={error} onRetry={load} />
      </MainContent>
    );
  }

  return (
    <MainContent>
      <div className="space-y-8">
        <ReportsPageHeader
          title={translate("audit.auditAndActivity")}
          subtitle={translate("audit.auditSubtitle")}
        />

        <PayrollSection title={translate("reports.filters")}>
          <Card>
            <div className="space-y-5">
              <ReportsFilterSubsection title={translate("reports.quickRange")}>
                <ReportDatePresetButtons
                  hideLabel
                  start={start}
                  end={end}
                  onSelect={(s, e) => {
                    setStart(s);
                    setEnd(e);
                  }}
                />
              </ReportsFilterSubsection>

              <ReportsFilterSubsection title={translate("attendance.dateRange")}>
                <DateRangeFilter
                  start={start}
                  end={end}
                  onStartChange={setStart}
                  onEndChange={setEnd}
                  onApply={() => undefined}
                  showApply={false}
                />
              </ReportsFilterSubsection>

              <div className="flex flex-wrap items-end gap-4">
                <div className="min-w-[12rem] flex-1">
                  <label htmlFor="audit-actor" className="mb-1 block text-xs font-medium text-theme-muted">
                    {translate("audit.actor")}
                  </label>
                  <input
                    id="audit-actor"
                    type="text"
                    value={actorId}
                    onChange={(e) => setActorId(e.target.value)}
                    placeholder={translate("audit.searchByNameOrEmail")}
                    className="input-field w-full max-w-md"
                  />
                </div>
                <div className="min-w-[12rem] flex-1">
                  <label htmlFor="audit-action" className="mb-1 block text-xs font-medium text-theme-muted">
                    {translate("audit.action")}
                  </label>
                  <input
                    id="audit-action"
                    type="text"
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    placeholder={translate("audit.searchActions")}
                    className="input-field w-full max-w-md"
                  />
                </div>
              </div>
            </div>
          </Card>
        </PayrollSection>

        <PayrollSection title={translate("audit.activityLog")}>
          {logs.length === 0 ? (
            <EmptyState
              title={translate("audit.noActivityYet")}
              description={translate("audit.activityWillAppear")}
            />
          ) : filteredLogs.length === 0 ? (
            <EmptyState message={translate("audit.noEventsMatchFilters")} />
          ) : (
            <DataTable
              columns={columns}
              data={presentedLogs}
              keyExtractor={(row) => row.id}
              emptyMessage={translate("common.noData")}
            />
          )}
        </PayrollSection>
      </div>
    </MainContent>
  );
}
