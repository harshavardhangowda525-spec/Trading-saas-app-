import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Check your email" };

export default function VerifyRequestPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Check your email</CardTitle>
        <CardDescription>
          We sent you a sign-in link. Open it on this device to continue. The link expires in 24
          hours.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Didn&apos;t get it? Check spam, or{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          try again
        </Link>
        .
      </CardContent>
    </Card>
  );
}
