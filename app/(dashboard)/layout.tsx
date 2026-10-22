"use client";
import { useState, Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50/80 antialiased text-slate-800 print:block print:h-auto print:bg-white">
      <Suspense fallback={<div className="w-72 bg-white border-r border-slate-200 hidden md:block" />}>
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      </Suspense>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto print:overflow-visible scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
}
