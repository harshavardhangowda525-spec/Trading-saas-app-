"use client";

import { SparklesIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChartUploader } from "@/features/uploads/components/chart-uploader";
import type { ChartImageView } from "@/features/uploads/server/upload.service";
import { cn } from "@/lib/utils";
import { INPUT_LIMITS, TIMEFRAMES, TRADING_STYLES, type TradingStyleValue } from "../options";

export function NewAnalysisForm() {
  const [image, setImage] = useState<ChartImageView | null>(null);
  const [instrument, setInstrument] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [style, setStyle] = useState<TradingStyleValue | null>(null);
  const [question, setQuestion] = useState("");

  return (
    <div className="flex flex-col gap-6">
      <Section step={1} title="Your chart">
        <ChartUploader onUploaded={setImage} />
      </Section>

      <Section
        step={2}
        title="Details"
        subtitle="All optional — the AI reads what it can from the chart."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="instrument">Instrument</Label>
            <Input
              id="instrument"
              placeholder="e.g. NIFTY 50, RELIANCE, BTCUSDT"
              maxLength={INPUT_LIMITS.instrument}
              value={instrument}
              onChange={(e) => setInstrument(e.target.value)}
              className="h-11"
              autoComplete="off"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="timeframe">Timeframe</Label>
            <select
              id="timeframe"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <option value="">Not sure / detect from chart</option>
              {TIMEFRAMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Trading style</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TRADING_STYLES.map((s) => {
              const active = style === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStyle(active ? null : s.value)}
                  className={cn(
                    "flex min-h-14 flex-col items-start rounded-lg border px-3 py-2 text-left transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    active ? "border-primary bg-primary/10" : "hover:bg-accent",
                  )}
                >
                  <span className="text-sm font-medium">{s.label}</span>
                  <span className="text-xs text-muted-foreground">{s.hint}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <Label htmlFor="question">Your question</Label>
          <Textarea
            id="question"
            placeholder="e.g. Is this a good breakout to buy?"
            maxLength={INPUT_LIMITS.question}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
          />
          <p className="self-end text-xs text-muted-foreground tabular-nums">
            {question.length}/{INPUT_LIMITS.question}
          </p>
        </div>
      </Section>

      <div className="flex flex-col gap-2">
        <Button size="lg" className="h-12 text-base" disabled>
          <SparklesIcon aria-hidden />
          Analyze chart · 1 credit
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          {image
            ? "Your chart is uploaded. AI analysis switches on in the next update — no credit has been used."
            : "AI analysis switches on in the next update. Uploading is free and doesn't use a credit."}
        </p>
      </div>
    </div>
  );
}

function Section({
  step,
  title,
  subtitle,
  children,
}: {
  step: number;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-card p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
          {step}
        </span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}
