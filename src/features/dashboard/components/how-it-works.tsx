import { BrainCircuitIcon, ImageUpIcon, ScaleIcon } from "lucide-react";

const STEPS = [
  {
    icon: ImageUpIcon,
    title: "Upload a screenshot",
    body: "Any chart — TradingView, Zerodha, Upstox, Binance.",
  },
  {
    icon: BrainCircuitIcon,
    title: "AI reads the chart",
    body: "Trend, structure, key levels and patterns, in plain English.",
  },
  {
    icon: ScaleIcon,
    title: "You decide",
    body: "See the reasoning and what would prove it wrong. Your call, always.",
  },
] as const;

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="flex flex-col gap-3">
      <h2 id="how-heading" className="text-lg font-semibold">
        How it works
      </h2>
      <ol className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex gap-3 rounded-2xl border bg-card p-4 sm:flex-col">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <step.icon className="size-4" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-medium">
                <span className="mr-1 text-muted-foreground tabular-nums">{i + 1}.</span>
                {step.title}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
