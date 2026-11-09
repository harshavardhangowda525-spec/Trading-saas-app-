export type Concept = { term: string; explanation: string; tip: string };

/** Short, beginner-friendly explanations. One is shown per day on the dashboard. */
export const CONCEPTS: readonly Concept[] = [
  {
    term: "Support",
    explanation:
      "A price area where buyers have stepped in before, stopping the price from falling further.",
    tip: "Support is a zone, not an exact number. Expect price to wobble around it.",
  },
  {
    term: "Resistance",
    explanation:
      "A price area where sellers have taken control before, stopping the price from rising further.",
    tip: "The more times a level is tested, the more traders are watching it — and the more likely it eventually breaks.",
  },
  {
    term: "Breakout",
    explanation:
      "When price moves decisively through a support or resistance level it was stuck under or above.",
    tip: "Many breakouts fail. Waiting for a candle to close beyond the level filters out some false moves.",
  },
  {
    term: "Invalidation",
    explanation:
      "The price or event that proves your trade idea wrong. If it happens, the reason for the trade is gone.",
    tip: "Decide your invalidation before you enter, not after the trade goes against you.",
  },
  {
    term: "Stop loss",
    explanation:
      "An order that exits your trade automatically at a set price to cap how much you can lose.",
    tip: "Place it where your idea is invalidated, not at a random round number.",
  },
  {
    term: "Risk:reward (R:R)",
    explanation:
      "How much you could gain compared with how much you risk. 1:2 means risking ₹1 to potentially make ₹2.",
    tip: "A good R:R doesn't help if the setup itself is poor. It's one input, not the whole decision.",
  },
  {
    term: "Uptrend",
    explanation:
      "A series of higher highs and higher lows — each rally goes further and each dip stops higher.",
    tip: "An uptrend is in doubt once price makes a lower low.",
  },
  {
    term: "Downtrend",
    explanation: "A series of lower highs and lower lows — rallies fail sooner and dips go deeper.",
    tip: "Buying in a downtrend because something 'looks cheap' is one of the most common beginner mistakes.",
  },
  {
    term: "Range (sideways market)",
    explanation: "Price bouncing between a ceiling and a floor without a clear trend.",
    tip: "The middle of a range is usually the worst place to enter. Edges offer clearer risk.",
  },
  {
    term: "Swing high / swing low",
    explanation:
      "A visible peak (swing high) or trough (swing low) on the chart where price turned around.",
    tip: "Swing points are where most traders draw their key levels.",
  },
  {
    term: "Market structure",
    explanation:
      "The overall pattern of highs and lows that tells you whether buyers or sellers are in control.",
    tip: "Read structure on a higher timeframe first, then zoom in.",
  },
  {
    term: "Timeframe",
    explanation: "How much time each candle represents — 5 minutes, 1 hour, 1 day and so on.",
    tip: "A pattern on a 5-minute chart matters far less to a swing trader than one on the daily chart.",
  },
  {
    term: "Candlestick",
    explanation:
      "A bar showing a period's open, high, low and close. The body is open-to-close; the wicks show extremes.",
    tip: "Long wicks show rejection — price went there but couldn't stay.",
  },
  {
    term: "Moving average",
    explanation: "A line showing the average price over the last N candles, smoothing out noise.",
    tip: "Moving averages lag. They confirm trends; they don't predict them.",
  },
  {
    term: "RSI",
    explanation: "Relative Strength Index: a 0–100 gauge of how strong recent moves have been.",
    tip: "'Overbought' doesn't mean 'about to fall'. Strong trends can stay overbought for a long time.",
  },
  {
    term: "Volume",
    explanation:
      "How many shares or contracts traded in a period. It shows how much participation is behind a move.",
    tip: "A breakout on low volume is more suspect than one on rising volume.",
  },
  {
    term: "False breakout (fakeout)",
    explanation: "Price pokes through a level, pulls in traders, then quickly reverses back.",
    tip: "This is why WAIT is often the right call right at a key level.",
  },
  {
    term: "Pullback",
    explanation: "A temporary move against the main trend before it continues.",
    tip: "Entering on a pullback often gives a tighter stop than chasing a move that already ran.",
  },
  {
    term: "Position sizing",
    explanation:
      "Deciding how much to trade so a loss at your stop costs only a small, fixed share of your capital.",
    tip: "Many traders risk no more than 1–2% of their capital on a single trade.",
  },
  {
    term: "Confluence",
    explanation: "When several independent reasons point to the same level or direction.",
    tip: "More confluence means a clearer setup, but the outcome is still uncertain.",
  },
  {
    term: "FOMO",
    explanation: "Fear of missing out: entering late because a move is already happening.",
    tip: "If you missed the entry, the trade is gone. There will be another chart tomorrow.",
  },
];

/** Same concept for everyone on a given IST calendar day. */
export function conceptForDate(date: Date): Concept {
  const istDay = Math.floor((date.getTime() + 5.5 * 60 * 60 * 1000) / 86_400_000);
  return CONCEPTS[istDay % CONCEPTS.length] as Concept;
}
