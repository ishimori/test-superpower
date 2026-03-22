#!/usr/bin/env bash
# ブレインストーミングサーバーを起動して接続情報を出力する
# 使用方法: start-server.sh [--project-dir <パス>] [--host <バインドホスト>] [--url-host <表示ホスト>] [--foreground] [--background]
#
# ランダムな高ポートでサーバーを起動し、URLを含むJSONを出力する。
# 各セッションは競合を避けるために独自のディレクトリを持つ。
#
# オプション:
#   --project-dir <パス>  /tmpの代わりに<パス>/.superpowers/brainstorm/に
#                         セッションファイルを保存する。サーバー停止後もファイルが残る。
#   --host <バインドホスト>  バインドするホスト/インターフェース（デフォルト: 127.0.0.1）。
#                           リモート/コンテナ環境では0.0.0.0を使用する。
#   --url-host <ホスト>     返却されるURL JSONに表示されるホスト名。
#   --foreground           現在のターミナルでサーバーを実行する（バックグラウンド化しない）。
#   --background           バックグラウンドモードを強制する（Codexの自動フォアグラウンドを上書き）。

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# 引数のパース
PROJECT_DIR=""
FOREGROUND="false"
FORCE_BACKGROUND="false"
BIND_HOST="127.0.0.1"
URL_HOST=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-dir)
      PROJECT_DIR="$2"
      shift 2
      ;;
    --host)
      BIND_HOST="$2"
      shift 2
      ;;
    --url-host)
      URL_HOST="$2"
      shift 2
      ;;
    --foreground|--no-daemon)
      FOREGROUND="true"
      shift
      ;;
    --background|--daemon)
      FORCE_BACKGROUND="true"
      shift
      ;;
    *)
      echo "{\"error\": \"不明な引数: $1\"}"
      exit 1
      ;;
  esac
done

if [[ -z "$URL_HOST" ]]; then
  if [[ "$BIND_HOST" == "127.0.0.1" || "$BIND_HOST" == "localhost" ]]; then
    URL_HOST="localhost"
  else
    URL_HOST="$BIND_HOST"
  fi
fi

# 一部の環境はデタッチ/バックグラウンドプロセスを終了させる。検出時に自動フォアグラウンド化。
if [[ -n "${CODEX_CI:-}" && "$FOREGROUND" != "true" && "$FORCE_BACKGROUND" != "true" ]]; then
  FOREGROUND="true"
fi

# Windows/Git Bashはnohupバックグラウンドプロセスを終了させる。検出時に自動フォアグラウンド化。
if [[ "$FOREGROUND" != "true" && "$FORCE_BACKGROUND" != "true" ]]; then
  case "${OSTYPE:-}" in
    msys*|cygwin*|mingw*) FOREGROUND="true" ;;
  esac
  if [[ -n "${MSYSTEM:-}" ]]; then
    FOREGROUND="true"
  fi
fi

# ユニークなセッションディレクトリを生成
SESSION_ID="$$-$(date +%s)"

if [[ -n "$PROJECT_DIR" ]]; then
  SCREEN_DIR="${PROJECT_DIR}/.superpowers/brainstorm/${SESSION_ID}"
else
  SCREEN_DIR="/tmp/brainstorm-${SESSION_ID}"
fi

PID_FILE="${SCREEN_DIR}/.server.pid"
LOG_FILE="${SCREEN_DIR}/.server.log"

# 新しいセッションディレクトリを作成
mkdir -p "$SCREEN_DIR"

# 既存のサーバーを停止
if [[ -f "$PID_FILE" ]]; then
  old_pid=$(cat "$PID_FILE")
  kill "$old_pid" 2>/dev/null
  rm -f "$PID_FILE"
fi

cd "$SCRIPT_DIR"

# ハーネスPID（このスクリプトの祖父プロセス）を解決する。
# $PPIDはハーネスがこのスクリプトを実行するために生成した一時的なシェル —
# このスクリプト終了時に消える。ハーネス自体は$PPIDの親。
OWNER_PID="$(ps -o ppid= -p "$PPID" 2>/dev/null | tr -d ' ')"
if [[ -z "$OWNER_PID" || "$OWNER_PID" == "1" ]]; then
  OWNER_PID="$PPID"
fi

# Windows/MSYS2ではMSYS2のPID名前空間がNode.jsから見えない。
# オーナーPID監視をスキップ — 30分のアイドルタイムアウトが孤立プロセスを防ぐ。
case "${OSTYPE:-}" in
  msys*|cygwin*|mingw*) OWNER_PID="" ;;
esac

# デタッチ/バックグラウンドプロセスを終了させる環境用のフォアグラウンドモード。
if [[ "$FOREGROUND" == "true" ]]; then
  echo "$$" > "$PID_FILE"
  env BRAINSTORM_DIR="$SCREEN_DIR" BRAINSTORM_HOST="$BIND_HOST" BRAINSTORM_URL_HOST="$URL_HOST" BRAINSTORM_OWNER_PID="$OWNER_PID" node server.cjs
  exit $?
fi

# サーバーを起動し、出力をログファイルにキャプチャ
# nohupでシェル終了後も生存させ、disownでジョブテーブルから削除
nohup env BRAINSTORM_DIR="$SCREEN_DIR" BRAINSTORM_HOST="$BIND_HOST" BRAINSTORM_URL_HOST="$URL_HOST" BRAINSTORM_OWNER_PID="$OWNER_PID" node server.cjs > "$LOG_FILE" 2>&1 &
SERVER_PID=$!
disown "$SERVER_PID" 2>/dev/null
echo "$SERVER_PID" > "$PID_FILE"

# server-startedメッセージを待つ（ログファイルを確認）
for i in {1..50}; do
  if grep -q "server-started" "$LOG_FILE" 2>/dev/null; then
    # 短い間隔でサーバーがまだ生きているか確認（プロセス終了を検知）
    alive="true"
    for _ in {1..20}; do
      if ! kill -0 "$SERVER_PID" 2>/dev/null; then
        alive="false"
        break
      fi
      sleep 0.1
    done
    if [[ "$alive" != "true" ]]; then
      echo "{\"error\": \"サーバーは起動したが終了されました。永続ターミナルで再試行: $SCRIPT_DIR/start-server.sh${PROJECT_DIR:+ --project-dir $PROJECT_DIR} --host $BIND_HOST --url-host $URL_HOST --foreground\"}"
      exit 1
    fi
    grep "server-started" "$LOG_FILE" | head -1
    exit 0
  fi
  sleep 0.1
done

# タイムアウト - サーバーが起動しなかった
echo '{"error": "サーバーが5秒以内に起動しませんでした"}'
exit 1
