# ビジュアルコンパニオンガイド

モックアップ、図表、オプションを表示するためのブラウザベースのビジュアルブレインストーミングコンパニオン。

## 使用するタイミング

セッション単位ではなく、質問単位で判断する。テスト：**ユーザーは読むよりも見た方が理解しやすいか？**

**ブラウザを使用** — コンテンツ自体がビジュアルな場合：

- **UIモックアップ** — ワイヤーフレーム、レイアウト、ナビゲーション構造、コンポーネントデザイン
- **アーキテクチャ図** — システムコンポーネント、データフロー、関係マップ
- **並べたビジュアル比較** — 2つのレイアウト、2つのカラースキーム、2つのデザイン方向の比較
- **デザインの仕上げ** — 見た目と感触、間隔、ビジュアル階層に関する質問
- **空間的な関係** — ステートマシン、フローチャート、図として描画されたエンティティ関係

**ターミナルを使用** — コンテンツがテキストまたは表形式の場合：

- **要件とスコープの質問** — 「Xとは何を意味するか？」「どの機能がスコープ内か？」
- **概念的なA/B/C選択** — 言葉で説明されるアプローチの選択
- **トレードオフリスト** — メリット/デメリット、比較表
- **技術的な決定** — API設計、データモデリング、アーキテクチャアプローチの選択
- **明確化の質問** — 回答が言葉であり、ビジュアルな好みではないもの

UIトピックに*関する*質問が自動的にビジュアルな質問になるわけではない。「どんなウィザードがほしいですか？」は概念的 — ターミナルを使用。「これらのウィザードレイアウトのどれがしっくりきますか？」はビジュアル — ブラウザを使用。

## 仕組み

サーバーはディレクトリを監視してHTMLファイルの変更を検知し、最新のものをブラウザに提供する。HTMLコンテンツを書き込むと、ユーザーはブラウザで確認でき、クリックしてオプションを選択できる。選択内容は `.events` ファイルに記録され、次のターンで読み取る。

**コンテンツフラグメントとフルドキュメント：** HTMLファイルが `<!DOCTYPE` または `<html` で始まる場合、サーバーはそのまま提供する（ヘルパースクリプトだけ注入）。それ以外の場合、サーバーは自動的にフレームテンプレートでコンテンツをラップする — ヘッダー、CSSテーマ、選択インジケーター、すべてのインタラクティブなインフラを追加。**デフォルトではコンテンツフラグメントを書く。** ページの完全な制御が必要な場合のみフルドキュメントを書く。

## セッションの開始

```bash
# 永続化ありでサーバーを起動（モックアップをプロジェクトに保存）
scripts/start-server.sh --project-dir /path/to/project

# 返却値: {"type":"server-started","port":52341,"url":"http://localhost:52341",
#           "screen_dir":"/path/to/project/.superpowers/brainstorm/12345-1706000000"}
```

レスポンスから `screen_dir` を保存する。ユーザーにURLを開くよう伝える。

**接続情報の確認：** サーバーは起動時のJSONを `$SCREEN_DIR/.server-info` に書き込む。バックグラウンドでサーバーを起動してstdoutをキャプチャしなかった場合、そのファイルを読んでURLとポートを取得する。`--project-dir` を使用している場合、`<project>/.superpowers/brainstorm/` でセッションディレクトリを確認する。

**注意：** モックアップが `.superpowers/brainstorm/` に永続化されサーバー再起動後も残るよう、プロジェクトルートを `--project-dir` として渡す。指定しない場合、ファイルは `/tmp` に保存されクリーンアップされる。まだ追加されていなければ、`.superpowers/` を `.gitignore` に追加するようユーザーに伝える。

**プラットフォーム別のサーバー起動：**

**Claude Code (macOS / Linux)：**
```bash
# デフォルトモードで動作 — スクリプトが自動的にサーバーをバックグラウンド化
scripts/start-server.sh --project-dir /path/to/project
```

**Claude Code (Windows)：**
```bash
# Windowsは自動検出してフォアグラウンドモードを使用し、ツールコールをブロックする。
# 会話ターン間でサーバーが生存するよう、Bashツールコールで run_in_background: true を設定する。
scripts/start-server.sh --project-dir /path/to/project
```
Bashツールで呼び出す際は、`run_in_background: true` を設定する。次のターンで `$SCREEN_DIR/.server-info` を読んでURLとポートを取得する。

**Codex：**
```bash
# Codexはバックグラウンドプロセスを終了させる。スクリプトがCODEX_CIを自動検出して
# フォアグラウンドモードに切り替える。通常通り実行する — 追加フラグは不要。
scripts/start-server.sh --project-dir /path/to/project
```

