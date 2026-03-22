# Gemini CLIツールマッピング

スキルはClaude Codeのツール名を使用します。スキル内でこれらに遭遇した場合は、プラットフォームの同等のものを使用してください：

| スキルの参照 | Gemini CLIの同等 |
|-----------------|----------------------|
| `Read`（ファイル読み取り） | `read_file` |
| `Write`（ファイル作成） | `write_file` |
| `Edit`（ファイル編集） | `replace` |
| `Bash`（コマンド実行） | `run_shell_command` |
| `Grep`（ファイルコンテンツ検索） | `grep_search` |
| `Glob`（ファイル名で検索） | `glob` |
| `TodoWrite`（タスク追跡） | `write_todos` |
| `Skill`ツール（スキルを呼び出す） | `activate_skill` |
| `WebSearch` | `google_web_search` |
| `WebFetch` | `web_fetch` |
| `Task`ツール（サブエージェントのディスパッチ） | 同等なし — Gemini CLIはサブエージェントをサポートしていない |

## サブエージェントサポートなし

Gemini CLIにはClaude Codeの`Task`ツールに相当するものがありません。サブエージェントのディスパッチに依存するスキル（`subagent-driven-development`、`dispatching-parallel-agents`）は`executing-plans`経由のシングルセッション実行にフォールバックします。

## Gemini CLI追加ツール

以下のツールはGemini CLIで利用可能ですが、Claude Codeには同等のものがありません：

| ツール | 目的 |
|------|---------|
| `list_directory` | ファイルとサブディレクトリの一覧表示 |
| `save_memory` | セッション間でGEMINI.mdに事実を永続化 |
| `ask_user` | ユーザーへの構造化された入力のリクエスト |
| `tracker_create_task` | リッチなタスク管理（作成、更新、一覧表示、可視化） |
| `enter_plan_mode` / `exit_plan_mode` | 変更前に読み取り専用の調査モードに切り替え |
