import { cn } from "@/lib/design-system/cn";
import { marketingText } from "@/lib/marketing/text";

export type WorkflowStep = {
  id: string;
  label: string;
  description?: string;
};

type Props = {
  title?: string;
  description?: string;
  steps: WorkflowStep[];
  className?: string;
};

/**
 * Connected product journey — communicates ecosystem flow, not isolated features.
 */
export function ProductWorkflow({
  title = marketingText("workflow.title"),
  description = marketingText("workflow.description"),
  steps,
  className,
}: Props) {
  return (
    <div className={cn("w-full", className)}>
      {(title || description) && (
        <div className="max-w-3xl">
          {title ? <h3 className="mkt-h2">{title}</h3> : null}
          {description ? <p className="mkt-body-lg mt-4">{description}</p> : null}
        </div>
      )}

      <ol className="mt-8 flex list-none flex-col gap-0 p-0 lg:flex-row lg:items-stretch lg:gap-0">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <li
              key={step.id}
              className={cn(
                "relative flex flex-1 flex-col",
                !isLast && "lg:pr-4"
              )}
            >
              <div className="flex items-start gap-4 lg:flex-col lg:items-stretch lg:gap-0">
                <div className="flex items-center gap-3 lg:mb-5">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--mkt-royal)]/25 bg-[var(--mkt-sky)] text-sm font-bold text-[var(--mkt-royal)]"
                    aria-hidden
                  >
                    {index + 1}
                  </span>
                  {!isLast ? (
                    <span
                      className="hidden h-px flex-1 bg-gradient-to-r from-[var(--mkt-royal)]/40 to-[var(--mkt-border)] lg:block"
                      aria-hidden
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1 rounded-[var(--mkt-radius-lg)] border border-[var(--mkt-border)] bg-[var(--mkt-surface)] p-4 shadow-[var(--mkt-shadow-soft)] lg:min-h-[8.5rem]">
                  <p className="text-sm font-semibold text-[var(--mkt-ink)]">{step.label}</p>
                  {step.description ? (
                    <p className="mt-2 text-xs leading-relaxed text-[var(--mkt-gray)]">{step.description}</p>
                  ) : null}
                </div>
              </div>

              {!isLast ? (
                <div
                  className="ml-5 h-6 w-px bg-gradient-to-b from-[var(--mkt-royal)]/35 to-[var(--mkt-border)] lg:hidden"
                  aria-hidden
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Default HADRO connected journey for marketing pages. */
export const DEFAULT_PRODUCT_WORKFLOW: WorkflowStep[] = [
  {
    id: "employee",
    get label() { return marketingText("workflow.employee"); },
    get description() { return marketingText("workflow.employeeHint"); },
  },
  {
    id: "attendance",
    get label() { return marketingText("workflow.attendance"); },
    get description() { return marketingText("workflow.attendanceHint"); },
  },
  {
    id: "gps",
    get label() { return marketingText("workflow.gps"); },
    get description() { return marketingText("workflow.gpsHint"); },
  },
  {
    id: "dashboard",
    get label() { return marketingText("workflow.dashboard"); },
    get description() { return marketingText("workflow.dashboardHint"); },
  },
  {
    id: "payroll",
    get label() { return marketingText("workflow.payroll"); },
    get description() { return marketingText("workflow.payrollHint"); },
  },
  {
    id: "live-earnings",
    get label() { return marketingText("workflow.liveEarnings"); },
    get description() { return marketingText("workflow.liveEarningsHint"); },
  },
  {
    id: "reports",
    get label() { return marketingText("workflow.reports"); },
    get description() { return marketingText("workflow.reportsHint"); },
  },
];
