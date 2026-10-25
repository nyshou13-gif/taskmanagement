---
name: start-servers
description: backend(8080)とfrontend(5173)を既定ポートで起動する。サーバー起動・動作確認・画面確認を求められたときに使う。ポート競合時は占有プロセスを停止して必ず既定ポートで起動する。
---

# サーバー起動（ポート固定）

ポートは固定: **backend 8080 / frontend 5173**。proxy とフロントがこの値を前提にしており、別ポートでは動かない。

## 手順
1. DB が必要なら `docker compose up -d`（PostgreSQL 5432。停止対象ではない）
2. `powershell -File scripts/start-servers.ps1` を実行する（`-Only backend` / `-Only frontend` も可）
   - 8080 / 5173 が占有されていれば、占有プロセスを自動で停止してから起動する
   - 起動後、ポートが Listen していることと `/api/health` が 200 であることを確認する
3. 結果として `http://localhost:8080` と `http://localhost:5173` を報告する
4. 停止する場合は `powershell -File scripts/stop-servers.ps1`

## 禁止事項
- `--port` / `-p` / `server.port` / `SERVER_PORT` / `PORT=` などで別ポートを指定して起動しない（hook でブロックされる）
- 競合したからといって別ポートで一時起動しない。必ず占有プロセスを停止して既定ポートを使う
- 停止してよいのは 8080 と 5173 の占有プロセスのみ
