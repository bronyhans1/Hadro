import React from "react";
import type { UserListItem } from "@/lib/api/users.api";
import { employeeInitials } from "@/lib/employees/employeeUtils";
import { AvatarPhoto } from "@/components/ui/AvatarPhoto";

interface EmployeeAvatarProps {
  user: UserListItem;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
};

const sizePx = {
  sm: 32,
  md: 40,
  lg: 56,
};

export function EmployeeAvatar({ user, size = "md" }: EmployeeAvatarProps) {
  const name = employeeInitials(user);

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ${sizeClasses[size]}`}
      style={{ background: "var(--ds-color-primary-muted)", color: "var(--ds-color-primary)" }}
      aria-hidden={user.profile_photo_url ? undefined : true}
    >
      {user.profile_photo_url ? (
        <AvatarPhoto
          src={user.profile_photo_url}
          alt=""
          size={sizePx[size]}
          className="h-full w-full object-cover"
        />
      ) : (
        name
      )}
    </div>
  );
}
