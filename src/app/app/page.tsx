import type { Metadata } from "next";
import { ConceptCard } from "@/features/dashboard/components/concept-card";
import { CreditsCard } from "@/features/dashboard/components/credits-card";
import { HeroCard } from "@/features/dashboard/components/hero-card";
import { HowItWorks } from "@/features/dashboard/components/how-it-works";
import { RecentAnalyses } from "@/features/dashboard/components/recent-analyses";
import { SampleTeaser } from "@/features/dashboard/components/sample-teaser";
import { requireOnboardedUser } from "@/features/auth/server/current-user";
import { conceptForDate } from "@/features/learn/concepts";
import { db } from "@/server/db";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireOnboardedUser();
  const recent = await db.analysis.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      createdAt: true,
      inputInstrument: true,
      detectedInstrument: true,
      inputTimeframe: true,
      detectedTimeframe: true,
      verdict: true,
    },
  });

  const isNew = recent.length === 0;
  const firstName = user.name?.split(" ")[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <HeroCard firstName={firstName} isNew={isNew} />
        </div>
        <CreditsCard balance={user.creditBalance} />
      </div>

      {isNew && <HowItWorks />}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="flex flex-col gap-6 lg:col-span-3">
          <RecentAnalyses
            items={recent.map((a) => ({
              id: a.id,
              createdAt: a.createdAt,
              instrument: a.inputInstrument ?? a.detectedInstrument,
              timeframe: a.inputTimeframe ?? a.detectedTimeframe,
              verdict: a.verdict,
            }))}
          />
          {isNew && <SampleTeaser />}
        </div>
        <div className="lg:col-span-2">
          <ConceptCard concept={conceptForDate(new Date())} />
        </div>
      </div>
    </div>
  );
}
