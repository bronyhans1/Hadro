"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MainContent } from "@/components/layout/MainContent";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { AttendanceSection } from "@/components/attendance/AttendanceSection";
import { RemoteReviewPageHeader } from "@/components/attendance/remote-review/RemoteReviewPageHeader";
import { RemoteReviewSummary } from "@/components/attendance/remote-review/RemoteReviewSummary";
import { RemoteReviewAttentionPanel } from "@/components/attendance/remote-review/RemoteReviewAttentionPanel";
import { RemoteReviewTable } from "@/components/attendance/remote-review/RemoteReviewTable";
import { RemoteReviewModal } from "@/components/attendance/remote-review/RemoteReviewModal";
import { useToast } from "@/components/ui/ToastProvider";
import { useAuth } from "@/lib/auth/AuthContext";
import { canAccessManagerFeatures } from "@/lib/auth/roles";
import * as remoteApi from "@/lib/api/remoteAttendance.api";
import { isApiError } from "@/lib/types/api";
import type { RemoteSessionRow } from "@/lib/api/remoteAttendance.api";
import { safeApi } from "@/lib/api/safeApi";
import { toUserFacingApiError } from "@/lib/api/userFacingError";
import {
  buildRemoteReviewAttentionItems,
  computeRemoteReviewSummary,
} from "@/lib/attendance/remoteReviewUtils";
import { formatBusinessDateTime } from "@/lib/utils/businessDateTime";
import { translate } from "@/lib/i18n";

export default function RemoteAttendanceReviewPage() {
  const { user } = useAuth();
  const toast = useToast();
  const isManager = canAccessManagerFeatures(user?.roles);
  const businessTz = user?.businessTimeZone ?? "Africa/Accra";

  const [rows, setRows] = useState<RemoteSessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reviewModal, setReviewModal] = useState<{
    row: RemoteSessionRow;
    action: "approve" | "reject";
  } | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const formatWhen = useCallback(
    (iso: string | null) => (iso ? formatBusinessDateTime(iso, businessTz) : "—"),
    [businessTz]
  );

  const load = useCallback(async () => {
    if (!isManager) return;
    setError(null);
    setLoading(true);
    try {
      const res = await safeApi(remoteApi.getPendingRemoteSessions());
      if (isApiError(res)) {
        setError(res.error);
        setRows([]);
        return;
      }
      setRows(res.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : translate("attendance.failedToLoad"));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => {
    void load();
  }, [load]);

  const summaryMetrics = useMemo(() => computeRemoteReviewSummary(rows), [rows]);
  const attentionItems = useMemo(
    () => buildRemoteReviewAttentionItems(rows, formatWhen),
    [rows, formatWhen]
  );

  async function submitReview() {
    if (!reviewModal) return;
    const { row, action } = reviewModal;
    setActionLoading(`${action}:${row.id}`);
    try {
      const res =
        action === "approve"
          ? await safeApi(remoteApi.approveRemoteSession(row.id, reviewNote.trim() || undefined))
          : await safeApi(remoteApi.rejectRemoteSession(row.id, reviewNote.trim() || undefined));
      if (isApiError(res)) {
        toast.error(res.error);
        return;
      }
      toast.success(
        action === "approve" ? translate("attendance.remoteSessionApproved") : translate("attendance.remoteSessionRejected")
      );
      setReviewModal(null);
      setReviewNote("");
      await load();
    } finally {
      setActionLoading(null);
    }
  }

  if (!isManager) {
    return (
      <MainContent>
        <EmptyState
          title={translate("attendance.accessRestricted")}
          description={translate("attendance.managerAccessRequired")}
        />
      </MainContent>
    );
  }

  if (loading && rows.length === 0 && !error) {
    return (
      <MainContent>
        <div className="space-y-8">
          <RemoteReviewPageHeader onRefresh={() => void load()} loading />
          <RemoteReviewSummary metrics={summaryMetrics} loading />
          <LoadingState message={translate("attendance.loadingPendingRemote")} className="min-h-[240px]" />
        </div>
      </MainContent>
    );
  }

  if (error && rows.length === 0) {
    return (
      <MainContent>
        <div className="space-y-8">
          <RemoteReviewPageHeader onRefresh={() => void load()} />
          <ErrorState message={toUserFacingApiError(error)} onRetry={() => void load()} />
        </div>
      </MainContent>
    );
  }

  return (
    <MainContent>
      <div className="space-y-8">
        <RemoteReviewPageHeader onRefresh={() => void load()} loading={loading} />

        <AttendanceSection title={translate("attendance.reviewSummary")} description={translate("attendance.queueStatus")}>
          <RemoteReviewSummary metrics={summaryMetrics} loading={loading && rows.length === 0} />
        </AttendanceSection>

        <AttendanceSection title={translate("attendance.attention")} description={translate("attendance.attentionQueue")}>
          <RemoteReviewAttentionPanel items={attentionItems} />
        </AttendanceSection>

        <RemoteReviewTable
          rows={rows}
          loading={loading}
          actionLoading={actionLoading}
          formatWhen={formatWhen}
          onApprove={(row) => {
            setReviewModal({ row, action: "approve" });
            setReviewNote("");
          }}
          onReject={(row) => {
            setReviewModal({ row, action: "reject" });
            setReviewNote("");
          }}
        />
      </div>

      <RemoteReviewModal
        reviewModal={reviewModal}
        reviewNote={reviewNote}
        actionLoading={Boolean(actionLoading)}
        formatWhen={formatWhen}
        onClose={() => setReviewModal(null)}
        onNoteChange={setReviewNote}
        onSubmit={() => void submitReview()}
      />
    </MainContent>
  );
}
