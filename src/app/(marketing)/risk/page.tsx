import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/legal-page";
import { DISCLAIMER_TEXT, TERMS_VERSION } from "@/lib/legal";

export const metadata: Metadata = { title: "Risk Disclosure" };

export default function RiskPage() {
  return (
    <LegalPage title="Risk Disclosure" updated={TERMS_VERSION}>
      <p>{DISCLAIMER_TEXT}</p>
      <h2>Trading is risky</h2>
      <ul>
        <li>
          You can lose some or all of your capital. With leveraged products such as futures and
          options, losses can exceed your initial investment.
        </li>
        <li>
          SEBI&apos;s own studies of the Indian equity derivatives segment found that around 9 in 10
          individual F&amp;O traders made net losses.
        </li>
        <li>Past chart patterns do not guarantee future price movement.</li>
      </ul>
      <h2>Limits of AI analysis</h2>
      <ul>
        <li>The AI only sees the image you upload. It has no live data, news or fundamentals.</li>
        <li>It can misread prices, timeframes, indicators or patterns.</li>
        <li>Confidence labels (low / medium / high) are qualitative, not probabilities.</li>
        <li>We do not claim any accuracy rate.</li>
      </ul>
    </LegalPage>
  );
}
