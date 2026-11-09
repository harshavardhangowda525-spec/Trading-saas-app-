import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";
import { DISCLAIMER_TEXT, TERMS_VERSION } from "@/lib/legal";

export const metadata: Metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated={TERMS_VERSION}>
      <h2>1. What ChartSense is</h2>
      <p>
        ChartSense is an educational software tool that uses artificial intelligence to describe
        what is visible in a chart image you upload. Outputs are AI-generated predictions and may be
        wrong.
      </p>
      <h2>2. Not investment advice</h2>
      <p>{DISCLAIMER_TEXT}</p>
      <p>
        ChartSense is not registered as an investment adviser or research analyst. Nothing on the
        service is a recommendation to buy, sell or hold any security or derivative.
      </p>
      <h2>3. Your responsibilities</h2>
      <ul>
        <li>You make your own trading decisions and bear all resulting gains and losses.</li>
        <li>You must be at least 18 years old.</li>
        <li>Do not upload images containing other people&apos;s personal or account data.</li>
      </ul>
      <h2>4. Credits</h2>
      <p>
        Analyses consume credits. Credits do not expire. Refunds are governed by the Refund Policy.
      </p>
      <h2>5. Changes</h2>
      <p>
        We may update these terms. When we do, you will be asked to accept the new version before
        continuing to use the service.
      </p>
    </LegalPage>
  );
}
