"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MainContent } from "@/components/layout/MainContent";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/FormControls";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { Badge } from "@/components/ui/Badge";
import * as platformApi from "@/lib/api/platform.api";
import type { OnboardingRequest, OnboardingRequestStatus } from "@/lib/api/onboarding.api";
import { isApiError } from "@/lib/types/api";
import { safeApi } from "@/lib/api/safeApi";
import { formatOnboardingStatusLabel } from "@/lib/format/displayLabels";
import { translate } from "@/lib/i18n";
import { toUserFacingApiError } from "@/lib/api/userFacingError";

const STATUSES: OnboardingRequestStatus[] = [
  "interested",
  "contacted",
  "demo_scheduled",
  "onboarded",
  "rejected",
];

function statusVariant(status: OnboardingRequestStatus): "pending" | "info" | "approved" | "success" | "danger" {
  if (status === "interested") return "pending";
  if (status === "contacted") return "info";
  if (status === "demo_scheduled") return "approved";
  if (status === "onboarded") return "success";
  return "danger";
}

export default function PlatformOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<OnboardingRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | OnboardingRequestStatus>("");
  const [selected, setSelected] = useState<OnboardingRequest | null>(null);
  const [statusDraft, setStatusDraft] = useState<OnboardingRequestStatus>("interested");
  const [notesDraft, setNotesDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await safeApi(
      platformApi.listOnboardingRequests({
        search: search || undefined,
        status: statusFilter || undefined,
        page: 1,
        limit: 50,
      })
    );
    setLoading(false);
    if (isApiError(res)) {
      setError(toUserFacingApiError(res.error, translate("platform.failedLoadOnboarding")));
      return;
    }
    setRows(res.data?.rows ?? []);
    setTotal(res.data?.total ?? 0);
  }, [search, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  function openRow(row: OnboardingRequest) {
    setSelected(row);
    setStatusDraft(row.status);
    setNotesDraft(row.admin_notes ?? "");
  }

  async function saveSelected() {
    if (!selected) return;
    setSaving(true);
    const res = await safeApi(
      platformApi.updateOnboardingRequest(selected.id, {
        status: statusDraft,
        admin_notes: notesDraft.trim() || null,
      })
    );
    setSaving(false);
    if (isApiError(res)) {
      setError(toUserFacingApiError(res.error, translate("platform.failedUpdateRequest")));
      return;
    }
    setSelected(res.data ?? null);
    await load();
  }

  return (
    <MainContent
      title={translate("navigation.onboardingRequests")}
      subtitle={translate("platform.onboardingSubtitle")}
    >
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <Input
            label={translate("common.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={translate("platform.onboardingSearchPlaceholder")}
            className="sm:max-w-xs"
          />
          <Select
            label={translate("attendance.status")}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "" | OnboardingRequestStatus)}
            className="sm:max-w-[12rem]"
          >
            <option value="">{translate("common.all")}</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatOnboardingStatusLabel(s)}
              </option>
            ))}
          </Select>
          <Button type="button" variant="secondary" onClick={() => void load()}>
            Refresh
          </Button>
        </div>

        {error ? <div className="alert-error mt-4 px-3 py-2">{error}</div> : null}

        {loading ? (
          <LoadingState message={translate("platform.loadingRequests")} className="mt-6 min-h-[200px]" />
        ) : rows.length === 0 ? (
          <EmptyState
            className="mt-6"
            title={translate("platform.noOnboardingRequests")}
            description={translate("platform.onboardingWillAppear")}
          />
        ) : (
          <div className="mt-6 overflow-x-auto">
            <p className="mb-3 text-sm text-theme-muted">{total} request{total === 1 ? "" : "s"}</p>
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-theme-muted" style={{ borderColor: "var(--border-soft)" }}>
                  <th className="py-2 pr-3">{translate("common.company")}</th>
                  <th className="py-2 pr-3">{translate("support.contact")}</th>
                  <th className="py-2 pr-3">{translate("platform.industry")}</th>
                  <th className="py-2 pr-3">{translate("attendance.status")}</th>
                  <th className="py-2 pr-3">{translate("attendance.submitted")}</th>
                  <th className="py-2"> </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b" style={{ borderColor: "var(--border-soft)" }}>
                    <td className="py-3 pr-3 font-medium">{row.company_name}</td>
                    <td className="py-3 pr-3">
                      <div>{row.full_name}</div>
                      <div className="text-xs text-theme-muted">{row.work_email}</div>
                    </td>
                    <td className="py-3 pr-3 text-theme-muted">{row.industry ?? "—"}</td>
                    <td className="py-3 pr-3">
                      <Badge variant={statusVariant(row.status)}>{formatOnboardingStatusLabel(row.status)}</Badge>
                    </td>
                    <td className="py-3 pr-3 text-theme-muted">
                      {new Date(row.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <Button type="button" variant="link" onClick={() => openRow(row)}>
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selected ? (
        <Card className="mt-6" title={`${selected.company_name} — review`}>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <p>
              <span className="font-semibold">{translate("support.contact")}:</span> {selected.full_name} · {selected.work_email}
            </p>
            <p>
              <span className="font-semibold">{translate("attendance.phone")}:</span> {selected.phone ?? "—"}
            </p>
            <p>
              <span className="font-semibold">{translate("employees.role")}:</span> {selected.role ?? "—"}
            </p>
            <p>
              <span className="font-semibold">{translate("navigation.employees")}:</span> {selected.employee_count ?? "—"}
            </p>
            <p>
              <span className="font-semibold">{translate("platform.location")}:</span>{" "}
              {[selected.city, selected.country].filter(Boolean).join(", ") || "—"}
            </p>
            <p>
              <span className="font-semibold">{translate("attendance.note")}:</span> {selected.notes ?? "—"}
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Select
              label={translate("attendance.status")}
              value={statusDraft}
              onChange={(e) => setStatusDraft(e.target.value as OnboardingRequestStatus)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {formatOnboardingStatusLabel(s)}
                </option>
              ))}
            </Select>
          </div>
          <Textarea
            label={translate("platform.adminNotes")}
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            rows={4}
            className="mt-4"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="primary" loading={saving} onClick={() => void saveSelected()}>
              Save changes
            </Button>
            <Button type="button" variant="secondary" onClick={() => setSelected(null)}>
              Close
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/platform/companies/new")}
            >
              Provision company
            </Button>
            <Link href={`mailto:${selected.work_email}`} className="text-sm font-semibold text-[var(--ds-color-primary)]">
              Email contact
            </Link>
          </div>
        </Card>
      ) : null}
    </MainContent>
  );
}
