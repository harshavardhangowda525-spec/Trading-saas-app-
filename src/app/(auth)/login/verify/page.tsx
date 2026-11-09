import type { Metadata } from "next";
import Link from "next/link";
import { MailIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CodeForm } from "@/features/auth/components/code-form";

export const metadata: Metadata = { title: "Check your email" };

export default function VerifyRequestPage() {
  return (
    <Card>
      <CardHeader>
        <span className="mb-2 grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
          <MailIcon className="size-5" aria-hidden />
        </span>
        <CardTitle className="text-xl">Check your email</CardTitle>
        <CardDescription>
          We sent you a 6-digit code and a sign-in link. Enter the code here, or tap the link on the
          device where you read your email.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <CodeForm />
        <p className="text-sm text-muted-foreground">
          The code works only in this browser and expires in 10 minutes. Didn&apos;t get the email?
          Check spam, or{" "}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            request a new one
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}
