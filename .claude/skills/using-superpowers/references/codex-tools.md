# Codexツールマッピング

スキルはClaude Codeのツール名を使用します。スキル内でこれらに遭遇した場合は、プラットフォームの同等のものを使用してください：

| スキルの参照 | Codexの同等 |
|-----------------|------------------|
| `Task`ツール（サブエージェントのディスパッチ） | `spawn_agent` |
| 複数の`Task`呼び出し（並列） | 複数の`spawn_agent`呼び出し |
| Taskが結果を返す | `wait` |
| Taskが自動的に完了 | スロットを解放するために`close_agent` |
| `TodoWrite`（タスク追跡） | `update_plan` |
| `Skill`ツール（スキルを呼び出す） | スキルはネイティブにロードされます — 指示に従うだけ |
| `Read`、`Write`、`Edit`（ファイル） | ネイティブのファイルツールを使用 |
| `Bash`（コマンド実行） | ネイティブのシェルツールを使用 |

## サブエージェントのディスパッチにはマルチエージェントサポートが必要

Codexの設定（`~/.codex/config.toml`）に追加：

```toml
[features]
multi_agent = true
```

これにより`dispatching-parallel-agents`や`subagent-driven-development`などのスキル用に`spawn_agent`、`wait`、`close_agent`が有効になります。
