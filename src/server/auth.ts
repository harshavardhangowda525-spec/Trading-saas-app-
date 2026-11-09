import "server-only";
import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { isAdminEmail, isDisposableEmail, normalizeEmail } from "@/features/auth/email-rules";
import { loginRequestContext } from "@/features/auth/server/login-context";
import { createLoginCode, deriveLoginCodeKeys } from "@/features/auth/server/login-code.service";
import { appConfig } from "./config";
import { db } from "./db";
import { sendMagicLinkEmail } from "./email";
import { env } from "./env";

const providers: Provider[] = [
  Resend({
    // apiKey is unused: sendVerificationRequest below handles delivery (and the dev console transport).
    apiKey: env.RESEND_API_KEY ?? "unused-in-console-mode",
    from: env.EMAIL_FROM,
    maxAge: 24 * 60 * 60,
    normalizeIdentifier: normalizeEmail,
    async sendVerificationRequest({ identifier, url }) {
      // When the request came from our sign-in form, also issue a 6-digit code
      // bound to that browser (see features/auth/server/login-code.service.ts).
      const ctx = loginRequestContext.getStore();
      const code = ctx
        ? await createLoginCode(db, deriveLoginCodeKeys(env.AUTH_SECRET), {
            email: identifier,
            nonce: ctx.nonce,
            magicLink: url,
          })
        : null;
      await sendMagicLinkEmail({ to: identifier, url, code });
    },
  }),
];

if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
  providers.unshift(
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
      // Google verifies email ownership, so linking to an existing magic-link
      // account with the same email is safe (approved in M1 plan, Q5).
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // The adapter's types target @prisma/client; our client is generated to a custom
  // path (Prisma 7) but is structurally identical at runtime.
  adapter: PrismaAdapter(db as unknown as Parameters<typeof PrismaAdapter>[0]),
  secret: env.AUTH_SECRET,
  session: { strategy: "database", maxAge: 30 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
  trustHost: true,
  providers,
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
    error: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email ? normalizeEmail(user.email) : null;
      if (!email) return "/login?error=EmailRequired";
      if (isDisposableEmail(email)) return "/login?error=DisposableEmail";

      const existing = await db.user.findUnique({
        where: { email },
        select: { deletedAt: true },
      });
      if (existing?.deletedAt) return "/login?error=AccountDeleted";
      return true;
    },
    session({ session, user }) {
      session.user.id = user.id;
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      if (user.id && user.email && isAdminEmail(user.email, appConfig.adminEmails)) {
        await db.user.updateMany({
          where: { id: user.id, role: "USER" },
          data: { role: "ADMIN" },
        });
      }
    },
  },
});
