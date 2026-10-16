import { Router } from "express";
import { requireRole } from "../../middleware/role.middleware";
import { requirePayrollEnabled } from "../../middleware/requirePayrollEnabled.middleware";
import { companyApiStack } from "../../middleware/standardGuards";
import { createRateLimit } from "../../middleware/rateLimit.middleware";
import * as manualOvertimeController from "./manualOvertime.controller";

const router = Router();

const manualOtGuard = [
  ...companyApiStack,
  requirePayrollEnabled,
  requireRole(["admin", "manager", "HR"]),
];

router.get(
  "/",
  ...manualOtGuard,
  createRateLimit({ keyPrefix: "manual-ot:list", windowMs: 60_000, max: 60 }),
  manualOvertimeController.listManualOvertime
);

router.get(
  "/overlap-check",
  ...manualOtGuard,
  createRateLimit({ keyPrefix: "manual-ot:overlap", windowMs: 60_000, max: 60 }),
  manualOvertimeController.checkOverlap
);

router.post(
  "/",
  ...manualOtGuard,
  createRateLimit({ keyPrefix: "manual-ot:create", windowMs: 60_000, max: 30 }),
  manualOvertimeController.createManualOvertime
);

router.post(
  "/:id/cancel",
  ...manualOtGuard,
  createRateLimit({ keyPrefix: "manual-ot:cancel", windowMs: 60_000, max: 30 }),
  manualOvertimeController.cancelManualOvertime
);

export default router;
