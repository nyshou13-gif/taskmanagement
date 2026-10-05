# TaskBoard 技術スタック

[要件定義書](requirements.md) に戻る

バックエンドは Java + Spring Boot、フロントエンドは React、データベースは PostgreSQL を使用する。
Next.js は今回の対象外とし、フロントエンドは Vite によるSPAとして構築する。

## 1. バックエンド

| 項目 | 選定技術 | 選定理由 |
|------|----------|----------|
| 言語 | Java 25（LTS） | 指定言語。最新のLTSで長期サポートされ、レコード型など近年の機能も利用できる |
| フレームワーク | Spring Boot 4.x | 指定フレームワーク。REST APIの構築に必要な機能が揃い、設定の自動化により開発が速い |
| Web / REST API | Spring Web（spring-boot-starter-web） | `@RestController` によるREST APIの実装 |
| DBアクセス | Spring Data JPA（Hibernate） | リポジトリのインターフェース定義だけでCRUDが実装でき、Spring Bootとの親和性が高い |
| バリデーション | Spring Validation（Bean Validation） | タイトル100文字以内・優先度の範囲などの入力チェックを、アノテーションで宣言的に実装できる |
| DBマイグレーション | Flyway | テーブル定義と初期データ（3カラム）をSQLファイルでバージョン管理できる |
| ビルドツール | Maven | Spring Boot標準で情報量が多く、設定が分かりやすい |
| テスト | JUnit 5 / Spring Boot Test / Testcontainers | APIの結合テストを、実PostgreSQL（コンテナ）に対して実行できる |

## 2. フロントエンド

| 項目 | 選定技術 | 選定理由 |
|------|----------|----------|
| フレームワーク | React 18 以降 | 指定フレームワーク。コンポーネント単位での開発がしやすく、情報量が豊富 |
| 言語 | TypeScript | APIレスポンスやタスクの型を定義でき、バックエンドとの仕様ずれをコンパイル時に検出できる |
| ビルドツール | Vite | 開発サーバーの起動・ホットリロードが高速で、設定がシンプル。Next.jsを使わないSPA構成に適している |
| ドラッグ&ドロップ | dnd-kit | Reactとの親和性が高く、キーボード操作対応への拡張余地もある |
| API通信 | fetch API ＋ TanStack Query | サーバー状態の取得・更新・再取得を宣言的に扱え、DnD後の楽観的更新も実装しやすい |
| テスト | Vitest / React Testing Library | Viteと統合され設定が少なく、コンポーネント単位のテストが書ける |

## 3. データベース・インフラ

| 項目 | 選定技術 | 選定理由 |
|------|----------|----------|
| データベース | PostgreSQL 16 以降 | 指定DB。外部キー・CHECK制約・トランザクションが堅牢で、将来の複数ユーザー化・複数ボード化にも耐えられる |
| JDBCドライバ | PostgreSQL JDBC Driver | Spring Boot（HikariCP）から接続するための標準ドライバ |
| ローカル実行環境 | Docker Compose | PostgreSQLをコンテナで起動し、各自の環境にDBを直接インストールせず同一構成で開発できる |

## 4. 構成と開発時のポイント

- フロントエンド（Vite開発サーバー: 5173番）からバックエンド（Spring Boot: 8080番）のAPIを呼び出す。開発時はViteのプロキシ設定（`/api` → `localhost:8080`）でCORSを回避する。
- バックエンドは Controller → Service → Repository の3層構成とし、DnDによる表示順（position）の更新はService層でトランザクションを張って行う。
- DBスキーマはFlywayのマイグレーションで管理し、Hibernateによる自動生成（`ddl-auto`）は使用しない（`validate` に設定）。
- SQLインジェクション対策として、JPAのパラメータバインドを使用し、文字列連結によるクエリ組み立ては行わない。
