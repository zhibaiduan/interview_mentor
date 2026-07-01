"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";

type AuthFormProps = {
  mode: "signin" | "signup";
  returnTo: string;
  error?: string;
};

export function AuthForm({ mode, returnTo, error }: AuthFormProps) {
  const [activeMode, setActiveMode] = useState(mode);
  const action = activeMode === "signin" ? "/auth/sign-in" : "/auth/sign-up";

  return (
    <Panel className="w-full max-w-[420px]">
      <div className="mb-8 grid gap-3">
        <Badge variant="neutral">OfferUp</Badge>
        <h1 className="font-display text-[length:var(--text-2xl)] leading-heading">
          {activeMode === "signin" ? "Welcome back" : "Create your workspace"}
        </h1>
        <p className="text-sm leading-body text-[var(--text-secondary)]">
          Sign in to continue your interview practice and saved answers.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-2 rounded-md bg-[var(--bg-page-soft)] p-1">
        <button
          type="button"
          className={`rounded-sm px-3 py-2 text-sm transition-colors ${
            activeMode === "signin"
              ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-panel"
              : "text-[var(--text-secondary)]"
          }`}
          onClick={() => setActiveMode("signin")}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`rounded-sm px-3 py-2 text-sm transition-colors ${
            activeMode === "signup"
              ? "bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-panel"
              : "text-[var(--text-secondary)]"
          }`}
          onClick={() => setActiveMode("signup")}
        >
          Sign up
        </button>
      </div>

      {error ? (
        <p className="mb-4 rounded-md bg-[var(--bg-danger)] px-3 py-2 text-sm text-[var(--text-danger)]">
          {error}
        </p>
      ) : null}

      <form action={action} method="post" className="grid gap-4">
        <input type="hidden" name="returnTo" value={returnTo} />
        <label className="grid gap-2 text-sm font-medium">
          Email
          <Input name="email" type="email" autoComplete="email" required />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Password
          <Input
            name="password"
            type="password"
            autoComplete={activeMode === "signin" ? "current-password" : "new-password"}
            required
          />
        </label>
        <Button type="submit">
          {activeMode === "signin" ? "Continue" : "Create account"}
        </Button>
      </form>

      <form action="/auth/google" method="post" className="mt-4">
        <input type="hidden" name="returnTo" value={returnTo} />
        <Button type="submit" variant="secondary" className="w-full">
          Continue with Google
        </Button>
      </form>
    </Panel>
  );
}
