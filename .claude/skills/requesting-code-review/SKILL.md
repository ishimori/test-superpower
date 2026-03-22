---
name: requesting-code-review
description: タスク完了時、主要な機能の実装後、またはマージ前に作業が要件を満たしているか確認するために使用する
---

# コードレビューのリクエスト

superpowers:code-reviewerサブエージェントをディスパッチして、問題が連鎖する前にキャッチします。レビュアーは評価のために正確に作成されたコンテキストを受け取ります — セッションの履歴は渡しません。これにより、レビュアーが思考プロセスではなく作業成果物に集中し、自分自身のコンテキストも継続作業のために保たれます。

**基本原則:** 早めにレビュー、頻繁にレビュー。

## レビューをリクエストするタイミング

**必須:**
- subagent-driven-developmentの各タスク後
- 主要な機能の完了後
- mainへのマージ前

**任意だが価値がある:**
- 行き詰まったとき（新鮮な視点）
- リファクタリング前（ベースラインチェック）
- 複雑なバグの修正後

## リクエスト方法

**1. git SHAを取得する:**
```bash
BASE_SHA=$(git rev-parse HEAD~1)  # またはorigin/main
HEAD_SHA=$(git rev-parse HEAD)
```

**2. code-reviewerサブエージェントをディスパッチする:**

`code-reviewer.md`のテンプレートを使って、superpowers:code-reviewerタイプでTaskツールを使用する

**プレースホルダー:**
- `{WHAT_WAS_IMPLEMENTED}` - 作成したもの
- `{PLAN_OR_REQUIREMENTS}` - 何をすべきか
- `{BASE_SHA}` - 開始コミット
- `{HEAD_SHA}` - 終了コミット
- `{DESCRIPTION}` - 簡単なサマリ

**3. フィードバックに対応する:**
- Criticalな問題はすぐに修正する
- Importantな問題は先に進む前に修正する
- Minorな問題は後のために記録する
- レビュアーが間違っている場合はプッシュバックする（理由を示して）

## 例

```
[タスク2: 検証関数の追加を完了]

あなた: 先に進む前にコードレビューをリクエストします。

BASE_SHA=$(git log --oneline | grep "Task 1" | head -1 | awk '{print $1}')
HEAD_SHA=$(git rev-parse HEAD)

[superpowers:code-reviewerサブエージェントをディスパッチ]
  WHAT_WAS_IMPLEMENTED: 会話インデックスの検証と修復関数
  PLAN_OR_REQUIREMENTS: docs/superpowers/plans/deployment-plan.mdのタスク2
  BASE_SHA: a7981ec
  HEAD_SHA: 3df7661
  DESCRIPTION: 4つの問題タイプでverifyIndex()とrepairIndex()を追加

[サブエージェントが返す]:
  長所: クリーンなアーキテクチャ、実際のテスト
  問題:
    Important: 進捗インジケーターが欠けている
    Minor: レポート間隔のマジックナンバー（100）
  評価: 先に進める準備ができている

あなた: [進捗インジケーターを修正]
[タスク3へ続く]
```

## ワークフローとの統合

**サブエージェント駆動開発:**
- 各タスク後にレビュー
- 問題が複合する前にキャッチする
- 次のタスクに移動する前に修正する

**計画の実行:**
- 各バッチ後にレビュー（3タスク）
- フィードバックを受け取り、適用し、続ける

**アドホック開発:**
- マージ前にレビュー
- 行き詰まったときにレビュー

## レッドフラグ

**絶対にしてはいけないこと:**
- 「シンプルだから」レビューをスキップする
- Criticalな問題を無視する
- 修正されていないImportantな問題を抱えたまま進む
- 有効な技術的フィードバックと議論する

**レビュアーが間違っている場合:**
- 技術的な理由でプッシュバックする
- 動作することを証明するコード/テストを示す
- 明確化をリクエストする

テンプレートは: requesting-code-review/code-reviewer.md
