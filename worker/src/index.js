const YAHOO_USER_AGENT =
  "Mozilla/5.0 (compatible; JHPortfolioWorker/1.0)";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400"
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders()
    }
  });
}

function isValidNumber(value) {
  if (value === null || value === undefined || value === "") {
    return false;
  }

  const number = Number(value);
  return Number.isFinite(number);
}

function normalizeHistory(timestamps, quote) {
  const history = [];

  if (!Array.isArray(timestamps) || !quote) {
    return history;
  }

  for (let index = 0; index < timestamps.length; index++) {
    const time = Number(timestamps[index]);
    const price = Number(quote.close?.[index]);

    if (!Number.isFinite(time) || !isValidNumber(price)) {
      continue;
    }

    history.push({
      time,
      price,
      open: isValidNumber(quote.open?.[index])
        ? Number(quote.open[index])
        : price,
      high: isValidNumber(quote.high?.[index])
        ? Number(quote.high[index])
        : price,
      low: isValidNumber(quote.low?.[index])
        ? Number(quote.low[index])
        : price,
      volume: isValidNumber(quote.volume?.[index])
        ? Number(quote.volume[index])
        : 0
    });
  }

  return history;
}

async function fetchYahooQuote(symbol) {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/` +
    `${encodeURIComponent(symbol)}?interval=1d&range=6mo`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": YAHOO_USER_AGENT,
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`Yahoo 回傳 HTTP ${response.status}`);
  }

  const payload = await response.json();
  const result = payload?.chart?.result?.[0];

  if (!result?.meta) {
    throw new Error("Yahoo 未回傳有效資料");
  }

  const meta = result.meta;
  const price =
    meta.regularMarketPrice ??
    meta.previousClose ??
    result.indicators?.quote?.[0]?.close?.slice(-1)[0];

  if (!isValidNumber(price)) {
    throw new Error("Yahoo 未回傳有效價格");
  }

  const history = normalizeHistory(
    result.timestamp,
    result.indicators?.quote?.[0]
  );

  return {
    success: true,
    symbol,
    name: meta.longName || meta.shortName || symbol,
    price: Number(price),
    previousClose: isValidNumber(meta.previousClose)
      ? Number(meta.previousClose)
      : null,
    change: isValidNumber(meta.regularMarketChange)
      ? Number(meta.regularMarketChange)
      : null,
    changePercent: isValidNumber(meta.regularMarketChangePercent)
      ? Number(meta.regularMarketChangePercent)
      : null,
    open: isValidNumber(meta.regularMarketOpen)
      ? Number(meta.regularMarketOpen)
      : null,
    dayHigh: isValidNumber(meta.regularMarketDayHigh)
      ? Number(meta.regularMarketDayHigh)
      : null,
    dayLow: isValidNumber(meta.regularMarketDayLow)
      ? Number(meta.regularMarketDayLow)
      : null,
    volume: isValidNumber(meta.regularMarketVolume)
      ? Number(meta.regularMarketVolume)
      : 0,
    currency: meta.currency || null,
    exchange: meta.exchangeName || null,
    instrumentType: meta.instrumentType || null,
    marketState: meta.marketState || null,
    marketTime: meta.regularMarketTime || null,
    timezone: meta.timezone || null,
    interval: meta.dataGranularity || "1d",
    historyCount: history.length,
    history
  };
}

async function fetchQuotes(symbols) {
  const uniqueSymbols = [...new Set(symbols)];
  const entries = await Promise.all(
    uniqueSymbols.map(async symbol => {
      try {
        return [symbol, await fetchYahooQuote(symbol)];
      } catch (error) {
        return [
          symbol,
          {
            success: false,
            symbol,
            message: error.message
          }
        ];
      }
    })
  );

  const data = Object.fromEntries(entries);
  const successCount = entries.filter(([, quote]) => quote.success).length;

  return {
    success: successCount > 0,
    updatedAt: new Date().toISOString(),
    requestedCount: uniqueSymbols.length,
    successCount,
    failedCount: uniqueSymbols.length - successCount,
    data
  };
}

function ensureDb(env) {
  if (!env.DB) {
    throw new Error("找不到 D1 Binding，請確認變數名稱設定為 DB");
  }

  return env.DB;
}

async function getPrayStats(requestUrl, env) {
  const db = ensureDb(env);
  const visitorId = requestUrl.searchParams.get("visitorId")?.trim();

  const totals = await db
    .prepare(
      `
        SELECT
          COUNT(*) AS total_count,
          COUNT(DISTINCT visitor_id) AS total_visitors
        FROM pray_events
      `
    )
    .first();

  let visitorCount = 0;

  if (visitorId) {
    const visitorRow = await db
      .prepare(
        `
          SELECT pray_count
          FROM pray_records
          WHERE visitor_id = ?
        `
      )
      .bind(visitorId)
      .first();

    visitorCount = Number(visitorRow?.pray_count || 0);
  }

  return jsonResponse({
    success: true,
    visitorCount,
    totalCount: Number(totals?.total_count || 0),
    totalVisitors: Number(totals?.total_visitors || 0)
  });
}

async function recordPray(request, env) {
  const db = ensureDb(env);
  const body = await request.json().catch(() => null);
  const visitorId = body?.visitorId?.trim();

  if (!visitorId) {
    return jsonResponse(
      {
        success: false,
        message: "缺少 visitorId"
      },
      400
    );
  }

  const now = new Date().toISOString();

  await db
    .prepare(
      `
        INSERT INTO pray_events (visitor_id, prayed_at)
        VALUES (?, ?)
      `
    )
    .bind(visitorId, now)
    .run();

  const existing = await db
    .prepare(
      `
        SELECT pray_count
        FROM pray_records
        WHERE visitor_id = ?
      `
    )
    .bind(visitorId)
    .first();

  if (existing) {
    await db
      .prepare(
        `
          UPDATE pray_records
          SET
            pray_count = pray_count + 1,
            last_pray_at = ?
          WHERE visitor_id = ?
        `
      )
      .bind(now, visitorId)
      .run();
  } else {
    await db
      .prepare(
        `
          INSERT INTO pray_records (
            visitor_id,
            pray_count,
            first_pray_at,
            last_pray_at
          )
          VALUES (?, 1, ?, ?)
        `
      )
      .bind(visitorId, now, now)
      .run();
  }

  const totals = await db
    .prepare(
      `
        SELECT
          COUNT(*) AS total_count,
          COUNT(DISTINCT visitor_id) AS total_visitors
        FROM pray_events
      `
    )
    .first();

  const visitorRow = await db
    .prepare(
      `
        SELECT pray_count
        FROM pray_records
        WHERE visitor_id = ?
      `
    )
    .bind(visitorId)
    .first();

  return jsonResponse({
    success: true,
    visitorCount: Number(visitorRow?.pray_count || 0),
    totalCount: Number(totals?.total_count || 0),
    totalVisitors: Number(totals?.total_visitors || 0)
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }

    const requestUrl = new URL(request.url);
    const pathname = requestUrl.pathname.replace(/\/+$/, "") || "/";

    try {
      if (pathname === "/pray" && request.method === "POST") {
        return await recordPray(request, env);
      }

      if (pathname === "/pray/stats" && request.method === "GET") {
        return await getPrayStats(requestUrl, env);
      }

      const symbolsParam = requestUrl.searchParams.get("symbols");

      if (!symbolsParam) {
        return jsonResponse(
          {
            success: false,
            message: "缺少 symbols 參數"
          },
          400
        );
      }

      const symbols = symbolsParam
        .split(",")
        .map(symbol => symbol.trim())
        .filter(Boolean);

      if (!symbols.length) {
        return jsonResponse(
          {
            success: false,
            message: "缺少 symbols 參數"
          },
          400
        );
      }

      const result = await fetchQuotes(symbols);
      return jsonResponse(result, result.success ? 200 : 502);
    } catch (error) {
      return jsonResponse(
        {
          success: false,
          message: error.message || "Worker 發生未知錯誤"
        },
        500
      );
    }
  }
};
