/** Optional inputs for a new analysis (Section 3.2). Shared by client and server. */
export const TIMEFRAMES = ["1m", "5m", "15m", "1H", "4H", "1D", "1W", "Other"] as const;
export type Timeframe = (typeof TIMEFRAMES)[number];

export const TRADING_STYLES = [
  { value: "SCALP", label: "Scalp", hint: "Seconds to minutes" },
  { value: "INTRADAY", label: "Intraday", hint: "Same day" },
  { value: "SWING", label: "Swing", hint: "Days to weeks" },
  { value: "POSITIONAL", label: "Positional", hint: "Weeks to months" },
] as const;
export type TradingStyleValue = (typeof TRADING_STYLES)[number]["value"];

export const INPUT_LIMITS = { instrument: 64, question: 200 } as const;
