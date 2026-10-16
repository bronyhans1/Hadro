/**
 * RB.3 codemod: wrap await XxxApi.foo(...) with safeApi(...).
 * Run from frontend/: node scripts/rb3-wrap-safeapi.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const files = [
  "app/(main)/attendance/page.tsx",
  "app/(main)/attendance/history/page.tsx",
  "app/(main)/attendance/remote-review/page.tsx",
  "app/(main)/attendance/absence/page.tsx",
  "app/(main)/attendance/flags/page.tsx",
  "app/(main)/attendance/lateness/page.tsx",
  "app/(main)/leave/page.tsx",
  "app/(main)/leave/requests/page.tsx",
  "app/(main)/leave/balance/page.tsx",
  "app/(main)/leave/calendar/page.tsx",
  "app/(main)/employees/page.tsx",
  "app/(main)/payroll/page.tsx",
  "app/(main)/payroll/records/page.tsx",
  "app/(main)/reports/page.tsx",
  "app/(main)/reports/attendance/page.tsx",
  "app/(main)/reports/leave/page.tsx",
  "app/(main)/audit/page.tsx",
  "app/(main)/settings/page.tsx",
  "app/(platform)/platform/settings/page.tsx",
  "app/(platform)/platform/companies/page.tsx",
  "app/(platform)/platform/companies/new/page.tsx",
  "app/(platform)/platform/companies/[companyId]/page.tsx",
  "app/(platform)/platform/audit/page.tsx",
  "components/attendance/ManualAttendanceModal.tsx",
  "components/attendance/AttendanceEmployeePreviewDrawer.tsx",
  "components/leave/LeaveBalancesAdminPanel.tsx",
  "components/leave/CurrentlyOnLeavePanel.tsx",
  "components/payroll/PayrollPeriodTimeline.tsx",
  "components/notifications/NotificationBell.tsx",
  "components/profile/ProfileDrawer.tsx",
  "components/support/SupportLauncher.tsx",
  "lib/leave/useRequestLeave.ts",
];

function findMatchingParen(src, openIdx) {
  let depth = 0;
  let inStr = null;
  let escape = false;
  for (let i = openIdx; i < src.length; i++) {
    const c = src[i];
    if (inStr) {
      if (escape) {
        escape = false;
        continue;
      }
      if (c === "\\") {
        escape = true;
        continue;
      }
      if (c === inStr) inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inStr = c;
      continue;
    }
    if (c === "(") depth++;
    else if (c === ")") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function wrapAwaits(src) {
  const re = /await\s+(?!safeApi\()([A-Za-z_][\w]*Api)\.([A-Za-z_][\w]*)\s*\(/g;
  let out = "";
  let last = 0;
  let m;
  let wraps = 0;
  while ((m = re.exec(src)) !== null) {
    const start = m.index;
    const openParen = m.index + m[0].length - 1;
    const close = findMatchingParen(src, openParen);
    if (close < 0) continue;
    out += src.slice(last, start);
    const call = src.slice(start + "await ".length, close + 1);
    // call is XxxApi.foo(...)
    out += `await safeApi(${call})`;
    last = close + 1;
    wraps++;
    re.lastIndex = close + 1;
  }
  out += src.slice(last);
  return { src: out, wraps };
}

function ensureImports(src) {
  if (src.includes("@/lib/api/safeApi")) return src;
  // Insert after first import line
  const lines = src.split("\n");
  let insertAt = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("import ")) insertAt = i + 1;
    else if (insertAt > 0 && !lines[i].startsWith("import ") && lines[i].trim() !== "") break;
  }
  lines.splice(insertAt, 0, 'import { safeApi } from "@/lib/api/safeApi";');
  return lines.join("\n");
}

const report = [];
for (const rel of files) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) {
    report.push({ rel, status: "missing" });
    continue;
  }
  let src = fs.readFileSync(p, "utf8");
  const { src: wrapped, wraps } = wrapAwaits(src);
  src = wrapped;
  if (wraps > 0 || src.includes("Api.")) {
    src = ensureImports(src);
  }
  // Soften common catch message patterns to use toUserFacingApiError when present
  if (wraps > 0 && !src.includes("toUserFacingApiError") && /setError\(|toast\.error\(/.test(src)) {
    src = src.replace(
      'import { safeApi } from "@/lib/api/safeApi";',
      'import { safeApi } from "@/lib/api/safeApi";\nimport { toUserFacingApiError } from "@/lib/api/userFacingError";'
    );
  }
  fs.writeFileSync(p, src);
  report.push({ rel, wraps });
}

console.log(JSON.stringify(report, null, 2));
console.log("TOTAL_WRAPS", report.reduce((a, r) => a + (r.wraps || 0), 0));
