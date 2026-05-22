import { cookies } from "next/headers";
import { UpdatePasswordForm } from "@/components/update-password-form";
import { AccentText } from "@/components/ui";

export default async function UpdatePasswordPage() {
  const cookieStore = await cookies();
  const recoveryAllowed = cookieStore.get("cc_password_recovery")?.value === "1";

  return (
    <main className="relative z-10 grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-border bg-black/40 p-6 shadow-glow backdrop-blur">
        <img src="/assets/primary-logo.svg" alt="Click Crafters" className="h-10 w-auto max-w-[240px]" />
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">Set a new <AccentText>password</AccentText></h1>
        <p className="mt-3 text-sm leading-6 text-white/60">Enter a new password for your portal account.</p>
        <div className="mt-6">
          <UpdatePasswordForm recoveryAllowed={recoveryAllowed} />
        </div>
      </section>
    </main>
  );
}
