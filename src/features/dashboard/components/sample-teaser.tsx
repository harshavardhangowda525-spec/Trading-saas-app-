import { ShieldCheckIcon } from "lucide-react";
import { VerdictBadge } from "@/components/verdict-badge";

/** Static example so new users see the output before spending a credit. */
export function SampleTeaser() {
  return (
    <section
      aria-labelledby="sample-heading"
      className="flex flex-col gap-4 rounded-2xl border bg-card p-5"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id="sample-heading" className="text-lg font-semibold">
          What you&apos;ll get
        </h2>
        <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
          Example
        </span>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-wait/30 bg-wait/5 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <VerdictBadge verdict="WAIT" />
          <span className="text-xs text-muted-foreground">Confidence: Medium</span>
          <span className="text-xs text-muted-foreground">· NIFTY 50 · 15m</span>
        </div>
        <p className="text-sm font-medium">
          Price is pressing into resistance after a strong run — wait for a clean close above or a
          pullback.
        </p>
      </div>

      <dl className="grid gap-3 text-sm">
        <div>
          <dt className="font-medium">Why this verdict</dt>
          <dd className="mt-0.5 text-muted-foreground">
            Buying right under a level that rejected price twice gives a poor risk:reward. A close
            above it, or a dip back to support, would offer a clearer setup.
          </dd>
        </div>
        <div>
          <dt className="font-medium">What would prove this wrong</dt>
          <dd className="mt-0.5 text-muted-foreground">
            A strong candle closing above resistance with follow-through would make waiting the
            wrong call.
          </dd>
        </div>
      </dl>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldCheckIcon className="size-4 shrink-0" aria-hidden />
        Every analysis includes what to watch next and a risk reminder.
      </p>
    </section>
  );
}
