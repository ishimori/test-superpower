# 売上入力画面 設計ドキュメント

**日付:** 2026-03-22
**対象:** Housing E-Kintai — 賃貸 / 売上入力画面
**ステータス:** 承認済み

---

## 概要

不動産管理システム「Housing E-Kintai」の賃貸売上入力画面を新規開発する。事務員が毎日長時間向き合う業務画面であり、操作性・視認性を最優先とする。この画面をスキャフォールディングとして、後続画面（個人別、申込日別等）を展開する。

---

## スコープ

### 対象
- 売上入力画面（`/sales/rent/entry`）のみ
- フロントエンド + バックエンド + DB を垂直に実装

### スコープ外
- 認証・ログイン機能（後から追加）
- 他画面（個人別、申込日別 等）
- 締め処理の業務ロジック（ボタンのみ配置）
- 行削除 UI（DELETE エンドポイントは用意するが画面上のトリガーは後から）

---

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | Next.js (App Router) + TypeScript |
| UIコンポーネント | shadcn/ui + TailwindCSS |
| テーブル管理 | TanStack Table v8 |
| サーバー状態 | TanStack Query v5 |
| バックエンド | Python + FastAPI |
| ORM | SQLAlchemy |
| マイグレーション | Alembic |
| バリデーション | Pydantic v2 |
| DB | PostgreSQL |
| 開発環境 | Docker Compose（postgres: 5432, backend: 8000, frontend: 3000） |

---

## アーキテクチャ

```
┌─────────────────────────────────────────────┐
│  Frontend (Next.js + TypeScript)            │
│  ├── shadcn/ui コンポーネント               │
│  ├── TanStack Table (テーブル管理)          │
│  ├── TanStack Query (サーバー状態)          │
│  └── TailwindCSS                            │
│              │ REST API (JSON)              │
├─────────────┼───────────────────────────────┤
│  Backend (FastAPI + Python)                 │
│  ├── SQLAlchemy (ORM)                       │
│  ├── Alembic (マイグレーション)             │
│  └── Pydantic (バリデーション/スキーマ)     │
│              │                              │
├─────────────┼───────────────────────────────┤
│  PostgreSQL                                 │
└─────────────────────────────────────────────┘
```

### プロジェクト構成

```
project-root/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   └── sales/rent/entry/page.tsx
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui 基本部品 + 汎用編集セル（scaffold用）
│   │   │   └── sales/           # 売上入力画面固有コンポーネント
│   │   ├── hooks/               # カスタムフック
│   │   ├── lib/                 # ユーティリティ・API クライアント
│   │   └── types/               # 型定義
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/                 # FastAPI ルーター
│   │   ├── models/              # SQLAlchemy モデル
│   │   ├── schemas/             # Pydantic スキーマ
│   │   └── services/            # ビジネスロジック
│   ├── alembic/
│   └── requirements.txt
└── docker-compose.yml
```

---

## データモデル

### 計算フィールドの仕様

以下のフィールドはすべてバックエンドで自動計算し、クライアントは読み取り専用で表示する：

| フィールド | 計算式 | 備考 |
|---|---|---|
| `total_sales` | `brokerage_fee + ad_fee - payment_fee` | 合計売上 |
| `fee_calculation` | TBD（実装時に業務ルールを確認） | 手数料計算 |
| `ad_calculation` | TBD（実装時に業務ルールを確認） | 広告計算 |
| `total_summary` | TBD（実装時に業務ルールを確認） | 合計総計 |

計算式が未確定のフィールドは、実装フェーズでヒアリングして確定する。DBには計算結果を保存し、バックエンドの保存処理内で再計算する。

### `sales_rent` テーブル

