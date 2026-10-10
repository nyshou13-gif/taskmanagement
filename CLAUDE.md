# Claude Code 運用ルール（厳守）

このリポジトリでは以下を例外なく守ること。違反しそうな場合は作業を止めてユーザーに確認する。

## 1. Issue 必須
- コード・ドキュメントを変更する前に、必ず `gh issue create` でIssueを作成する（既存Issueがあればそれを使う）。
- Issueなしで着手しない。ブランチ・コミット・PRはすべていずれかのIssueに紐づける。
- Issueには「目的」「作業内容」「完了条件」を書く（`.github/ISSUE_TEMPLATE/task.md` に従う）。

## 2. ブランチ命名規則
- 形式: `<type>/<issue番号>-<kebab-case英語の短い説明>`
- type: `feature`（機能追加）/ `fix`（不具合修正）/ `docs`（文書）/ `chore`（設定・雑務）/ `refactor` / `test`
- 例: `feature/12-task-crud`、`fix/15-board-null`、`docs/3-branch-rules`
- 必ず最新の master から切る。1ブランチ＝1Issue。

## 3. master への直接 push 禁止
- master 上でコミットしない。`git push origin master`、force push（`-f` / `--force`）、`--no-verify` は禁止。
- 他人のブランチやリモートブランチの削除、`git reset --hard` 等の破壊的操作はユーザーの明示的な指示なしに行わない。

## 4. Pull Request 必須
- すべての変更は 作業ブランチ → Pull Request → squash merge で master に取り込む。PRを経由しないマージ・反映は禁止。
- PR本文に `Closes #<issue番号>` を含める（`.github/pull_request_template.md` に従う）。
- PRタイトルは変更内容が分かる1行にする。
- マージは squash merge のみ。マージ前にユーザーの確認を得る。マージ後のブランチは自動削除される。

## 5. コミットメッセージ規則
- 1行目: `<type>: <変更内容の要約>`（type はブランチと同じ分類。72文字以内、現在形・命令形、末尾にピリオドを付けない）
  - 例: `feat: add GET /api/tasks search endpoint`
  - type 対応: feature→`feat` / fix→`fix` / docs→`docs` / chore→`chore` / refactor→`refactor` / test→`test`
- 空行を挟んで本文（任意）: 何を・なぜ変えたかを書く。
- 末尾に `Refs #<issue番号>` を必ず入れる。
- 1コミット＝1つの論理的な変更。無関係な変更を混ぜない。
- Claude が作成したコミットには、システム指定の Co-Authored-By 行を末尾に付ける。

## 6. 作業の流れ
Issue作成 → ブランチ作成 → 実装・コミット → push → PR作成 → ユーザー確認後に squash merge
