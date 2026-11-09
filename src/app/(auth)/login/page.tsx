import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signInWithEmail, signInWithGoogle } from "@/features/auth/actions";
import { SubmitButton } from "@/features/auth/components/submit-button";
import { loginErrorMessage } from "@/features/auth/login-errors";
import { getCurrentUser } from "@/features/auth/server/current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { appConfig } from "@/server/config";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/app");

  const { error } = await searchParams;
  const errorMessage = loginErrorMessage(typeof error === "string" ? error : undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Sign in to ChartSense</CardTitle>
        <CardDescription>New here? Signing in creates your account.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {errorMessage && (
          <p
            role="alert"
            className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm"
          >
            {errorMessage}
          </p>
        )}

        {appConfig.googleAuthEnabled && (
          <>
            <form action={signInWithGoogle}>
              <SubmitButton variant="outline" className="h-11 w-full" pendingLabel="Redirecting…">
                Continue with Google
              </SubmitButton>
            </form>
            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or</span>
              <Separator className="flex-1" />
            </div>
          </>
        )}

        <form action={signInWithEmail} className="flex flex-col gap-3">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            className="h-11"
          />
          <SubmitButton className="h-11 w-full" pendingLabel="Sending link…">
            Email me a sign-in link
          </SubmitButton>
        </form>

        <p className="text-xs leading-relaxed text-muted-foreground">
          By continuing you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-4">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </p>
      </CardContent>
    </Card>
  );
}
