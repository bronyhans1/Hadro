import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMyLeave } from "@/lib/api/leave.api";
import { isCurrentlyOnApprovedLeave } from "@/lib/leave/leaveLifecycle";

export function useCurrentApprovedLeave() {
  const query = useQuery({
    queryKey: ["leave", "my"],
    queryFn: async () => {
      const res = await getMyLeave();
      if (res.success === false) throw new Error(res.error);
      return res.data ?? [];
    },
  });

  const currentLeave = useMemo(() => {
    const list = query.data ?? [];
    return list.find((row) => isCurrentlyOnApprovedLeave(row)) ?? null;
  }, [query.data]);

  return {
    currentLeave,
    isOnApprovedLeave: currentLeave !== null,
    ...query,
  };
}
