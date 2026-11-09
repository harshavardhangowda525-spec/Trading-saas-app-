import { GraduationCapIcon, LightbulbIcon } from "lucide-react";
import type { Concept } from "@/features/learn/concepts";

export function ConceptCard({ concept }: { concept: Concept }) {
  return (
    <section
      aria-labelledby="concept-heading"
      className="flex flex-col gap-3 rounded-2xl border bg-card p-5"
    >
      <p className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        <GraduationCapIcon className="size-4 text-primary" aria-hidden />
        Concept of the day
      </p>
      <h2 id="concept-heading" className="text-lg font-semibold">
        {concept.term}
      </h2>
      <p className="text-sm leading-relaxed text-muted-foreground">{concept.explanation}</p>
      <p className="flex gap-2 rounded-lg bg-muted/60 p-3 text-sm leading-relaxed">
        <LightbulbIcon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <span>{concept.tip}</span>
      </p>
    </section>
  );
}
