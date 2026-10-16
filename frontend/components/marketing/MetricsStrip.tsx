import { cn } from "@/lib/design-system/cn";
import { marketingText } from "@/lib/marketing/text";

export type MetricItem = {
  id: string;
  value: string;
  label: string;
  hint?: string;
};

type Props = {
  eyebrow?: string;
  title?: string;
  metrics: MetricItem[];
  className?: string;
  tone?: "default" | "navy";
};

/**
 * Configurable metrics strip for platform highlights.
 * Placeholder values are fine until real statistics are available.
 */
export function MetricsStrip({
  eyebrow,
  title,
  metrics,
  className,
  tone = "default",
}: Props) {
  const navy = tone === "navy";

  return (
    <div
      className={cn(
        "rounded-[var(--mkt-radius-2xl)] border px-6 py-6 sm:px-8 sm:py-8",
        navy
          ? "border-white/10 bg-[var(--mkt-navy)] text-white shadow-[var(--mkt-shadow-lift)]"
          : "border-[var(--mkt-border)] bg-[var(--mkt-surface)] shadow-[var(--mkt-shadow-soft)]",
        className
      )}
    >
      {(eyebrow || title) && (
        <div className="mb-6 max-w-2xl">
          {eyebrow ? (
            <p className={cn("mkt-eyebrow", navy && "text-[var(--mkt-royal)]")}>{eyebrow}</p>
          ) : null}
          {title ? (
            <h3 className={cn("mkt-h3 mt-3", navy && "text-white")}>{title}</h3>
          ) : null}
        </div>
      )}

      <dl className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.id} className="min-w-0">
            <dt className="sr-only">{metric.label}</dt>
            <dd>
              <p
                className={cn(
                  "text-3xl font-semibold tracking-tight sm:text-4xl",
                  navy ? "text-white" : "text-[var(--mkt-ink)]"
                )}
              >
                {metric.value}
              </p>
              <p
                className={cn(
                  "mt-2 text-sm font-semibold",
                  navy ? "text-[#F5F5F5]" : "text-[var(--mkt-ink-soft)]"
                )}
              >
                {metric.label}
              </p>
              {metric.hint ? (
                <p className={cn("mt-1 text-xs leading-relaxed", navy ? "text-[#A3A3A3]" : "text-[var(--mkt-gray)]")}>
                  {metric.hint}
                </p>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Placeholder metrics — replace with production statistics later. */
export const DEFAULT_MARKETING_METRICS: MetricItem[] = [
  {
    id: "attendance",
    get value() { return marketingText("metrics.attendanceValue"); },
    get label() { return marketingText("metrics.attendanceLabel"); },
    get hint() { return marketingText("metrics.attendanceHint"); },
  },
  {
    id: "branches",
    get value() { return marketingText("metrics.branchesValue"); },
    get label() { return marketingText("metrics.branchesLabel"); },
    get hint() { return marketingText("metrics.branchesHint"); },
  },
  {
    id: "earnings",
    get value() { return marketingText("metrics.earningsValue"); },
    get label() { return marketingText("metrics.earningsLabel"); },
    get hint() { return marketingText("metrics.earningsHint"); },
  },
  {
    id: "ecosystem",
    get value() { return marketingText("metrics.ecosystemValue"); },
    get label() { return marketingText("metrics.ecosystemLabel"); },
    get hint() { return marketingText("metrics.ecosystemHint"); },
  },
];