**Gemini CLI：**
```bash
# --foreground を使用し、シェルツールコールで is_background: true を設定して
# プロセスがターン間で生存するようにする
scripts/start-server.sh --project-dir /path/to/project --foreground
```

**その他の環境：** サーバーは会話ターン間でバックグラウンドで実行し続ける必要がある。環境がデタッチされたプロセスを終了させる場合、`--foreground` を使用し、プラットフォームのバックグラウンド実行メカニズムでコマンドを起動する。

ブラウザからURLに到達できない場合（リモート/コンテナ化された環境で一般的）、ループバックでないホストをバインドする：

```bash
scripts/start-server.sh \
  --project-dir /path/to/project \
  --host 0.0.0.0 \
  --url-host localhost
```

`--url-host` で返却されるURL JSONに表示されるホスト名を制御する。

## ループ

1. **サーバーの生存を確認**し、**HTMLを書き込む** `screen_dir` の新しいファイルに：
   - 書き込む前に、`$SCREEN_DIR/.server-info` が存在することを確認する。存在しない場合（または `.server-stopped` が存在する場合）、サーバーがシャットダウンしている — 続行する前に `start-server.sh` で再起動する。サーバーは30分間の非アクティブ後に自動終了する。
   - セマンティックなファイル名を使用する：`platform.html`、`visual-style.html`、`layout.html`
   - **ファイル名を再利用しない** — 各スクリーンは新しいファイルにする
   - Writeツールを使用する — **cat/heredocは使わない**（ターミナルにノイズが出る）
   - サーバーは自動的に最新のファイルを提供する

2. **ユーザーに何を期待するか伝え、ターンを終了する：**
   - URLをリマインドする（最初だけでなく毎回）
   - 画面に表示されている内容の簡単なテキスト要約を伝える（例：「ホームページの3つのレイアウトオプションを表示しています」）
   - ターミナルで応答するよう依頼する：「確認して、感想をお聞かせください。よければオプションをクリックして選択してください。」

3. **次のターンで** — ユーザーがターミナルで応答した後：
   - `$SCREEN_DIR/.events` が存在する場合は読み取る — ユーザーのブラウザインタラクション（クリック、選択）がJSON行として含まれている
   - ユーザーのターミナルテキストとマージして全体像を把握する
   - ターミナルメッセージが主なフィードバック；`.events` は構造化されたインタラクションデータを提供する

4. **繰り返しまたは次に進む** — フィードバックが現在のスクリーンを変更する場合、新しいファイルを書く（例：`layout-v2.html`）。現在のステップが検証されてから初めて次の質問に移る。

5. **ターミナルに戻る際にアンロード** — 次のステップがブラウザを必要としない場合（例：明確化の質問、トレードオフの議論）、古いコンテンツをクリアするための待機スクリーンをプッシュする：

   ```html
   <!-- ファイル名: waiting.html（またはwaiting-2.htmlなど） -->
   <div style="display:flex;align-items:center;justify-content:center;min-height:60vh">
     <p class="subtitle">ターミナルで続行中...</p>
   </div>
   ```

   これにより、会話が先に進んでいるのに、ユーザーが解決済みの選択を見続けることを防ぐ。次のビジュアルな質問が出てきたら、通常通り新しいコンテンツファイルをプッシュする。

6. 完了まで繰り返す。

## コンテンツフラグメントの書き方

ページ内に入るコンテンツだけを書く。サーバーが自動的にフレームテンプレートでラップする（ヘッダー、テーマCSS、選択インジケーター、すべてのインタラクティブなインフラ）。

**最小限の例：**

```html
<h2>どちらのレイアウトが良いですか？</h2>
<p class="subtitle">可読性とビジュアル階層を考慮してください</p>

<div class="options">
  <div class="option" data-choice="a" onclick="toggleSelect(this)">
    <div class="letter">A</div>
    <div class="content">
      <h3>シングルカラム</h3>
      <p>クリーンで集中した読書体験</p>
    </div>
  </div>
  <div class="option" data-choice="b" onclick="toggleSelect(this)">
    <div class="letter">B</div>
    <div class="content">
      <h3>ツーカラム</h3>
      <p>サイドバーナビゲーション付きのメインコンテンツ</p>
    </div>
  </div>
</div>
```

これだけです。`<html>`、CSS、`<script>` タグは不要。サーバーがすべて提供する。

## 利用可能なCSSクラス

フレームテンプレートはコンテンツ用に以下のCSSクラスを提供する：

### オプション（A/B/C選択）

```html
<div class="options">
  <div class="option" data-choice="a" onclick="toggleSelect(this)">
    <div class="letter">A</div>
    <div class="content">
      <h3>タイトル</h3>
      <p>説明</p>
    </div>
  </div>
</div>
```

