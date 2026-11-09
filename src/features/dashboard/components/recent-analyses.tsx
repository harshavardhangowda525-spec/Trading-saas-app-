import { ChevronRightIcon, LineChartIcon } from "lucide-react";
import { VerdictBadge } from "@/components/verdict-badge";
import type { VerdictValue } from "@/lib/verdict";

export type RecentAnalysis = {
  id: string;
  createdAt: Date;
  instrument: string | null;
  timeframe: string | null;
  verdict: VerdictValue | null;
};

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
});

export function RecentAnalyses({ items }: { items: RecentAnalysis[] }) {
  return (
    <section aria-labelledby="recent-heading" className="flex flex-col gap-3">
      <h2 id="recent-heading" className="text-lg font-semibold">
        Recent analyses
      </h2>
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-10 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
            <LineChartIcon className="size-6" aria-hidden />
          </span>
          <p className="font-medium">Your trading journal starts here</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Every chart you analyse is saved here, so you can look back and mark how it played out.
          </p>
        </div>
      ) : (
        <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
          {items.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {a.instrument ?? "Untitled chart"}
                  {a.timeframe && (
                    <span className="font-normal text-muted-foreground"> · {a.timeframe}</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">{dateFmt.format(a.createdAt)}</p>
              </div>
              {a.verdict && <VerdictBadge verdict={a.verdict} />}
              <ChevronRightIcon className="size-4 text-muted-foreground" aria-hidden />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
