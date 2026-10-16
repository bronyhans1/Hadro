import { Router } from "express";
import { createRateLimit } from "../../middleware/rateLimit.middleware";
import { platformAdminStack } from "../../middleware/standardGuards";
import { requireRole } from "../../middleware/role.middleware";
import * as controller from "./onboarding.controller";

const router = Router();
const platformAdminGuard = [...platformAdminStack, requireRole(["PLATFORM_ADMIN"])];

router.post(
  "/request",
  createRateLimit({ keyPrefix: "onboarding:submit", windowMs: 60_000, max: 5 }),
  controller.submitRequest
);

export default router;

export const platformOnboardingRouter = Router();

platformOnboardingRouter.get(
  "/onboarding-requests",
  ...platformAdminGuard,
  controller.listRequests
);

platformOnboardingRouter.patch(
  "/onboarding-requests/:id",
  ...platformAdminGuard,
  controller.patchRequest
);

platformOnboardingRouter.get(
  "/notifications",
  ...platformAdminGuard,
  controller.listPlatformNotifications
);

platformOnboardingRouter.get(
  "/notifications/unread-count",
  ...platformAdminGuard,
  controller.getPlatformUnreadCount
);

platformOnboardingRouter.patch(
  "/notifications/:id/read",
  ...platformAdminGuard,
  controller.markPlatformNotificationRead
);
