"use client";

import React from "react";
import type { UserListItem } from "@/lib/api/users.api";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmployeeAvatar } from "./EmployeeAvatar";
import {
  accountStatusBadge,
  remoteBadge,
} from "@/lib/employees/employeeBadges";
import {
  employeeFullName,
  employeeRoleLabel,
} from "@/lib/employees/employeeUtils";
import { Badge } from "@/components/ui/Badge";
import { translate } from "@/lib/i18n";
import { Eye, Plus, Users } from "lucide-react";

interface EmployeesTablePanelProps {
  filtered: UserListItem[];
  totalUsers: number;
  loading?: boolean;
  hasActiveFilters: boolean;
  onOpenDetails: (userId: string) => void;
  onAddEmployee: () => void;
  columns: Array<{
    key: string;
    header: string;
    render?: (row: UserListItem) => React.ReactNode;
  }>;
}

function emptyDescription(totalUsers: number, hasActiveFilters: boolean): string {
  if (totalUsers === 0) return translate("employees.addFirstEmployee");
  if (hasActiveFilters) return translate("employees.adjustFilters");
  return translate("employees.noMatchCurrentView");
}

export function EmployeesTablePanel({
  filtered,
  totalUsers,
  loading,
  hasActiveFilters,
  onOpenDetails,
  onAddEmployee,
  columns,
}: EmployeesTablePanelProps) {
  const emptyTitle = totalUsers === 0 ? translate("employees.noEmployeesYet") : translate("employees.noEmployeesFound");
  const emptyDesc = emptyDescription(totalUsers, hasActiveFilters);

  if (!loading && filtered.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDesc}
        icon={<Users className="h-5 w-5" />}
        action={
          totalUsers === 0 ? (
            <Button
              variant="primary"
              size="sm"
              onClick={onAddEmployee}
              leftIcon={<Plus className="h-4 w-4" aria-hidden />}
            >
              {translate("employees.addEmployee")}
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <Card padding={false}>
          <CardHeader title={translate("employees.employeeDirectory")} />
          <CardBody className="!p-0">
            <DataTable
              columns={columns}
              data={filtered}
              keyExtractor={(row) => row.id}
              loading={loading}
              stickyHeader
              emptyMessage={translate("employees.noEmployeesFound")}
              emptyDescription={emptyDesc}
              emptyIcon={<Users className="h-5 w-5" />}
              onRowClick={(row) => onOpenDetails(row.id)}
              rowAriaLabel={(row) =>
                translate("employees.viewDetailsFor", { values: { name: employeeFullName(row) } })
              }
            />
          </CardBody>
        </Card>
      </div>

      <ul className="space-y-3 md:hidden" aria-label={translate("employees.title")}>
        {loading ? (
          <li className="list-none">
            <DataTable
              columns={[{ key: "loading", header: translate("common.loading") }]}
              data={[]}
              loading
              keyExtractor={() => "loading"}
            />
          </li>
        ) : (
          filtered.map((row) => (
            <li key={row.id}>
            <Card hoverable padding={false}>
              <CardBody className="space-y-3">
                <div className="flex items-start gap-3">
                  <EmployeeAvatar user={row} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold" style={{ color: "var(--ds-color-text-primary)" }}>
                      {employeeFullName(row)}
                    </p>
                    <p className="text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
                      {employeeRoleLabel(row)}
                    </p>
                    <p className="mt-1 truncate text-xs" style={{ color: "var(--ds-color-text-secondary)" }}>
                      {row.email}
                    </p>
                    {row.phone_number ? (
                      <p className="truncate text-xs" style={{ color: "var(--ds-color-text-muted)" }}>
                        {row.phone_number}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {accountStatusBadge(row.status)}
                    {remoteBadge(row.remote_attendance_allowed)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {row.department?.name ? <Badge variant="neutral">{row.department.name}</Badge> : null}
                  {row.branch?.name ? <Badge variant="neutral">{row.branch.name}</Badge> : null}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => onOpenDetails(row.id)}
                  leftIcon={<Eye className="h-4 w-4" aria-hidden />}
                >
                  {translate("employees.viewDetails")}
                </Button>
              </CardBody>
            </Card>
            </li>
          ))
        )}
      </ul>
    </>
  );
}
