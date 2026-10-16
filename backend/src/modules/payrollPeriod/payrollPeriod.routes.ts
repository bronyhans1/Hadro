import { Router } from "express";
import { requireRole } from "../../middleware/role.middleware";
import { requirePayrollEnabled } from "../../middleware/requirePayrollEnabled.middleware";
import { companyApiStack } from "../../middleware/standardGuards";
import * as payrollPeriodController from "./payrollPeriod.controller";

const router = Router();

/** View / submit / approve — admin or HR */
const adminHrGuard = [
  ...companyApiStack,
  requirePayrollEnabled,
  requireRole(["admin", "HR"]),
];

/** Lock, unlock, archive, reopen, regenerate — Payroll Administrator (company admin) */
const payrollAdminGuard = [
  ...companyApiStack,
  requirePayrollEnabled,
  requireRole(["admin"]),
];

router.get("/", ...adminHrGuard, payrollPeriodController.listPeriods);
router.get("/:year/:month", ...adminHrGuard, payrollPeriodController.getByYearMonth);
router.post("/:id/submit-review", ...adminHrGuard, payrollPeriodController.submitForReview);
router.post("/:id/approve", ...adminHrGuard, payrollPeriodController.approve);
router.post("/:id/lock", ...payrollAdminGuard, payrollPeriodController.lockPeriod);
router.post("/:id/unlock", ...payrollAdminGuard, payrollPeriodController.unlockPeriod);
router.post("/:id/close", ...payrollAdminGuard, payrollPeriodController.closePeriod);
router.post("/:id/reopen", ...payrollAdminGuard, payrollPeriodController.reopenPeriod);
router.post("/:id/regenerate", ...payrollAdminGuard, payrollPeriodController.regeneratePeriod);
router.get("/:id", ...adminHrGuard, payrollPeriodController.getById);

export default router;
