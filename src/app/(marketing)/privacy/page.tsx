import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";
import { TERMS_VERSION } from "@/lib/legal";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated={TERMS_VERSION}>
      <h2>What we collect</h2>
      <ul>
        <li>Account data: email address, name and profile picture (if you sign in with Google).</li>
        <li>Chart images you upload and the analyses generated from them.</li>
        <li>Records of your terms acceptance, including a one-way hash of your IP address.</li>
        <li>Payment records (handled by Razorpay; we never see your card or UPI credentials).</li>
      </ul>
      <h2>How we use it</h2>
      <p>
        To provide the service, prevent abuse, and improve analysis quality. Chart images are sent
        to our AI provider for processing.
      </p>
      <h2>Deletion</h2>
      <p>
        You can delete your account at any time. Images and personal data are removed within 30
        days. Payment and invoice records are retained in anonymised form as required by Indian tax
        law.
      </p>
      <h2>Contact</h2>
      <p>Questions about your data: contact details will be published before launch.</p>
    </LegalPage>
  );
}
