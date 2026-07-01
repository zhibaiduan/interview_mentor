"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { BookOpenText, LayoutDashboard, PanelLeftClose, PanelLeftOpen, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: ReactNode;
};

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/home", icon: LayoutDashboard },
  { label: "Answer Bank", href: "/bank", icon: BookOpenText },
  { label: "Profile", href: "/profile", icon: UserRound }
];

export function AppShell({ children }: AppShellProps) {
  return <CollapsibleShell>{children}</CollapsibleShell>;
}

function CollapsibleShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[var(--bg-page)] p-2 text-[var(--text-primary)] md:p-3">
      <div
        className={cn(
          "grid h-full gap-2 transition-[grid-template-columns] duration-300 ease-standard md:gap-3",
          collapsed
            ? "grid-cols-[44px_minmax(0,1fr)]"
            : "grid-cols-[44px_minmax(0,1fr)] md:grid-cols-[208px_minmax(0,1fr)]"
        )}
      >
        <aside
          className={cn(
            "flex min-h-0 flex-col overflow-hidden transition-all duration-300 ease-standard",
            collapsed ? "px-1 py-2" : "px-1 py-2 md:px-2 md:py-3"
          )}
        >
          <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-center md:justify-between md:gap-3")}>
            <a
              href="/home"
              className={cn(
                "min-w-0 font-display text-lg leading-none transition-opacity duration-200",
                collapsed ? "sr-only" : "hidden md:block"
              )}
            >
              OfferUp
            </a>
            <button
              type="button"
              className="inline-flex size-8 items-center justify-center rounded-md text-[var(--text-secondary)] transition-colors duration-base ease-standard hover:bg-[var(--state-hover-bg)] hover:text-[var(--text-primary)]"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? "Open sidebar" : "Close sidebar"}
              title={collapsed ? "Open sidebar" : "Close sidebar"}
            >
              {collapsed ? <PanelLeftOpen aria-hidden="true" size={18} /> : <PanelLeftClose aria-hidden="true" size={18} />}
            </button>
          </div>

          <nav className={cn("flex-1 space-y-1", collapsed ? "mt-7" : "mt-8")}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                pathname === item.href ||
                (item.href !== "/home" && pathname?.startsWith(`${item.href}/`));

              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex h-10 items-center rounded-md text-sm font-medium transition-colors duration-base ease-standard",
                    collapsed ? "justify-center px-0" : "gap-2.5 px-2",
                    active
                      ? "bg-[rgba(255,252,246,0.58)] text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--state-hover-bg)] hover:text-[var(--text-primary)]"
                  )}
                  aria-current={active ? "page" : undefined}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
                  <span className={cn("min-w-0 truncate", collapsed ? "sr-only" : "hidden md:inline")}>{item.label}</span>
                </a>
              );
            })}
          </nav>

          <div className="border-t border-[var(--border-subtle)] pt-3">
            <a
              href="/setup"
              className={cn(
                "flex h-10 items-center rounded-md text-sm font-medium text-[var(--text-secondary)] transition-colors duration-base ease-standard hover:bg-[var(--state-hover-bg)] hover:text-[var(--text-primary)]",
                collapsed ? "justify-center px-0" : "gap-2.5 px-2"
              )}
              title={collapsed ? "New interview" : undefined}
            >
              <span className="inline-flex size-[18px] items-center justify-center text-lg leading-none">+</span>
              <span className={cn("truncate", collapsed ? "sr-only" : "hidden md:inline")}>New interview</span>
            </a>
          </div>
        </aside>

        <main className="min-h-0 min-w-0 overflow-y-auto rounded-[var(--layout-shell-radius)] border border-[var(--border-subtle)] bg-[var(--bg-shell-surface)]">
          <div className="mx-auto w-full max-w-content px-5 py-8 sm:px-8 md:px-10 md:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
