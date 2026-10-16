import PDFDocument from "pdfkit";
import { supabaseAdmin } from "../../config/supabase";
import * as payrollRepo from "./payroll.repository";
import * as usersRepo from "../users/users.repository";
import * as companyPolicyService from "../companyPolicy/companyPolicy.service";
import {
  computeOvertimePayFromCompensation,
  formatOvertimeCompensationLabel,
  overtimeCompensationFromPolicy,
  resolveOvertimeCompensationApplied,
} from "../../lib/overtime/overtimeCompensation";

export interface PayslipResult {
  buffer: Buffer;
}

async function fetchCompanyLogoBuffer(logoUrl: string | null | undefined): Promise<Buffer | null> {
  if (!logoUrl?.trim()) return null;
  try {
    const res = await fetch(logoUrl.trim(), { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;
    const ab = await res.arrayBuffer();
    if (!ab.byteLength || ab.byteLength > 2_000_000) return null;
    return Buffer.from(ab);
  } catch {
    return null;
  }
}

export async function generatePayslip(
  payrollId: string,
  companyId: string
): Promise<{ buffer: Buffer } | null> {
  const payroll = await payrollRepo.getPayrollById(payrollId);
  if (!payroll || payroll.company_id !== companyId) {
    return null;
  }

  const user = await usersRepo.findByIdAndCompanyId(payroll.user_id, companyId);
  if (!user) {
    return null;
  }

  const { data: companyRow } = await supabaseAdmin
    .from("companies")
    .select("name, logo_url")
    .eq("id", companyId)
    .maybeSingle();
  const companyName =
    (companyRow as { name?: string } | null)?.name ?? "Company";
  const logoUrl =
    (companyRow as { logo_url?: string | null } | null)?.logo_url ?? null;
  const logoBuffer = await fetchCompanyLogoBuffer(logoUrl);

  const policy = await companyPolicyService.getPolicy(companyId);
  const policyCompensation = overtimeCompensationFromPolicy(policy);
  const compensationApplied = resolveOvertimeCompensationApplied(
    payroll,
    policyCompensation
  );

  const regularPay =
    (payroll.regular_minutes / 60) * payroll.hourly_rate;
  const overtimePay = computeOvertimePayFromCompensation(
    payroll.overtime_minutes,
    payroll.hourly_rate,
    compensationApplied
  );
  const otCompensationLabel = formatOvertimeCompensationLabel(compensationApplied);

  const lateBreak = payrollRepo.payrollRecordEarningsBreakdown(payroll);

  const buffer = await buildPdf({
    companyName,
    logoBuffer,
    employeeName: `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || "Employee",
    payrollDate: payroll.payroll_date,
    regularMinutes: payroll.regular_minutes,
    overtimeMinutes: payroll.overtime_minutes,
    hourlyRate: payroll.hourly_rate,
    regularPay,
    overtimePay,
    otCompensationLabel,
    grossEarnings: payroll.gross_earnings,
    baseBeforeLate: lateBreak.baseBeforeLate,
    lateDeduction: lateBreak.lateDeduction,
  });

  return { buffer };
}

function buildPdf(params: {
  companyName: string;
  logoBuffer: Buffer | null;
  employeeName: string;
  payrollDate: string;
  regularMinutes: number;
  overtimeMinutes: number;
  hourlyRate: number;
  regularPay: number;
  overtimePay: number;
  otCompensationLabel: string;
  grossEarnings: number;
  baseBeforeLate: number;
  lateDeduction: number;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    if (params.logoBuffer) {
      try {
        doc.image(params.logoBuffer, { fit: [64, 64], align: "center" });
        doc.moveDown(0.5);
      } catch {
        // Invalid image — continue with text-only company header
      }
    }

    doc.fontSize(18).text("Payslip", { align: "center" });
    doc.moveDown();

    doc.fontSize(12);
    doc.text(`Company: ${params.companyName}`);
    doc.text(`Employee: ${params.employeeName}`);
    doc.text(`Payroll date: ${params.payrollDate}`);
    doc.moveDown();

    doc.text(`Regular minutes: ${params.regularMinutes}`);
    doc.text(`Overtime minutes: ${params.overtimeMinutes}`);
    doc.text(`Hourly rate: ${params.hourlyRate.toFixed(2)}`);
    doc.text(`OT compensation: ${params.otCompensationLabel}`);
    doc.moveDown();

    doc.text(`Regular pay: ${params.regularPay.toFixed(2)}`);
    doc.text(`Overtime pay: ${params.overtimePay.toFixed(2)}`);
    if (params.lateDeduction > 0) {
      doc.moveDown(0.25);
      doc
        .fontSize(12)
        .text(`Earnings before late deduction: ${params.baseBeforeLate.toFixed(2)}`);
      doc.text(`Late pay deduction: -${params.lateDeduction.toFixed(2)}`);
      doc.moveDown(0.25);
      doc.fontSize(14).text(`Net earnings (payable): ${params.grossEarnings.toFixed(2)}`, {
        continued: false,
      });
    } else {
      doc.fontSize(14).text(`Gross earnings: ${params.grossEarnings.toFixed(2)}`, {
        continued: false,
      });
    }

    doc.moveDown(2);
    doc.fontSize(9).fillColor("#666666").text("Powered by HADRO Technologies", {
      align: "center",
    });

    doc.end();
  });
}
