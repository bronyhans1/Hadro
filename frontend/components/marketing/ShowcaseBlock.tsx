import { cn } from "@/lib/design-system/cn";
import { MARKETING_IMAGES } from "@/lib/marketing/assets";
import { marketingText } from "@/lib/marketing/text";
import { MarketingMedia } from "./MarketingMedia";

type Props = {
  eyebrow?: string;
  title: string;
  problem: string;
  solution: string;
  benefit: string;
  visualLabel?: string;
  /** Defaults to features overview when omitted. */
  visualSrc?: string;
  /** Alternate image/copy sides for storytelling rhythm. */
  reverse?: boolean;
  className?: string;
};

/**
 * Flagship signature capability block: Problem → Solution → Visual → Value.
 */
export function ShowcaseBlock({
  eyebrow = marketingText("showcase.eyebrow"),
  title,
  problem,
  solution,
  benefit,
  visualLabel,
  visualSrc = MARKETING_IMAGES.featuresOverview,
  reverse = false,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "grid items-center gap-8 lg:grid-cols-12 lg:gap-10",
        className
      )}
    >
      <div className={cn("min-w-0 lg:col-span-5", reverse && "lg:order-2")}>
        <p className="mkt-eyebrow">{eyebrow}</p>
        <h3 className="mkt-h2 mt-3">{title}</h3>
        <dl className="mt-6 space-y-4">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--mkt-gray)]">{marketingText("showcase.problem")}</dt>
            <dd className="mkt-body mt-2">{problem}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--mkt-gray)]">{marketingText("showcase.solution")}</dt>
            <dd className="mkt-body mt-2">{solution}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--mkt-royal)]">{marketingText("showcase.businessValue")}</dt>
            <dd className="mkt-body mt-2 font-medium text-[var(--mkt-ink)]">{benefit}</dd>
          </div>
        </dl>
      </div>
      <div className={cn("min-w-0 lg:col-span-7", reverse && "lg:order-1")}>
        <MarketingMedia label={visualLabel ?? title} src={visualSrc} aspect="wide" />
      </div>
    </div>
  );
}
