import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Pricing" };

// Placeholder until payments ship (M5). Prices are not final.
const PACKS = [
  { name: "Starter", credits: 5 },
  { name: "Trader", credits: 25 },
  { name: "Pro", credits: 100 },
] as const;

export default function PricingPage() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-14">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Credit packs</h1>
        <p className="text-muted-foreground">
          Pay only for what you use. 1 credit = 1 full analysis. Credits never expire, and
          unreadable images are never charged.
        </p>
      </div>
      <ul className="grid gap-4 sm:grid-cols-3">
        {PACKS.map((p) => (
          <li key={p.name} className="flex flex-col gap-2 rounded-2xl border bg-card p-5">
            <p className="font-medium">{p.name}</p>
            <p className="text-3xl font-semibold tabular-nums">{p.credits}</p>
            <p className="text-sm text-muted-foreground">analyses</p>
          </li>
        ))}
      </ul>
      <div className="rounded-2xl border bg-muted/50 p-5 text-sm">
        <p className="font-medium">Buying credits opens soon.</p>
        <p className="mt-1 text-muted-foreground">
          Every pack uses the same analysis — bigger packs simply cost less per chart.
        </p>
      </div>
      <Button asChild variant="outline" className="self-start">
        <Link href="/app">Back to dashboard</Link>
      </Button>
    </section>
  );
}
