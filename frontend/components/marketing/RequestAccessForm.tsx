"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { MarketingButton } from "./MarketingButton";
import { RequestAccessSuccessPanel } from "./RequestAccessSuccessPanel";
import { Select } from "@/components/ui/SelectField";
import { submitOnboardingRequest } from "@/lib/api/onboarding.api";
import { MARKETING_COUNTRIES } from "@/lib/marketing/countries";
import { EMPLOYEE_COUNT_OPTIONS } from "@/lib/marketing/siteConfig";
import { isApiError } from "@/lib/types/api";
import { cn } from "@/lib/design-system/cn";
import { marketingText } from "@/lib/marketing/text";

const fieldClass =
  "w-full rounded-[12px] border border-[var(--mkt-border-strong)] bg-[var(--mkt-surface)] px-3.5 py-2.5 text-sm text-[var(--mkt-ink)] placeholder:text-[var(--mkt-gray)] transition-[border-color,box-shadow] focus:outline-none focus-visible:border-[var(--mkt-royal)] focus-visible:shadow-[0_0_0_3px_rgba(244,163,0,0.35)]";

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  children: ReactNode;
};

function Field({ id, label, required, optional, children }: FieldProps) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[var(--mkt-ink)]">
        {label}
        {required ? <span className="ml-0.5 text-[var(--mkt-royal)]">*</span> : null}
        {optional ? <span className="ml-1.5 text-xs font-normal text-[var(--mkt-gray)]">{marketingText("requestAccess.optional")}</span> : null}
      </label>
      {children}
    </div>
  );
}

type Props = {
  className?: string;
  /** Called after a successful submit (new or duplicate-friendly). */
  onSuccess?: (result: { already_exists: boolean; message: string }) => void;
  /** Called when the user chooses to submit another request from the success panel. */
  onReset?: () => void;
};

/**
 * Public Request Access form.
 * Posts to the existing onboarding backend / Platform Admin inbox.
 * On success, replaces the form with a prominent confirmation panel.
 */
export function RequestAccessForm({ className, onSuccess, onReset }: Props) {
  const baseId = useId();
  const [companyName, setCompanyName] = useState("");
  const [fullName, setFullName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [role, setRole] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [alreadyExists, setAlreadyExists] = useState(false);

  function resetToForm() {
    setSuccess(null);
    setAlreadyExists(false);
    setError(null);
    onReset?.();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setAlreadyExists(false);

    const res = await submitOnboardingRequest({
      company_name: companyName,
      full_name: fullName,
      work_email: workEmail,
      phone,
      country,
      role: role || undefined,
      employee_count: employeeCount || undefined,
      notes: message || undefined,
    });

    setLoading(false);

    if (isApiError(res)) {
      setError(res.error ?? marketingText("requestAccess.submitError"));
      return;
    }

    const result = res.data;
    const msg =
      result?.message ??
      (result?.already_exists
        ? marketingText("requestAccess.alreadyExists")
        : marketingText("requestAccess.received"));

    setAlreadyExists(Boolean(result?.already_exists));
    setSuccess(msg);
    onSuccess?.({ already_exists: Boolean(result?.already_exists), message: msg });

    if (!result?.already_exists) {
      setCompanyName("");
      setFullName("");
      setWorkEmail("");
      setPhone("");
      setCountry("");
      setRole("");
      setEmployeeCount("");
      setMessage("");
    }
  }

  if (success) {
    return (
      <RequestAccessSuccessPanel
        className={className}
        alreadyExists={alreadyExists}
        message={success}
        onSubmitAnother={resetToForm}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} className={cn("space-y-5", className)}>
      {error ? (
        <div
          role="alert"
          className="rounded-[var(--mkt-radius-md)] border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${baseId}-company`} label={marketingText("requestAccess.companyName")} required>
          <input
            id={`${baseId}-company`}
            name="company_name"
            className={fieldClass}
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            autoComplete="organization"
            required
          />
        </Field>

        <Field id={`${baseId}-name`} label={marketingText("requestAccess.fullName")} required>
          <input
            id={`${baseId}-name`}
            name="full_name"
            className={fieldClass}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            required
          />
        </Field>

        <Field id={`${baseId}-email`} label={marketingText("requestAccess.workEmail")} required>
          <input
            id={`${baseId}-email`}
            name="work_email"
            type="email"
            className={fieldClass}
            value={workEmail}
            onChange={(e) => setWorkEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </Field>

        <Field id={`${baseId}-phone`} label={marketingText("requestAccess.phone")} required>
          <input
            id={`${baseId}-phone`}
            name="phone"
            type="tel"
            className={fieldClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            required
          />
        </Field>

        <Field id={`${baseId}-country`} label={marketingText("requestAccess.country")} required>
          <Select
            id={`${baseId}-country`}
            name="country"
            variant="marketing"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
            aria-label={marketingText("requestAccess.country")}
          >
            <option value="">{marketingText("requestAccess.selectCountry")}</option>
            {MARKETING_COUNTRIES.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </Field>

        <Field id={`${baseId}-role`} label={marketingText("requestAccess.role")} optional>
          <input
            id={`${baseId}-role`}
            name="role"
            className={fieldClass}
            value={role}
            onChange={(e) => setRole(e.target.value)}
            autoComplete="organization-title"
            placeholder={marketingText("requestAccess.rolePlaceholder")}
          />
        </Field>

        <Field id={`${baseId}-employees`} label={marketingText("requestAccess.employeeCount")} optional>
          <Select
            id={`${baseId}-employees`}
            name="employee_count"
            variant="marketing"
            value={employeeCount}
            onChange={(e) => setEmployeeCount(e.target.value)}
            aria-label={marketingText("requestAccess.employeeCount")}
          >
            <option value="">{marketingText("requestAccess.selectRange")}</option>
            {EMPLOYEE_COUNT_OPTIONS.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field id={`${baseId}-message`} label={marketingText("requestAccess.message")} optional>
        <textarea
          id={`${baseId}-message`}
          name="message"
          className={cn(fieldClass, "min-h-[120px] resize-y")}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder={marketingText("requestAccess.messagePlaceholder")}
        />
      </Field>

      <MarketingButton type="submit" size="lg" disabled={loading} className="w-full sm:w-auto">
        {loading ? marketingText("cta.submitting") : marketingText("cta.submitRequest")}
      </MarketingButton>
    </form>
  );
}
