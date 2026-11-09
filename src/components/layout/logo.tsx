import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-semibold tracking-tight">
      <span
        aria-hidden
        className="grid size-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
      >
        CS
      </span>
      <span>ChartSense</span>
    </Link>
  );
}
