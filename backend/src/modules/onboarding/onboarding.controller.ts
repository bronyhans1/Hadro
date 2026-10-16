import { Request, Response } from "express";
import * as service from "./onboarding.service";
import type { OnboardingRequestStatus } from "./onboarding.repository";

export async function submitRequest(req: Request, res: Response) {
  try {
    const result = await service.submitOnboardingRequest(req.body ?? {});
    return res.status(result.already_exists ? 200 : 201).json({
      success: true,
      data: result,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to submit request";
    return res.status(400).json({ success: false, error: message });
  }
}

export async function listRequests(req: Request, res: Response) {
  try {
    const status = req.query.status as OnboardingRequestStatus | undefined;
    const search = typeof req.query.search === "string" ? req.query.search : undefined;
    const page = Number.parseInt(String(req.query.page ?? "1"), 10) || 1;
    const limit = Number.parseInt(String(req.query.limit ?? "25"), 10) || 25;
    const result = await service.listOnboardingRequestsForAdmin({ status, search, page, limit });
    return res.json({
      success: true,
      data: {
        rows: result.rows,
        page,
        limit,
        total: result.total,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list onboarding requests";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function patchRequest(req: Request, res: Response) {
  try {
    const { status, admin_notes } = req.body ?? {};
    const allowed: OnboardingRequestStatus[] = [
      "interested",
      "contacted",
      "demo_scheduled",
      "onboarded",
      "rejected",
    ];
    if (status !== undefined && !allowed.includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status" });
    }
    const id = String(req.params.id ?? "");
    const row = await service.updateOnboardingRequestForAdmin(id, {
      status,
      admin_notes: admin_notes === undefined ? undefined : admin_notes,
    });
    return res.json({ success: true, data: row });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update onboarding request";
    const code = message.includes("not found") ? 404 : 500;
    return res.status(code).json({ success: false, error: message });
  }
}

export async function listPlatformNotifications(req: Request, res: Response) {
  try {
    const userId = (req as { context?: { userId?: string } }).context?.userId;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });
    const page = Number.parseInt(String(req.query.page ?? "1"), 10) || 1;
    const limit = Number.parseInt(String(req.query.limit ?? "20"), 10) || 20;
    const result = await service.listMyPlatformNotifications(userId, page, limit);
    return res.json({
      success: true,
      data: { rows: result.rows, page, limit, total: result.total },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to list notifications";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function getPlatformUnreadCount(req: Request, res: Response) {
  try {
    const userId = (req as { context?: { userId?: string } }).context?.userId;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });
    const count = await service.getMyPlatformUnreadCount(userId);
    return res.json({ success: true, data: { count } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to get unread count";
    return res.status(500).json({ success: false, error: message });
  }
}

export async function markPlatformNotificationRead(req: Request, res: Response) {
  try {
    const userId = (req as { context?: { userId?: string } }).context?.userId;
    if (!userId) return res.status(401).json({ success: false, error: "Unauthorized" });
    await service.markMyPlatformNotificationRead(userId, String(req.params.id ?? ""));
    return res.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to mark notification read";
    return res.status(500).json({ success: false, error: message });
  }
}
