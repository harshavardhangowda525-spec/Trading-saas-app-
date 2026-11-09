const MESSAGES: Record<string, string> = {
  InvalidEmail: "Please enter a valid email address.",
  EmailRequired: "We need an email address to create your account.",
  DisposableEmail: "Temporary email addresses aren't supported. Please use your regular email.",
  AccountDeleted: "This account was deleted. Contact support if you think this is a mistake.",
  Verification: "That sign-in link has expired or was already used. Request a new one below.",
  OAuthAccountNotLinked: "This email is already linked to a different sign-in method.",
  AccessDenied: "Sign-in was not allowed for this account.",
};

export function loginErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  return MESSAGES[code] ?? "Something went wrong while signing in. Please try again.";
}
