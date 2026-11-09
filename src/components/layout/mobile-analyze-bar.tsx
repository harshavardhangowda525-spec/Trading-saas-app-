"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

/** Sticky mobile CTA (Section 5.2). Hidden on the upload page, which has its own primary action. */
export function MobileAnalyzeBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/app/new")) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur sm:hidden">
      <Button asChild size="lg" className="h-12 w-full">
        <Link href="/app/new">Analyze a chart</Link>
      </Button>
    </div>
  );
}
