"use client";

import { Loader2Icon } from "lucide-react";
import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyCodeAction, type VerifyCodeState } from "../actions";

const initial: VerifyCodeState = { error: null, next: null };

export function CodeForm() {
  const [state, formAction, pending] = useActionState(verifyCodeAction, initial);

  // Full-page navigation so the browser itself receives the session cookie.
  useEffect(() => {
    if (state.next) window.location.assign(state.next);
  }, [state.next]);

  const busy = pending || Boolean(state.next);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm"
        >
          {state.error}
        </p>
      )}
      <Label htmlFor="code">Sign-in code</Label>
      <Input
        id="code"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9 ]*"
        maxLength={7}
        placeholder="123456"
        required
        autoFocus
        className="h-14 text-center font-mono text-2xl tracking-[0.4em]"
      />
      <Button type="submit" className="h-11 w-full" disabled={busy}>
        {busy && <Loader2Icon className="animate-spin" aria-hidden />}
        {state.next ? "Signing you in…" : pending ? "Checking…" : "Sign in with code"}
      </Button>
    </form>
  );
}
