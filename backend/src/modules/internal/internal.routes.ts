import { Router, Request, Response } from "express";
import { ENV } from "../../config/env";
import { runForgotClockOutCheck } from "../notifications/forgotClockOut.service";
import { completeExpiredApprovedLeaves } from "../leave/leaveCompletion.service";
import { runPaidLeaveShiftCloseCredits } from "../workforceEvents";

const router = Router();

function assertCronSecret(req: Request, res: Response): boolean {
  const secret = ENV.CRON_SECRET;
  if (!secret) {
    res.status(503).json({
      success: false,
      error: "Cron jobs are not configured (CRON_SECRET missing)",
    });
    return false;
  }
  const header = req.headers["x-cron-secret"];
  if (typeof header !== "string" || header !== secret) {
    res.status(401).json({ success: false, error: "Unauthorized" });
    return false;
  }
  return true;
}

/** POST /api/internal/jobs/forgot-clock-out — Render cron / external scheduler */
router.post("/jobs/forgot-clock-out", async (req, res) => {
  if (!assertCronSecret(req, res)) return;
  try {
    const result = await runForgotClockOutCheck();
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("forgot-clock-out job error", err);
    res.status(500).json({ success: false, error: "Job failed" });
  }
});

/** POST /api/internal/jobs/complete-expired-leave — passive approved → completed */
router.post("/jobs/complete-expired-leave", async (req, res) => {
  if (!assertCronSecret(req, res)) return;
  try {
    const result = await completeExpiredApprovedLeaves();
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("complete-expired-leave job error", err);
    res.status(500).json({ success: false, error: "Job failed" });
  }
});

/**
 * POST /api/internal/jobs/paid-leave-shift-close
 * Workforce engine: credit paid leave earnings after scheduled shift close.
 */
router.post("/jobs/paid-leave-shift-close", async (req, res) => {
  if (!assertCronSecret(req, res)) return;
  try {
    const result = await runPaidLeaveShiftCloseCredits();
    res.json({ success: true, data: result });
  } catch (err) {
    console.error("paid-leave-shift-close job error", err);
    res.status(500).json({ success: false, error: "Job failed" });
  }
});

export default router;
