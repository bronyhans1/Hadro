"use client";

import { RouteGuard } from "@/components/layout/RouteGuard";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { SidebarCollapseProvider } from "@/components/layout/SidebarCollapseContext";
import { NavGroupsExpandedProvider } from "@/components/layout/NavGroupsExpandedContext";
import { SupportLauncher } from "@/components/support/SupportLauncher";
import { MotionPage } from "@/components/ui/Motion";
import { useAuth } from "@/lib/auth/AuthContext";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) return;
    if (isPlatformAdmin(user.roles)) {
      router.replace("/platform/dashboard");
    }
  }, [isLoading, router, user]);

  return (
    <RouteGuard>
      <SidebarCollapseProvider>
        <NavGroupsExpandedProvider>
          <Sidebar />
          <Header />
          <MotionPage key={pathname}>{children}</MotionPage>
          <SupportLauncher />
        </NavGroupsExpandedProvider>
      </SidebarCollapseProvider>
    </RouteGuard>
  );
}
