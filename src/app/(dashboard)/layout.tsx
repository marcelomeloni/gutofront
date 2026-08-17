"use client";

import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { MobileSidebarProvider } from "@/contexts/MobileSidebarContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileSidebarProvider>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-950 antialiased overflow-hidden w-full transition-colors duration-300">
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </MobileSidebarProvider>
  );
}

