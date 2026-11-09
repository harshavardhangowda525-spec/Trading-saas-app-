import { ArrowRightIcon, ImageUpIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function greeting(date: Date): string {
  const hourIst = (date.getUTCHours() + 5 + (date.getUTCMinutes() + 30 >= 60 ? 1 : 0)) % 24;
  if (hourIst < 12) return "Good morning";
  if (hourIst < 17) return "Good afternoon";
  return "Good evening";
}

export function HeroCard({ firstName, isNew }: { firstName: string | null; isNew: boolean }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-6 sm:p-8">
      <ChartBackdrop />
      <div className="relative flex flex-col gap-4">
        <p className="text-sm font-medium text-primary">
          {greeting(new Date())}
          {firstName ? `, ${firstName}` : ""}
        </p>
        <h1 className="max-w-md text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {isNew ? "Let's read your first chart together." : "What are you looking at today?"}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground sm:text-base">
          Upload a screenshot from TradingView or your broker app. You&apos;ll get the structure,
          key levels, and an honest verdict — including when to wait.
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button asChild size="lg" className="h-12 px-6 text-base">
            <Link href="/app/new">
              <ImageUpIcon aria-hidden />
              Analyze a chart
              <ArrowRightIcon aria-hidden />
            </Link>
          </Button>
          <span className="text-xs text-muted-foreground">Results in about 20 seconds</span>
        </div>
      </div>
    </section>
  );
}

/** Decorative price line. Purely visual, hidden from assistive tech. */
function ChartBackdrop() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 160"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 w-full text-primary opacity-30"
    >
      <defs>
        <linearGradient id="hero-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.35" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0 130 L30 118 L55 124 L85 98 L110 104 L140 80 L165 88 L190 70 L215 76 L240 52 L265 60 L290 44 L315 56 L340 34 L370 40 L400 22 L400 160 L0 160 Z"
        fill="url(#hero-fill)"
      />
      <path
        d="M0 130 L30 118 L55 124 L85 98 L110 104 L140 80 L165 88 L190 70 L215 76 L240 52 L265 60 L290 44 L315 56 L340 34 L370 40 L400 22"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
