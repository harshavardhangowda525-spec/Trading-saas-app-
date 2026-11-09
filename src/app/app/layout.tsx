import { CoinsIcon } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { SiteFooter } from "@/components/layout/site-footer";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { Button } from "@/components/ui/button";
import { requireOnboardedUser } from "@/features/auth/server/current-user";

export default async function AppLayout({ children }: LayoutProps<"/app">) {
  // Gate: signed in AND current terms accepted. Pages below may assume both.
  const user = await requireOnboardedUser();

  return (
    <>
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-2 px-4">
          <Logo href="/app" />
          <div className="flex items-center gap-1">
            <span
              className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm text-muted-foreground"
              aria-label={`${user.creditBalance} credits left`}
            >
              <CoinsIcon className="size-4" aria-hidden />
              <span className="font-medium text-foreground tabular-nums">{user.creditBalance}</span>
              <span className="hidden sm:inline">credits</span>
            </span>
            <Button asChild size="sm" className="ml-1 hidden sm:inline-flex">
              <Link href="/app/new">New analysis</Link>
            </Button>
            <ThemeToggle />
            <UserMenu email={user.email} name={user.name} />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-6 pb-28 sm:pb-10">{children}</main>
      <SiteFooter />

      {/* Sticky mobile CTA (Section 5.2) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 p-3 backdrop-blur sm:hidden">
        <Button asChild size="lg" className="h-12 w-full">
          <Link href="/app/new">Analyze a chart</Link>
        </Button>
      </div>
    </>
  );
}
