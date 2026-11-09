const MESSAGES: Record<string, string> = {
  InvalidEmail: "Please enter a valid email address.",
  EmailRequired: "We need an email address to create your account.",
  DisposableEmail: "Temporary email addresses aren't supported. Please use your regular email.",
  AccountDeleted: "This account was deleted. Contact support if you think this is a mistake.",
  Verification: "That sign-in link has expired or was already used. Request a new one below.",
  OAuthAccountNotLinked: "This email is already linked to a different sign-in method.",
  Configuration:
    "We couldn't send your sign-in email right now. Please try again in a few minutes.",
  TooManyEmails: "Too many sign-in emails requested. Please wait a while and try again.",
  AccessDenied: "Sign-in was not allowed for this account.",
};

export function loginErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return MESSAGES[code] ?? "Something went wrong while signing in. Please try again.";
}

const CODE_MESSAGES: Record<string, string> = {
  InvalidCode: "Enter the 6-digit code from the email.",
  NoCode: "No code was requested in this browser. Request a new sign-in email below.",
  CodeNO_CODE: "No active code for this browser. Request a new sign-in email below.",
  CodeEXPIRED: "That code has expired. Request a new sign-in email below.",
  CodeLOCKED: "Too many wrong attempts. Request a new sign-in email below.",
};

export function codeErrorMessage(
  code: string | undefined,
  left: string | undefined,
): string | null {
  if (!code) return null;
  if (code === "CodeWRONG") {
    const n = Number(left);
    return Number.isFinite(n) && n > 0
      ? `That code isn't right. ${n} ${n === 1 ? "try" : "tries"} left.`
      : "That code isn't right.";
  }
  return CODE_MESSAGES[code] ?? "Something went wrong. Please try again.";
}
