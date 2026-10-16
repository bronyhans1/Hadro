export interface TimelineEventRecord {
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

export interface RecordTimelineEventInput {
  companyId: string;
  module: string;
  entityType: string;
  entityId: string;
  eventType: string;
  title: string;
  description: string;
  performedBy?: string | null;
  performedByName?: string | null;
  occurredAt?: string;
  metadata?: Record<string, unknown> | null;
}

export interface TimelineListOptions {
  module?: string;
  entityType?: string;
  entityId?: string;
  eventType?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface TimelineListResult {
  events: TimelineEventRecord[];
  total: number;
}
