import { Response } from "express";
import { ContextRequest } from "../../middleware/context.middleware";
import { getRequiredCompanyContext } from "../../lib/companyRequestContext";
import * as service from "./companyProfile.service";
import * as auditService from "../audit/audit.service";

export async function getMyCompanyProfile(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const { companyId } = getRequiredCompanyContext(req);
    const result = await service.getCompanyProfile(companyId);
    if (result.error || !result.data) {
      res.status(404).json({ success: false, error: result.error ?? "Not found" });
      return;
    }
    res.json({ success: true, data: result.data });
  } catch (err) {
    console.error("getMyCompanyProfile error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function updateMyCompanyProfile(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const { companyId, userId } = getRequiredCompanyContext(req);
    const result = await service.updateCompanyProfile(companyId, req.body ?? {}, {
      allowRename: true,
    });
    if (result.error || !result.data) {
      res.status(400).json({ success: false, error: result.error ?? "Update failed" });
      return;
    }
    try {
      await auditService.logAction(
        companyId,
        userId,
        "company_profile_updated",
        "company",
        companyId,
        { fields: Object.keys(req.body ?? {}) }
      );
    } catch (auditErr) {
      console.error("Audit company_profile_updated error", auditErr);
    }
    res.json({ success: true, data: result.data });
  } catch (err) {
    console.error("updateMyCompanyProfile error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function dismissMyCompanyProfileSetup(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const { companyId, userId } = getRequiredCompanyContext(req);
    const result = await service.dismissCompanyProfileSetup(companyId);
    if (result.error || !result.data) {
      res.status(400).json({ success: false, error: result.error ?? "Dismiss failed" });
      return;
    }
    try {
      await auditService.logAction(
        companyId,
        userId,
        "company_profile_setup_dismissed",
        "company",
        companyId,
        {}
      );
    } catch (auditErr) {
      console.error("Audit company_profile_setup_dismissed error", auditErr);
    }
    res.json({ success: true, data: result.data });
  } catch (err) {
    console.error("dismissMyCompanyProfileSetup error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}
