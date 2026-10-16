import type { NotificationRecord } from "../../modules/notifications/notifications.repository";

export function notificationEmailSubject(record: NotificationRecord): string {
  return `HADRO: ${record.title}`;
}

export function notificationEmailBody(record: NotificationRecord): string {
  return `${record.title}\n\n${record.body}\n\n— HADRO`;
}
