import type { AuthUser } from "@/lib/types/auth";

/** True when the user must finish password and/or required profile fields before using the app. */
export function needsFirstLoginOnboarding(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  if (user.mustChangePassword) return true;
  if (user.profileCompletion && !user.profileCompletion.requiredComplete) return true;
  return false;
}

export function onboardingMissingPassword(user: AuthUser): boolean {
  return (
    user.mustChangePassword ||
    user.profileCompletion.missingRequiredFields.includes("password")
  );
}

export function onboardingMissingDob(user: AuthUser): boolean {
  return (
    !user.dateOfBirth?.trim() ||
    user.profileCompletion.missingRequiredFields.includes("date_of_birth")
  );
}
