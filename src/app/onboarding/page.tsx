import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { OnboardingFlow } from "@/features/onboarding/components/onboarding-flow";
import { hasAcceptedCurrentTerms, requireUser } from "@/features/auth/server/current-user";
import { TERMS_VERSION } from "@/lib/legal";

export const metadata: Metadata = { title: "Welcome" };

export default async function OnboardingPage() {
  const user = await requireUser();
  if (hasAcceptedCurrentTerms(user)) redirect("/app");

  // A user who accepted an older version sees a shorter "terms updated" flow.
  const isReacceptance = user.termsVersion !== null;

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10">
      <div className="mb-8">
        <Logo href="/onboarding" />
      </div>
      <OnboardingFlow termsVersion={TERMS_VERSION} isReacceptance={isReacceptance} />
    </main>
  );
}
