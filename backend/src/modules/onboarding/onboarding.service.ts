import * as repo from "./onboarding.repository";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function cleanText(value: unknown, maxLen: number): string {
  return String(value ?? "")
    .trim()
    .slice(0, maxLen);
}

export type SubmitOnboardingResult = {
  id: string;
  message: string;
  already_exists: boolean;
};

export async function submitOnboardingRequest(input: {
  company_name: unknown;
  full_name: unknown;
  work_email: unknown;
  phone?: unknown;
  role?: unknown;
  notes?: unknown;
  employee_count?: unknown;
  country?: unknown;
  /** Intentionally not collected on the public form. */
  industry?: unknown;
  city?: unknown;
}): Promise<SubmitOnboardingResult> {
  const company_name = cleanText(input.company_name, 200);
  const full_name = cleanText(input.full_name, 200);
  const work_email = cleanText(input.work_email, 320).toLowerCase();

  const phone = cleanText(input.phone, 40);
  const country = cleanText(input.country, 120);
  const employee_count = cleanText(input.employee_count, 40) || null;

  if (!company_name) throw new Error("Company name is required");
  if (!full_name) throw new Error("Full name is required");
  if (!work_email || !EMAIL_RE.test(work_email)) throw new Error("A valid work email is required");
  if (!phone) throw new Error("Phone number is required");
  if (!country) throw new Error("Country is required");

  const existing = await repo.findActiveOnboardingRequestByEmail(work_email);
  if (existing) {
    return {
      id: existing.id,
      already_exists: true,
      message:
        "We already have your request. Our onboarding team will be in touch—no need to submit again.",
    };
  }

  const row = await repo.insertOnboardingRequest({
    company_name,
    full_name,
    work_email,
    phone,
    role: cleanText(input.role, 120) || null,
    notes: cleanText(input.notes, 2000) || null,
    industry: null,
    employee_count,
    country,
    city: null,
  });

  const adminIds = await repo.listPlatformAdminUserIds();
  await repo.insertPlatformNotifications(adminIds, {
    type: "onboarding_request",
    title: "New onboarding request",
    body: `${row.company_name} — ${row.full_name} (${row.work_email})`,
    metadata: { onboarding_request_id: row.id },
  });

  return {
    id: row.id,
    already_exists: false,
    message: "Request received. Our team will contact you shortly.",
  };
}

export async function listOnboardingRequestsForAdmin(options: {
  status?: repo.OnboardingRequestStatus;
  search?: string;
  page: number;
  limit: number;
}) {
  const limit = Math.min(Math.max(options.limit, 1), 100);
  const page = Math.max(options.page, 1);
  const offset = (page - 1) * limit;
  return repo.listOnboardingRequests({ ...options, limit, offset });
}

export async function updateOnboardingRequestForAdmin(
  id: string,
  patch: { status?: repo.OnboardingRequestStatus; admin_notes?: string | null }
) {
  const existing = await repo.getOnboardingRequestById(id);
  if (!existing) throw new Error("Onboarding request not found");
  return repo.updateOnboardingRequest(id, patch);
}

export async function listMyPlatformNotifications(userId: string, page: number, limit: number) {
  const safeLimit = Math.min(Math.max(limit, 1), 50);
  const safePage = Math.max(page, 1);
  const offset = (safePage - 1) * safeLimit;
  return repo.listPlatformNotifications(userId, safeLimit, offset);
}

export async function getMyPlatformUnreadCount(userId: string) {
  return repo.countUnreadPlatformNotifications(userId);
}

export async function markMyPlatformNotificationRead(userId: string, notificationId: string) {
  await repo.markPlatformNotificationRead(userId, notificationId);
}
