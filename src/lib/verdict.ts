export type VerdictValue = "ENTER_LONG" | "ENTER_SHORT" | "WAIT" | "AVOID";

/**
 * Display labels. Internal enum stays ENTER_LONG/ENTER_SHORT, but the UI uses
 * education-mode wording ("Bullish setup") until compliance clears advisory
 * wording (approved in M1 plan, pushback #1).
 */
export const VERDICT_LABELS: Record<VerdictValue, string> = {
  ENTER_LONG: "Bullish setup",
  ENTER_SHORT: "Bearish setup",
  WAIT: "Wait",
  AVOID: "Avoid",
};

/** Tailwind classes per verdict. Colour is never the only signal: always render the label too. */
export const VERDICT_STYLES: Record<VerdictValue, string> = {
  ENTER_LONG: "bg-bullish/15 text-bullish border-bullish/30",
  ENTER_SHORT: "bg-bearish/15 text-bearish border-bearish/30",
  WAIT: "bg-wait/15 text-wait border-wait/30",
  AVOID: "bg-avoid/15 text-avoid border-avoid/30",
};
