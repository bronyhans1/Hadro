import React from "react";
import { Calendar, Search } from "lucide-react";
import { cn } from "@/lib/design-system/cn";
import { Label } from "./Label";
export { Select } from "./SelectField";
export type { SelectProps } from "./SelectField";

const controlBase =
  "ds-focus-ring w-full rounded-lg border text-sm transition-[border-color,box-shadow,background-color] disabled:cursor-not-allowed disabled:opacity-60";

const controlStyle: React.CSSProperties = {
  borderColor: "var(--ds-color-border)",
  background: "var(--ds-color-surface-muted)",
  color: "var(--ds-color-text-primary)",
  transitionDuration: "var(--ds-duration-normal)",
};

function mergeDescribedBy(...ids: Array<string | undefined>) {
  const value = ids.filter(Boolean).join(" ");
  return value || undefined;
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  error,
  label,
  hint,
  leftIcon,
  rightIcon,
  className,
  id,
  style,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: InputProps) {
  const generatedId = React.useId();
  const inputId = id ?? props.name ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const isNativePicker =
    props.type === "date" || props.type === "month" || props.type === "datetime-local";
  /** Date fields keep a consistent calendar glyph; native indicator is visually hidden. */
  const hasLeftIcon = Boolean(leftIcon);
  const hasRightIcon = Boolean(rightIcon) && !isNativePicker;
  return (
    <div className="w-full">
      {label ? (
        <Label htmlFor={inputId} hint={hint} hintId={hintId} required={props.required}>
          {label}
        </Label>
      ) : null}
      <div className="relative">
        {hasLeftIcon ? (
          <span
            className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center"
            style={{ color: "var(--ds-color-text-muted)" }}
            aria-hidden
          >
            {leftIcon}
          </span>
        ) : null}
        <input
          id={inputId}
          className={cn(
            controlBase,
            "input-field h-9 placeholder:text-[var(--ds-color-text-muted)]",
            error && "border-[var(--ds-color-danger-border)]",
            className
          )}
          style={{
            ...controlStyle,
            "--ds-input-padding-left": hasLeftIcon ? "2.5rem" : "0.75rem",
            "--ds-input-padding-right": hasRightIcon ? "2.5rem" : "0.75rem",
            paddingInlineStart: hasLeftIcon ? "2.5rem" : "0.75rem",
            paddingInlineEnd: hasRightIcon ? "2.5rem" : "0.75rem",
            ...style,
          } as React.CSSProperties}
          data-native-picker={isNativePicker ? "true" : undefined}
          aria-invalid={error ? true : ariaInvalid}
          aria-describedby={mergeDescribedBy(ariaDescribedBy, hintId, errorId)}
          {...props}
        />
        {hasRightIcon ? (
          <span
            className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center"
            style={{ color: "var(--ds-color-text-muted)" }}
            aria-hidden
          >
            {rightIcon}
          </span>
        ) : null}
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

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  hint?: string;
}

export function Textarea({
  error,
  label,
  hint,
  className,
  id,
  rows = 4,
  style,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  ...props
}: TextareaProps) {
  const generatedId = React.useId();
  const inputId = id ?? props.name ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  return (
    <div className="w-full">
      {label ? (
        <Label htmlFor={inputId} hint={hint} hintId={hintId} required={props.required}>
          {label}
        </Label>
      ) : null}
      <textarea
        id={inputId}
        rows={rows}
        className={cn(controlBase, "input-field resize-y px-3 py-2", error && "border-[var(--ds-color-danger-border)]", className)}
        style={{
          ...controlStyle,
          paddingInline: "0.75rem",
          ...style,
        }}
        aria-invalid={error ? true : ariaInvalid}
        aria-describedby={mergeDescribedBy(ariaDescribedBy, hintId, errorId)}
        {...props}
      />
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

export type SearchInputProps = Omit<InputProps, "type" | "leftIcon">;

export function SearchInput(props: SearchInputProps) {
  return <Input type="search" leftIcon={<Search className="h-4 w-4" />} {...props} />;
}

export type DateInputProps = Omit<InputProps, "type" | "leftIcon" | "rightIcon">;

/** Canonical date field — single Lucide calendar icon; native picker opens on field click. */
export function DateInput({ className, ...props }: DateInputProps) {
  return (
    <Input
      type="date"
      leftIcon={<Calendar className="h-4 w-4" aria-hidden />}
      className={cn("date-input", className)}
      {...props}
    />
  );
}

export type MonthInputProps = Omit<InputProps, "type" | "leftIcon" | "rightIcon">;

export function MonthInput({ className, ...props }: MonthInputProps) {
  return (
    <Input
      type="month"
      leftIcon={<Calendar className="h-4 w-4" aria-hidden />}
      className={cn("date-input", className)}
      {...props}
    />
  );
}

export type DateTimeInputProps = Omit<InputProps, "type" | "leftIcon" | "rightIcon">;

export function DateTimeInput({ className, ...props }: DateTimeInputProps) {
  return (
    <Input
      type="datetime-local"
      leftIcon={<Calendar className="h-4 w-4" aria-hidden />}
      className={cn("date-input", className)}
      {...props}
    />
  );
}

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  const inputId = id ?? `checkbox-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <label htmlFor={inputId} className={cn("inline-flex cursor-pointer items-center gap-2", className)}>
      <input
        id={inputId}
        type="checkbox"
        className="hadro-checkbox ds-focus-ring h-4 w-4 rounded border-[var(--ds-color-border)]"
        {...props}
      />
      <span className="ds-body-sm">{label}</span>
    </label>
  );
}

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export function Radio({ label, className, id, ...props }: RadioProps) {
  const inputId = id ?? `radio-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <label htmlFor={inputId} className={cn("inline-flex cursor-pointer items-center gap-2", className)}>
      <input
        id={inputId}
        type="radio"
        className="hadro-radio ds-focus-ring h-4 w-4 border-[var(--ds-color-border)]"
        {...props}
      />
      <span className="ds-body-sm">{label}</span>
    </label>
  );
}

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
}

export function Switch({ label, className, id, checked, ...props }: SwitchProps) {
  const inputId = id ?? `switch-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <label htmlFor={inputId} className={cn("inline-flex cursor-pointer items-center gap-3", className)}>
      <span className="relative inline-flex h-5 w-9 shrink-0">
        <input id={inputId} type="checkbox" role="switch" className="peer sr-only" checked={checked} {...props} />
        <span
          className="absolute inset-0 rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--ds-ring-focus)] peer-checked:bg-[var(--ds-color-primary)]"
          style={{
            background: checked ? undefined : "var(--ds-color-surface-muted)",
            borderColor: "var(--ds-color-border)",
            transitionDuration: "var(--ds-duration-normal)",
          }}
        />
        <span
          className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4"
          style={{ transitionDuration: "var(--ds-duration-normal)" }}
        />
      </span>
      <span className="ds-body-sm">{label}</span>
    </label>
  );
}
