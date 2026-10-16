import Link from "next/link";
import { cn } from "@/lib/design-system/cn";
import { industryImage } from "@/lib/marketing/assets";
import { industrySolutionPath } from "@/lib/marketing/siteConfig";
import { MarketingMedia } from "./MarketingMedia";

type Props = {
  id: string;
  label: string;
  href?: string;
  src?: string;
  className?: string;
  /** When true, card is non-navigating (Stage 0 / pending page). */
  disabled?: boolean;
};

export function IndustryCard({ id, label, href, src, className, disabled }: Props) {
  const target = href ?? industrySolutionPath(id);
  const imageSrc = src ?? industryImage(id);
  const body = (
    <>
      <MarketingMedia
        label={label}
        src={imageSrc}
        aspect="square"
        className="rounded-none border-0 shadow-none"
      />
      <div className="px-4 py-4">
        <p className="text-sm font-semibold text-[var(--mkt-ink)]">{label}</p>
        <p className="mt-1 text-xs text-[var(--mkt-gray)]">Workforce solutions</p>
      </div>
    </>
  );

  const shell = cn(
    "overflow-hidden rounded-[var(--mkt-radius-xl)] border border-[var(--mkt-border)] bg-[var(--mkt-surface)] shadow-[var(--mkt-shadow-soft)] transition-[transform,box-shadow] duration-[var(--mkt-duration)] ease-[var(--mkt-ease)]",
    !disabled && "hover:-translate-y-0.5 hover:shadow-[var(--mkt-shadow-lift)]",
    disabled && "opacity-90",
    className
  );

  if (disabled) {
    return <div className={shell}>{body}</div>;
  }

  return (
    <Link href={target} className={shell}>
      {body}
    </Link>
  );
}
