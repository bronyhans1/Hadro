import { Response } from "express";
import { ContextRequest } from "../../middleware/context.middleware";
import { getRequiredCompanyContext } from "../../lib/companyRequestContext";
import * as payrollPeriodService from "./payrollPeriod.service";
import {
  PayrollPeriodTransitionError,
  PayrollPeriodValidationError,
} from "./payrollPeriod.service";

function parseBooleanQuery(value: unknown): boolean {
  if (value === true || value === "true" || value === "1") return true;
  return false;
}

export async function listPeriods(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const { companyId } = getRequiredCompanyContext(req);
    const options = payrollPeriodService.normalizeListOptions(req.query);
    const result = await payrollPeriodService.listPeriods(companyId, options);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof PayrollPeriodValidationError) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }
    console.error("listPeriods error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function getByYearMonth(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const { companyId } = getRequiredCompanyContext(req);
    const year = Number(req.params.year);
    const month = Number(req.params.month);
    const createIfMissing = parseBooleanQuery(req.query.create_if_missing);

    if (createIfMissing) {
      const period = await payrollPeriodService.getOrCreate(companyId, year, month);
      res.json({ success: true, data: period });
      return;
    }

    const period = await payrollPeriodService.getByCompanyMonth(companyId, year, month);
    if (!period) {
      res.status(404).json({ success: false, error: "Payroll period not found" });
      return;
    }
    res.json({ success: true, data: period });
  } catch (err) {
    if (err instanceof PayrollPeriodValidationError) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }
    console.error("getByYearMonth payroll period error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function getById(req: ContextRequest, res: Response): Promise<void> {
  try {
    const { companyId } = getRequiredCompanyContext(req);
    const period = await payrollPeriodService.getById(
      companyId,
      String(req.params.id)
    );
    if (!period) {
      res.status(404).json({ success: false, error: "Payroll period not found" });
      return;
    }
    res.json({ success: true, data: period });
  } catch (err) {
    if (err instanceof PayrollPeriodValidationError) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }
    console.error("getById payroll period error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function submitForReview(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const { companyId, userId } = getRequiredCompanyContext(req);
    const period = await payrollPeriodService.submitForReview(
      companyId,
      String(req.params.id),
      userId
    );
    if (!period) {
      res.status(404).json({ success: false, error: "Payroll period not found" });
      return;
    }
    res.json({ success: true, data: period });
  } catch (err) {
    if (err instanceof PayrollPeriodValidationError) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }
    if (err instanceof PayrollPeriodTransitionError) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    console.error("submitForReview payroll period error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function approve(req: ContextRequest, res: Response): Promise<void> {
  try {
    const { companyId, userId } = getRequiredCompanyContext(req);
    const period = await payrollPeriodService.approve(
      companyId,
      String(req.params.id),
      userId
    );
    if (!period) {
      res.status(404).json({ success: false, error: "Payroll period not found" });
      return;
    }
    res.json({ success: true, data: period });
  } catch (err) {
    if (err instanceof PayrollPeriodValidationError) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }
    if (err instanceof PayrollPeriodTransitionError) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    console.error("approve payroll period error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function lockPeriod(req: ContextRequest, res: Response): Promise<void> {
  try {
    const { companyId, userId } = getRequiredCompanyContext(req);
    const period = await payrollPeriodService.lock(
      companyId,
      String(req.params.id),
      userId
    );
    if (!period) {
      res.status(404).json({ success: false, error: "Payroll period not found" });
      return;
    }
    res.json({ success: true, data: period });
  } catch (err) {
    if (err instanceof PayrollPeriodValidationError) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }
    if (err instanceof PayrollPeriodTransitionError) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    console.error("lock payroll period error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function closePeriod(req: ContextRequest, res: Response): Promise<void> {
  try {
    const { companyId, userId } = getRequiredCompanyContext(req);
    const period = await payrollPeriodService.close(
      companyId,
      String(req.params.id),
      userId
    );
    if (!period) {
      res.status(404).json({ success: false, error: "Payroll period not found" });
      return;
    }
    res.json({ success: true, data: period });
  } catch (err) {
    if (err instanceof PayrollPeriodValidationError) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }
    if (err instanceof PayrollPeriodTransitionError) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    console.error("close payroll period error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function reopenPeriod(req: ContextRequest, res: Response): Promise<void> {
  try {
    const { companyId, userId } = getRequiredCompanyContext(req);
    const input = payrollPeriodService.normalizeReopenInput(req.body);
    const period = await payrollPeriodService.reopen(
      companyId,
      String(req.params.id),
      userId,
      input
    );
    if (!period) {
      res.status(404).json({ success: false, error: "Payroll period not found" });
      return;
    }
    res.json({ success: true, data: period });
  } catch (err) {
    if (err instanceof PayrollPeriodValidationError) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }
    if (err instanceof PayrollPeriodTransitionError) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    console.error("reopen payroll period error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function unlockPeriod(req: ContextRequest, res: Response): Promise<void> {
  try {
    const { companyId, userId } = getRequiredCompanyContext(req);
    const period = await payrollPeriodService.unlock(
      companyId,
      String(req.params.id),
      userId
    );
    if (!period) {
      res.status(404).json({ success: false, error: "Payroll period not found" });
      return;
    }
    res.json({ success: true, data: period });
  } catch (err) {
    if (err instanceof PayrollPeriodValidationError) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }
    if (err instanceof PayrollPeriodTransitionError) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    console.error("unlock payroll period error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function regeneratePeriod(req: ContextRequest, res: Response): Promise<void> {
  try {
    const { companyId, userId } = getRequiredCompanyContext(req);
    const reason =
      typeof req.body?.reason === "string" ? req.body.reason.trim() : null;
    const period = await payrollPeriodService.regeneratePeriodPayroll(
      companyId,
      String(req.params.id),
      userId,
      reason
    );
    if (!period) {
      res.status(404).json({ success: false, error: "Payroll period not found" });
      return;
    }
    res.json({ success: true, data: period });
  } catch (err) {
    if (err instanceof PayrollPeriodValidationError) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }
    if (err instanceof PayrollPeriodTransitionError) {
      res.status(409).json({ success: false, error: err.message });
      return;
    }
    console.error("regenerate payroll period error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

