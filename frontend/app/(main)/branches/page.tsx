"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MainContent } from "@/components/layout/MainContent";
import { Button, IconButton, PageHeader } from "@/components/ui";
import { Pencil, Trash2 } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { DataTable } from "@/components/ui/DataTable";
import { LoadingState } from "@/components/ui/LoadingState";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { AccessDeniedState } from "@/components/ui/AccessDeniedState";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/FormControls";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/lib/auth/AuthContext";
import { canAccessAdminFeatures } from "@/lib/auth/roles";
import * as branchesApi from "@/lib/api/branches.api";
import type { BranchDto, PatchBranchInput } from "@/lib/api/branches.api";
import { safeApi } from "@/lib/api/safeApi";
import { isApiError } from "@/lib/types/api";
import { useToast } from "@/components/ui/ToastProvider";
import { useSuccessBanner } from "@/hooks/useSuccessBanner";
import { translate } from "@/lib/i18n";

const PRINT_QR_SIZE_PX = 280;
const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((mod) => mod.QRCodeSVG),
  { ssr: false }
);

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export default function BranchesPage() {
  const { user } = useAuth();
  const toast = useToast();
  const success = useSuccessBanner();
  const isAdmin = canAccessAdminFeatures(user?.roles);

  const [branches, setBranches] = useState<BranchDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editBranch, setEditBranch] = useState<BranchDto | null>(null);
  const [deleteBranch, setDeleteBranch] = useState<BranchDto | null>(null);
  const [qrBranch, setQrBranch] = useState<BranchDto | null>(null);

  const [formName, setFormName] = useState("");
  const [formLat, setFormLat] = useState("");
  const [formLng, setFormLng] = useState("");
  const [formRadius, setFormRadius] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const qrContainerRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setError(null);
    setLoading(true);
    try {
      const res = await safeApi(branchesApi.getBranches());
      if (isApiError(res)) {
        setError(res.error ?? translate("branches.failedLoad"));
        setBranches([]);
        return;
      }
      setBranches(res.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : translate("branches.failedLoad"));
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setFormName("");
    setFormError(null);
    setAddOpen(true);
  }

  function openEdit(b: BranchDto) {
    setEditBranch(b);
    setFormName(b.name);
    setFormLat(b.latitude != null ? String(b.latitude) : "");
    setFormLng(b.longitude != null ? String(b.longitude) : "");
    setFormRadius(b.radius_meters != null ? String(b.radius_meters) : "");
    setFormError(null);
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const name = formName.trim();
    if (!name) {
      setFormError(translate("branches.nameRequired"));
      return;
    }
    setFormSubmitting(true);
    try {
      const res = await safeApi(branchesApi.createBranch(name));
      if (isApiError(res)) {
        const msg = res.error ?? translate("branches.failedCreate");
        setFormError(msg);
        toast.error(msg);
        return;
      }
      setAddOpen(false);
      success.showSuccess({
        title: translate("leave.changesSaved"),
        description: translate("branches.created"),
      });
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : translate("branches.failedCreate");
      setFormError(msg);
      toast.error(msg);
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editBranch) return;
    setFormError(null);
    const name = formName.trim();
    if (!name) {
      setFormError(translate("branches.nameRequired"));
      return;
    }
    setFormSubmitting(true);
    try {
      const latTrim = formLat.trim();
      const lngTrim = formLng.trim();
      const radTrim = formRadius.trim();
      const payload: PatchBranchInput = { name };
      if (latTrim !== "") {
        const n = Number(latTrim);
        if (Number.isNaN(n)) {
          setFormError(translate("branches.latitudeNumber"));
          setFormSubmitting(false);
          return;
        }
        payload.latitude = n;
      }
      if (lngTrim !== "") {
        const n = Number(lngTrim);
        if (Number.isNaN(n)) {
          setFormError(translate("branches.longitudeNumber"));
          setFormSubmitting(false);
          return;
        }
        payload.longitude = n;
      }
      if (radTrim !== "") {
        const n = Number(radTrim);
        if (Number.isNaN(n) || n < 0) {
          setFormError(translate("branches.radiusInvalid"));
          setFormSubmitting(false);
          return;
        }
        payload.radius_meters = n;
      }

      const res = await safeApi(branchesApi.patchBranch(editBranch.id, payload));
      if (isApiError(res)) {
        const msg = res.error ?? translate("employees.failedUpdateBranch");
        setFormError(msg);
        toast.error(msg);
        return;
      }
      setEditBranch(null);
      success.showSuccess({
        title: translate("leave.changesSaved"),
        description: translate("branches.updated"),
      });
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : translate("employees.failedUpdateBranch");
      setFormError(msg);
      toast.error(msg);
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteBranch) return;
    setActionLoading(deleteBranch.id);
    try {
      const res = await safeApi(branchesApi.deleteBranch(deleteBranch.id));
      if (isApiError(res)) {
        const msg = res.error ?? translate("branches.failedDelete");
        setError(msg);
        toast.error(msg);
        return;
      }
      setDeleteBranch(null);
      success.showSuccess({
        title: translate("leave.changesSaved"),
        description: translate("branches.deleted"),
      });
      await load();
    } catch (e) {
      const msg = e instanceof Error ? e.message : translate("branches.failedDelete");
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  }

  const filteredBranches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return branches;
    return branches.filter((branch) => branch.name.toLowerCase().includes(query));
  }, [branches, searchQuery]);

  const columns = [
    {
      key: "name",
      header: translate("attendance.branch"),
      render: (row: BranchDto) => (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-theme">{row.name}</span>
          {row.is_default ? <Badge variant="success">{translate("leave.defaultBadge")}</Badge> : null}
        </div>
      ),
    },
    {
      key: "attendance",
      header: translate("branches.attendanceSite"),
      render: (row: BranchDto) =>
        row.latitude != null && row.longitude != null ? (
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-theme">{translate("branches.gpsConfigured")}</p>
            <p className="text-xs text-theme-muted">{translate("branches.radiusMeters", { values: { meters: row.radius_meters ?? 50 } })}</p>
          </div>
        ) : (
          <Badge variant="warning">{translate("branches.configureGps")}</Badge>
        ),
    },
    {
      key: "qr_code",
      header: translate("branches.qr"),
      render: (row: BranchDto) =>
        row.qr_code ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setQrBranch(row)}>
            {translate("branches.viewQr")}
          </Button>
        ) : (
          <span className="text-sm text-theme-muted">—</span>
        ),
    },
    {
      key: "actions",
      header: translate("attendance.actions"),
      render: (row: BranchDto) => (
        <div className="flex justify-end gap-1">
          <IconButton
            type="button"
            variant="outline"
            size="sm"
            aria-label={translate("branches.editNamed", { values: { name: row.name } })}
            onClick={() => openEdit(row)}
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </IconButton>
          {!row.is_default ? (
            <IconButton
              type="button"
              variant="danger"
              size="sm"
              aria-label={translate("branches.deleteNamed", { values: { name: row.name } })}
              onClick={() => setDeleteBranch(row)}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </IconButton>
          ) : null}
        </div>
      ),
    },
  ];

  const qrMeta = useMemo(() => {
    if (!qrBranch) return null;
    return {
      companyName: user?.companyName ?? translate("common.company"),
      branchName: qrBranch.name,
      payload: qrBranch.qr_code ?? "",
    };
  }, [qrBranch, user?.companyName]);

  function handleDownloadQrSvg() {
    if (!qrMeta || !qrContainerRef.current) return;
    const svg = qrContainerRef.current.querySelector("svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${qrMeta.companyName}-${qrMeta.branchName}-attendance-qr.svg`.replace(/\s+/g, "_");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handlePrintQr() {
    if (!qrMeta || !qrContainerRef.current) return;
    const svg = qrContainerRef.current.querySelector("svg");
    if (!svg) {
      toast.error(translate("branches.qrNotReady"));
      return;
    }

    const clone = svg.cloneNode(true) as SVGElement;
    clone.setAttribute("width", String(PRINT_QR_SIZE_PX));
    clone.setAttribute("height", String(PRINT_QR_SIZE_PX));
    if (!clone.getAttribute("xmlns")) {
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    }

    const serializer = new XMLSerializer();
    const svgMarkup = serializer.serializeToString(clone);
    if (!svgMarkup.trim()) {
      toast.error(translate("branches.qrReadFailed"));
      return;
    }

    /**
     * Open a real navigation to an HTML blob instead of mutating an about:blank
     * subframe via `document.write`. With `noopener`/`Cross-Origin-Opener-Policy`,
     * the handle returned by `window.open("", ...)` is often not reliably writable,
     * which leaves a blank tab. Navigating to a blob URL loads this document normally.
     */
    const title = translate("branches.printTitle", { values: { name: qrMeta.branchName } });
    const productLabel = translate("branches.printProductLabel");
    const printHint = translate("branches.printHint");
    const docHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: #fff;
      color: #111827;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif;
      padding: 28px 20px 32px;
    }
    .sheet {
      max-width: 520px;
      margin: 0 auto;
      text-align: center;
    }
    .company {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0 0 6px;
      line-height: 1.3;
    }
    .branch {
      font-size: 1.05rem;
      font-weight: 600;
      margin: 0 0 18px;
      color: #374151;
      line-height: 1.35;
    }
    .product-label {
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #4b5563;
      margin: 0 0 14px;
    }
    .qr-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 4px auto 22px;
      padding: 16px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      width: fit-content;
      max-width: 100%;
      margin-inline: auto;
      background: #fff;
    }
    .qr-wrap svg {
      display: block;
      max-width: 100%;
      height: auto;
    }
    .hint {
      font-size: 0.8125rem;
      line-height: 1.5;
      color: #6b7280;
      margin: 0 auto;
      max-width: 380px;
    }
    @page {
      margin: 14mm;
      size: auto;
    }
    @media print {
      body { padding: 12px 8px 20px; }
      .qr-wrap { border-color: #d1d5db; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <p class="company">${escapeHtml(qrMeta.companyName)}</p>
    <p class="branch">${escapeHtml(qrMeta.branchName)}</p>
    <p class="product-label">${escapeHtml(productLabel)}</p>
    <div class="qr-wrap">${svgMarkup}</div>
    <p class="hint">${escapeHtml(printHint)}</p>
  </div>
</body>
</html>`;

    const blob = new Blob([docHtml], { type: "text/html;charset=utf-8" });
    const blobUrl = URL.createObjectURL(blob);

    const features = "width=900,height=800,scrollbars=yes";
    const win = window.open(blobUrl, "_blank", features);
    if (!win) {
      URL.revokeObjectURL(blobUrl);
      toast.error(translate("branches.printWindowBlocked"));
      return;
    }

    const revokeSoon = () => {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {
        /* ignore */
      }
    };
    win.addEventListener("afterprint", revokeSoon, { once: true });
    window.setTimeout(revokeSoon, 120_000);

    const runPrint = () => {
      try {
        win.focus();
        win.print();
      } catch {
        toast.error(translate("branches.printCouldNotStart"));
      }
    };

    if (win.document.readyState === "complete") {
      window.setTimeout(runPrint, 50);
    } else {
      win.addEventListener(
        "load",
        () => window.setTimeout(runPrint, 50),
        { once: true }
      );
    }
  }

  if (!isAdmin) {
    return (
      <MainContent title={translate("branches.title")}>
        <AccessDeniedState description={translate("branches.accessDenied")} />
      </MainContent>
    );
  }

  if (loading && branches.length === 0) {
    return (
      <MainContent>
        <LoadingState message={translate("branches.loadingBranches")} className="min-h-[240px]" />
      </MainContent>
    );
  }

  if (error && branches.length === 0) {
    return (
      <MainContent>
        <ErrorState message={error} onRetry={load} />
      </MainContent>
    );
  }

  return (
    <MainContent>
      <div className="space-y-8">
        <PageHeader
          title={translate("branches.title")}
          subtitle={translate("branches.subtitle")}
          actions={
            <Button type="button" onClick={openAdd}>
              {translate("branches.addBranch")}
            </Button>
          }
        />
        {error ? (
          <p className="callout-warning text-sm" role="alert">
            {error}
          </p>
        ) : null}
        {success.banner}
        <Card padding={false}>
          <CardBody>
            <Input
              id="branch-search"
              label={translate("branches.searchBranches")}
              placeholder={translate("branches.searchBranchesPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </CardBody>
        </Card>
        <Card title={translate("branches.branchList")}>
          {filteredBranches.length === 0 ? (
            <EmptyState
              title={
                branches.length === 0
                  ? translate("branches.noBranchesYet")
                  : translate("branches.noBranchesMatch")
              }
              description={
                branches.length === 0
                  ? translate("branches.createFirst")
                  : undefined
              }
            />
          ) : (
            <DataTable
              columns={columns}
              data={filteredBranches}
              keyExtractor={(row) => row.id}
              emptyMessage={translate("branches.noBranches")}
              stickyHeader
            />
          )}
        </Card>
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title={translate("branches.addBranchSentence")}>
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {formError && (
            <div className="alert-error px-3 py-2">{formError}</div>
          )}
          <div>
            <label htmlFor="add-branch-name" className="mb-1.5 block text-sm font-medium text-theme">
              {translate("departments.name")}
            </label>
            <input
              id="add-branch-name"
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              className="input-field w-full"
              placeholder={translate("branches.placeholderAdd")}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>
              {translate("common.cancel")}
            </Button>
            <Button type="submit" variant="primary" loading={formSubmitting}>
              {translate("branches.addBranchSentence")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editBranch} onClose={() => setEditBranch(null)} title={translate("branches.editBranch")}>
        {editBranch && (
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {formError && (
              <div className="alert-error px-3 py-2">{formError}</div>
            )}
            <div
              className="rounded-lg border px-3 py-2.5"
              style={{
                borderColor: "var(--ds-color-border)",
                background: "var(--ds-color-surface-muted)",
              }}
            >
              <p className="text-xs font-medium text-theme-muted">{translate("branches.attendanceQr")}</p>
              <p className="mt-0.5 text-sm text-theme">
                {editBranch.qr_code ? translate("branches.qrGenerated") : translate("branches.notAvailable")}
              </p>
            </div>
            <div>
              <label htmlFor="edit-branch-name" className="mb-1 block text-sm font-medium text-theme">
                {translate("departments.name")}
              </label>
              <input
                id="edit-branch-name"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="input-field w-full"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="edit-branch-lat" className="mb-1 block text-sm font-medium text-theme">
                  {translate("branches.latitude")}
                </label>
                <input
                  id="edit-branch-lat"
                  type="text"
                  inputMode="decimal"
                  value={formLat}
                  onChange={(e) => setFormLat(e.target.value)}
                  placeholder={translate("branches.latitudePlaceholder")}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label htmlFor="edit-branch-lng" className="mb-1 block text-sm font-medium text-theme">
                  {translate("branches.longitude")}
                </label>
                <input
                  id="edit-branch-lng"
                  type="text"
                  inputMode="decimal"
                  value={formLng}
                  onChange={(e) => setFormLng(e.target.value)}
                  placeholder={translate("branches.longitudePlaceholder")}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label htmlFor="edit-branch-rad" className="mb-1 block text-sm font-medium text-theme">
                  {translate("branches.radiusLabel")}
                </label>
                <input
                  id="edit-branch-rad"
                  type="text"
                  inputMode="numeric"
                  value={formRadius}
                  onChange={(e) => setFormRadius(e.target.value)}
                  placeholder={translate("branches.radiusPlaceholder")}
                  className="input-field w-full"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditBranch(null)}>
                {translate("common.cancel")}
              </Button>
              <Button type="submit" loading={formSubmitting}>
                {translate("common.save")}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal open={!!deleteBranch} onClose={() => setDeleteBranch(null)} title={translate("branches.deleteBranch")}>
        {deleteBranch && (
          <div className="space-y-4">
            <p className="text-sm text-theme-muted">
              {translate("branches.deleteConfirm", { values: { name: deleteBranch.name } })}
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setDeleteBranch(null)}>
                {translate("common.cancel")}
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDeleteConfirm}
                loading={actionLoading === deleteBranch.id}
              >
                {translate("departments.delete")}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!qrBranch} onClose={() => setQrBranch(null)} title={translate("branches.printProductLabel")}>
        {qrMeta ? (
          <div className="space-y-4">
            <div className="rounded-lg border p-3" style={{ borderColor: "var(--border-soft)", background: "var(--surface-muted)" }}>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                {qrMeta.branchName}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {qrMeta.companyName}
              </p>
            </div>
            <div
              ref={qrContainerRef}
              className="qr-code-pad flex items-center justify-center rounded-lg border p-5"
              style={{ borderColor: "var(--border-soft)" }}
            >
              <QRCodeSVG value={qrMeta.payload} size={220} level="M" includeMargin />
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {translate("branches.qrHint")}
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={handleDownloadQrSvg}>
                {translate("branches.downloadSvg")}
              </Button>
              <Button type="button" onClick={handlePrintQr}>
                {translate("branches.print")}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </MainContent>
  );
}