| カラム名 | 型 | 説明 |
|---|---|---|
| `id` | SERIAL PK | 内部ID |
| `display_order` | INTEGER | 表示順（`(store_id, closing_month)` スコープ内で連番、保存時にバックエンドが自動採番） |
| `applied_at` | DATE | 申込日 |
| `employee_id` | INTEGER FK | 社員ID（nullable: 新規行では空可） |
| `customer_name` | VARCHAR(100) | 顧客名 |
| `property_name` | VARCHAR(200) | 物件名 |
| `brokerage_fee` | INTEGER | 仲介手数料（デフォルト: 0） |
| `ad_fee` | INTEGER | 広告料（デフォルト: 0） |
| `payment_fee` | INTEGER | 支払手数料（デフォルト: 0） |
| `total_sales` | INTEGER | 合計売上（計算値、バックエンド計算） |
| `received_at` | DATE | 入金日（nullable） |
| `is_white_flow` | BOOLEAN | 白流れ（デフォルト: false） |
| `fee_calculation` | INTEGER | 手数料計算（計算値、バックエンド計算） |
| `delivered_at` | DATE | お届日（nullable） |
| `is_delivery_flow` | BOOLEAN | お届流れ（デフォルト: false） |
| `ad_calculation` | INTEGER | 広告計算（計算値、バックエンド計算） |
| `total_summary` | INTEGER | 合計総計（計算値、バックエンド計算） |
| `status_flag` | VARCHAR(50) | 色分け用ステータスフラグ（nullable、詳細は後述） |
| `store_id` | INTEGER FK | 店舗ID |
| `closing_month` | VARCHAR(7) | 締め月（例: `2026-02`） |
| `category` | VARCHAR(50) | 区分 |
| `is_closed` | BOOLEAN | 締め処理済みフラグ（デフォルト: false） |
| `created_at` | TIMESTAMP | 作成日時 |
| `updated_at` | TIMESTAMP | 更新日時 |

### `stores` テーブル（マスタ）

| カラム名 | 型 | 説明 |
|---|---|---|
| `id` | SERIAL PK | 店舗ID |
| `name` | VARCHAR(100) | 店舗名 |

### `employees` テーブル（マスタ）

| カラム名 | 型 | 説明 |
|---|---|---|
| `id` | SERIAL PK | 社員ID |
| `name` | VARCHAR(100) | 社員名 |
| `store_id` | INTEGER FK | 所属店舗ID |

---

## ステータスフラグ仕様

`status_flag` カラムの値に応じて行・セルのスタイルを変更する。具体的な値とカラーマッピングは実装フェーズで業務ルールを確認して確定するが、以下の構造で実装する：

```typescript
// components/ui/row-color-resolver.ts（scaffold共通部品）
type StatusFlag = string; // 実装時に union type に絞る

const STATUS_STYLE_MAP: Record<StatusFlag, string> = {
  // 例（実装時に確定）:
  // "cancelled": "bg-red-50 text-red-700",
  // "settled": "bg-blue-50",
  // "pending": "",
};
```

マイナス金額（`total_sales < 0` 等）は `status_flag` によらず自動的に `text-red-600` を適用する。

---

## API設計

### フィルター仕様

`GET /api/sales/rent` の `store_id` と `closing_month` は**必須**パラメータ。未指定の場合は 422 を返す。`employee_id` と `category` はオプション。

### 売上データ

```
GET    /api/sales/rent
       必須クエリ: store_id, closing_month
       任意クエリ: employee_id, category
       レスポンス: SalesRentRow[]

POST   /api/sales/rent
       ボディ: SalesRentCreateSchema
       レスポンス: SalesRentRow（新規行、計算フィールド含む）

PATCH  /api/sales/rent/batch
       ボディ: { rows: SalesRentUpdateSchema[] }
       レスポンス: SalesRentRow[]（更新済み行、計算フィールド含む）

DELETE /api/sales/rent/{id}
       レスポンス: 204 No Content

POST   /api/sales/rent/closing
       ボディ: { store_id: int, closing_month: str }
       レスポンス: { closed_count: int }

GET    /api/sales/rent/export/excel
       必須クエリ: store_id, closing_month（現在のフィルター条件と同一）
       任意クエリ: employee_id, category
       レスポンス: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
       備考: テーブルに表示中のデータと同一スコープをエクスポートする
```

### マスタ

```
GET    /api/master/stores       → Store[]
GET    /api/master/employees    → Employee[]（store_id でフィルタ可）
```

---

## 行追加のデフォルト値

「行を追加」ボタン押下時、新規行は以下のデフォルト値で初期化する：

| フィールド | デフォルト値 |
|---|---|
| `store_id` | 現在のフィルターの store_id |
| `closing_month` | 現在のフィルターの closing_month |
| `applied_at` | 本日の日付 |
| `employee_id` | null（空欄） |
| `customer_name` | "" |
| `property_name` | "" |
| 金額フィールド | 0 |
| boolean フィールド | false |
| `status_flag` | null |

