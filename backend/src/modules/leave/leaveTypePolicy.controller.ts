import { Response } from "express";
import { ContextRequest } from "../../middleware/context.middleware";
import { getRequiredCompanyContext } from "../../lib/companyRequestContext";
import * as service from "./leaveTypePolicy.service";

export async function listLeaveTypePolicies(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const { companyId } = getRequiredCompanyContext(req);
    const data = await service.listLeaveTypePolicies(companyId);
    res.json({ success: true, data });
  } catch (err) {
    console.error("listLeaveTypePolicies error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}

export async function updateLeaveTypePolicy(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const { companyId } = getRequiredCompanyContext(req);
    const leaveType =
      typeof req.params.leaveType === "string"
        ? req.params.leaveType
        : Array.isArray(req.params.leaveType)
          ? req.params.leaveType[0]
          : "";
    const compensationRaw =
      typeof req.body?.compensation_type === "string"
        ? req.body.compensation_type
        : typeof req.body?.compensationType === "string"
          ? req.body.compensationType
          : "";

    const result = await service.updateLeaveTypeCompensation({
      companyId,
      leaveTypeRaw: leaveType ?? "",
      compensationRaw,
    });

    if (result.error || !result.data) {
      res.status(400).json({ success: false, error: result.error ?? "Update failed" });
      return;
    }

    res.json({ success: true, data: result.data });
  } catch (err) {
    console.error("updateLeaveTypePolicy error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}
