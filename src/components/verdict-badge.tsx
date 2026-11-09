import { ArrowDownRightIcon, ArrowUpRightIcon, BanIcon, PauseIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { VERDICT_LABELS, VERDICT_STYLES, type VerdictValue } from "@/lib/verdict";

const ICONS = {
  ENTER_LONG: ArrowUpRightIcon,
  ENTER_SHORT: ArrowDownRightIcon,
  WAIT: PauseIcon,
  AVOID: BanIcon,
} as const;

export function VerdictBadge({
  verdict,
  className,
}: {
  verdict: VerdictValue;
  className?: string;
}) {
  const Icon = ICONS[verdict];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        VERDICT_STYLES[verdict],
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {VERDICT_LABELS[verdict]}
    </span>
  );
}
