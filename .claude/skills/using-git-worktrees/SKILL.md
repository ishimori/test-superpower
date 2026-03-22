---
name: using-git-worktrees
description: 現在のワークスペースから隔離が必要な機能開発を開始するとき、または実装計画を実行する前に使用する — スマートなディレクトリ選択と安全性検証で隔離されたgitワークツリーを作成する
---

# Gitワークツリーの使用

## 概要

Gitワークツリーは同じリポジトリを共有する隔離されたワークスペースを作成し、切り替えなしに複数のブランチを同時に扱えます。

**核心原則:** 体系的なディレクトリ選択 + 安全性検証 = 信頼性の高い隔離。

**開始時のアナウンス:** 「using-git-worktreesスキルを使用して隔離されたワークスペースをセットアップします。」

## ディレクトリ選択プロセス

以下の優先順位に従ってください：

### 1. 既存ディレクトリの確認

```bash
# 優先順位に従って確認
ls -d .worktrees 2>/dev/null     # 推奨（非表示）
ls -d worktrees 2>/dev/null      # 代替
```

**見つかった場合:** そのディレクトリを使用。両方存在する場合は`.worktrees`が優先。

### 2. CLAUDE.mdの確認

```bash
grep -i "worktree.*director" CLAUDE.md 2>/dev/null
```

**設定が指定されている場合:** 質問せずにそれを使用。

### 3. ユーザーに質問

ディレクトリが存在せずCLAUDE.mdの設定もない場合：

```
ワークツリーディレクトリが見つかりませんでした。どこにワークツリーを作成しますか？

1. .worktrees/（プロジェクトローカル、非表示）
2. ~/.config/superpowers/worktrees/<プロジェクト名>/（グローバルな場所）

どちらを希望しますか？
```

## 安全性検証

### プロジェクトローカルディレクトリの場合（.worktreesまたはworktrees）

**ワークツリーを作成する前にディレクトリが無視されていることを確認する必要があります：**

```bash
# ディレクトリが無視されているか確認（ローカル、グローバル、システムのgitignoreを尊重）
git check-ignore -q .worktrees 2>/dev/null || git check-ignore -q worktrees 2>/dev/null
```

**無視されていない場合：**

Jesseのルール「壊れたものはすぐに修正する」に従って：
1. .gitignoreに適切な行を追加
2. 変更をコミット
3. ワークツリーの作成に進む

**重要な理由:** ワークツリーの内容が誤ってリポジトリにコミットされるのを防ぎます。

### グローバルディレクトリの場合（~/.config/superpowers/worktrees）

.gitignoreの検証は不要 — プロジェクトの外にあるため。

## 作成手順

### 1. プロジェクト名の検出

```bash
project=$(basename "$(git rev-parse --show-toplevel)")
```

### 2. ワークツリーの作成

```bash
# フルパスの決定
case $LOCATION in
  .worktrees|worktrees)
    path="$LOCATION/$BRANCH_NAME"
    ;;
  ~/.config/superpowers/worktrees/*)
    path="~/.config/superpowers/worktrees/$project/$BRANCH_NAME"
    ;;
esac

# 新しいブランチでワークツリーを作成
git worktree add "$path" -b "$BRANCH_NAME"
cd "$path"
```

### 3. プロジェクトセットアップの実行

適切なセットアップを自動検出して実行：

```bash
# Node.js
if [ -f package.json ]; then npm install; fi

# Rust
if [ -f Cargo.toml ]; then cargo build; fi

# Python
if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
if [ -f pyproject.toml ]; then poetry install; fi

# Go
if [ -f go.mod ]; then go mod download; fi
```

### 4. クリーンなベースラインの確認

ワークツリーがクリーンな状態で始まることを確認するためにテストを実行：

```bash
# 例 — プロジェクトに適したコマンドを使用
npm test
cargo test
pytest
go test ./...
```

**テストが失敗した場合:** 失敗を報告し、続行するか調査するか確認する。

**テストが通過した場合:** 準備完了を報告。

### 5. 場所を報告

```
ワークツリーの準備が完了しました: <フルパス>
テスト通過（<N>件のテスト、0件の失敗）
<機能名>の実装を開始する準備ができました
```

## クイックリファレンス

| 状況 | アクション |
|-----------|--------|
| `.worktrees/`が存在 | 使用する（無視されているか確認） |
| `worktrees/`が存在 | 使用する（無視されているか確認） |
| 両方存在 | `.worktrees/`を使用 |
| どちらも存在しない | CLAUDE.mdを確認 → ユーザーに質問 |
| ディレクトリが無視されていない | .gitignoreに追加 + コミット |
| ベースラインでテストが失敗 | 失敗を報告 + 確認 |
| package.json/Cargo.tomlなし | 依存関係インストールをスキップ |

## よくある間違い

### 無視確認のスキップ

- **問題:** ワークツリーの内容が追跡され、gitのステータスを汚染する
- **修正:** プロジェクトローカルのワークツリーを作成する前に必ず`git check-ignore`を使用

### ディレクトリの場所を決めつける

- **問題:** 不整合を生み出し、プロジェクトの規約に違反する
- **修正:** 優先順位に従う：既存 > CLAUDE.md > ユーザーに質問

### 失敗したテストで続行する

- **問題:** 新しいバグと既存の問題を区別できない
- **修正:** 失敗を報告し、続行する明示的な許可を得る

### セットアップコマンドのハードコーディング

- **問題:** 異なるツールを使用するプロジェクトで壊れる
- **修正:** プロジェクトファイルから自動検出（package.jsonなど）

## ワークフロー例

```
あなた: using-git-worktreesスキルを使用して隔離されたワークスペースをセットアップします。

[.worktrees/を確認 — 存在する]
[無視確認 — git check-ignoreが.worktrees/の無視を確認]
[ワークツリーを作成: git worktree add .worktrees/auth -b feature/auth]
[npm installを実行]
[npm testを実行 — 47件通過]

ワークツリーの準備が完了しました: /Users/jesse/myproject/.worktrees/auth
テスト通過（47件のテスト、0件の失敗）
auth機能の実装を開始する準備ができました
```

## レッドフラグ

**絶対にしないこと：**
- 無視されているか確認せずにワークツリーを作成する（プロジェクトローカルの場合）
- ベースラインテスト確認をスキップする
- 確認なしに失敗したテストで続行する
- 曖昧な場合にディレクトリの場所を決めつける
- CLAUDE.mdの確認をスキップする

**常にすること：**
- ディレクトリの優先順位に従う：既存 > CLAUDE.md > ユーザーに質問
- プロジェクトローカルのディレクトリが無視されているか確認する
- プロジェクトセットアップを自動検出して実行する
- クリーンなテストのベースラインを確認する

## 統合

**呼び出し元：**
- **brainstorming**（フェーズ4）— 設計が承認され実装に進む場合に必須
- **subagent-driven-development** — タスク実行前に必須
- **executing-plans** — タスク実行前に必須
- 隔離されたワークスペースが必要なスキル全般

**連携するもの：**
- **finishing-a-development-branch** — 作業完了後のクリーンアップに必須
