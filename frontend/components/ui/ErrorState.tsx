"use client";

import React from "react";
import { useLocale } from "@/components/providers/LocaleProvider";
import { Button } from "./Button";
import { Alert } from "./Alert";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ message, onRetry, className = "" }: ErrorStateProps) {
  const { t } = useLocale();
  return (
    <div className={className}>
      <Alert variant="error" title={t("errors.generic")}>
        {message}
        {onRetry ? (
          <div className="mt-3">
            <Button variant="outline" size="sm" onClick={onRetry}>
              {t("common.retry")}
            </Button>
          </div>
        ) : null}
      </Alert>
    </div>
  );
}
