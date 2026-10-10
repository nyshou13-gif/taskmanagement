# Claude Code 運用ルール（厳守）

このリポジトリでは以下を例外なく守ること。違反しそうな場合は作業を止めてユーザーに確認する。

## 1. 作業前にIssueを作成する
- コード・ドキュメントを変更する前に、必ず `gh issue create` でIssueを作成する（既存Issueがあればそれを使う）。
- Issueなしで着手しない。

## 2. ブランチ命名規則
- 形式: `<type>/<issue番号>-<kebab-case短い説明>`
- type: `feature`（機能）/ `fix`（修正）/ `docs`（文書）/ `chore`（雑務）/ `refactor` / `test`
- 例: `feature/12-task-crud`、`fix/15-board-null`
- 必ず最新の master から切る。

## 3. master への直接変更の禁止
- master 上でコミットしない。`git push origin master`、force push、`--no-verify` は禁止。
- 変更は必ず作業ブランチ → Pull Request → squash merge で取り込む。

## 4. コミット・PR
- コミットメッセージ末尾に `Refs #<issue番号>` を含める。
- PR本文に `Closes #<issue番号>` を含める（テンプレートに従う）。
- マージはsquash mergeのみ。マージ後ブランチは自動削除される。
- PRのマージはユーザーの確認を得てから行う。

## 5. 流れ
Issue作成 → ブランチ作成 → 実装・コミット → push → PR作成 → ユーザー確認後にsquash merge
