export function isRemoteSession(attendanceMode?: string | null): boolean {
  return (attendanceMode ?? "onsite").toLowerCase() === "remote";
}

export function remoteApprovalLabel(
  status?: string | null
): "Pending" | "Approved" | "Rejected" | null {
  const s = (status ?? "").toLowerCase();
  if (s === "pending") return "Pending";
  if (s === "approved") return "Approved";
  if (s === "rejected") return "Rejected";
  return null;
}
