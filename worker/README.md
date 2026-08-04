# JH Portfolio API Worker

賢哥總資產戰情室專用 Cloudflare Worker，提供：

- Yahoo Finance 行情代理（`GET /?symbols=...`）
- 中離統計 API（`GET /pray/stats`、`POST /pray`）

## 部署步驟

### 1. 建立 D1 資料庫

```bash
cd worker
npx wrangler login
npx wrangler d1 create jh-portfolio-chungli-db
```

將回傳的 `database_id` 填入 `wrangler.toml` 的 `database_id`。

### 2. 建立資料表

```bash
npx wrangler d1 execute jh-portfolio-chungli-db --remote --file=schema.sql
```

### 3. 部署 Worker

```bash
npx wrangler deploy
```

部署完成後會得到網址，例如：

```text
https://jh-portfolio-api.xxxxx.workers.dev
```

### 4. 更新前端設定

將根目錄 `config.js` 更新為：

```js
workerUrl: "https://jh-portfolio-api.xxxxx.workers.dev",
prayApiUrl: "https://jh-portfolio-api.xxxxx.workers.dev",
```

## API 測試

```bash
# 行情
curl "https://YOUR_WORKER/?symbols=00981A.TW,00687B.TWO"

# 中離統計
curl "https://YOUR_WORKER/pray/stats?visitorId=test_123"

# 記錄中離
curl -X POST "https://YOUR_WORKER/pray" \
  -H "Content-Type: application/json" \
  -d '{"visitorId":"test_123"}'
```

## 重置累積次數

若要將中離次數歸零，在 D1 Console 執行：

```sql
DELETE FROM pray_events;
DELETE FROM pray_records;
```
