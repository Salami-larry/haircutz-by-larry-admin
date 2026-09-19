"use client";

import { BrandMark } from "@/components/brand-mark";
import { brand } from "@/lib/brand";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-hbl-bg text-hbl-ink">
      <header
        data-admin-header
        className="border-b border-white/10"
        style={
          {
            ["--admin-header-fg" as string]: "#ffffff",
            ["--admin-header-hover-bg" as string]: "rgba(255, 255, 255, 0.1)",
            backgroundColor: brand.primary,
            color: "#ffffff",
          } as React.CSSProperties
        }
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:h-16 sm:px-6">
          <BrandMark size="sm" suffix="Admin" />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <div className="rounded-lg bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.08)] sm:p-12">
          <h1 className="font-display text-2xl font-semibold tracking-wide sm:text-3xl">
            Admin shell
          </h1>
          <p className="mt-3 max-w-md text-hbl-muted">
            Phase 0 scaffold. Login, styles, and appointments arrive in later
            phases.
          </p>
        </div>
      </main>
    </div>
  );
}
