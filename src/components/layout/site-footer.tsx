import Link from "next/link";
import { DISCLAIMER_TEXT } from "@/lib/legal";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 text-xs text-muted-foreground">
        <p className="max-w-3xl leading-relaxed">
          <strong className="font-medium text-foreground">Disclaimer:</strong> {DISCLAIMER_TEXT}
        </p>
        <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/terms" className="underline-offset-4 hover:text-foreground hover:underline">
            Terms of Use
          </Link>
          <Link href="/risk" className="underline-offset-4 hover:text-foreground hover:underline">
            Risk Disclosure
          </Link>
          <Link
            href="/privacy"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            Privacy Policy
          </Link>
        </nav>
        <p>© {new Date().getFullYear()} ChartSense</p>
      </div>
    </footer>
  );
}
