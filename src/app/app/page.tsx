import type { Metadata } from "next";
import { LineChartIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireOnboardedUser } from "@/features/auth/server/current-user";
import { db } from "@/server/db";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireOnboardedUser();
  const recent = await db.analysis.findMany({
    where: { userId: user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, createdAt: true, inputInstrument: true, status: true },
  });

  const firstName = user.name?.split(" ")[0];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {firstName ? `Welcome, ${firstName}` : "Welcome"}
        </h1>
        <p className="text-sm text-muted-foreground">Upload a chart to get an AI second opinion.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardDescription>Credits left</CardDescription>
            <CardTitle className="text-4xl tabular-nums">{user.creditBalance}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            1 analysis uses 1 credit. Unreadable images are never charged.
          </CardContent>
        </Card>
        <Card className="justify-between">
          <CardHeader>
            <CardTitle>New analysis</CardTitle>
            <CardDescription>
              Screenshot from TradingView, your broker app, anywhere.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="h-11 w-full sm:w-auto">
              <Link href="/app/new">Analyze a chart</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="recent-heading" className="flex flex-col gap-3">
        <h2 id="recent-heading" className="text-lg font-semibold">
          Recent analyses
        </h2>
        {recent.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <LineChartIcon className="size-8 text-muted-foreground" aria-hidden />
              <p className="font-medium">No analyses yet</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Your analyses will show up here. Start with any chart screenshot.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="divide-y rounded-lg border">
            {recent.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span>{a.inputInstrument ?? "Untitled chart"}</span>
                <span className="text-muted-foreground">
                  {a.createdAt.toLocaleDateString("en-IN")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
