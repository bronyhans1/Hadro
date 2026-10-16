"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { m, useReducedMotion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { formatTodayDate, getTimeGreeting } from "@/lib/dashboard/formatters";
import { greetingWave } from "@/lib/motion";
import { CompanyLogoMark } from "@/components/company/CompanyLogoMark";
import { translate } from "@/lib/i18n";

type WelcomePeriod = "morning" | "afternoon" | "evening";

type WelcomeIllustration = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

type WelcomeTheme = {
  period: WelcomePeriod;
  gradient: string;
  glow: string;
};

function periodFromGreeting(greeting: string): WelcomePeriod {
  if (greeting === translate("dashboard.goodMorning")) return "morning";
  if (greeting === translate("dashboard.goodAfternoon")) return "afternoon";
  return "evening";
}

function illustrationForPeriod(period: WelcomePeriod): WelcomeIllustration {
  if (period === "morning") {
    return {
      src: "/morning.jpg",
      alt: translate("dashboard.morningAlt"),
      width: 1839,
      height: 855,
    };
  }
  if (period === "afternoon") {
    return {
      src: "/afternoon.jpg",
      alt: translate("dashboard.afternoonAlt"),
      width: 1824,
      height: 862,
    };
  }
  return {
    src: "/evening.jpg",
    alt: translate("dashboard.eveningAlt"),
    width: 1774,
    height: 887,
  };
}

/** Soft banner themes keyed to the same greeting period as the illustration. */
function themeForPeriod(period: WelcomePeriod): WelcomeTheme {
  if (period === "morning") {
    return {
      period,
      gradient: "var(--ds-welcome-morning-gradient)",
      glow: "var(--ds-welcome-morning-glow)",
    };
  }
  if (period === "afternoon") {
    return {
      period,
      gradient: "var(--ds-welcome-afternoon-gradient)",
      glow: "var(--ds-welcome-afternoon-glow)",
    };
  }
  return {
    period,
    gradient: "var(--ds-welcome-evening-gradient)",
    glow: "var(--ds-welcome-evening-glow)",
  };
}

const PERIODS: WelcomePeriod[] = ["morning", "afternoon", "evening"];

export function DashboardWelcome() {
  const { user } = useAuth();
  const reduced = useReducedMotion();
  const firstName = user?.firstName?.trim() || user?.email?.split("@")[0] || translate("dashboard.greetingFallback");
  const greeting = getTimeGreeting();
  const nextPeriod = periodFromGreeting(greeting);

  const [period, setPeriod] = useState(nextPeriod);
  const [illustration, setIllustration] = useState(() => illustrationForPeriod(nextPeriod));
  const [illustrationVisible, setIllustrationVisible] = useState(true);

  useEffect(() => {
    if (nextPeriod === period) return;

    setIllustrationVisible(false);
    const timer = window.setTimeout(() => {
      setPeriod(nextPeriod);
      setIllustration(illustrationForPeriod(nextPeriod));
      setIllustrationVisible(true);
    }, 150);

    return () => window.clearTimeout(timer);
  }, [nextPeriod, period]);

  return (
    <header
      className="relative overflow-hidden rounded-2xl border shadow-sm sm:min-h-[170px] lg:min-h-[180px]"
      style={{
        borderColor: "var(--ds-color-border)",
        background: "var(--ds-color-surface)",
        boxShadow: "var(--ds-shadow-card)",
      }}
    >
      {/* Period theme layers — crossfade when greeting period changes */}
      {PERIODS.map((p) => {
        const theme = themeForPeriod(p);
        const active = p === period;
        return (
          <div
            key={p}
            className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-out"
            style={{
              background: theme.gradient,
              opacity: active ? 1 : 0,
            }}
            aria-hidden
          />
        );
      })}

      <div
        className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full blur-3xl transition-colors duration-500 sm:hidden"
        style={{ background: themeForPeriod(period).glow }}
        aria-hidden
      />

      {/*
        Photograph is height-driven (height: 100%; width: auto) and right-aligned so the
        <img> box matches the rendered photo — mask coordinates apply to the photograph,
        not the full card width. Card overflow-hidden clips; content stays z-10 above.
      */}
      <div
        className={`ds-welcome-illustration pointer-events-none absolute inset-y-0 right-0 z-[1] hidden h-full transition-opacity duration-300 sm:block ${
          illustrationVisible ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden
      >
        <Image
          src={illustration.src}
          alt=""
          width={illustration.width}
          height={illustration.height}
          className="ds-welcome-illustration-photo"
          sizes="(min-width: 640px) 45vw, 0px"
          priority={false}
        />
      </div>

      {/* Screen-reader description for the current illustration */}
      <span className="sr-only">{illustration.alt}</span>

      <div className="relative z-10 flex h-full min-h-[inherit] items-center px-5 py-5 sm:w-[56%] sm:px-6 sm:py-6 md:w-[54%] lg:w-[52%]">
        <div className="min-w-0">
          <p className="ds-caption flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[var(--ds-color-primary)]" aria-hidden />
            {formatTodayDate()}
          </p>
          <h1 className="ds-h1 mt-2 text-2xl sm:text-3xl">
            {greeting}, {firstName}{" "}
            <m.span
              className="inline-block origin-[70%_70%]"
              variants={greetingWave}
              initial={reduced ? false : "initial"}
              animate={reduced ? undefined : "animate"}
              aria-hidden
            >
              👋
            </m.span>
          </h1>
          <p className="ds-body-sm mt-2 max-w-xl" style={{ color: "var(--ds-color-text-secondary)" }}>
            {translate("dashboard.greetingOverview")}
          </p>
          {user?.companyName ? (
            <div className="mt-3 flex items-center gap-2">
              <CompanyLogoMark
                name={user.companyName}
                logoUrl={user.companyLogoUrl}
                size="sm"
              />
              <span className="text-sm font-medium" style={{ color: "var(--ds-color-text-primary)" }}>
                {user.companyName}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
