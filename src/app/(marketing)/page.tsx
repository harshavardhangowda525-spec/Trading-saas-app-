import Link from "next/link";
import { Button } from "@/components/ui/button";

// Placeholder landing page. The full landing page (how it works, sample
// analysis, pricing preview, FAQ) is built in M8.
export default function HomePage() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-start gap-6 px-4 py-16 sm:py-24">
      <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
        AI chart analysis for traders
      </p>
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
        An AI second opinion on your chart.
      </h1>
      <p className="max-w-xl text-lg text-pretty text-muted-foreground">
        Upload a screenshot of any chart. Get a plain-English read of the structure, key levels, and
        — just as important — when it makes sense to wait or stay out.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/app">Analyze a chart</Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Every result is an AI-generated prediction, not a guarantee and not financial advice.
      </p>
    </section>
  );
}
