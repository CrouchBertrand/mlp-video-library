"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, GraduationCap, Home, LogIn, Menu, Search, X } from "lucide-react";

export function PublicMobileNav() {
  const pathname = usePathname();
  const isResourceRoute = pathname.startsWith("/resources/") || pathname.startsWith("/videos/");

  return (
    <details className="group md:hidden">
      <summary className="grid size-11 cursor-pointer list-none place-items-center rounded-lg border border-[#d8dde5] bg-white text-[#243447] [&::-webkit-details-marker]:hidden" aria-label="Open navigation menu">
        <Menu className="size-5 group-open:hidden" />
        <X className="hidden size-5 group-open:block" />
      </summary>
      <div className="fixed inset-0 top-[64px] z-50 hidden bg-[#243447]/35 group-open:block" />
      <nav className="fixed inset-x-3 top-[76px] z-50 hidden rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-[#e5e7eb] group-open:block">
        <div className="mb-3 flex items-center gap-3 border-b border-[#edf0f3] pb-3">
          <span className="grid size-10 place-items-center rounded-lg bg-[#a64026] text-white"><GraduationCap className="size-5" /></span>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wide text-[#6b7c8f]">MLP Video Library</div>
            <div className="font-extrabold text-[#243447]">Navigation</div>
          </div>
        </div>
        <div className="grid gap-2">
          {isResourceRoute && (
            <button type="button" onClick={() => window.history.back()} className="mlp-btn-outline min-h-12 justify-start">
              <ArrowLeft className="size-4" /> Back to previous level
            </button>
          )}
          <Link href="/" className="mlp-btn-outline min-h-12 justify-start"><Home className="size-4" /> Home</Link>
          <Link href="/resources" className="mlp-btn-outline min-h-12 justify-start"><GraduationCap className="size-4" /> Browse Resources</Link>
          <Link href="/search" className="mlp-btn-outline min-h-12 justify-start"><Search className="size-4" /> Search</Link>
          <Link href="/admin/login" className="mlp-btn-primary min-h-12 justify-start"><LogIn className="size-4" /> Admin Login</Link>
        </div>
      </nav>
    </details>
  );
}
