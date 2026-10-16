import {
  TIMELINE_LIST_DEFAULT_LIMIT,
  TIMELINE_LIST_MAX_LIMIT,
} from "./timeline.constants";
import * as timelineRepo from "./timeline.repository";
import type {
  RecordTimelineEventInput,
  TimelineEventRecord,
  TimelineListOptions,
  TimelineListResult,
} from "./timeline.types";

export class TimelineValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimelineValidationError";
  }
}

function requireNonEmpty(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new TimelineValidationError(`${field} is required`);
  }
  return value.trim();
}

export async function recordEvent(
  input: RecordTimelineEventInput
): Promise<TimelineEventRecord> {
  requireNonEmpty(input.companyId, "companyId");
  requireNonEmpty(input.module, "module");
  requireNonEmpty(input.entityType, "entityType");
  requireNonEmpty(input.entityId, "entityId");
  requireNonEmpty(input.eventType, "eventType");
  requireNonEmpty(input.title, "title");
  requireNonEmpty(input.description, "description");

  return timelineRepo.insertEvent(input);
}

export function normalizeListOptions(query: {
  module?: unknown;
  entity_type?: unknown;
  entity_id?: unknown;
  event_type?: unknown;
  from?: unknown;
  to?: unknown;
  limit?: unknown;
  offset?: unknown;
}): TimelineListOptions {
  const options: TimelineListOptions = {};

  if (query.module !== undefined && query.module !== "") {
    options.module = String(query.module).trim();
  }
  if (query.entity_type !== undefined && query.entity_type !== "") {
    options.entityType = String(query.entity_type).trim();
  }
  if (query.entity_id !== undefined && query.entity_id !== "") {
    options.entityId = String(query.entity_id).trim();
  }
  if (query.event_type !== undefined && query.event_type !== "") {
    options.eventType = String(query.event_type).trim();
  }
  if (query.from !== undefined && query.from !== "") {
    options.from = String(query.from).trim();
  }
  if (query.to !== undefined && query.to !== "") {
    options.to = String(query.to).trim();
  }

  let limit = TIMELINE_LIST_DEFAULT_LIMIT;
  if (query.limit !== undefined && query.limit !== "") {
    const parsed = Number(query.limit);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new TimelineValidationError("limit must be a positive integer");
    }
    limit = Math.min(parsed, TIMELINE_LIST_MAX_LIMIT);
  }
  options.limit = limit;

  let offset = 0;
  if (query.offset !== undefined && query.offset !== "") {
    const parsed = Number(query.offset);
    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new TimelineValidationError("offset must be a non-negative integer");
    }
    offset = parsed;
  }
  options.offset = offset;

  return options;
}

export async function listEvents(
  companyId: string,
  options: TimelineListOptions
): Promise<TimelineListResult> {
  return timelineRepo.listByCompany(companyId, options);
}
