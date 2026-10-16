import { Response } from "express";
import { ContextRequest } from "../../middleware/context.middleware";
import { getRequiredCompanyContext } from "../../lib/companyRequestContext";
import * as timelineService from "./timeline.service";
import { TimelineValidationError } from "./timeline.service";

export async function listTimeline(
  req: ContextRequest,
  res: Response
): Promise<void> {
  try {
    const { companyId } = getRequiredCompanyContext(req);
    const options = timelineService.normalizeListOptions(req.query);
    const result = await timelineService.listEvents(companyId, options);
    res.json({ success: true, data: result });
  } catch (err) {
    if (err instanceof TimelineValidationError) {
      res.status(400).json({ success: false, error: err.message });
      return;
    }
    console.error("listTimeline error", err);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
}