---

## 保存フロー（「保存」ボタン押下時）

1. ローカル状態の変更行を「新規行」と「既存行の編集」に分類
2. 新規行 → `POST /api/sales/rent` を順次実行（または一括対応の場合は後続で拡張）
3. 既存行の編集 → `PATCH /api/sales/rent/batch` で一括送信
4. 両方の結果を受け取ってローカル状態を更新、未保存ハイライトをクリア
5. エラー行は赤枠でハイライトし、Toast でエラー内容を表示

---

## フロントエンドコンポーネント設計

### 汎用部品（scaffold共通 — `components/ui/` 配下）

以下は他画面でも再利用することを前提に、`components/ui/` に配置する：

- `EditableCell` — インライン編集セル基底コンポーネント
  - `EditableNumberCell` — 金額入力（カンマ区切り表示、負数は赤文字）
  - `EditableDateCell` — 日付ピッカー（YYYY/MM/DD）
  - `EditableTextCell` — テキスト入力
  - `EditableCheckboxCell` — チェックボックス
- `RowColorResolver` — `status_flag` → CSS クラス変換ユーティリティ
- `DataTableFooter` — 集計行コンポーネント

### 画面固有部品（`components/sales/` 配下）

```
SalesRentHeader
├── StoreSelect
├── ClosingMonthSelect
├── EmployeeSearch
├── CategorySelect
└── ActionButtons（ExcelExportButton, ClosingProcessButton, SaveButton, AddRowButton）

SalesRentTable
├── TanStack Table インスタンス
├── EditableCell 各種（components/ui/ から）
├── RowColorResolver（components/ui/ から）
└── DataTableFooter（components/ui/ から）

SalesRentSummaryBar  # 件数・合計の表示バー
```

### カスタムフック

```
hooks/useSalesRentData.ts     # TanStack Query でデータ取得・更新（画面固有）
hooks/useTableEditing.ts      # 編集状態管理（汎用、scaffold共通として設計）
hooks/useExcelExport.ts       # Excel出力トリガー（画面固有）
```

### 型定義

```
types/salesRent.ts            # SalesRentRow, SalesRentFilter, SalesRentCreatePayload 等
types/master.ts               # Store, Employee
```

---

## UI・UX仕様

### デザインスタイル
- shadcn/ui + TailwindCSS ベースのモダンデザイン
- 長時間業務利用を考慮した視認性重視

### インライン編集
- セルをシングルクリックで編集モードに入る（スプレッドシートライク）
- 未保存の変更がある行は薄い黄色（`bg-yellow-50`）でハイライト
- `Tab` / `Shift+Tab` で次の編集可能セルへ移動

### 条件付きスタイリング
- `status_flag` の値に応じて行・セルの背景色・文字色を変更（`RowColorResolver`）
- マイナス金額は自動的に `text-red-600`

### テーブルフッター（合計行）
テーブル下部に固定の合計行を表示。以下の列を集計：
- 仲介手数料、広告料、支払手数料、合計売上、手数料計算、広告計算、合計総計

### フィルター
- 店舗・締め月は必須。変更時に TanStack Query でデータ再取得
- 社員名・区分はオプション。変更時も同様に再取得

---

## エラーハンドリング

- API エラー時は shadcn/ui の `Toast` でエラーメッセージ表示
- 保存時にバリデーションエラーがある行はセルに赤枠（`ring-red-500`）
- `store_id` または `closing_month` が未選択の場合、テーブルは空状態を表示（エラーではなく案内メッセージ）
- ネットワーク断は TanStack Query のデフォルトリトライ動作に従う

---

## 将来の拡張性（スキャフォールディングとして）

この実装を基に以下の画面を展開予定：
- 個人別 / 申込日別 / 入金日別 / 白売上台帳 / 明細検索 / 管理取得 / 売買入力

**再利用可能として明示的に設計する部品:**
- `components/ui/EditableCell` 系 — 編集セルはドメインに依存しない汎用実装
- `components/ui/RowColorResolver` — status_flag マッピングのみ差し替え可能
- `components/ui/DataTableFooter` — 集計列の定義を props で受け取る汎用実装
- `hooks/useTableEditing.ts` — 編集状態管理フックはジェネリック型で実装
