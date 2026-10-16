import { ENV } from "../config/env";
import { runForgotClockOutCheck } from "../modules/notifications/forgotClockOut.service";
import { completeExpiredApprovedLeaves } from "../modules/leave/leaveCompletion.service";
import { runPaidLeaveShiftCloseCredits } from "../modules/workforceEvents";

let intervalHandle: ReturnType<typeof setInterval> | null = null;

/**
 * Optional in-process scheduler for local/staging only.
 * Production: use Render Cron → POST /api/internal/jobs/*
 */
export function startInternalJobsIfEnabled(): void {
  if (ENV.isProduction || ENV.INTERNAL_JOB_INTERVAL_MS <= 0) return;
  if (intervalHandle) return;

  const ms = ENV.INTERNAL_JOB_INTERVAL_MS;
  console.log(`[jobs] Internal workforce interval ${ms}ms (dev/staging)`);

  const runJobs = () => {
    runForgotClockOutCheck()
      .then((r) => {
        if (r.notified > 0) {
          console.log(`[jobs] forgot-clock-out notified=${r.notified} scanned=${r.scanned}`);
        }
      })
      .catch((err) => console.warn("[jobs] forgot-clock-out failed", err));

    completeExpiredApprovedLeaves()
      .then((r) => {
        if (r.completed > 0) {
          console.log(`[jobs] complete-expired-leave completed=${r.completed}`);
        }
      })
      .catch((err) => console.warn("[jobs] complete-expired-leave failed", err));

    runPaidLeaveShiftCloseCredits()
      .then((r) => {
        if (r.credited > 0 || r.failed > 0) {
          console.log(
            `[jobs] paid-leave-shift-close credited=${r.credited} skipped=${r.skipped} failed=${r.failed} candidates=${r.candidateDays}`
          );
        }
      })
      .catch((err) => console.warn("[jobs] paid-leave-shift-close failed", err));
  };

  runJobs();
  intervalHandle = setInterval(runJobs, ms);
}
