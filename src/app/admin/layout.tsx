import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { getCurrentUser } from "@/server/actions/auth-helpers";

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  if (!user.isSuperadmin) {
    redirect("/dashboard");
  }

  const userInfo = {
    name: user.name || user.email.split("@")[0],
    email: user.email,
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar userInfo={userInfo} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center border-b border-slate-200 bg-white px-8 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-lg font-semibold text-red-600">슈퍼관리자 패널</h2>
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50 p-8 dark:bg-slate-900">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
