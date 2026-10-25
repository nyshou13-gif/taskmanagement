---
name: start-servers
description: backend(8080)とfrontend(5173)の開発サーバーを、必ず既定ポートで起動・再起動・停止する。サーバーを起動して、画面を確認して、動作確認して、localhost:5173 / 8080 を開きたい、ポートが使用中・競合している、EADDRINUSE、Port already in use、5174 など別ポートで立ち上がってしまった、といった場面では、依頼に「スキル」という言葉がなくても必ずこのスキルを使うこと。ポート競合時は別ポートに逃げず、占有プロセスを停止して既定ポートで起動する。
---

# サーバー起動（ポート固定）

このプロジェクトのポートは固定で、**backend = 8080 / frontend = 5173**。
理由: Vite の proxy が `localhost:8080` を、利用者のブラウザ確認が `localhost:5173` を前提にしている。別ポートで立ち上げると API が繋がらず、画面が動かない。そのため「ポートが塞がっていたら避ける」のではなく「塞いでいるものを止めて、既定ポートを取る」という方針にしている。

## 手順

1. DB が動いていなければ `docker compose up -d`（PostgreSQL 5432。これは停止対象ではない）
2. リポジトリルートで実行する:
   ```
   powershell -File scripts/start-servers.ps1
   ```
   片方だけなら `-Only backend` / `-Only frontend`。スクリプトは次を自動で行う。
   - 8080 / 5173 の占有プロセスを（子プロセスごと）停止し、解放を待つ
   - backend を `dev` プロファイルで起動し、`/api/health` が 200 になるまで待つ（初回はビルドで1〜3分かかる）
   - frontend を起動し、5173 で Listen していることを確認する
3. 起動に時間がかかるので、実行はバックグラウンドで行い、完了通知を待つ（待つあいだ sleep で見張らない）
4. 結果を報告する: `http://localhost:8080` / `http://localhost:5173`。ブラウザで開く依頼があれば `Start-Process http://localhost:5173`
5. 停止する場合:
   ```
   powershell -File scripts/stop-servers.ps1
   ```

失敗したときは `scripts/logs/backend.log(.err)` / `frontend.log(.err)` を読んで原因を直し、同じスクリプトで再実行する。

## やってはいけないこと

- `--port` / `-p` / `server.port` / `SERVER_PORT` / `PORT=` などで別ポートを指定して起動しない。`.claude/settings.json` の deny と hook（`scripts/check-port-rule.ps1`）が止めるし、止められなくてもやらない。
- 競合を見つけても別ポートで「一時的に」立ち上げない。動かないことが分かっているため。
- 8080 と 5173 以外のポートのプロセスは止めない（DB の 5432 など）。ポート解放はスクリプト経由で行い、`Stop-Process` を手で打たない。
- Vite の `strictPort: true` を外さない。外すと競合時に黙って 5174 へ退避する。

## 関連

- ルールの原文: `CLAUDE.md` 7章（このスキルと内容を揃えておくこと。変えるときは両方）
- スクリプト: `scripts/start-servers.ps1` / `stop-servers.ps1` / `check-port-rule.ps1`（PowerShell 5.1 で日本語が化けないよう UTF-8 BOM 付きで保存する）
