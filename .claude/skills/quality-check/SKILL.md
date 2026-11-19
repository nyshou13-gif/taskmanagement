---
name: quality-check
description: TaskBoard の実装品質をレビューし、lint・静的チェックを実行して、設計書との乖離を洗い出す。「品質チェック」「レビューして」「lintを通して」「設計書と合っているか確認」「標準から外れていないか見て」と言われたとき、または機能追加・修正の PR を出す前に使うこと。依頼に「スキル」という言葉がなくても使う。
---

# 品質チェック

実装を **設計書** と **業界標準（Spring Boot / React）** に照らして点検し、自動チェックを通す。
方針: **設計書が正**。差分は原則として実装側を直す（ドキュメントを直すのは、設計書に無い実装済み機能を追記する場合など、設計と矛盾しないときだけ）。

作業を始める前に CLAUDE.md の運用ルールに従う（Issue 作成 → ブランチ → PR）。

## 手順

1. **自動チェックを実行する**（すべて通ること）
   ```
   cd frontend && npm run lint && npm run build
   cd backend && ./gradlew check        # javac -Xlint:all -Werror + Checkstyle + テスト（Docker 必須）
   ```
   - フロントの lint は Oxlint（`frontend/.oxlintrc.json`）。typescript-eslint は TypeScript 7 に未対応のため使わない。
   - バックエンドの Checkstyle 設定は `backend/config/checkstyle/checkstyle.xml`。警告 0 が条件（`maxWarnings = 0`）。
   - ルールを緩めて通すのは禁止。指摘は直す。やむを得ず無効化する場合は理由をPRに書く。
2. **設計書との突き合わせ**（下のチェックリスト「設計書との整合」）
3. **標準からの逸脱レビュー**（下のチェックリスト「バックエンド」「フロントエンド」）
4. 指摘を「直した／直さない（理由）」で一覧にして PR 本文に書く。未実装・見送りは隠さず明記する。

## 設計書との整合（docs/ と照合）

| 見る場所 | 確認すること |
|----------|--------------|
| docs/database.md（テーブル・API） | API のメソッド・パス・パラメータが一致するか（PUT/PATCH の取り違えなど）。ステータスコード、優先度の値（1:低 / 2:中 / 3:高）の向きがフロント・バックで一致するか |
| docs/features.md | F1〜F7 がすべて実装されているか。並び替えは「1回限り・安定ソート・position に保存」か |
| docs/screens.md | 画面要素（ボタンの位置・文言）、モーダルの項目、削除確認ダイアログ、Esc・外側クリック、バリデーション文言、エラーバナー文言が一字一句一致するか |
| docs/tech-stack.md | Controller → Service → Repository の3層か。トランザクションは Service か。`ddl-auto: validate` か。文字列連結のクエリが無いか |
| docs/requirements.md | 非機能（キーボード操作、入力値のバリデーションをバックエンドでも行う）を満たすか |

差分を見つけたら、設計書が正なので実装を直す。設計書に無い実装済み機能は設計書へ追記する。

## バックエンド（Spring Boot）チェックリスト

- Controller は薄く、業務ロジックと `@Transactional` は Service に置く（Repository を Controller から直接呼ばない）
- 複数行にまたがる更新（position の振り直し等）は1つのトランザクションにする。参照専用は `readOnly = true`
- リクエスト/レスポンスは DTO（record）で受け渡し、Entity を直接返さない。Controller 内に DTO を定義しない（`dto` パッケージへ）
- 入力検証は Bean Validation（`@Valid` + 制約アノテーション）。PATCH は「省略＝変更なし」と「null＝クリア」を区別する
- 例外は業務例外 + `@RestControllerAdvice` で ProblemDetail（RFC 9457）に変換。Controller/Service で `ResponseStatusException` を乱用しない
- Entity: JPA 必須の引数なしコンストラクタは `protected`、setter を乱立しない、`updated_at` のような監査項目が実際に更新されるか
- N+1 や全件取得が無いか。JPQL はパラメータバインド（文字列連結禁止）
- 設定: `open-in-view: false`、`ddl-auto: validate`、接続情報は環境変数で上書き可能
- 例外クラスには `serialVersionUID`（`-Xlint` が検出する）
- テストは実 PostgreSQL（Testcontainers）で API を叩く。正常系に加え、検証エラー(400)・未存在(404)・境界値を入れる

## フロントエンド（React）チェックリスト

- Hooks のルール（条件分岐内で呼ばない）、`useEffect` の依存配列を正しく書く（lint が検出）
- `useEffect` 内で同期的に `setState` しない。派生できる値は state にせず render 中に計算する（`useMemo` の濫用も避ける）
- `useEffect` の非同期処理は `AbortController` で後始末する（競合・アンマウント後の更新防止）
- state は必要最小限。props を state にコピーするなら理由を書く
- リスト描画は安定した `key`（index ではなく id）
- `any` と非 null アサーション（`!`）を使わない。API の型は `types.ts` に集約
- fetch は `api.ts` に集約し、エラーは型付き（`ApiError`）で扱う。画面側で個別に `fetch` を書かない
- アクセシビリティ（jsx-a11y）: クリックできる要素は `button`/`role="button"` + `tabIndex` + キーボード操作、モーダルは `role="dialog"` と `aria-modal`、フォーム項目は `label` と関連付ける、`autoFocus` 属性は使わず ref/`data-autofocus` で制御
- 優先度など「値と表示ラベル」は定数に1か所で定義（`PRIORITIES`）。マジックナンバーを散らさない
- モーダル・ダイアログは共通コンポーネント（`Modal`）を使う

## 既知の見送り事項（再レビュー時に確認）

- フロントエンドのテスト（Vitest）は Issue #9 で対応予定
- DnD のキーボード操作は拡張候補（要件定義書 9章）
- TanStack Query は未導入（技術スタックに「未導入」と明記）
- Entity が `@ManyToOne` ではなく `columnId` を直接持つ（MVP の単純化として許容）

## 報告のしかた

ユーザーには「自動チェックの結果」「設計書との差分と対応」「標準からの逸脱と対応」「未対応事項」の4点を短くまとめる。
