# 多層防御バリデーション

## 概要

無効なデータによって引き起こされたバグを修正する際、1か所にバリデーションを追加するだけで十分に思えます。しかし、その単一のチェックは異なるコードパス、リファクタリング、またはモックによってバイパスされる可能性があります。

**基本原則:** データが通過する全てのレイヤーでバリデーションを行う。バグを構造的に不可能にする。

## 複数レイヤーの理由

単一のバリデーション: 「バグを修正した」
複数のレイヤー: 「バグを不可能にした」

異なるレイヤーが異なるケースをキャッチする:
- エントリーバリデーションはほとんどのバグをキャッチする
- ビジネスロジックはエッジケースをキャッチする
- 環境ガードはコンテキスト固有の危険を防ぐ
- デバッグログは他のレイヤーが失敗した時に助ける

## 4つのレイヤー

### レイヤー1: エントリーポイントバリデーション
**目的:** API境界で明らかに無効な入力を拒否する

```typescript
function createProject(name: string, workingDirectory: string) {
  if (!workingDirectory || workingDirectory.trim() === '') {
    throw new Error('workingDirectory は空にできません');
  }
  if (!existsSync(workingDirectory)) {
    throw new Error(`workingDirectory が存在しません: ${workingDirectory}`);
  }
  if (!statSync(workingDirectory).isDirectory()) {
    throw new Error(`workingDirectory はディレクトリではありません: ${workingDirectory}`);
  }
  // ... 続行
}
```

### レイヤー2: ビジネスロジックバリデーション
**目的:** データがこの操作に対して意味をなすことを確認する

```typescript
function initializeWorkspace(projectDir: string, sessionId: string) {
  if (!projectDir) {
    throw new Error('ワークスペースの初期化にはprojectDirが必要です');
  }
  // ... 続行
}
```

### レイヤー3: 環境ガード
**目的:** 特定のコンテキストで危険な操作を防ぐ

```typescript
async function gitInit(directory: string) {
  // テストでは、一時ディレクトリ外でのgit initを拒否する
  if (process.env.NODE_ENV === 'test') {
    const normalized = normalize(resolve(directory));
    const tmpDir = normalize(resolve(tmpdir()));

    if (!normalized.startsWith(tmpDir)) {
      throw new Error(
        `テスト中に一時ディレクトリ外でのgit initを拒否: ${directory}`
      );
    }
  }
  // ... 続行
}
```

### レイヤー4: デバッグインストゥルメンテーション
**目的:** フォレンジックのためのコンテキストをキャプチャする

```typescript
async function gitInit(directory: string) {
  const stack = new Error().stack;
  logger.debug('git initを実行しようとしています', {
    directory,
    cwd: process.cwd(),
    stack,
  });
  // ... 続行
}
```

## パターンの適用

バグを見つけた時:

1. **データフローをトレースする** — 不正な値はどこで発生するか？どこで使用されるか？
2. **全てのチェックポイントをマップする** — データが通過する全ての点をリストアップする
3. **各レイヤーにバリデーションを追加する** — エントリー、ビジネス、環境、デバッグ
4. **各レイヤーをテストする** — レイヤー1をバイパスしてみる、レイヤー2がキャッチすることを確認する

## セッションからの例

バグ: 空の `projectDir` がソースコードで `git init` を引き起こした

**データフロー:**
1. テストセットアップ → 空文字列
2. `Project.create(name, '')`
3. `WorkspaceManager.createWorkspace('')`
4. `git init` が `process.cwd()` で実行される

**追加された4つのレイヤー:**
- レイヤー1: `Project.create()` が空でない/存在する/書き込み可能を検証
- レイヤー2: `WorkspaceManager` が projectDir が空でないことを検証
- レイヤー3: `WorktreeManager` がテスト中に tmpdir 外での git init を拒否
- レイヤー4: git init 前にスタックトレースログ

**結果:** 全1847テストが通過し、バグを再現不能にした

## 重要な洞察

全4つのレイヤーが必要でした。テスト中に各レイヤーが他のレイヤーが見逃したバグをキャッチしました:
- 異なるコードパスがエントリーバリデーションをバイパスした
- モックがビジネスロジックのチェックをバイパスした
- 異なるプラットフォームのエッジケースに環境ガードが必要だった
- デバッグログが構造的な誤用を特定した

**1か所のバリデーションで止まらないでください。** 全てのレイヤーでチェックを追加してください。
