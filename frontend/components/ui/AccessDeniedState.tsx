"use client";

import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { getDefaultHomeRoute } from "@/lib/auth/roles";
import { useAuth } from "@/lib/auth/AuthContext";
import { translate } from "@/lib/i18n";

type AccessDeniedStateProps = {
  title?: string;
  description?: string;
  homeHref?: string;
};

/**
 * Friendly role-access denial — prefer hiding modules in nav; use this for deep links.
 */
export function AccessDeniedState({
  title,
  description,
  homeHref,
}: AccessDeniedStateProps) {
  const { user } = useAuth();
  const href = homeHref ?? getDefaultHomeRoute(user?.roles);

  return (
    <EmptyState
      title={title ?? translate("errors.noSectionAccess")}
      description={description ?? translate("errors.noSectionAccessBody")}
      icon={<ShieldOff className="h-5 w-5" aria-hidden />}
      action={
        <Link href={href}>
          <Button type="button" variant="secondary">
            {translate("common.returnToDashboard")}
          </Button>
        </Link>
      }
    />
  );
}
