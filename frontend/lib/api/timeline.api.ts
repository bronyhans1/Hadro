import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types/api";

export interface TimelineEvent {
  id: string;
  company_id: string;
  module: string;
  entity_type: string;
  entity_id: string;
  event_type: string;
  title: string;
  description: string;
  performed_by: string | null;
  performed_by_name: string | null;
  occurred_at: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface TimelineListResult {
  events: TimelineEvent[];
  total: number;
}

export async function listTimeline(params?: {
  module?: string;
  entity_type?: string;
  entity_id?: string;
  event_type?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<TimelineListResult>> {
  const search = new URLSearchParams();
  if (params?.module) search.set("module", params.module);
  if (params?.entity_type) search.set("entity_type", params.entity_type);
  if (params?.entity_id) search.set("entity_id", params.entity_id);
  if (params?.event_type) search.set("event_type", params.event_type);
  if (params?.from) search.set("from", params.from);
  if (params?.to) search.set("to", params.to);
  if (params?.limit !== undefined) search.set("limit", String(params.limit));
  if (params?.offset !== undefined) search.set("offset", String(params.offset));
  const qs = search.toString();
  return apiClient.get<TimelineListResult>(`/api/timeline${qs ? `?${qs}` : ""}`);
}
