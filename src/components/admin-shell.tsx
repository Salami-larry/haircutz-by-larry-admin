"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogoutOutlined } from "@ant-design/icons";
import { Button } from "antd";

import { logout } from "@/lib/api";
import { brand } from "@/lib/brand";
import { BrandMark } from "@/components/brand-mark";

const contentMaxWidth = {
  narrow: "max-w-3xl",
  wide: "max-w-6xl",
} as const;

const navLinks = [
  { href: "/styles", label: "Styles" },
  { href: "/styles/new", label: "New style" },
  { href: "/appointments", label: "Appointments" },
] as const;

export function AdminShell({
  title,
  children,
  extra,
  contentWidth = "narrow",
}: {
  title: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
  contentWidth?: "narrow" | "wide";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const maxW = contentMaxWidth[contentWidth];

  function navLinkClass(active: boolean) {
    const base =
      "admin-header-interactive admin-header-link inline-flex items-center rounded-md px-3 py-1.5 no-underline";
    return `${base}${active ? " bg-white/15" : ""}`;
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-hbl-bg">
      <header
        data-admin-header
        className="fixed inset-x-0 top-0 z-50 border-b border-white/10 px-4 py-3 shadow-sm sm:px-6"
        style={
          {
            ["--admin-header-fg" as string]: "#ffffff",
            ["--admin-header-hover-bg" as string]: "rgba(255, 255, 255, 0.1)",
            backgroundColor: brand.primary,
            color: "#ffffff",
          } as React.CSSProperties
        }
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
            <Link href="/styles" className="admin-header-logo shrink-0 no-underline">
              <BrandMark size="sm" />
            </Link>
            <span className="hidden shrink-0 rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium tracking-wide text-white/70 sm:inline">
              Admin
            </span>
            <nav className="flex min-w-0 items-center gap-1 overflow-x-auto text-sm sm:gap-2 sm:text-base">
              {navLinks.map((link) => {
                const active =
                  link.href === "/styles"
                    ? pathname === "/styles" ||
                      (pathname.startsWith("/styles/") && !pathname.startsWith("/styles/new"))
                    : pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link key={link.href} href={link.href} className={navLinkClass(active)}>
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            {extra}
            <Button
              type="text"
              aria-label="Log out"
              icon={<LogoutOutlined style={{ fontSize: 22, color: "#ffffff" }} />}
              onClick={handleLogout}
              className="admin-header-interactive flex! h-10! w-10! min-w-10! items-center justify-center rounded-md! border-0! shadow-none!"
            />
          </div>
        </div>
      </header>
      <main className={`mx-auto w-full px-4 pb-6 pt-4 sm:px-6 ${maxW}`}>
        <h1 className="mb-6 pt-14 font-display text-2xl tracking-wide text-hbl-ink sm:pt-16">
          {title}
        </h1>
        {children}
      </main>
    </div>
  );
}
