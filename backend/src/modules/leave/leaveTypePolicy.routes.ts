import { Router } from "express";
import { requireRole } from "../../middleware/role.middleware";
import { companyApiStack } from "../../middleware/standardGuards";
import * as controller from "./leaveTypePolicy.controller";

const router = Router();

const guard = companyApiStack;
const adminHrGuard = [...companyApiStack, requireRole(["admin", "HR"])];

/** Any authenticated company user may read policies (request leave UI). */
router.get("/", ...guard, controller.listLeaveTypePolicies);

/** Company admins/HR configure paid vs unpaid per leave type. */
router.patch("/:leaveType", ...adminHrGuard, controller.updateLeaveTypePolicy);

export default router;
