import { supabaseAdmin } from "../../config/supabase";
import type {
  RecordTimelineEventInput,
  TimelineEventRecord,
  TimelineListOptions,
  TimelineListResult,
} from "./timeline.types";

export async function insertEvent(
  input: RecordTimelineEventInput
): Promise<TimelineEventRecord> {
  const now = new Date().toISOString();
  const payload = {
    company_id: input.companyId,
    module: input.module,
    entity_type: input.entityType,
    entity_id: input.entityId,
    event_type: input.eventType,
    title: input.title,
    description: input.description,
    performed_by: input.performedBy ?? null,
    performed_by_name: input.performedByName ?? null,
    occurred_at: input.occurredAt ?? now,
    metadata: input.metadata ?? {},
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabaseAdmin
    .from("timeline_events")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data as TimelineEventRecord;
}

export async function listByCompany(
  companyId: string,
  options: TimelineListOptions = {}
): Promise<TimelineListResult> {
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  let q = supabaseAdmin
    .from("timeline_events")
    .select("*", { count: "exact" })
    .eq("company_id", companyId)
    .order("occurred_at", { ascending: false });

  if (options.module) {
    q = q.eq("module", options.module);
  }
  if (options.entityType) {
    q = q.eq("entity_type", options.entityType);
  }
  if (options.entityId) {
    q = q.eq("entity_id", options.entityId);
  }
  if (options.eventType) {
    q = q.eq("event_type", options.eventType);
  }
  if (options.from) {
    q = q.gte("occurred_at", options.from);
  }
  if (options.to) {
    q = q.lte("occurred_at", options.to);
  }

  const { data, error, count } = await q.range(offset, offset + limit - 1);
  if (error) throw error;

  return {
    events: (data ?? []) as TimelineEventRecord[],
    total: count ?? 0,
  };
}
