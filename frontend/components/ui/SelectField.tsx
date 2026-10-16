"use client";

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/design-system/cn";
import { Label } from "./Label";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

function collectOptions(children: React.ReactNode): SelectOption[] {
  const out: SelectOption[] = [];
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;
    const type = child.type;
    const props = child.props as {
      value?: string | number;
      disabled?: boolean;
      children?: React.ReactNode;
      label?: string;
    };
    if (type === "option") {
      const label = String(props.children ?? props.value ?? "");
      out.push({
        value: props.value === undefined ? label : String(props.value),
        label,
        disabled: Boolean(props.disabled),
      });
      return;
    }
    if (type === "optgroup") {
      out.push(...collectOptions(props.children));
    }
  });
  return out;
}

function mergeDescribedBy(...ids: Array<string | undefined>) {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

function emitChange(
  onChange: SelectProps["onChange"],
  value: string,
  name: string
) {
  onChange?.({
    target: { value, name },
    currentTarget: { value, name },
  } as React.ChangeEvent<HTMLSelectElement>);
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  error?: string;
  label?: string;
  hint?: string;
  variant?: "default" | "marketing";
  /** Minimum width of the portaled option menu. Does not widen other selects. */
  menuMinWidth?: number;
}

export function Select({
  error,
  label,
  hint,
  className,
  id,
  children,
  style,
  variant = "default",
  value,
  defaultValue,
  onChange,
  disabled,
  required,
  name,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
  menuMinWidth,
}: SelectProps) {
  const generatedId = useId();
  const listboxId = `${generatedId}-listbox`;
  const inputId = id ?? name ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = mergeDescribedBy(ariaDescribedBy, hintId, errorId);

  const options = useMemo(() => collectOptions(children), [children]);
  const isControlled = value !== undefined;
  const [uncontrolled, setUncontrolled] = useState(String(defaultValue ?? ""));
  const selectedValue = isControlled ? String(value) : uncontrolled;
  const selected = options.find((o) => o.value === selectedValue);

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(() =>
    Math.max(0, options.findIndex((o) => o.value === selectedValue))
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [menuPos, setMenuPos] = useState<{
    top: number;
    left: number;
    width: number;
    openUp: boolean;
  } | null>(null);
  const searchRef = useRef("");
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const enabledIndexes = useMemo(
    () => options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0),
    [options]
  );

  const close = useCallback(() => {
    setOpen(false);
    setMenuPos(null);
  }, []);

  const updateMenuPos = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const margin = 8;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 260 && rect.top > spaceBelow;
    const maxWidth = Math.max(rect.width, window.innerWidth - margin * 2);
    const width = Math.min(Math.max(rect.width, menuMinWidth ?? rect.width), maxWidth);
    let left = rect.left;
    if (left + width > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - margin - width);
    }
    setMenuPos({
      top: openUp ? rect.top - 8 : rect.bottom + 4,
      left,
      width,
      openUp,
    });
  }, [menuMinWidth]);

  useEffect(() => {
    if (!open) return;
    const idx = options.findIndex((o) => o.value === selectedValue);
    setActiveIndex(idx >= 0 ? idx : enabledIndexes[0] ?? 0);
  }, [open, options, selectedValue, enabledIndexes]);

  useEffect(() => {
    if (!open) return;
    updateMenuPos();
    window.addEventListener("resize", updateMenuPos);
    window.addEventListener("scroll", updateMenuPos, true);
    return () => {
      window.removeEventListener("resize", updateMenuPos);
      window.removeEventListener("scroll", updateMenuPos, true);
    };
  }, [open, updateMenuPos]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return;
      close();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function commit(next: string) {
    if (!isControlled) setUncontrolled(next);
    emitChange(onChange, next, name ?? "");
    close();
  }

  function move(delta: number) {
    if (enabledIndexes.length === 0) return;
    const currentPos = enabledIndexes.indexOf(activeIndex);
    const start = currentPos === -1 ? (delta > 0 ? -1 : 0) : currentPos;
    const nextPos = (start + delta + enabledIndexes.length) % enabledIndexes.length;
    setActiveIndex(enabledIndexes[nextPos]);
  }

  function typeahead(key: string) {
    searchRef.current += key.toLowerCase();
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      searchRef.current = "";
    }, 500);
    const q = searchRef.current;
    const match = options.findIndex(
      (o) => !o.disabled && o.label.toLowerCase().startsWith(q)
    );
    if (match >= 0) {
      setActiveIndex(match);
      if (!open) commit(options[match].value);
    }
  }

  function onTriggerKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) {
          updateMenuPos();
          setOpen(true);
        } else move(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!open) {
          updateMenuPos();
          setOpen(true);
        } else move(-1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        if (!open) {
          updateMenuPos();
          setOpen(true);
        } else {
          const opt = options[activeIndex];
          if (opt && !opt.disabled) commit(opt.value);
        }
        break;
      case "Escape":
        if (open) {
          event.preventDefault();
          close();
        }
        break;
      case "Home":
        event.preventDefault();
        if (enabledIndexes.length) setActiveIndex(enabledIndexes[0]);
        break;
      case "End":
        event.preventDefault();
        if (enabledIndexes.length) setActiveIndex(enabledIndexes[enabledIndexes.length - 1]);
        break;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          event.preventDefault();
          if (!open) {
            updateMenuPos();
            setOpen(true);
          }
          typeahead(event.key);
        }
    }
  }

  const marketing = variant === "marketing";
  const triggerClass = marketing
    ? cn(
        "flex h-[42px] w-full items-center justify-between gap-2 rounded-[12px] border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)] px-3.5 text-left text-sm text-[var(--mkt-ink)] transition-[border-color,box-shadow,background-color]",
        "focus-visible:border-[var(--mkt-royal)] focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(244,163,0,0.35)]",
        open && "border-[var(--mkt-royal)]",
        error && "border-[var(--ds-color-danger-border)]",
        disabled && "cursor-not-allowed opacity-60",
        className
      )
    : cn(
        "ds-focus-ring flex h-9 w-full items-center justify-between gap-2 rounded-lg border text-left text-sm transition-[border-color,box-shadow,background-color]",
        "disabled:cursor-not-allowed disabled:opacity-60",
        error && "border-[var(--ds-color-danger-border)]",
        className
      );

  const triggerStyle: React.CSSProperties | undefined = marketing
    ? style
    : {
        borderColor: "var(--ds-color-border)",
        background: "var(--ds-color-surface-muted)",
        color: "var(--ds-color-text-primary)",
        ...style,
      };

  const placeholder = options.find((o) => o.value === "")?.label;
  const displayLabel = selected && selected.value !== "" ? selected.label : placeholder ?? "Select";
  const isPlaceholder = !selected || selected.value === "";

  return (
    <div className="w-full" ref={rootRef}>
      {label ? (
        <Label htmlFor={inputId} hint={hint} hintId={hintId} required={required}>
          {label}
        </Label>
      ) : null}
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          id={inputId}
          disabled={disabled}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={open ? `${listboxId}-opt-${activeIndex}` : undefined}
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={describedBy}
          aria-label={ariaLabel}
          aria-required={required || undefined}
          className={triggerClass}
          style={triggerStyle}
          onClick={() => {
            if (disabled) return;
            if (open) {
              close();
              return;
            }
            updateMenuPos();
            setOpen(true);
          }}
          onKeyDown={onTriggerKeyDown}
        >
          <span className={cn("min-w-0 flex-1 truncate", isPlaceholder && "opacity-70")}>
            {displayLabel}
          </span>
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
            style={{ color: marketing ? "var(--mkt-gray)" : "var(--ds-color-text-muted)" }}
            aria-hidden
          />
        </button>
        {open && menuPos && typeof document !== "undefined"
          ? createPortal(
              <ul
                ref={listRef}
                id={listboxId}
                role="listbox"
                aria-labelledby={inputId}
                className={cn(
                  "fixed z-[80] max-h-64 overflow-auto py-1",
                  marketing
                    ? "rounded-[12px] shadow-[var(--mkt-shadow-soft,0_10px_40px_rgba(0,0,0,0.35))]"
                    : "rounded-lg shadow-[var(--ds-shadow-dropdown)]"
                )}
                style={{
                  top: menuPos.top,
                  left: menuPos.left,
                  width: menuPos.width,
                  transform: menuPos.openUp ? "translateY(-100%)" : undefined,
                  background: "var(--ds-color-surface-elevated)",
                  color: "var(--ds-color-text-primary)",
                  border: "1px solid var(--ds-color-border)",
                }}
              >
                {options.map((opt, index) => {
                  const active = index === activeIndex;
                  const selectedOpt = opt.value === selectedValue;
                  return (
                    <li
                      key={`${opt.value}-${index}`}
                      id={`${listboxId}-opt-${index}`}
                      role="option"
                      data-index={index}
                      aria-selected={selectedOpt}
                      aria-disabled={opt.disabled || undefined}
                      className={cn(
                        "cursor-pointer whitespace-normal break-words px-3 py-2 text-sm leading-snug",
                        opt.disabled && "cursor-not-allowed opacity-50",
                        active && !opt.disabled && "bg-[rgba(244,163,0,0.16)]",
                        selectedOpt && "font-semibold text-[var(--ds-color-primary)]"
                      )}
                      onMouseEnter={() => !opt.disabled && setActiveIndex(index)}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        if (!opt.disabled) commit(opt.value);
                      }}
                    >
                      {opt.label}
                    </li>
                  );
                })}
              </ul>,
              document.body
            )
          : null}
        <input type="hidden" name={name} value={selectedValue} required={required} />
      </div>
      {!label && hint ? (
        <p id={hintId} className="ds-caption mt-1">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-error`} className="ds-caption mt-1 text-[var(--ds-color-danger-text)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
