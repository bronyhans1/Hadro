import { Router } from "express";
import { requireRole } from "../../middleware/role.middleware";
import { companyApiStack } from "../../middleware/standardGuards";
import * as controller from "./companyProfile.controller";

const router = Router();

const guard = companyApiStack;
const adminHrGuard = [...companyApiStack, requireRole(["admin", "HR"])];

/** Any authenticated company user may read company profile (logo / name displays). */
router.get("/", ...guard, controller.getMyCompanyProfile);

/** Admin/HR update tenant company identity. */
router.patch("/", ...adminHrGuard, controller.updateMyCompanyProfile);

/** Dismiss Complete Company Profile onboarding card. */
router.post("/dismiss-setup", ...adminHrGuard, controller.dismissMyCompanyProfileSetup);

export default router;
