window.APP_CONFIG = {
  refreshSeconds: 60,
  // Yahoo 行情代理（部署本專案 worker 後可一併改為同一網址）
  workerUrl: "https://lucky-rice-01c0.jimmydog0423.workers.dev",
  // 中離統計 API（部署 worker/ 後填入，例如 https://jh-portfolio-api.xxxxx.workers.dev）
  prayApiUrl: "",

  socialLinks: [],

  holdings: [
    {
      id: "00981a",
      name: "主動統一台股增長",
      ticker: "00981A",
      apiSymbol: "00981A.TW",
      currency: "TWD",
      cost: 26.08,
      qty: 59000,
      fallbackPrice: 31.32
    },
    {
      id: "00687b",
      name: "國泰20年美債",
      ticker: "00687B",
      apiSymbol: "00687B.TWO",
      currency: "TWD",
      cost: 31.81,
      qty: 50000,
      fallbackPrice: 28.16
    },
    {
      id: "00795b",
      name: "中信美國公債20年",
      ticker: "00795B",
      apiSymbol: "00795B.TWO",
      currency: "TWD",
      cost: 30.83,
      qty: 50013,
      fallbackPrice: 27.35
    },
    {
      id: "00937b",
      name: "群益ESG投等債20+",
      ticker: "00937B",
      apiSymbol: "00937B.TWO",
      currency: "TWD",
      cost: 15.79,
      qty: 66000,
      fallbackPrice: 15.09
    }
  ],

  mp3Files: [
    "assets/sounds/lose-1.mp3",
    "assets/sounds/lose-2.mp3",
    "assets/sounds/win-1.mp3",
    "assets/sounds/alert-1.mp3"
  ],

  reportMeta: {
    recordDate: "2026年7月8日",
    totalCost: 5713889,
    initialValue: 5462218,
    initialPnl: -251671,
    initialReturn: -4.40,
    latestValue: 5619676,
    latestPnl: -94213,
    latestReturn: -1.65,
    valueChange: 157458,
    pnlChange: 157458,
    returnChange: 2.75
  }
};
