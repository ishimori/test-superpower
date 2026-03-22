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
| 開発環境 | Docker Compose |

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
│   │   │   ├── ui/              # shadcn/ui 基本部品
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

### `sales_rent` テーブル

| カラム名 | 型 | 説明 |
|---|---|---|
| `id` | SERIAL PK | 内部ID |
| `row_number` | INTEGER | 行番号（表示用 #） |
| `applied_at` | DATE | 申込日 |
| `employee_id` | INTEGER FK | 社員ID |
| `customer_name` | VARCHAR(100) | 顧客名 |
| `property_name` | VARCHAR(200) | 物件名 |
| `brokerage_fee` | INTEGER | 仲介手数料 |
| `ad_fee` | INTEGER | 広告料 |
| `payment_fee` | INTEGER | 支払手数料 |
| `total_sales` | INTEGER | 合計売上（計算値: brokerage_fee + ad_fee - payment_fee） |
| `received_at` | DATE | 入金日（nullable） |
| `is_white_flow` | BOOLEAN | 白流れ（デフォルト: false） |
| `fee_calculation` | INTEGER | 手数料計算 |
| `delivered_at` | DATE | お届日（nullable） |
| `is_delivery_flow` | BOOLEAN | お届流れ（デフォルト: false） |
| `ad_calculation` | INTEGER | 広告計算 |
| `total_summary` | INTEGER | 合計総計 |
| `status_flag` | VARCHAR(50) | 色分け用ステータスフラグ（nullable） |
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

## API設計

### 売上データ

```
GET    /api/sales/rent
       クエリパラメータ: store_id, closing_month, employee_id, category
       レスポンス: SalesRentRow[]

POST   /api/sales/rent
       ボディ: SalesRentCreateSchema
       レスポンス: SalesRentRow（新規行）

PATCH  /api/sales/rent/batch
       ボディ: { rows: SalesRentUpdateSchema[] }
       レスポンス: SalesRentRow[]（更新済み行）

DELETE /api/sales/rent/{id}
       レスポンス: 204 No Content

POST   /api/sales/rent/closing
       ボディ: { store_id, closing_month }
       レスポンス: { closed_count: number }

GET    /api/sales/rent/export/excel
       クエリパラメータ: store_id, closing_month, employee_id, category
       レスポンス: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

### マスタ

```
GET    /api/master/stores       → Store[]
GET    /api/master/employees    → Employee[]（store_id でフィルタ可）
```

---

## フロントエンドコンポーネント設計

```
app/sales/rent/entry/page.tsx
├── SalesRentHeader
│   ├── StoreSelect              # 店舗ドロップダウン
│   ├── ClosingMonthSelect       # 締め月ドロップダウン
│   ├── EmployeeSearch           # 社員名検索 input
│   ├── CategorySelect           # 区分ドロップダウン
│   └── ActionButtons
│       ├── ExcelExportButton
│       ├── ClosingProcessButton # 締め処理（ロジックは後から）
│       ├── SaveButton           # 一括保存
│       └── AddRowButton         # 行を追加
├── SalesRentTable
│   ├── TanStack Table インスタンス
│   ├── EditableCell（汎用）
│   │   ├── EditableNumberCell   # 金額入力（カンマ区切り表示）
│   │   ├── EditableDateCell     # 日付ピッカー
│   │   ├── EditableTextCell     # テキスト入力
│   │   └── EditableCheckboxCell # チェックボックス
│   ├── RowColorResolver         # status_flag → CSS クラス変換
│   └── TableFooter              # 合計行
└── SalesRentSummaryBar          # 件数・合計の表示バー

hooks/
├── useSalesRentData.ts          # TanStack Query でデータ取得・更新
├── useTableEditing.ts           # 編集状態管理（未保存行の追跡）
└── useExcelExport.ts            # Excel出力トリガー

types/
└── salesRent.ts                 # SalesRentRow, SalesRentFilter 等の型定義
```

---

## UI・UX仕様

### デザインスタイル
- shadcn/ui + TailwindCSS ベースのモダンデザイン
- 長時間業務利用を考慮した視認性重視

### インライン編集
- セルをシングルクリックで編集モードに入る（スプレッドシートライク）
- 未保存の変更がある行は薄い黄色（`bg-yellow-50`）でハイライト
- `Tab` / `Shift+Tab` で次のセルへ移動

### 条件付きスタイリング
- `status_flag` の値に応じて行・セルの背景色・文字色を変更
- マイナス金額は自動的に赤文字（`text-red-600`）

### 合計行
- テーブル下部に固定の合計行を表示
- 仲介手数料、広告料、支払手数料、合計売上、手数料計算、広告計算、合計総計の列を集計

### フィルター
- 店舗・締め月・社員名・区分の変更で即時再取得（TanStack Query）

---

## エラーハンドリング

- API エラー時は shadcn/ui の `Toast` でエラーメッセージ表示
- 保存時にバリデーションエラーがある行はセルに赤枠表示
- ネットワーク断は自動リトライ（TanStack Query デフォルト動作）

---

## 将来の拡張性（スキャフォールディングとして）

この実装を基に以下の画面を展開予定：
- 個人別
- 申込日別
- 入金日別
- 白売上台帳
- 明細検索
- 管理取得
- 売買入力

共通部品（`EditableCell`、`useSalesRentData` パターン、`SalesRentHeader` 構造）を再利用可能な形で設計すること。
