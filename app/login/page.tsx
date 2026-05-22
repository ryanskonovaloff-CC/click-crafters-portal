import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { AccentText } from "@/components/ui";

export default function LoginPage() {
  return (
    <main className="relative z-10 grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-border bg-black/40 p-6 shadow-glow backdrop-blur">
        <img src="/assets/primary-logo.svg" alt="Click Crafters" className="h-10 w-auto max-w-[240px]" />
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">Client <AccentText>Portal</AccentText></h1>
        <p className="mt-3 text-sm leading-6 text-white/60">Sign in to view performance dashboards, monthly reports, paid media metrics, and SEO activity.</p>
        <div className="mt-6">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
