"use client";

import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { translate } from "@/lib/i18n";
import { Plus } from "lucide-react";

interface EmployeesPageHeaderProps {
  branchScoped: boolean;
  branchName?: string | null;
  onAddEmployee: () => void;
}

export function EmployeesPageHeader({
  branchScoped,
  branchName,
  onAddEmployee,
}: EmployeesPageHeaderProps) {
  return (
    <PageHeader
      title={translate("employees.title")}
      subtitle={translate("employees.subtitle")}
      actions={
        <Button
          type="button"
          variant="primary"
          onClick={onAddEmployee}
          leftIcon={<Plus className="h-4 w-4" aria-hidden />}
        >
          {translate("employees.addEmployee")}
        </Button>
      }
    >
      {branchScoped && branchName ? (
        <span className="mt-1 block text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
          {translate("employees.showingInBranch", { values: { name: branchName } })}
        </span>
      ) : null}
    </PageHeader>
  );
}
