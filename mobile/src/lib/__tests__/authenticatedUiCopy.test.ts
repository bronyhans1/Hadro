import { setActiveLocale } from "../../../../shared/i18n";
import {
  payrollHealthWarnings,
  presentPayrollReadiness,
  presentPayrollTimelineEvent,
  presentStructuredAuditAction,
  presentTimelineModule,
  translate,
} from "../../../../shared/i18n";

const zeroCounts = {
  draftRecords: 0,
  pendingManualOt: 0,
  pendingRemoteAttendance: 0,
  leaveChangesInMonth: 0,
  syncFailuresInMonth: 0,
};

describe("authenticated application copy", () => {
  afterEach(() => {
    setActiveLocale("en");
  });

  it("localizes the payroll readiness sentence and shared shell labels", () => {
    setActiveLocale("fr");
    expect(payrollHealthWarnings(zeroCounts)).toEqual(["La paie semble prête pour examen."]);
    expect(translate("profile.completeProfile")).toBe("Compléter le profil");
    expect(translate("common.optional")).toBe("Facultatif");
    expect(translate("support.launcher")).toBe("Assistance");
    expect(translate("profile.completeProfile")).not.toBe("Complete profile");
  });

  it("renders a stored payroll period event from its type and locale date", () => {
    setActiveLocale("fr");
    const copy = presentPayrollTimelineEvent({
      event_type: "payroll_period.created",
      title: "Payroll Period Created",
      description: "October 2026 payroll period was created.",
      metadata: { year: 2026, month: 10 },
    });
    expect(copy.title).toBe("Période de paie créée");
    expect(copy.description.toLowerCase()).toContain("octobre");
    expect(copy.description).not.toContain("October");
    expect(copy.description).toContain("2026");
  });

  it("does not inherit Arabic payroll copy as English and keeps right-to-left text localized", () => {
    setActiveLocale("ar");
    expect(payrollHealthWarnings(zeroCounts)[0]).toBe("يبدو أن الرواتب جاهزة للمراجعة.");
    expect(translate("support.launcher")).toBe("الدعم");
  });

  it("returns English when the locale is English", () => {
    setActiveLocale("en");
    expect(payrollHealthWarnings(zeroCounts)[0]).toBe("Payroll appears ready for review.");
    expect(translate("common.optional")).toBe("Optional");
    expect(translate("support.launcher")).toBe("Support");
  });

  it("localizes the payroll category badge and leaves unknown modules unchanged", () => {
    setActiveLocale("fr");
    expect(presentTimelineModule("payroll")).toBe("Paie");
    expect(presentTimelineModule("payroll")).not.toBe("payroll");
    expect(presentTimelineModule("custom-module")).toBe("custom-module");
    setActiveLocale("en");
    expect(presentTimelineModule("payroll")).toBe("Payroll");
  });

  it("localizes known audit action codes and leaves unknown actions unmapped", () => {
    setActiveLocale("fr");
    expect(presentStructuredAuditAction("company_profile_updated")).toBe("Profil d'entreprise mis à jour");
    expect(presentStructuredAuditAction("company_profile_setup_dismissed")).toBe(
      "Configuration du profil d'entreprise ignorée"
    );
    expect(presentStructuredAuditAction("legacy.free_form_note")).toBeNull();
    setActiveLocale("en");
    expect(presentStructuredAuditAction("company_profile_updated")).toBe("Company Profile Updated");
  });

  it("localizes the live earnings empty state and profile file labels in every reviewed locale", () => {
    const earnings = {
      fr: "Aucun profil de compensation n'est enregistré. Lorsque l'administrateur ou les RH attribuent un taux horaire ou mensuel, vos gains apparaîtront ici.",
      pt: "Não há perfil de compensação registado. Quando a administração ou os RH atribuírem uma taxa horária ou mensal, os seus vencimentos aparecerão aqui.",
      es: "No hay un perfil de compensación registrado. Cuando administración o RR. HH. asignen una tarifa por hora o mensual, sus ingresos aparecerán aquí.",
      ar: "لا يوجد ملف تعويض مسجّل. عندما يعيّن المسؤول أو الموارد البشرية أجرًا ساعيًا أو شهريًا، ستظهر أرباحك هنا.",
      sw: "Hakuna wasifu wa fidia uliorekodiwa. Wakati msimamizi au HR atakapoweka kiwango cha saa au cha kila mwezi, mapato yako yataonekana hapa.",
    };
    const choose = { fr: "Choisir un fichier", pt: "Escolher ficheiro", es: "Elegir archivo", ar: "اختيار ملف", sw: "Chagua faili" };
    const empty = {
      fr: "Aucun fichier choisi",
      pt: "Nenhum ficheiro escolhido",
      es: "Ningún archivo seleccionado",
      ar: "لم يتم اختيار ملف",
      sw: "Hakuna faili lililochaguliwa",
    };
    for (const locale of ["fr", "pt", "es", "ar", "sw"] as const) {
      setActiveLocale(locale);
      expect(translate("payroll.noCompensationOnFile")).toBe(earnings[locale]);
      expect(translate("profile.chooseFile")).toBe(choose[locale]);
      expect(translate("profile.noFileChosen")).toBe(empty[locale]);
      expect(translate("payroll.dailyRateAmount", { values: { amount: "10" } })).toContain("10");
    }
  });

  it("localizes dashboard payroll readiness from the status code, not the English API label", () => {
    setActiveLocale("fr");
    expect(presentPayrollReadiness("ready")).toBe("Prêt");
    expect(presentPayrollReadiness("ready")).not.toBe("Ready");
    expect(presentPayrollReadiness("needs_review")).toBe("À examiner");
    expect(presentPayrollReadiness("action_required")).toBe("Action requise");
    setActiveLocale("en");
    expect(presentPayrollReadiness("ready")).toBe("Ready");
    expect(presentPayrollReadiness("needs_review")).toBe("Needs Review");
    expect(presentPayrollReadiness("action_required")).toBe("Action Required");
  });

  it("localizes the payroll readiness badge and the attendance view action", () => {
    setActiveLocale("fr");
    expect(translate("payroll.readiness.ready")).toBe("Prêt");
    expect(translate("payroll.readiness.needsReview")).toBe("À examiner");
    expect(translate("payroll.readiness.actionRequired")).toBe("Action requise");
    expect(translate("employees.view")).toBe("Voir");
    expect(translate("attendance.flaggedHighRisk", { count: 2 })).toBe("2 employés signalés à risque élevé.");
    expect(translate("attendance.markedAbsentToday", { count: 1 })).toBe("1 employé marqué absent aujourd'hui.");
    expect(translate("attendance.lateArrivalsToday", { count: 2 })).toBe("2 arrivées en retard aujourd'hui.");
    setActiveLocale("en");
    expect(translate("payroll.readiness.ready")).toBe("Ready");
    expect(translate("employees.view")).toBe("View");
  });

  it("keeps an unknown stored timeline sentence unchanged", () => {
    setActiveLocale("fr");
    const copy = presentPayrollTimelineEvent({
      event_type: "custom.note",
      title: "Payroll Period Created",
      description: "October 2026 payroll period was created.",
      metadata: null,
    });
    expect(copy.description).toBe("October 2026 payroll period was created.");
  });
});
