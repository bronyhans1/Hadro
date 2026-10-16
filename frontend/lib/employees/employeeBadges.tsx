import type { UserListItem } from "@/lib/api/users.api";
import { Badge } from "@/components/ui/Badge";
import { formatAccountStatusLabel } from "@/lib/format/displayLabels";
import { translate } from "@/lib/i18n";

export function accountStatusBadge(status: UserListItem["status"]) {
  if (status === "active") return <Badge variant="active">{formatAccountStatusLabel(status)}</Badge>;
  if (status === "inactive") return <Badge variant="inactive">{formatAccountStatusLabel(status)}</Badge>;
  return <Badge variant="blocked">{formatAccountStatusLabel("suspended")}</Badge>;
}

export function remoteBadge(allowed?: boolean) {
  if (allowed) return <Badge variant="remote">{translate("attendance.remote")}</Badge>;
  return null;
}
