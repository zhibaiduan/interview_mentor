import type { ReactNode } from "react";

type MarketingShellProps = {
  children: ReactNode;
};

export function MarketingShell({ children }: MarketingShellProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)]">
      <header className="mx-auto flex h-24 max-w-landing items-center justify-between px-6 sm:px-10">
        <a className="font-display text-xl leading-none" href="/">
          OfferUp
        </a>
        <nav className="flex items-center gap-6 text-sm text-[var(--text-secondary)]">
          <a href="/home">Home</a>
          <a href="/setup">Setup</a>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
