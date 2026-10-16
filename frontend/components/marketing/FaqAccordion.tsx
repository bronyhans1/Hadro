"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/design-system/cn";

export type FaqItem = {
  question: string;
  answer: string;
};

type Props = {
  items: FaqItem[];
  className?: string;
};

export function FaqAccordion({ items, className }: Props) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className={cn("divide-y divide-[var(--mkt-border)] rounded-[var(--mkt-radius-xl)] border border-[var(--mkt-border)] bg-[var(--mkt-surface)]", className)}>
      {items.map((item, index) => {
        const open = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;
        return (
          <div key={item.question}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-[var(--mkt-ink)] sm:px-6 sm:text-base"
                onClick={() => setOpenIndex(open ? null : index)}
              >
                <span>{item.question}</span>
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--mkt-border)] text-lg leading-none text-[var(--mkt-royal)] transition-transform duration-[var(--mkt-duration-fast)]",
                    open && "rotate-45"
                  )}
                  aria-hidden
                >
                  +
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!open}
              className="px-5 pb-5 sm:px-6"
            >
              {open ? <p className="mkt-body max-w-3xl">{item.answer}</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
