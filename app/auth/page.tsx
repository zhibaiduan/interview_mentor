import { AuthForm } from "./auth-form";

type AuthPageProps = {
  searchParams?: {
    returnTo?: string;
    error?: string;
    mode?: string;
  };
};

export default function AuthPage({ searchParams }: AuthPageProps) {
  const returnTo = searchParams?.returnTo || "/home";
  const mode = searchParams?.mode === "signup" ? "signup" : "signin";

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <AuthForm
        mode={mode}
        returnTo={returnTo}
        error={searchParams?.error}
      />
    </main>
  );
}
