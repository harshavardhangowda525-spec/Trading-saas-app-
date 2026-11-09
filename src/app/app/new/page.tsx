import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "New analysis" };

// Placeholder so navigation works end to end. Upload UI ships in M2.
export default function NewAnalysisPage() {
  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>Chart upload is coming next</CardTitle>
        <CardDescription>
          Uploading and analysing charts arrives in the next update. Your credits are safe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline">
          <Link href="/app">Back to dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
