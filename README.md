# 賢哥總資產戰情室

比照 [羅傑全資產戰情室](https://jimmydog0423-ux.github.io/roger9527/) 製作的投資組合追蹤儀表板，持倉資料來自 `investment_pnl_report.md`。

## 投資組合

| 代號 | 名稱 | 股數 | 買進均價 | 總投入成本 |
|------|------|------|----------|------------|
| 00981A | 主動統一台股增長 | 59,000 | 26.08 | 1,538,720 |
| 00687B | 國泰20年美債 | 50,000 | 31.81 | 1,590,500 |
| 00795B | 中信美國公債20年 | 50,013 | 30.83 | 1,541,901 |
| 00937B | 群益ESG投等債20+ | 66,000 | 15.79 | 1,042,140 |

**總投入成本：5,713,889 元**

## 線上預覽

https://moriarty0916.github.io/JH_Portfolio/

## API Worker

中離統計與行情資料使用本專案自带的 Cloudflare Worker，部署方式見 [`worker/README.md`](worker/README.md)。

## 本地預覽

```bash
python3 -m http.server 8765
```

開啟 http://localhost:8765

## 部署

可推送至 GitHub Pages 或其他靜態網站託管服務。
