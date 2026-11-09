"use client";

import { CheckIcon, EyeIcon, ShieldAlertIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DISCLAIMER_TEXT, TERMS_ACCEPTANCE_TEXT } from "@/lib/legal";
import type { ApiErrorBody } from "@/server/errors";

type Slide = { title: string; icon: ReactNode; body: ReactNode };

const SLIDES: Slide[] = [
  {
    title: "What ChartSense does",
    icon: <EyeIcon className="size-5" aria-hidden />,
    body: (
      <ul className="space-y-3">
        <Point ok>Reads a screenshot of any price chart you upload.</Point>
        <Point ok>
          Explains the trend, structure and key support/resistance zones in plain English.
        </Point>
        <Point ok>
          Gives a verdict — including <strong>Wait</strong> or <strong>Avoid</strong> when the chart
          isn&apos;t clear — and explains why.
        </Point>
        <Point ok>Tells you what would prove the analysis wrong.</Point>
      </ul>
    ),
  },
  {
    title: "What it doesn't do",
    icon: <XIcon className="size-5" aria-hidden />,
    body: (
      <ul className="space-y-3">
        <Point>
          It doesn&apos;t see live prices, news, volume or fundamentals — only your image.
        </Point>
        <Point>It doesn&apos;t guarantee anything. We never claim an accuracy percentage.</Point>
        <Point>
          It isn&apos;t a SEBI-registered adviser and doesn&apos;t give investment advice.
        </Point>
        <Point>It doesn&apos;t place trades or connect to your broker.</Point>
      </ul>
    ),
  },
  {
    title: "The risk is yours",
    icon: <ShieldAlertIcon className="size-5" aria-hidden />,
    body: (
      <div className="space-y-3">
        <p>{DISCLAIMER_TEXT}</p>
        <p>
          SEBI&apos;s own studies found that around 9 in 10 individual F&amp;O traders made net
          losses. Always use a stop loss and never risk money you can&apos;t afford to lose.
        </p>
      </div>
    ),
  },
];

function Point({ children, ok = false }: { children: ReactNode; ok?: boolean }) {
  return (
    <li className="flex gap-3">
      {ok ? (
        <CheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-label="Does" />
      ) : (
        <XIcon className="mt-0.5 size-4 shrink-0 text-rose-500" aria-label="Does not" />
      )}
      <span>{children}</span>
    </li>
  );
}

export function OnboardingFlow({
  termsVersion,
  isReacceptance,
}: {
  termsVersion: string;
  isReacceptance: boolean;
}) {
  const router = useRouter();
  // Returning users who only need to re-accept updated terms skip the intro slides.
  const [step, setStep] = useState(isReacceptance ? SLIDES.length : 0);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/account/accept-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: termsVersion, accepted: true }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as ApiErrorBody | null;
        if (body?.error.code === "TERMS_OUTDATED") {
          router.refresh();
          return;
        }
        throw new Error(body?.error.message ?? "Could not save your acceptance.");
      }
      router.replace("/app");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Network error. Please try again.");
      setSubmitting(false);
    }
  }

  const isAcceptStep = step >= SLIDES.length;
  const slide = SLIDES[step];

  return (
    <Card className="w-full max-w-md">
      {!isAcceptStep && slide ? (
        <>
          <CardHeader>
            <p className="text-xs font-medium text-muted-foreground">
              Step {step + 1} of {SLIDES.length + 1}
            </p>
            <CardTitle className="flex items-center gap-2 text-xl">
              {slide.icon}
              {slide.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-relaxed text-muted-foreground">
            {slide.body}
          </CardContent>
          <CardFooter className="flex gap-2">
            {step > 0 && (
              <Button variant="ghost" className="h-11" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button className="h-11 flex-1" onClick={() => setStep(step + 1)}>
              Next
            </Button>
          </CardFooter>
        </>
      ) : (
        <>
          <CardHeader>
            {!isReacceptance && (
              <p className="text-xs font-medium text-muted-foreground">
                Step {SLIDES.length + 1} of {SLIDES.length + 1}
              </p>
            )}
            <CardTitle className="text-xl">
              {isReacceptance ? "Our terms have been updated" : "Before you start"}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 text-sm">
            <p className="leading-relaxed text-muted-foreground">
              Please read the{" "}
              <Link
                href="/terms"
                target="_blank"
                className="text-foreground underline underline-offset-4"
              >
                Terms of Use
              </Link>{" "}
              and{" "}
              <Link
                href="/risk"
                target="_blank"
                className="text-foreground underline underline-offset-4"
              >
                Risk Disclosure
              </Link>
              .
            </p>
            <div className="flex items-start gap-3 rounded-md border bg-muted/50 p-4">
              <Checkbox
                id="accept-terms"
                checked={accepted}
                onCheckedChange={(v) => setAccepted(v === true)}
                className="mt-0.5 size-5"
              />
              <Label htmlFor="accept-terms" className="leading-relaxed font-normal">
                {TERMS_ACCEPTANCE_TEXT}
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            {!isReacceptance && (
              <Button variant="ghost" className="h-11" onClick={() => setStep(SLIDES.length - 1)}>
                Back
              </Button>
            )}
            <Button className="h-11 flex-1" disabled={!accepted || submitting} onClick={submit}>
              {submitting ? "Saving…" : "Accept and continue"}
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );
}
