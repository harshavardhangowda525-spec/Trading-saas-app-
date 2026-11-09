import "server-only";
import { env } from "./env";

type MagicLinkEmail = { to: string; url: string; code: string | null };

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Sends the sign-in link (and code). In dev (EMAIL_TRANSPORT=console) it is logged instead. */
export async function sendMagicLinkEmail({ to, url, code }: MagicLinkEmail): Promise<void> {
  if (env.EMAIL_TRANSPORT === "console") {
    console.info(
      `\n[email:console] Magic link for ${to}\n${url}\n${code ? `[email:console] Code for ${to}: ${code}\n` : ""}`,
    );
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
      subject: code ? `${code} is your ChartSense sign-in code` : "Your ChartSense sign-in link",
      html: magicLinkHtml(url, code),
      text: [
        code
          ? `Your sign-in code: ${code}\n(Enter it in the browser where you requested it. Expires in 10 minutes.)\n`
          : "",
        `Or sign in with this link:\n${url}`,
        "\nIf you didn't request this, ignore this email.",
      ].join("\n"),
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend error ${res.status}: ${await res.text()}`);
  }
}

function magicLinkHtml(url: string, code: string | null): string {
  const safeUrl = escapeHtml(url);
  const codeBlock = code
    ? `<tr><td style="padding:8px 0 4px;font-size:14px;color:#3f3f46;">Your sign-in code</td></tr>
<tr><td style="padding:4px 0 8px;"><span style="display:inline-block;font-family:'Courier New',monospace;font-size:32px;font-weight:bold;letter-spacing:8px;color:#18181b;background:#f4f4f5;border-radius:8px;padding:12px 16px;">${escapeHtml(code)}</span></td></tr>
<tr><td style="padding-bottom:20px;font-size:13px;color:#71717a;">Type it in the browser where you asked to sign in. It expires in 10 minutes.</td></tr>
<tr><td style="padding-bottom:12px;font-size:14px;color:#3f3f46;">Or sign in on this device:</td></tr>`
    : `<tr><td style="padding:16px 0;font-size:15px;color:#3f3f46;">Tap the button below to sign in.</td></tr>`;
  return `<!doctype html><html><body style="margin:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;padding:32px;">
<tr><td style="font-size:20px;font-weight:bold;color:#4f46e5;padding-bottom:12px;">ChartSense</td></tr>
${codeBlock}
<tr><td><a href="${safeUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:15px;">Sign in</a></td></tr>
<tr><td style="padding-top:24px;font-size:12px;color:#71717a;">The link works once and expires in 24 hours. If you didn't request this, you can safely ignore this email.</td></tr>
</table></td></tr></table></body></html>`;
}
