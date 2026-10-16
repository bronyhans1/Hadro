import { Router } from "express";
import { requireRole } from "../../middleware/role.middleware";
import { companyApiStack } from "../../middleware/standardGuards";
import * as leaveController from "./leave.controller";

const router = Router();

const guard = companyApiStack;
const managerGuard = [
  ...companyApiStack,
  requireRole(["admin", "manager", "HR"]),
];

router.post("/", ...guard, leaveController.requestLeave);
router.get("/me", ...guard, leaveController.getMyLeave);
router.get("/my", ...guard, leaveController.getMyLeave);
router.get("/company", ...managerGuard, leaveController.getCompanyLeave);
router.get("/currently-on-leave", ...managerGuard, leaveController.getCurrentlyOnLeave);
router.patch("/:leaveId/review", ...managerGuard, leaveController.reviewLeave);
router.patch("/:leaveId/approve", ...managerGuard, leaveController.approveLeave);
router.patch("/:leaveId/reject", ...managerGuard, leaveController.rejectLeave);
router.patch(
  "/:leaveId/compensation",
  ...managerGuard,
  leaveController.updateLeaveCompensation
);
router.patch("/:leaveId/cancel", ...guard, leaveController.cancelLeave);
router.patch("/:leaveId/terminate", ...managerGuard, leaveController.terminateLeave);

export default router;
