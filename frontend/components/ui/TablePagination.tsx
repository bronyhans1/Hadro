"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/design-system/cn";
import { translate } from "@/lib/i18n";

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  currentCount: number;
  onPrevious: () => void;
  onNext: () => void;
  loading?: boolean;
  itemLabel?: string;
  className?: string;
}

export function TablePagination({
  page,
  pageSize,
  total,
  currentCount,
  onPrevious,
  onNext,
  loading = false,
  itemLabel = "items",
  className,
}: TablePaginationProps) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = total === 0 ? 0 : start + Math.max(0, currentCount - 1);

  return (
    <nav
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
      aria-label={translate("common.paginationAria", { values: { items: itemLabel } })}
    >
      <p
        className="text-xs tabular-nums"
        style={{ color: "var(--ds-color-text-muted)" }}
        aria-live="polite"
      >
        {translate("common.showingRange", {
          values: { start, end, total, items: itemLabel },
        })}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1 || loading}
          onClick={onPrevious}
          leftIcon={<ChevronLeft className="h-4 w-4" aria-hidden />}
        >
          {translate("common.previous")}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading || page * pageSize >= total}
          onClick={onNext}
          rightIcon={<ChevronRight className="h-4 w-4" aria-hidden />}
        >
          {translate("common.next")}
        </Button>
      </div>
    </nav>
  );
}