**複数選択：** コンテナに `data-multiselect` を追加すると、ユーザーが複数のオプションを選択できる。クリックでアイテムがトグルされる。インジケーターバーに数が表示される。

```html
<div class="options" data-multiselect>
  <!-- 同じオプションマークアップ — ユーザーが複数を選択/解除可能 -->
</div>
```

### カード（ビジュアルデザイン）

```html
<div class="cards">
  <div class="card" data-choice="design1" onclick="toggleSelect(this)">
    <div class="card-image"><!-- モックアップコンテンツ --></div>
    <div class="card-body">
      <h3>名前</h3>
      <p>説明</p>
    </div>
  </div>
</div>
```

### モックアップコンテナ

```html
<div class="mockup">
  <div class="mockup-header">プレビュー：ダッシュボードレイアウト</div>
  <div class="mockup-body"><!-- モックアップHTML --></div>
</div>
```

### 分割表示（横並び）

```html
<div class="split">
  <div class="mockup"><!-- 左 --></div>
  <div class="mockup"><!-- 右 --></div>
</div>
```

### メリット/デメリット

```html
<div class="pros-cons">
  <div class="pros"><h4>メリット</h4><ul><li>利点</li></ul></div>
  <div class="cons"><h4>デメリット</h4><ul><li>欠点</li></ul></div>
</div>
```

### モック要素（ワイヤーフレームの構成部品）

```html
<div class="mock-nav">ロゴ | ホーム | について | 連絡先</div>
<div style="display: flex;">
  <div class="mock-sidebar">ナビゲーション</div>
  <div class="mock-content">メインコンテンツエリア</div>
</div>
<button class="mock-button">アクションボタン</button>
<input class="mock-input" placeholder="入力フィールド">
<div class="placeholder">プレースホルダーエリア</div>
```

### タイポグラフィとセクション

- `h2` — ページタイトル
- `h3` — セクション見出し
- `.subtitle` — タイトル下のサブテキスト
- `.section` — 下マージン付きのコンテンツブロック
- `.label` — 小さな大文字ラベルテキスト

## ブラウザイベント形式

ユーザーがブラウザでオプションをクリックすると、インタラクションが `$SCREEN_DIR/.events` に記録される（1行につき1つのJSONオブジェクト）。新しいスクリーンをプッシュすると、ファイルは自動的にクリアされる。

```jsonl
{"type":"click","choice":"a","text":"オプションA - シンプルレイアウト","timestamp":1706000101}
{"type":"click","choice":"c","text":"オプションC - 複雑なグリッド","timestamp":1706000108}
{"type":"click","choice":"b","text":"オプションB - ハイブリッド","timestamp":1706000115}
```

完全なイベントストリームはユーザーの探索パスを示す — 決定する前に複数のオプションをクリックすることがある。最後の `choice` イベントが通常最終選択だが、クリックのパターンから迷いや質問すべき好みが見えることがある。

`.events` が存在しない場合、ユーザーはブラウザとインタラクションしていない — ターミナルテキストのみを使用する。

## デザインのヒント

- **忠実度を質問に合わせてスケーリング** — レイアウトにはワイヤーフレーム、仕上げの質問には仕上げを
- **各ページで質問を説明する** — 「どちらのレイアウトがよりプロフェッショナルに感じますか？」であって単に「一つ選んで」ではない
- **次に進む前に繰り返す** — フィードバックが現在のスクリーンを変更する場合、新しいバージョンを書く
- **1スクリーンあたり最大2〜4のオプション**
- **重要な場合は実際のコンテンツを使用** — 写真ポートフォリオなら実際の画像（Unsplash）を使用。プレースホルダーコンテンツはデザインの問題を覆い隠す。
- **モックアップはシンプルに** — レイアウトと構造に集中し、ピクセルパーフェクトなデザインではない

## ファイル命名

- セマンティックな名前を使用する：`platform.html`、`visual-style.html`、`layout.html`
- ファイル名を再利用しない — 各スクリーンは新しいファイルでなければならない
- 反復にはバージョンサフィックスを付ける：`layout-v2.html`、`layout-v3.html`
- サーバーは更新日時が最新のファイルを提供する

## クリーンアップ

```bash
scripts/stop-server.sh $SCREEN_DIR
```

セッションが `--project-dir` を使用していた場合、モックアップファイルは `.superpowers/brainstorm/` に残り、後で参照できる。`/tmp` セッションのみが停止時に削除される。

## リファレンス

- フレームテンプレート（CSSリファレンス）：`scripts/frame-template.html`
- ヘルパースクリプト（クライアントサイド）：`scripts/helper.js`
