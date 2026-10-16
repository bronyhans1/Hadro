export const RemoteApprovalStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type RemoteApprovalStatusValue =
  (typeof RemoteApprovalStatus)[keyof typeof RemoteApprovalStatus];

export function isRemoteApprovalStatusValue(
  raw: unknown
): raw is RemoteApprovalStatusValue {
  return (
    raw === RemoteApprovalStatus.PENDING ||
    raw === RemoteApprovalStatus.APPROVED ||
    raw === RemoteApprovalStatus.REJECTED
  );
}
