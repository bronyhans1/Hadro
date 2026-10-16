import type { QueryClient } from "@tanstack/react-query";

/** Shared TanStack Query keys for attendance — keep invalidation consistent. */
export const attendanceQueryKeys = {
  today: ["attendance", "today"] as const,
  history: ["attendance", "history", "my"] as const,
  historyPreview: ["attendance", "history", "home-preview"] as const,
  all: ["attendance"] as const,
};

/** Active session must stay fresh across overnight boundaries and app resume. */
export const activeSessionQueryOptions = {
  staleTime: 0,
  gcTime: 5 * 60_000,
  refetchOnMount: "always" as const,
  refetchOnReconnect: true,
};

export function invalidateAttendanceQueries(queryClient: QueryClient): Promise<void> {
  return queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.all });
}
