import { Response } from "express";
import { ContextRequest } from "../../middleware/context.middleware";
import { getRequiredCompanyContext } from "../../lib/companyRequestContext";
import * as manualOvertimeService from "./manualOvertime.service";
import * as auditService from "../audit/audit.service";
import {
  isManualOvertimeEntryStatus,
  type ManualOvertimeEntryStatus,
} from "../../constants/manualOvertime";

function parseYearMonth(query: Record<string, unknown>): {
  year: number;
  month: number;
} | null {
  const year = Number(query.year);
  const month = Number(query.month);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  return { year, month };
}

export async function listManualOvertime(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const { companyId } = getRequiredCompanyContext(req);
    const parsed = parseYearMonth((req.query ?? {}) as Record<string, unknown>);
    if (!parsed) {
      res.status(400).json({ success: false, error: "year and month are required" });
      return;
    }

    const userId =
      typeof req.query.user_id === "string" && req.query.user_id.trim()
        ? req.query.user_id.trim()
        : undefined;

    let status: ManualOvertimeEntryStatus | undefined;
    const rawStatus = req.query.status;
    if (typeof rawStatus === "string" && rawStatus.trim()) {
      if (!isManualOvertimeEntryStatus(rawStatus.trim())) {
        res.status(400).json({ success: false, error: "Invalid status filter" });
        return;
      }
      status = rawStatus.trim() as ManualOvertimeEntryStatus;
    }

    const result = await manualOvertimeService.listManualOvertimeEntries(
      req.context!,
      companyId,
      { ...parsed, userId, status }
    );

    if (result.error) {
      const statusCode =
        result.error === "Insufficient permissions for company-wide data" ||
        result.error === "Branch context required for this role"
          ? 403
          : 404;
      res.status(statusCode).json({ success: false, error: result.error });
      return;
    }

    res.json({ success: true, data: result.entries });
  } catch (err) {
    console.error("listManualOvertime error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function checkOverlap(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const { companyId } = getRequiredCompanyContext(req);
    const userId =
      typeof req.query.user_id === "string" ? req.query.user_id.trim() : "";
    const earningsDate =
      typeof req.query.earnings_date === "string"
        ? req.query.earnings_date.trim().slice(0, 10)
        : "";
    const hours = Number(req.query.hours);

    if (!userId || !earningsDate || !(hours > 0)) {
      res.status(400).json({
        success: false,
        error: "user_id, earnings_date, and hours (> 0) are required",
      });
      return;
    }

    const result = await manualOvertimeService.checkManualOvertimeOverlap(
      companyId,
      userId,
      earningsDate,
      hours
    );

    res.json({
      success: true,
      data: {
        summary: result.summary,
        requires_acknowledgment: result.requires_acknowledgment,
        allowed: result.allowed,
        error: result.error ?? null,
      },
    });
  } catch (err) {
    console.error("checkOverlap error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function createManualOvertime(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const { companyId, userId: actorId } = getRequiredCompanyContext(req);
    const body = req.body ?? {};

    const result = await manualOvertimeService.createManualOvertimeEntry(
      req.context!,
      companyId,
      actorId,
      {
        user_id: body.user_id,
        earnings_date: body.earnings_date,
        hours: body.hours,
        reason: body.reason,
        reason_code: body.reason_code,
        overlap_warning_acknowledged: body.overlap_warning_acknowledged,
      }
    );

    if (result.error) {
      res.status(result.status ?? 400).json({
        success: false,
        error: result.error,
        overlap: result.overlap ?? null,
      });
      return;
    }

    const entry = result.entry!;
    try {
      await auditService.logAction(
        companyId,
        actorId,
        "manual_overtime.created",
        "manual_overtime",
        entry.id,
        {
          employee_id: entry.user_id,
          earnings_date: entry.earnings_date,
          hours: entry.hours,
          reason: entry.reason,
        }
      );
      await auditService.logAction(
        companyId,
        actorId,
        "manual_overtime.approved",
        "manual_overtime",
        entry.id,
        {
          employee_id: entry.user_id,
          earnings_date: entry.earnings_date,
          hours: entry.hours,
          payroll_record_id: entry.payroll_record_id,
        }
      );
    } catch (auditErr) {
      console.error("Audit log manual_overtime create error", auditErr);
    }

    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    console.error("createManualOvertime error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function cancelManualOvertime(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const { companyId, userId: actorId } = getRequiredCompanyContext(req);
    const entryId =
      typeof req.params.id === "string"
        ? req.params.id
        : Array.isArray(req.params.id)
          ? req.params.id[0]
          : "";

    if (!entryId) {
      res.status(400).json({ success: false, error: "id is required" });
      return;
    }

    const result = await manualOvertimeService.cancelManualOvertimeEntry(
      req.context!,
      companyId,
      entryId
    );

    if (result.error) {
      res.status(result.status ?? 400).json({ success: false, error: result.error });
      return;
    }

    const entry = result.entry!;
    try {
      await auditService.logAction(
        companyId,
        actorId,
        "manual_overtime.cancelled",
        "manual_overtime",
        entry.id,
        {
          employee_id: entry.user_id,
          earnings_date: entry.earnings_date,
          hours: entry.hours,
          reason: entry.reason,
        }
      );
    } catch (auditErr) {
      console.error("Audit log manual_overtime cancel error", auditErr);
    }

    res.json({ success: true, data: entry });
  } catch (err) {
    console.error("cancelManualOvertime error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}
