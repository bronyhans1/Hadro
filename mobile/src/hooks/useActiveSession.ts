import { useCallback, useMemo } from "react";
import { useFocusEffect } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMySessionHistory, getTodaySessions, type SessionRecord } from "@/lib/api/attendance.api";
import { pickActiveSessionWithSource } from "@/lib/activeSession";
import {
  activeSessionQueryOptions,
  attendanceQueryKeys,
  invalidateAttendanceQueries,
} from "@/lib/attendanceQueries";

type Options = {
  /** Lighter history fetch for Home preview (default 10). */
  historyLimit?: number;
  /** Refetch when screen gains focus (tab navigation). */
  refetchOnFocus?: boolean;
};

/**
 * Single source for "currently clocked in" — today API + history reconciliation.
 */
export function useActiveSession(options: Options = {}) {
  const { historyLimit = 10, refetchOnFocus = true } = options;
  const queryClient = useQueryClient();

  const todayQuery = useQuery({
    queryKey: attendanceQueryKeys.today,
    queryFn: async () => {
      const res = await getTodaySessions();
      if (res.success === false) throw new Error(res.error);
      return res.data ?? [];
    },
    ...activeSessionQueryOptions,
  });

  const historyQuery = useQuery({
    queryKey: [...attendanceQueryKeys.historyPreview, historyLimit],
    queryFn: async () => {
      const res = await getMySessionHistory({ page: 1, limit: historyLimit });
      if (res.success === false) throw new Error(res.error);
      return res.data?.rows ?? [];
    },
    ...activeSessionQueryOptions,
  });

  useFocusEffect(
    useCallback(() => {
      if (!refetchOnFocus) return;
      void invalidateAttendanceQueries(queryClient);
    }, [queryClient, refetchOnFocus])
  );

  const { session: activeSession, source } = useMemo(
    () =>
      pickActiveSessionWithSource(todayQuery.data ?? [], historyQuery.data ?? []),
    [todayQuery.data, historyQuery.data]
  );

  const isLoading =
    (todayQuery.isLoading && todayQuery.data === undefined) ||
    (historyQuery.isLoading && historyQuery.data === undefined);

  const refetch = useCallback(async () => {
    await invalidateAttendanceQueries(queryClient);
  }, [queryClient]);

  return {
    activeSession: activeSession as SessionRecord | null,
    activeSessionSource: source,
    hasActiveSession: Boolean(activeSession),
    todayQuery,
    historyQuery,
    isLoading,
    refetch,
  };
}
