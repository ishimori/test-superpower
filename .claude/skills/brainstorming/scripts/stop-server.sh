#!/usr/bin/env bash
# ブレインストーミングサーバーを停止してクリーンアップする
# 使用方法: stop-server.sh <screen_dir>
#
# サーバープロセスを停止する。/tmp配下のセッションディレクトリ
# （一時的なもの）のみ削除する。永続ディレクトリ（.superpowers/）は
# モックアップを後で確認できるよう保持する。

SCREEN_DIR="$1"

if [[ -z "$SCREEN_DIR" ]]; then
  echo '{"error": "使用方法: stop-server.sh <screen_dir>"}'
  exit 1
fi

PID_FILE="${SCREEN_DIR}/.server.pid"

if [[ -f "$PID_FILE" ]]; then
  pid=$(cat "$PID_FILE")

  # グレースフルに停止を試み、まだ生きていれば強制終了にフォールバック
  kill "$pid" 2>/dev/null || true

  # グレースフルシャットダウンを待つ（最大約2秒）
  for i in {1..20}; do
    if ! kill -0 "$pid" 2>/dev/null; then
      break
    fi
    sleep 0.1
  done

  # まだ実行中ならSIGKILLにエスカレート
  if kill -0 "$pid" 2>/dev/null; then
    kill -9 "$pid" 2>/dev/null || true

    # SIGKILLが効くまで少し待つ
    sleep 0.1
  fi

  if kill -0 "$pid" 2>/dev/null; then
    echo '{"status": "failed", "error": "プロセスがまだ実行中です"}'
    exit 1
  fi

  rm -f "$PID_FILE" "${SCREEN_DIR}/.server.log"

  # 一時的な/tmpディレクトリのみ削除
  if [[ "$SCREEN_DIR" == /tmp/* ]]; then
    rm -rf "$SCREEN_DIR"
  fi

  echo '{"status": "stopped"}'
else
  echo '{"status": "not_running"}'
fi
