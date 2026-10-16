import { Router } from "express";
import { requireRole } from "../../middleware/role.middleware";
import { companyApiStack } from "../../middleware/standardGuards";
import * as timelineController from "./timeline.controller";

const router = Router();

const timelineReadGuard = [
  ...companyApiStack,
  requireRole(["admin", "HR"]),
];

router.get("/", ...timelineReadGuard, timelineController.listTimeline);

export default router;
