export type ProfileSection = "personal" | "work" | "security" | "preferences";

let remembered: ProfileSection = "personal";

export function readProfileSection(): ProfileSection {
  return remembered;
}

export function writeProfileSection(section: ProfileSection): void {
  remembered = section;
}

export function resetProfileSection(): void {
  remembered = "personal";
}
