"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { RouteGuard } from "@/components/layout/RouteGuard";
import { Header } from "@/components/layout/Header";
import { SidebarCollapseProvider } from "@/components/layout/SidebarCollapseContext";
import { NavGroupsExpandedProvider } from "@/components/layout/NavGroupsExpandedContext";
import { PlatformSidebar } from "@/components/platform/PlatformSidebar";
import { SupportLauncher } from "@/components/support/SupportLauncher";
import { MotionPage } from "@/components/ui/Motion";
import { useAuth } from "@/lib/auth/AuthContext";
import { isPlatformAdmin } from "@/lib/auth/roles";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) return; // RouteGuard handles /login redirect
    if (!isPlatformAdmin(user.roles)) {
      router.replace("/dashboard");
      return;
    }
    // Normalize platform home.
    if (pathname === "/platform") {
      router.replace("/platform/dashboard");
    }
  }, [isLoading, pathname, router, user]);

  return (
    <RouteGuard>
      <SidebarCollapseProvider>
        <NavGroupsExpandedProvider>
          <PlatformSidebar />
          <Header />
          <MotionPage key={pathname}>{children}</MotionPage>
          <SupportLauncher />
        </NavGroupsExpandedProvider>
      </SidebarCollapseProvider>
    </RouteGuard>
  );
}

