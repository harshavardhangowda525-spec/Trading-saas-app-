import { CoinsIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CreditsCard({ balance }: { balance: number }) {
  const low = balance <= 1;
  return (
    <section className="flex flex-col justify-between gap-4 rounded-2xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Credits left</p>
          <p className="mt-1 text-4xl font-semibold tabular-nums">{balance}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <CoinsIcon className="size-5" aria-hidden />
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        1 credit = 1 full analysis. Unreadable images are never charged.
      </p>
      <Button
        asChild
        variant={low ? "default" : "outline"}
        className={cn("h-10", !low && "bg-transparent")}
      >
        <Link href="/pricing">{balance === 0 ? "Get credits" : "Get more credits"}</Link>
      </Button>
    </section>
  );
}
