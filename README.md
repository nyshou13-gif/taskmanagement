# TaskBoard

Trello風のシンプルなタスク管理アプリ。「未着手」「作業中」「完了」の3カラムにタスクカードを並べ、ドラッグ&ドロップで進捗を管理する。
各タスクにはタイトル・説明・優先度・期限を設定でき、カラム単位で優先度順・期限順に並べ替えられる。

まずは最小機能（MVP）を作り、後から機能を拡張していく方針。1ユーザー・1ボード・ローカル環境での利用を前提とする。

## 機能

要件定義上のMVP機能（詳細は [機能一覧](docs/features.md)）と、現在の実装状況。

| ID | 機能 | 実装状況 |
|----|------|----------|
| F1 | タスク作成 | 未実装 |
| F2 | タスク編集 | 未実装 |
| F3 | タスク削除 | 未実装 |
| F4 | タスク移動・並び替え（DnD） | 未実装 |
| F5 | 優先度順・期限順ソート | 未実装 |
| F6 | データ永続化（PostgreSQL） | DB・マイグレーション・参照系APIまで実装済み |
| - | タスク検索（キーワード・優先度・期限） | 実装済み（API・検索UI。ボード上に結果を表示） |

## 技術スタック

| 領域 | 技術 |
|------|------|
| フロントエンド | React 19 / TypeScript 7 / Vite 8 / Tailwind CSS 4 / dnd-kit |
| バックエンド | Java 25 / Spring Boot 4.0 / Spring Data JPA / Flyway / Gradle 9.8 |
| データベース | PostgreSQL 16（Docker Compose で起動） |
| テスト | JUnit 6 / Spring Boot Test / Testcontainers |

バージョンと選定理由は [技術スタック](docs/tech-stack.md) を参照。

## ディレクトリ構成

```
.
├── backend/          Spring Boot アプリ（controller / entity / repository、Flyway マイグレーション）
├── frontend/         React SPA（Vite）
├── docs/             要件定義・設計ドキュメント
├── mockup/           画面モック（mockup/index.html をブラウザで開いて確認）
├── scripts/          開発サーバーの起動・停止スクリプト
├── docker-compose.yml  PostgreSQL
└── CLAUDE.md         開発運用ルール
```

## 必要な環境

- JDK 25
- Node.js 24 / npm 11
- Docker（PostgreSQL と、バックエンドのテスト（Testcontainers）に使用）
- Gradle のインストールは不要（同梱の Gradle Wrapper を使用）

## 起動方法

ポートは固定: **backend = 8080 / frontend = 5173 / DB = 5432**。Vite のプロキシがこの値を前提にしているため、変更しない。

### 1. データベース

```
docker compose up -d      # PostgreSQL 16 を起動（healthy になるまで待つ）
```

### 2. バックエンド

```
cd backend
./gradlew bootRun         # Windows は gradlew.bat。起動時に Flyway がテーブル作成・初期データ投入
```

```
curl http://localhost:8080/api/health   # {"status":"ok"}
curl http://localhost:8080/api/board    # 3カラム（未着手/作業中/完了）とタスク
```

DB接続先は環境変数 `DB_URL` / `DB_USER` / `DB_PASSWORD` で上書きできる（既定は docker-compose の値）。

### 3. フロントエンド

バックエンドを起動した状態で実行する（`/api` は Vite のプロキシ経由で `localhost:8080` に転送される）。

```
cd frontend
npm install
npm run dev
```

http://localhost:5173 を開く。

### 一括起動（Windows / PowerShell）

```
scripts/start-servers.ps1     # backend と frontend を既定ポートで起動（占有プロセスがあれば停止してから起動）
scripts/stop-servers.ps1      # 停止（8080 と 5173 のみ対象）
```

## テスト・ビルド

```
cd backend && ./gradlew test      # Docker が必要（Testcontainers で実PostgreSQLに接続）
cd frontend && npm run build      # 型チェック + 本番ビルド
```

フロントエンドのテスト（Vitest）は [#9](https://github.com/nyshou13-gif/taskmanagement/issues/9) で導入予定。

## API

| メソッド | パス | 内容 | 状況 |
|----------|------|------|------|
| GET | /api/health | ヘルスチェック | 実装済み |
| GET | /api/board | 全カラムとタスクを取得 | 実装済み |
| GET | /api/tasks | タスク検索（キーワード・優先度・期限） | 実装済み |
| GET | /api/tasks/:id | タスク1件取得 | 実装済み |
| POST | /api/tasks | タスク作成 | 未実装 |
| PATCH | /api/tasks/:id | タスク更新（内容・所属カラム・表示順） | 未実装 |
| DELETE | /api/tasks/:id | タスク削除 | 未実装 |
| POST | /api/columns/:id/sort | カラム内の並び替え | 未実装 |

テーブル定義・API仕様の詳細は [データベース設計](docs/database.md) を参照。

## ドキュメント

| ドキュメント | 内容 |
|--------------|------|
| [要件定義書](docs/requirements.md) | 概要・スコープ・非機能要件・ユースケース・拡張候補 |
| [機能一覧](docs/features.md) | F1〜F6、タスクの項目、並び替えの方針 |
| [画面設計](docs/screens.md) | ボード画面・モーダル・バリデーション/エラー表示 |
| [データベース設計](docs/database.md) | ER図・テーブル定義・API仕様 |
| [技術スタック](docs/tech-stack.md) | 使用技術・バージョン・選定理由 |
| [画面モック](mockup/index.html) | ブラウザで開いて操作イメージを確認できる |

## 注意事項

- 認証機能はなく、APIは誰でもアクセスできる。外部公開はしない（公開する場合は認証の追加が必須）。
- パスワードやクレジットカード番号などの機密情報は、タスクに入力・保存しないこと。

## 開発フロー

Issue作成 → `<type>/<issue番号>-<説明>` ブランチ → PR → squash merge。master への直接 push は禁止。
コミットメッセージ・ポート運用などのルールは [CLAUDE.md](CLAUDE.md) を参照。
