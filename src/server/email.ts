import "server-only";
import { env } from "./env";

type MagicLinkEmail = { to: string; url: string };

/** Sends the sign-in link. In dev (EMAIL_TRANSPORT=console) it is logged instead. */
export async function sendMagicLinkEmail({ to, url }: MagicLinkEmail): Promise<void> {
  if (env.EMAIL_TRANSPORT === "console") {
    console.info(`\n[email:console] Magic link for ${to}\n${url}\n`);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY ?? ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to,
      subject: "Your ChartSense sign-in link",
      html: magicLinkHtml(url),
      text: `Sign in to ChartSense:\n${url}\n\nThis link expires in 24 hours. If you didn't request it, ignore this email.`,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend error ${res.status}: ${await res.text()}`);
  }
}

function magicLinkHtml(url: string): string {
  const safeUrl = url.replace(/"/g, "&quot;");
  return `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;padding:32px;">
<tr><td style="font-size:20px;font-weight:bold;color:#18181b;">ChartSense</td></tr>
<tr><td style="padding:16px 0;font-size:15px;color:#3f3f46;">Tap the button below to sign in. This link expires in 24 hours and can be used once.</td></tr>
<tr><td><a href="${safeUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:15px;">Sign in</a></td></tr>
<tr><td style="padding-top:24px;font-size:12px;color:#71717a;">If you didn't request this, you can safely ignore this email.</td></tr>
</table></td></tr></table></body></html>`;
}
