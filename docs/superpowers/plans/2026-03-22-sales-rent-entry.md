# 売上入力画面 実装計画

> **エージェントワーカー向け：** 必須サブスキル: superpowers:subagent-driven-development（推奨）または superpowers:executing-plans を使用して、この計画をタスクごとに実装してください。ステップは進捗追跡のためにチェックボックス（`- [ ]`）構文を使用します。

**目標:** Housing E-Kintai の賃貸売上入力画面を Next.js + FastAPI + PostgreSQL でフルスタック実装し、後続画面のスキャフォールディングとする。

**アーキテクチャ:** Docker Compose で PostgreSQL を起動し、FastAPI バックエンドが REST API を提供、Next.js フロントエンドが TanStack Table + shadcn/ui でインライン編集可能なテーブルを実装する。計算フィールドはバックエンドで処理し、状態カラムに応じた条件付きスタイリングをサポートする。

**技術スタック:** Next.js 14 (App Router), TypeScript, shadcn/ui, TailwindCSS, TanStack Table v8, TanStack Query v5, Python 3.11, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, PostgreSQL 16, Docker Compose, openpyxl, pytest, Vitest

**仕様:** `docs/superpowers/specs/2026-03-22-sales-rent-entry-design.md`

---

## ファイルマップ

```
project-root/
├── docker-compose.yml
├── .env.example
│
├── backend/
│   ├── requirements.txt
│   ├── requirements-dev.txt
│   ├── pytest.ini
│   ├── app/
│   │   ├── main.py                          # FastAPI エントリーポイント
│   │   ├── database.py                      # SQLAlchemy セッション
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── store.py                     # Store モデル
│   │   │   ├── employee.py                  # Employee モデル
│   │   │   └── sales_rent.py                # SalesRent モデル
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── store.py                     # Store Pydantic スキーマ
│   │   │   ├── employee.py                  # Employee Pydantic スキーマ
│   │   │   └── sales_rent.py                # SalesRent Pydantic スキーマ
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── sales_rent_calculator.py     # 計算フィールドロジック
│   │   │   └── excel_exporter.py            # Excel 生成
│   │   └── api/
│   │       ├── __init__.py
│   │       ├── deps.py                      # 依存性注入（DB セッション）
│   │       ├── master.py                    # /api/master/* ルーター
│   │       └── sales_rent.py                # /api/sales/rent/* ルーター
│   ├── alembic/
│   │   ├── alembic.ini
│   │   ├── env.py
│   │   └── versions/
│   │       └── 001_initial_schema.py
│   └── tests/
│       ├── conftest.py                      # pytest fixtures（テスト用 DB）
│       ├── test_calculator.py               # 計算ロジックのユニットテスト
│       ├── test_api_master.py               # マスタ API の統合テスト
│       └── test_api_sales_rent.py           # 売上 API の統合テスト
│
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── tailwind.config.ts
    ├── vitest.config.ts
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx                   # ルートレイアウト（サイドバー含む）
    │   │   ├── globals.css
    │   │   └── sales/rent/entry/
    │   │       └── page.tsx                 # 売上入力ページ
    │   ├── components/
    │   │   ├── ui/                          # shadcn/ui + scaffold 共通部品
    │   │   │   ├── button.tsx               # shadcn/ui（自動生成）
    │   │   │   ├── input.tsx                # shadcn/ui（自動生成）
    │   │   │   ├── select.tsx               # shadcn/ui（自動生成）
    │   │   │   ├── toast.tsx                # shadcn/ui（自動生成）
    │   │   │   ├── checkbox.tsx             # shadcn/ui（自動生成）
    │   │   │   ├── editable-number-cell.tsx # scaffold 共通：金額入力セル
    │   │   │   ├── editable-date-cell.tsx   # scaffold 共通：日付入力セル
    │   │   │   ├── editable-text-cell.tsx   # scaffold 共通：テキスト入力セル
    │   │   │   ├── editable-checkbox-cell.tsx # scaffold 共通：チェックボックスセル
    │   │   │   ├── row-color-resolver.ts    # scaffold 共通：status_flag → CSS クラス
    │   │   │   └── data-table-footer.tsx    # scaffold 共通：集計行
    │   │   ├── layout/
    │   │   │   ├── sidebar.tsx              # 左サイドバー
    │   │   │   └── breadcrumb.tsx           # パンくずリスト
    │   │   └── sales/
    │   │       ├── sales-rent-header.tsx    # フィルター + アクションボタン
    │   │       ├── sales-rent-table.tsx     # TanStack Table 本体
    │   │       └── sales-rent-summary-bar.tsx # 件数・合計バー
    │   ├── hooks/
    │   │   ├── use-sales-rent-data.ts       # TanStack Query データ取得・更新
    │   │   ├── use-table-editing.ts         # 編集状態管理（汎用ジェネリック）
    │   │   └── use-excel-export.ts          # Excel 出力トリガー
    │   ├── lib/
    │   │   ├── api-client.ts                # fetch ラッパー（ベース URL, エラー処理）
    │   │   └── utils.ts                     # cn() 等ユーティリティ
    │   └── types/
    │       ├── sales-rent.ts                # SalesRentRow, SalesRentFilter 等
    │       └── master.ts                    # Store, Employee
    └── src/__tests__/
        ├── row-color-resolver.test.ts
        ├── use-table-editing.test.ts
        └── sales-rent-header.test.tsx
```

---

## タスク 1: 開発環境セットアップ

**ファイル:**
- 作成: `docker-compose.yml`
- 作成: `.env.example`

- [ ] **ステップ 1: docker-compose.yml を作成する**

```yaml
# docker-compose.yml
version: "3.9"
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: kintai
      POSTGRES_PASSWORD: kintai
      POSTGRES_DB: kintai_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  db_test:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: kintai
      POSTGRES_PASSWORD: kintai
      POSTGRES_DB: kintai_test
    ports:
      - "5433:5432"

volumes:
  postgres_data:
```

- [ ] **ステップ 2: .env.example を作成する**

```bash
# .env.example
DATABASE_URL=postgresql://kintai:kintai@localhost:5432/kintai_dev
TEST_DATABASE_URL=postgresql://kintai:kintai@localhost:5433/kintai_test
NEXT_PUBLIC_API_URL=http://localhost:8000
```

- [ ] **ステップ 3: Docker を起動して確認する**

```bash
docker compose up -d
docker compose ps
```

期待結果: `db` と `db_test` が `running` 状態

- [ ] **ステップ 4: コミット**

```bash
git add docker-compose.yml .env.example
git commit -m "chore: add docker compose for postgres dev/test databases"
```

---

## タスク 2: バックエンドプロジェクト初期化

**ファイル:**
- 作成: `backend/requirements.txt`
- 作成: `backend/requirements-dev.txt`
- 作成: `backend/pytest.ini`
- 作成: `backend/app/__init__.py`
- 作成: `backend/app/database.py`
- 作成: `backend/app/main.py`

- [ ] **ステップ 1: backend ディレクトリと requirements を作成する**

```bash
mkdir -p backend/app/models backend/app/schemas backend/app/services backend/app/api backend/tests
```

`backend/requirements.txt`:
```
fastapi==0.111.0
uvicorn[standard]==0.30.1
sqlalchemy==2.0.31
alembic==1.13.2
pydantic==2.8.2
pydantic-settings==2.3.4
psycopg2-binary==2.9.9
openpyxl==3.1.5
python-multipart==0.0.9
```

`backend/requirements-dev.txt`:
```
pytest==8.2.2
pytest-asyncio==0.23.7
pytest-env==1.1.3
httpx==0.27.0
pytest-cov==5.0.0
```

- [ ] **ステップ 2: database.py を作成する**

`backend/app/database.py`:
```python
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import StaticPool
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://kintai:kintai@localhost:5432/kintai_dev")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **ステップ 3: main.py を作成する**

`backend/app/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Housing E-Kintai API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}
```

- [ ] **ステップ 4: pytest.ini を作成する**

`backend/pytest.ini`:
```ini
[pytest]
asyncio_mode = auto
env =
    DATABASE_URL=postgresql://kintai:kintai@localhost:5433/kintai_test
```

- [ ] **ステップ 5: ヘルスチェックが動くことを確認する**

```bash
cd backend
pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000
```

別ターミナルで:
```bash
curl http://localhost:8000/health
```
期待結果: `{"status":"ok"}`

- [ ] **ステップ 6: コミット**

```bash
git add backend/
git commit -m "chore: initialize fastapi backend with health endpoint"
```

---

## タスク 3: データベースモデルとマイグレーション

**ファイル:**
- 作成: `backend/app/models/__init__.py`
- 作成: `backend/app/models/store.py`
- 作成: `backend/app/models/employee.py`
- 作成: `backend/app/models/sales_rent.py`
- 作成: `backend/alembic/` (alembic init)
- 作成: `backend/alembic/versions/001_initial_schema.py`

- [ ] **ステップ 1: Store モデルを書く**

`backend/app/models/store.py`:
```python
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Store(Base):
    __tablename__ = "stores"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    employees: Mapped[list["Employee"]] = relationship(back_populates="store")
    sales: Mapped[list["SalesRent"]] = relationship(back_populates="store")
```

- [ ] **ステップ 2: Employee モデルを書く**

`backend/app/models/employee.py`:
```python
from sqlalchemy import Integer, String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class Employee(Base):
    __tablename__ = "employees"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)
    store: Mapped["Store"] = relationship(back_populates="employees")
    sales: Mapped[list["SalesRent"]] = relationship(back_populates="employee")
```

- [ ] **ステップ 3: SalesRent モデルを書く**

`backend/app/models/sales_rent.py`:
```python
from sqlalchemy import Integer, String, Boolean, Date, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
import datetime

class SalesRent(Base):
    __tablename__ = "sales_rent"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    applied_at: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)
    employee_id: Mapped[int | None] = mapped_column(ForeignKey("employees.id"), nullable=True)
    customer_name: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    property_name: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    brokerage_fee: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ad_fee: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    payment_fee: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_sales: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    received_at: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)
    is_white_flow: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    fee_calculation: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    delivered_at: Mapped[datetime.date | None] = mapped_column(Date, nullable=True)
    is_delivery_flow: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    ad_calculation: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_summary: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status_flag: Mapped[str | None] = mapped_column(String(50), nullable=True)
    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)
    closing_month: Mapped[str] = mapped_column(String(7), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    is_closed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime.datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())
    store: Mapped["Store"] = relationship(back_populates="sales")
    employee: Mapped["Employee | None"] = relationship(back_populates="sales")
```

- [ ] **ステップ 4: models/__init__.py を作成する**

`backend/app/models/__init__.py`:
```python
from .store import Store
from .employee import Employee
from .sales_rent import SalesRent

__all__ = ["Store", "Employee", "SalesRent"]
```

- [ ] **ステップ 5: Alembic を初期化してマイグレーションを作成する**

```bash
cd backend
alembic init alembic
```

`backend/alembic/env.py` の `target_metadata` を以下に変更:
```python
from app.database import Base
from app.models import Store, Employee, SalesRent  # noqa: F401
target_metadata = Base.metadata
```

```bash
alembic revision --autogenerate -m "initial_schema"
alembic upgrade head
```

期待結果: `stores`, `employees`, `sales_rent` テーブルが作成される

- [ ] **ステップ 6: コミット**

```bash
git add backend/
git commit -m "feat: add SQLAlchemy models and initial alembic migration"
```

---

## タスク 4: 計算ロジックサービス（TDD）

**ファイル:**
- 作成: `backend/app/services/sales_rent_calculator.py`
- 作成: `backend/tests/test_calculator.py`

- [ ] **ステップ 1: 失敗するテストを書く**

`backend/tests/test_calculator.py`:
```python
import pytest
from app.services.sales_rent_calculator import calculate_fields

def test_total_sales_basic():
    result = calculate_fields(brokerage_fee=100000, ad_fee=50000, payment_fee=20000)
    assert result["total_sales"] == 130000

def test_total_sales_negative():
    """支払手数料が大きい場合はマイナスになる"""
    result = calculate_fields(brokerage_fee=0, ad_fee=0, payment_fee=50000)
    assert result["total_sales"] == -50000

def test_fee_calculation_defaults_to_zero_when_tbd():
    """fee_calculation は TBD のため 0 を返す"""
    result = calculate_fields(brokerage_fee=100000, ad_fee=0, payment_fee=0)
    assert result["fee_calculation"] == 0

def test_ad_calculation_defaults_to_zero_when_tbd():
    result = calculate_fields(brokerage_fee=0, ad_fee=200000, payment_fee=0)
    assert result["ad_calculation"] == 0

def test_total_summary_equals_total_sales_when_tbd():
    """total_summary は TBD のため total_sales と同じ値を返す"""
    result = calculate_fields(brokerage_fee=100000, ad_fee=50000, payment_fee=20000)
    assert result["total_summary"] == result["total_sales"]
```

- [ ] **ステップ 2: テストを実行して失敗を確認する**

```bash
cd backend
pytest tests/test_calculator.py -v
```
期待結果: `ImportError` または `ModuleNotFoundError`

- [ ] **ステップ 3: calculator サービスを実装する**

`backend/app/services/sales_rent_calculator.py`:
```python
def calculate_fields(
    brokerage_fee: int,
    ad_fee: int,
    payment_fee: int,
) -> dict:
    """
    計算フィールドを計算して返す。
    fee_calculation, ad_calculation, total_summary の式は
    業務ルール確認後に更新すること（現在は TBD）。
    """
    total_sales = brokerage_fee + ad_fee - payment_fee
    # TBD: 業務ルール確認後に実装
    fee_calculation = 0
    ad_calculation = 0
    total_summary = total_sales  # TBD

    return {
        "total_sales": total_sales,
        "fee_calculation": fee_calculation,
        "ad_calculation": ad_calculation,
        "total_summary": total_summary,
    }
```

- [ ] **ステップ 4: テストを実行して通過を確認する**

```bash
pytest tests/test_calculator.py -v
```
期待結果: 5 tests PASSED

- [ ] **ステップ 5: コミット**

```bash
git add backend/app/services/sales_rent_calculator.py backend/tests/test_calculator.py
git commit -m "feat: add sales rent calculator service with TDD"
```

---

## タスク 5: Pydantic スキーマ

**ファイル:**
- 作成: `backend/app/schemas/store.py`
- 作成: `backend/app/schemas/employee.py`
- 作成: `backend/app/schemas/sales_rent.py`
- 作成: `backend/app/schemas/__init__.py`

- [ ] **ステップ 1: Store と Employee スキーマを作成する**

`backend/app/schemas/store.py`:
```python
from pydantic import BaseModel

class StoreResponse(BaseModel):
    id: int
    name: str
    model_config = {"from_attributes": True}
```

`backend/app/schemas/employee.py`:
```python
from pydantic import BaseModel

class EmployeeResponse(BaseModel):
    id: int
    name: str
    store_id: int
    model_config = {"from_attributes": True}
```

- [ ] **ステップ 2: SalesRent スキーマを作成する**

`backend/app/schemas/sales_rent.py`:
```python
from pydantic import BaseModel
import datetime

class SalesRentRow(BaseModel):
    id: int
    display_order: int
    applied_at: datetime.date | None
    employee_id: int | None
    customer_name: str
    property_name: str
    brokerage_fee: int
    ad_fee: int
    payment_fee: int
    total_sales: int
    received_at: datetime.date | None
    is_white_flow: bool
    fee_calculation: int
    delivered_at: datetime.date | None
    is_delivery_flow: bool
    ad_calculation: int
    total_summary: int
    status_flag: str | None
    store_id: int
    closing_month: str
    category: str
    is_closed: bool
    model_config = {"from_attributes": True}

class SalesRentCreate(BaseModel):
    store_id: int
    closing_month: str
    applied_at: datetime.date | None = None
    employee_id: int | None = None
    customer_name: str = ""
    property_name: str = ""
    brokerage_fee: int = 0
    ad_fee: int = 0
    payment_fee: int = 0
    received_at: datetime.date | None = None
    is_white_flow: bool = False
    delivered_at: datetime.date | None = None
    is_delivery_flow: bool = False
    status_flag: str | None = None
    category: str = ""

class SalesRentUpdate(BaseModel):
    id: int
    applied_at: datetime.date | None = None
    employee_id: int | None = None
    customer_name: str | None = None
    property_name: str | None = None
    brokerage_fee: int | None = None
    ad_fee: int | None = None
    payment_fee: int | None = None
    received_at: datetime.date | None = None
    is_white_flow: bool | None = None
    delivered_at: datetime.date | None = None
    is_delivery_flow: bool | None = None
    status_flag: str | None = None
    category: str | None = None

class SalesRentBatchUpdate(BaseModel):
    rows: list[SalesRentUpdate]

class ClosingRequest(BaseModel):
    store_id: int
    closing_month: str
```

- [ ] **ステップ 3: schemas/__init__.py を作成する**

`backend/app/schemas/__init__.py`:
```python
from .store import StoreResponse
from .employee import EmployeeResponse
from .sales_rent import SalesRentRow, SalesRentCreate, SalesRentUpdate, SalesRentBatchUpdate, ClosingRequest

__all__ = [
    "StoreResponse", "EmployeeResponse",
    "SalesRentRow", "SalesRentCreate", "SalesRentUpdate", "SalesRentBatchUpdate", "ClosingRequest"
]
```

- [ ] **ステップ 4: コミット**

```bash
git add backend/app/schemas/
git commit -m "feat: add pydantic schemas for all entities"
```

---

## タスク 6: マスタ API エンドポイント（TDD）

**ファイル:**
- 作成: `backend/app/api/deps.py`
- 作成: `backend/app/api/master.py`
- 変更: `backend/app/main.py`
- 作成: `backend/tests/conftest.py`
- 作成: `backend/tests/test_api_master.py`

- [ ] **ステップ 1: conftest.py を作成する（テスト用 DB）**

`backend/tests/conftest.py`:
```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL", "postgresql://kintai:kintai@localhost:5433/kintai_test")

from app.database import Base, get_db
from app.main import app
from app.models import Store, Employee, SalesRent  # noqa: F401

test_engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture
def db():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

@pytest.fixture
def sample_store(db):
    store = Store(name="本店")
    db.add(store)
    db.commit()
    db.refresh(store)
    return store

@pytest.fixture
def sample_employee(db, sample_store):
    emp = Employee(name="田中 一郎", store_id=sample_store.id)
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp
```

- [ ] **ステップ 2: マスタ API テストを書く**

`backend/tests/test_api_master.py`:
```python
def test_get_stores_empty(client):
    res = client.get("/api/master/stores")
    assert res.status_code == 200
    assert res.json() == []

def test_get_stores_with_data(client, sample_store):
    res = client.get("/api/master/stores")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["name"] == "本店"

def test_get_employees_filtered_by_store(client, sample_store, sample_employee):
    res = client.get(f"/api/master/employees?store_id={sample_store.id}")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 1
    assert data[0]["name"] == "田中 一郎"

def test_get_employees_wrong_store(client, sample_employee):
    res = client.get("/api/master/employees?store_id=9999")
    assert res.status_code == 200
    assert res.json() == []
```

- [ ] **ステップ 3: テストを実行して失敗を確認する**

```bash
cd backend
pytest tests/test_api_master.py -v
```
期待結果: `404` または `ImportError`

- [ ] **ステップ 4: deps.py と master.py を実装する**

`backend/app/api/deps.py`:
```python
from typing import Generator
from sqlalchemy.orm import Session
from app.database import get_db

__all__ = ["get_db"]
```

`backend/app/api/master.py`:
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Store, Employee
from app.schemas import StoreResponse, EmployeeResponse

router = APIRouter(prefix="/api/master", tags=["master"])

@router.get("/stores", response_model=list[StoreResponse])
def get_stores(db: Session = Depends(get_db)):
    return db.query(Store).order_by(Store.id).all()

@router.get("/employees", response_model=list[EmployeeResponse])
def get_employees(store_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Employee)
    if store_id is not None:
        q = q.filter(Employee.store_id == store_id)
    return q.order_by(Employee.name).all()
```

`backend/app/main.py` にルーターを追加:
```python
from app.api import master
app.include_router(master.router)
```

- [ ] **ステップ 5: テストを実行して通過を確認する**

```bash
pytest tests/test_api_master.py -v
```
期待結果: 4 tests PASSED

- [ ] **ステップ 6: コミット**

```bash
git add backend/
git commit -m "feat: add master API endpoints for stores and employees"
```

---

## タスク 7: 売上 API エンドポイント（TDD）

**ファイル:**
- 作成: `backend/app/api/sales_rent.py`
- 変更: `backend/app/main.py`
- 作成: `backend/tests/test_api_sales_rent.py`

- [ ] **ステップ 1: 売上 API テストを書く**

`backend/tests/test_api_sales_rent.py`:
```python
import datetime

def test_get_sales_rent_requires_store_id(client):
    res = client.get("/api/sales/rent?closing_month=2026-02")
    assert res.status_code == 422

def test_get_sales_rent_requires_closing_month(client, sample_store):
    res = client.get(f"/api/sales/rent?store_id={sample_store.id}")
    assert res.status_code == 422

def test_get_sales_rent_empty(client, sample_store):
    res = client.get(f"/api/sales/rent?store_id={sample_store.id}&closing_month=2026-02")
    assert res.status_code == 200
    assert res.json() == []

def test_create_sales_rent(client, sample_store):
    payload = {
        "store_id": sample_store.id,
        "closing_month": "2026-02",
        "customer_name": "小林 由美",
        "property_name": "リバーサイド小鶴新田 508",
        "brokerage_fee": 80000,
        "ad_fee": 200000,
        "payment_fee": 0,
    }
    res = client.post("/api/sales/rent", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["customer_name"] == "小林 由美"
    assert data["total_sales"] == 280000  # 計算フィールド確認

def test_batch_update_sales_rent(client, sample_store, db):
    from app.models import SalesRent
    row = SalesRent(store_id=sample_store.id, closing_month="2026-02", brokerage_fee=100000, ad_fee=0, payment_fee=0, total_sales=100000)
    db.add(row)
    db.commit()
    db.refresh(row)
    payload = {"rows": [{"id": row.id, "customer_name": "更新後顧客", "brokerage_fee": 150000}]}
    res = client.patch("/api/sales/rent/batch", json=payload)
    assert res.status_code == 200
    updated = res.json()[0]
    assert updated["customer_name"] == "更新後顧客"
    assert updated["total_sales"] == 150000

def test_closing_process(client, sample_store, db):
    from app.models import SalesRent
    row = SalesRent(store_id=sample_store.id, closing_month="2026-02", total_sales=0)
    db.add(row)
    db.commit()
    payload = {"store_id": sample_store.id, "closing_month": "2026-02"}
    res = client.post("/api/sales/rent/closing", json=payload)
    assert res.status_code == 200
    assert res.json()["closed_count"] == 1

def test_excel_export(client, sample_store):
    res = client.get(f"/api/sales/rent/export/excel?store_id={sample_store.id}&closing_month=2026-02")
    assert res.status_code == 200
    assert "spreadsheetml" in res.headers["content-type"]
```

- [ ] **ステップ 2: テストを実行して失敗を確認する**

```bash
pytest tests/test_api_sales_rent.py -v
```
期待結果: `404 Not Found` または ImportError

- [ ] **ステップ 3: sales_rent.py エンドポイントを実装する**

> **重要:** `/export/excel` と `/closing` は `/{row_id}` より**前**に定義すること。FastAPI はルートを上から評価するため、`/{row_id}` が先にあると `/export/excel` が `row_id="export"` として誤解釈される。

`backend/app/api/sales_rent.py`:
```python
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SalesRent
from app.schemas import SalesRentRow, SalesRentCreate, SalesRentBatchUpdate, ClosingRequest
from app.services.sales_rent_calculator import calculate_fields
from app.services.excel_exporter import export_to_excel
import io

router = APIRouter(prefix="/api/sales/rent", tags=["sales_rent"])

def _apply_calculations(row: SalesRent) -> SalesRent:
    calc = calculate_fields(row.brokerage_fee, row.ad_fee, row.payment_fee)
    for k, v in calc.items():
        setattr(row, k, v)
    return row

# ★ リテラルパスを /{row_id} より前に定義すること（FastAPI のルート評価順序の制約）

@router.get("", response_model=list[SalesRentRow])
def get_sales_rent(store_id: int, closing_month: str, employee_id: int | None = None, category: str | None = None, db: Session = Depends(get_db)):
    q = db.query(SalesRent).filter(SalesRent.store_id == store_id, SalesRent.closing_month == closing_month)
    if employee_id is not None:
        q = q.filter(SalesRent.employee_id == employee_id)
    if category:
        q = q.filter(SalesRent.category == category)
    return q.order_by(SalesRent.display_order, SalesRent.id).all()

@router.post("", response_model=SalesRentRow, status_code=201)
def create_sales_rent(payload: SalesRentCreate, db: Session = Depends(get_db)):
    max_order = db.query(SalesRent).filter(SalesRent.store_id == payload.store_id, SalesRent.closing_month == payload.closing_month).count()
    row = SalesRent(**payload.model_dump(), display_order=max_order + 1)
    _apply_calculations(row)
    db.add(row)
    db.commit()
    db.refresh(row)
    return row

@router.patch("/batch", response_model=list[SalesRentRow])
def batch_update(payload: SalesRentBatchUpdate, db: Session = Depends(get_db)):
    results = []
    for update in payload.rows:
        row = db.get(SalesRent, update.id)
        if row is None:
            raise HTTPException(status_code=404, detail=f"Row {update.id} not found")
        for field, value in update.model_dump(exclude_unset=True, exclude={"id"}).items():
            setattr(row, field, value)
        _apply_calculations(row)
        results.append(row)
    db.commit()
    for r in results:
        db.refresh(r)
    return results

@router.post("/closing")
def closing_process(payload: ClosingRequest, db: Session = Depends(get_db)):
    rows = db.query(SalesRent).filter(SalesRent.store_id == payload.store_id, SalesRent.closing_month == payload.closing_month).all()
    for row in rows:
        row.is_closed = True
    db.commit()
    return {"closed_count": len(rows)}

@router.get("/export/excel")
def export_excel(store_id: int, closing_month: str, employee_id: int | None = None, category: str | None = None, db: Session = Depends(get_db)):
    q = db.query(SalesRent).filter(SalesRent.store_id == store_id, SalesRent.closing_month == closing_month)
    if employee_id:
        q = q.filter(SalesRent.employee_id == employee_id)
    if category:
        q = q.filter(SalesRent.category == category)
    rows = q.order_by(SalesRent.display_order, SalesRent.id).all()
    buf = export_to_excel(rows)
    return StreamingResponse(
        io.BytesIO(buf),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=sales_rent_{closing_month}.xlsx"}
    )

# ★ /{row_id} は必ずリテラルパスの後に配置すること
@router.delete("/{row_id}", status_code=204)
def delete_sales_rent(row_id: int, db: Session = Depends(get_db)):
    row = db.get(SalesRent, row_id)
    if row is None:
        raise HTTPException(status_code=404)
    db.delete(row)
    db.commit()
```

- [ ] **ステップ 4: Excel エクスポートサービスを実装する**

`backend/app/services/excel_exporter.py`:
```python
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment
import io

HEADERS = ["#", "申込日", "社員名", "顧客名", "物件名", "仲介手数料", "広告料", "支払手数料",
           "合計売上", "入金日", "白流れ", "手数料計算", "お届日", "お届流れ", "広告計算", "合計総計"]

def export_to_excel(rows) -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = "売上入力"
    ws.append(HEADERS)
    for cell in ws[1]:
        cell.font = Font(bold=True)
        cell.alignment = Alignment(horizontal="center")
    for i, row in enumerate(rows, 1):
        ws.append([
            i, row.applied_at, row.employee_id, row.customer_name, row.property_name,
            row.brokerage_fee, row.ad_fee, row.payment_fee, row.total_sales,
            row.received_at, row.is_white_flow, row.fee_calculation,
            row.delivered_at, row.is_delivery_flow, row.ad_calculation, row.total_summary
        ])
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()
```

- [ ] **ステップ 5: main.py にルーターを追加する**

`backend/app/main.py` に追加:
```python
from app.api import sales_rent
app.include_router(sales_rent.router)
```

- [ ] **ステップ 6: テストを実行して通過を確認する**

```bash
pytest tests/test_api_sales_rent.py -v
```
期待結果: 6 tests PASSED

- [ ] **ステップ 7: 全テストを実行する**

```bash
pytest --cov=app -v
```
期待結果: 全テスト PASSED、カバレッジレポート表示

- [ ] **ステップ 8: コミット**

```bash
git add backend/
git commit -m "feat: add sales rent CRUD, batch update, closing, and excel export APIs"
```

---

## タスク 8: フロントエンドプロジェクト初期化

**ファイル:**
- 作成: `frontend/` 以下全体

- [ ] **ステップ 1: Next.js プロジェクトを作成する**

```bash
cd project-root
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --no-git \
  --import-alias "@/*"
```

- [ ] **ステップ 2: 必要な依存関係を追加する**

```bash
cd frontend
npm install \
  @tanstack/react-table \
  @tanstack/react-query \
  @radix-ui/react-select \
  @radix-ui/react-checkbox \
  @radix-ui/react-toast \
  clsx \
  tailwind-merge \
  lucide-react \
  date-fns

npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event jsdom @testing-library/jest-dom
```

- [ ] **ステップ 3: shadcn/ui を初期化する**

```bash
npx shadcn@latest init
# プロンプト: Default style → Default, Base color → Slate, CSS variables → Yes

# 必要なコンポーネントを追加
npx shadcn@latest add button input select checkbox toast badge
```

- [ ] **ステップ 4: Vitest 設定を作成する**

`frontend/vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
  },
  resolve: {
    alias: { "@": resolve(__dirname, "./src") },
  },
});
```

`frontend/src/__tests__/setup.ts` を**必ず作成**すること（Vitestが参照するため）:
```typescript
import "@testing-library/jest-dom";
```

```bash
mkdir -p frontend/src/__tests__
```

- [ ] **ステップ 5: 型定義ファイルを作成する**

`frontend/src/types/master.ts`:
```typescript
export interface Store {
  id: number;
  name: string;
}

export interface Employee {
  id: number;
  name: string;
  store_id: number;
}
```

`frontend/src/types/sales-rent.ts`:
```typescript
export interface SalesRentRow {
  id: number;
  display_order: number;
  applied_at: string | null;       // ISO date string
  employee_id: number | null;
  customer_name: string;
  property_name: string;
  brokerage_fee: number;
  ad_fee: number;
  payment_fee: number;
  total_sales: number;
  received_at: string | null;
  is_white_flow: boolean;
  fee_calculation: number;
  delivered_at: string | null;
  is_delivery_flow: boolean;
  ad_calculation: number;
  total_summary: number;
  status_flag: string | null;
  store_id: number;
  closing_month: string;
  category: string;
  is_closed: boolean;
}

export interface SalesRentFilter {
  store_id: number;
  closing_month: string;
  employee_id?: number;
  category?: string;
}

export interface SalesRentCreatePayload {
  store_id: number;
  closing_month: string;
  applied_at?: string | null;
  employee_id?: number | null;
  customer_name?: string;
  property_name?: string;
  brokerage_fee?: number;
  ad_fee?: number;
  payment_fee?: number;
}

export interface SalesRentUpdatePayload {
  id: number;
  [key: string]: unknown;
}
```

- [ ] **ステップ 6: API クライアントを作成する**

`frontend/src/lib/api-client.ts`:
```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API error ${res.status}: ${error}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (path: string) => request<void>(path, { method: "DELETE" }),
};
```

- [ ] **ステップ 7: utils.ts を作成する**

`frontend/src/lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("ja-JP").format(value);
}

export function formatDate(value: string | null): string {
  if (!value) return "";
  return value; // YYYY-MM-DD そのまま表示（必要に応じて変換）
}
```

- [ ] **ステップ 8: フロントが起動することを確認する**

```bash
cd frontend
npm run dev
```
期待結果: `http://localhost:3000` でデフォルトページが表示される

- [ ] **ステップ 9: コミット**

```bash
git add frontend/
git commit -m "chore: initialize next.js frontend with shadcn/ui, tanstack, and vitest"
```

---

## タスク 9: 汎用 UI コンポーネント（scaffold 共通）

**ファイル:**
- 作成: `frontend/src/components/ui/row-color-resolver.ts`
- 作成: `frontend/src/components/ui/editable-number-cell.tsx`
- 作成: `frontend/src/components/ui/editable-date-cell.tsx`
- 作成: `frontend/src/components/ui/editable-text-cell.tsx`
- 作成: `frontend/src/components/ui/editable-checkbox-cell.tsx`
- 作成: `frontend/src/components/ui/data-table-footer.tsx`
- 作成: `frontend/src/__tests__/row-color-resolver.test.ts`

- [ ] **ステップ 1: RowColorResolver のテストを書く**

`frontend/src/__tests__/row-color-resolver.test.ts`:
```typescript
import { resolveRowClass, resolveNumberClass } from "@/components/ui/row-color-resolver";

test("null status_flag returns empty string", () => {
  expect(resolveRowClass(null)).toBe("");
});

test("unknown status_flag returns empty string", () => {
  expect(resolveRowClass("unknown_value")).toBe("");
});

test("negative number returns red class", () => {
  expect(resolveNumberClass(-1000)).toContain("text-red-600");
});

test("positive number returns empty string", () => {
  expect(resolveNumberClass(1000)).toBe("");
});
```

- [ ] **ステップ 2: テストを実行して失敗を確認する**

```bash
cd frontend
npx vitest run src/__tests__/row-color-resolver.test.ts
```

- [ ] **ステップ 3: RowColorResolver を実装する**

`frontend/src/components/ui/row-color-resolver.ts`:
```typescript
// status_flag の値とスタイルのマッピング
// 業務ルール確認後に追記すること
const STATUS_STYLE_MAP: Record<string, string> = {
  // 例: "cancelled": "bg-red-50",
  // 例: "settled": "bg-blue-50",
};

export function resolveRowClass(statusFlag: string | null): string {
  if (!statusFlag) return "";
  return STATUS_STYLE_MAP[statusFlag] ?? "";
}

export function resolveNumberClass(value: number): string {
  return value < 0 ? "text-red-600" : "";
}
```

- [ ] **ステップ 4: テストを実行して通過を確認する**

```bash
npx vitest run src/__tests__/row-color-resolver.test.ts
```
期待結果: 4 tests PASSED

- [ ] **ステップ 5: 編集セルコンポーネントを実装する**

`frontend/src/components/ui/editable-number-cell.tsx`:
```typescript
"use client";
import { useState, useRef, useEffect } from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { resolveNumberClass as resolveNum } from "./row-color-resolver";

interface Props {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function EditableNumberCell({ value, onChange, disabled }: Props) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(value));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) ref.current?.select();
  }, [editing]);

  if (disabled) {
    return <span className={cn("block text-right tabular-nums", resolveNum(value))}>{formatCurrency(value)}</span>;
  }

  if (editing) {
    return (
      <input
        ref={ref}
        type="number"
        value={input}
        className="w-full text-right border rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        onChange={(e) => setInput(e.target.value)}
        onBlur={() => { onChange(parseInt(input, 10) || 0); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Tab") { onChange(parseInt(input, 10) || 0); setEditing(false); } }}
      />
    );
  }

  return (
    <span
      className={cn("block text-right tabular-nums cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5", resolveNum(value))}
      onClick={() => { setInput(String(value)); setEditing(true); }}
    >
      {formatCurrency(value)}
    </span>
  );
}
```

`frontend/src/components/ui/editable-text-cell.tsx`:
```typescript
"use client";
import { useState, useRef, useEffect } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function EditableTextCell({ value, onChange, disabled, className }: Props) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  if (disabled) return <span className={className}>{value}</span>;

  if (editing) {
    return (
      <input
        ref={ref}
        value={input}
        className="w-full border rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        onChange={(e) => setInput(e.target.value)}
        onBlur={() => { onChange(input); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === "Enter") { onChange(input); setEditing(false); } }}
      />
    );
  }

  return (
    <span
      className={`block cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5 min-h-[1.5rem] ${className ?? ""}`}
      onClick={() => { setInput(value); setEditing(true); }}
    >
      {value || <span className="text-slate-400 text-xs">クリックして編集</span>}
    </span>
  );
}
```

`frontend/src/components/ui/editable-date-cell.tsx`:
```typescript
"use client";
import { useState } from "react";

interface Props {
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export function EditableDateCell({ value, onChange, disabled }: Props) {
  const [editing, setEditing] = useState(false);

  if (disabled) return <span>{value ?? ""}</span>;

  if (editing) {
    return (
      <input
        type="date"
        defaultValue={value ?? ""}
        className="border rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        onChange={(e) => onChange(e.target.value || null)}
        onBlur={() => setEditing(false)}
        autoFocus
      />
    );
  }

  return (
    <span
      className="block cursor-pointer hover:bg-slate-100 rounded px-1 py-0.5 min-h-[1.5rem] text-sm"
      onClick={() => setEditing(true)}
    >
      {value ?? <span className="text-slate-400 text-xs">YYYY/MM/DD</span>}
    </span>
  );
}
```

`frontend/src/components/ui/editable-checkbox-cell.tsx`:
```typescript
"use client";

interface Props {
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  danger?: boolean; // 赤枠スタイル
}

export function EditableCheckboxCell({ value, onChange, disabled, danger }: Props) {
  return (
    <input
      type="checkbox"
      checked={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className={`h-4 w-4 cursor-pointer ${danger ? "accent-red-600" : "accent-slate-700"}`}
    />
  );
}
```

`frontend/src/components/ui/data-table-footer.tsx`:
```typescript
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";

interface FooterColumn {
  key: string;
  label?: string;
  align?: "left" | "right";
  isSum?: boolean;
}

interface Props {
  rows: Record<string, unknown>[];
  columns: FooterColumn[];
  className?: string;
}

export function DataTableFooter({ rows, columns, className }: Props) {
  return (
    <tr className={cn("bg-slate-100 font-semibold text-sm border-t-2 border-slate-300", className)}>
      {columns.map((col) => {
        if (!col.isSum) {
          return <td key={col.key} className="px-3 py-2">{col.label ?? ""}</td>;
        }
        const sum = rows.reduce((acc, row) => acc + (Number(row[col.key]) || 0), 0);
        return (
          <td key={col.key} className={cn("px-3 py-2 tabular-nums", col.align === "right" ? "text-right" : "")}>
            {formatCurrency(sum)}
          </td>
        );
      })}
    </tr>
  );
}
```

- [ ] **ステップ 6: コミット**

```bash
git add frontend/src/components/ui/ frontend/src/__tests__/row-color-resolver.test.ts
git commit -m "feat: add scaffold-reusable editable cell components and row color resolver"
```

---

## タスク 10: カスタムフック（TDD）

**ファイル:**
- 作成: `frontend/src/hooks/use-table-editing.ts`
- 作成: `frontend/src/hooks/use-sales-rent-data.ts`
- 作成: `frontend/src/hooks/use-excel-export.ts`
- 作成: `frontend/src/__tests__/use-table-editing.test.ts`

- [ ] **ステップ 1: useTableEditing のテストを書く**

`frontend/src/__tests__/use-table-editing.test.ts`:
```typescript
import { renderHook, act } from "@testing-library/react";
import { useTableEditing } from "@/hooks/use-table-editing";

interface Row { id: number; name: string; value: number; }

test("initially no dirty rows", () => {
  const { result } = renderHook(() => useTableEditing<Row>());
  expect(result.current.dirtyIds.size).toBe(0);
  expect(result.current.hasDirty).toBe(false);
});

test("updateCell marks row as dirty", () => {
  const { result } = renderHook(() => useTableEditing<Row>());
  act(() => { result.current.updateCell(1, "name", "新しい名前"); });
  expect(result.current.dirtyIds.has(1)).toBe(true);
  expect(result.current.hasDirty).toBe(true);
});

test("getEditedRows returns only dirty rows merged with original", () => {
  const originals: Row[] = [
    { id: 1, name: "元の名前", value: 100 },
    { id: 2, name: "変更なし", value: 200 },
  ];
  const { result } = renderHook(() => useTableEditing<Row>());
  act(() => { result.current.updateCell(1, "name", "新しい名前"); });
  const edited = result.current.getEditedRows(originals);
  expect(edited).toHaveLength(1);
  expect(edited[0]).toEqual({ id: 1, name: "新しい名前", value: 100 });
});

test("clearDirty resets state", () => {
  const { result } = renderHook(() => useTableEditing<Row>());
  act(() => { result.current.updateCell(1, "name", "新しい名前"); });
  act(() => { result.current.clearDirty(); });
  expect(result.current.hasDirty).toBe(false);
});
```

- [ ] **ステップ 2: テストを実行して失敗を確認する**

```bash
npx vitest run src/__tests__/use-table-editing.test.ts
```

- [ ] **ステップ 3: useTableEditing を実装する**

`frontend/src/hooks/use-table-editing.ts`:
```typescript
import { useState, useCallback } from "react";

interface HasId { id: number; }

export function useTableEditing<T extends HasId>() {
  const [edits, setEdits] = useState<Map<number, Partial<T>>>(new Map());
  const dirtyIds = new Set(edits.keys());

  const updateCell = useCallback((id: number, field: keyof T, value: unknown) => {
    setEdits((prev) => {
      const next = new Map(prev);
      const existing = next.get(id) ?? {};
      next.set(id, { ...existing, [field]: value });
      return next;
    });
  }, []);

  const getEditedRows = useCallback((originals: T[]): T[] => {
    return originals
      .filter((row) => edits.has(row.id))
      .map((row) => ({ ...row, ...edits.get(row.id) }));
  }, [edits]);

  const clearDirty = useCallback(() => {
    setEdits(new Map());
  }, []);

  const getCellValue = useCallback(<K extends keyof T>(row: T, field: K): T[K] => {
    const edit = edits.get(row.id);
    return edit && field in edit ? (edit[field] as T[K]) : row[field];
  }, [edits]);

  return {
    dirtyIds,
    hasDirty: dirtyIds.size > 0,
    updateCell,
    getEditedRows,
    clearDirty,
    getCellValue,
  };
}
```

- [ ] **ステップ 4: テストを実行して通過を確認する**

```bash
npx vitest run src/__tests__/use-table-editing.test.ts
```
期待結果: 4 tests PASSED

- [ ] **ステップ 5: useSalesRentData を実装する**

`frontend/src/hooks/use-sales-rent-data.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { SalesRentRow, SalesRentFilter, SalesRentCreatePayload, SalesRentUpdatePayload } from "@/types/sales-rent";

export function useSalesRentData(filter: SalesRentFilter | null) {
  const queryClient = useQueryClient();
  const queryKey = ["sales-rent", filter];

  const query = useQuery({
    queryKey,
    queryFn: () => {
      if (!filter) return [];
      const params = new URLSearchParams({
        store_id: String(filter.store_id),
        closing_month: filter.closing_month,
        ...(filter.employee_id ? { employee_id: String(filter.employee_id) } : {}),
        ...(filter.category ? { category: filter.category } : {}),
      });
      return api.get<SalesRentRow[]>(`/api/sales/rent?${params}`);
    },
    enabled: !!filter,
  });

  const createMutation = useMutation({
    mutationFn: (payload: SalesRentCreatePayload) =>
      api.post<SalesRentRow>("/api/sales/rent", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const batchUpdateMutation = useMutation({
    mutationFn: (rows: SalesRentUpdatePayload[]) =>
      api.patch<SalesRentRow[]>("/api/sales/rent/batch", { rows }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const closingMutation = useMutation({
    mutationFn: (payload: { store_id: number; closing_month: string }) =>
      api.post<{ closed_count: number }>("/api/sales/rent/closing", payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { query, createMutation, batchUpdateMutation, closingMutation };
}
```

- [ ] **ステップ 6: useExcelExport を実装する**

`frontend/src/hooks/use-excel-export.ts`:
```typescript
import { useCallback } from "react";
import type { SalesRentFilter } from "@/types/sales-rent";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export function useExcelExport() {
  const exportExcel = useCallback(async (filter: SalesRentFilter) => {
    const params = new URLSearchParams({
      store_id: String(filter.store_id),
      closing_month: filter.closing_month,
      ...(filter.employee_id ? { employee_id: String(filter.employee_id) } : {}),
      ...(filter.category ? { category: filter.category } : {}),
    });
    const url = `${API_BASE}/api/sales/rent/export/excel?${params}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_rent_${filter.closing_month}.xlsx`;
    a.click();
  }, []);

  return { exportExcel };
}
```

- [ ] **ステップ 7: コミット**

```bash
git add frontend/src/hooks/ frontend/src/__tests__/use-table-editing.test.ts
git commit -m "feat: add useTableEditing, useSalesRentData, useExcelExport hooks"
```

---

## タスク 11: レイアウトコンポーネント

**ファイル:**
- 作成: `frontend/src/components/layout/sidebar.tsx`
- 作成: `frontend/src/components/layout/breadcrumb.tsx`
- 作成: `frontend/src/components/providers/query-provider.tsx`
- 変更: `frontend/src/app/layout.tsx`

- [ ] **ステップ 1: サイドバーを実装する**

`frontend/src/components/layout/sidebar.tsx`:
```typescript
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Clock, Calendar, Building, Settings, ChevronDown } from "lucide-react";
import { useState } from "react";

const navItems = [
  { label: "ダッシュボード", href: "/", icon: Home },
  { label: "動態", href: "/activity", icon: Clock },
  { label: "有休", href: "/leave", icon: Calendar },
  {
    label: "賃貸", icon: Building, children: [
      { label: "売上入力", href: "/sales/rent/entry" },
      { label: "個人別", href: "/sales/rent/individual" },
      { label: "申込日別", href: "/sales/rent/by-date" },
      { label: "入金日別", href: "/sales/rent/by-payment" },
    ]
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["賃貸"]));

  return (
    <aside className="w-56 min-h-screen bg-slate-800 text-slate-200 flex flex-col">
      <div className="px-4 py-4 border-b border-slate-700">
        <h1 className="text-sm font-bold text-white">Housing E-Kintai</h1>
      </div>
      <nav className="flex-1 py-2">
        {navItems.map((item) => {
          if ("children" in item) {
            const isOpen = openSections.has(item.label);
            return (
              <div key={item.label}>
                <button
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-700 text-slate-300"
                  onClick={() => setOpenSections((prev) => {
                    const next = new Set(prev);
                    if (next.has(item.label)) next.delete(item.label);
                    else next.add(item.label);
                    return next;
                  })}
                >
                  <item.icon size={16} />
                  <span className="flex-1 text-left">{item.label}</span>
                  <ChevronDown size={14} className={cn("transition-transform", isOpen && "rotate-180")} />
                </button>
                {isOpen && (
                  <div className="bg-slate-900">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          "block pl-10 pr-4 py-2 text-sm",
                          pathname === child.href
                            ? "bg-blue-600 text-white font-medium"
                            : "text-slate-400 hover:bg-slate-700 hover:text-white"
                        )}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm",
                pathname === item.href ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700"
              )}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-slate-700 text-xs text-slate-400">
        <p>管理者（総務部）</p>
        <button className="mt-1 hover:text-white">ログアウト</button>
      </div>
    </aside>
  );
}
```

- [ ] **ステップ 2: パンくずリストを実装する**

`frontend/src/components/layout/breadcrumb.tsx`:
```typescript
interface Props {
  items: { label: string; href?: string }[];
}

export function Breadcrumb({ items }: Props) {
  return (
    <nav className="text-sm text-slate-500 flex items-center gap-1">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-slate-300">›</span>}
          <span className={i === items.length - 1 ? "text-slate-800 font-medium" : ""}>{item.label}</span>
        </span>
      ))}
    </nav>
  );
}
```

- [ ] **ステップ 3: ルートレイアウトを更新する**

`frontend/src/app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/components/providers/query-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = { title: "Housing E-Kintai" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <QueryProvider>
          <div className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
```

`frontend/src/components/providers/query-provider.tsx`:
```typescript
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

- [ ] **ステップ 4: コミット**

```bash
git add frontend/src/components/layout/ frontend/src/components/providers/ frontend/src/app/layout.tsx
git commit -m "feat: add sidebar navigation and root layout"
```

---

## タスク 12: 売上入力ヘッダーコンポーネント

**ファイル:**
- 作成: `frontend/src/components/sales/sales-rent-header.tsx`
- 作成: `frontend/src/__tests__/sales-rent-header.test.tsx`

- [ ] **ステップ 1: ヘッダーのテストを書く**

`frontend/src/__tests__/sales-rent-header.test.tsx`:
```typescript
import { render, screen, fireEvent } from "@testing-library/react";
import { SalesRentHeader } from "@/components/sales/sales-rent-header";

const mockStores = [{ id: 1, name: "本店" }, { id: 2, name: "支店" }];
const defaultProps = {
  stores: mockStores,
  employees: [],
  filter: { store_id: 1, closing_month: "2026-02" },
  onFilterChange: vi.fn(),
  onSave: vi.fn(),
  onAddRow: vi.fn(),
  onExcelExport: vi.fn(),
  onClosingProcess: vi.fn(),
  hasDirty: false,
  isSaving: false,
};

test("renders filter controls and action buttons", () => {
  render(<SalesRentHeader {...defaultProps} />);
  expect(screen.getByText("保存")).toBeInTheDocument();
  expect(screen.getByText("行を追加")).toBeInTheDocument();
  expect(screen.getByText("Excel")).toBeInTheDocument();
  expect(screen.getByText("締め処理")).toBeInTheDocument();
});

test("save button is disabled when no dirty rows", () => {
  render(<SalesRentHeader {...defaultProps} hasDirty={false} />);
  expect(screen.getByText("保存").closest("button")).toBeDisabled();
});

test("save button is enabled when dirty rows exist", () => {
  render(<SalesRentHeader {...defaultProps} hasDirty={true} />);
  expect(screen.getByText("保存").closest("button")).not.toBeDisabled();
});

test("clicking add row calls onAddRow", () => {
  render(<SalesRentHeader {...defaultProps} />);
  fireEvent.click(screen.getByText("行を追加"));
  expect(defaultProps.onAddRow).toHaveBeenCalled();
});
```

- [ ] **ステップ 2: テストを実行して失敗を確認する**

```bash
npx vitest run src/__tests__/sales-rent-header.test.tsx
```

- [ ] **ステップ 3: SalesRentHeader を実装する**

`frontend/src/components/sales/sales-rent-header.tsx`:
```typescript
"use client";
import { Button } from "@/components/ui/button";
import { Download, Lock, Save, Plus } from "lucide-react";
import type { Store, Employee } from "@/types/master";
import type { SalesRentFilter } from "@/types/sales-rent";

interface Props {
  stores: Store[];
  employees: Employee[];
  filter: SalesRentFilter;
  onFilterChange: (filter: Partial<SalesRentFilter>) => void;
  onSave: () => void;
  onAddRow: () => void;
  onExcelExport: () => void;
  onClosingProcess: () => void;
  hasDirty: boolean;
  isSaving: boolean;
}

const CLOSING_MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(2026, i, 1);
  return { value: `2026-${String(i + 1).padStart(2, "0")}`, label: `2026年${i + 1}月(未)` };
});

const CATEGORIES = ["全件", "仲介", "自社"];

export function SalesRentHeader({ stores, filter, onFilterChange, onSave, onAddRow, onExcelExport, onClosingProcess, hasDirty, isSaving }: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b bg-white gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        <label className="text-sm text-slate-500">店舗</label>
        <select
          value={filter.store_id}
          onChange={(e) => onFilterChange({ store_id: Number(e.target.value) })}
          className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <label className="text-sm text-slate-500 ml-2">締め月</label>
        <select
          value={filter.closing_month}
          onChange={(e) => onFilterChange({ closing_month: e.target.value })}
          className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {CLOSING_MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>

        <label className="text-sm text-slate-500 ml-2">社員名</label>
        {/* 社員名はマスタから取得した選択肢をドロップダウンで表示する */}
        <select
          value={filter.employee_id ?? ""}
          onChange={(e) => onFilterChange({ employee_id: e.target.value ? Number(e.target.value) : undefined })}
          className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">部分一致（全員）</option>
          {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
        </select>

        <label className="text-sm text-slate-500 ml-2">区分</label>
        <select
          value={filter.category ?? ""}
          onChange={(e) => onFilterChange({ category: e.target.value || undefined })}
          className="border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {CATEGORIES.map((c) => <option key={c} value={c === "全件" ? "" : c}>{c}</option>)}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onExcelExport}>
          <Download size={14} className="mr-1" /> Excel
        </Button>
        <Button variant="outline" size="sm" onClick={onClosingProcess}>
          <Lock size={14} className="mr-1" /> 締め処理
        </Button>
        <Button size="sm" onClick={onSave} disabled={!hasDirty || isSaving}>
          <Save size={14} className="mr-1" /> {isSaving ? "保存中..." : "保存"}
        </Button>
        <Button size="sm" variant="secondary" onClick={onAddRow}>
          <Plus size={14} className="mr-1" /> 行を追加
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **ステップ 4: テストを実行して通過を確認する**

```bash
npx vitest run src/__tests__/sales-rent-header.test.tsx
```
期待結果: 4 tests PASSED

- [ ] **ステップ 5: コミット**

```bash
git add frontend/src/components/sales/sales-rent-header.tsx frontend/src/__tests__/sales-rent-header.test.tsx
git commit -m "feat: add SalesRentHeader component with filters and action buttons"
```

---

## タスク 13: 売上入力テーブルコンポーネント

**ファイル:**
- 作成: `frontend/src/components/sales/sales-rent-table.tsx`
- 作成: `frontend/src/components/sales/sales-rent-summary-bar.tsx`

- [ ] **ステップ 1: SalesRentTable を実装する**

`frontend/src/components/sales/sales-rent-table.tsx`:
```typescript
"use client";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { resolveRowClass } from "@/components/ui/row-color-resolver";
import { EditableNumberCell } from "@/components/ui/editable-number-cell";
import { EditableTextCell } from "@/components/ui/editable-text-cell";
import { EditableDateCell } from "@/components/ui/editable-date-cell";
import { EditableCheckboxCell } from "@/components/ui/editable-checkbox-cell";
import { DataTableFooter } from "@/components/ui/data-table-footer";
import type { SalesRentRow } from "@/types/sales-rent";
import type { useTableEditing } from "@/hooks/use-table-editing";

interface Props {
  rows: SalesRentRow[];
  editing: ReturnType<typeof useTableEditing<SalesRentRow>>;
  isLoading: boolean;
}

export function SalesRentTable({ rows, editing, isLoading }: Props) {
  const { getCellValue, updateCell, dirtyIds } = editing;

  const columns: ColumnDef<SalesRentRow>[] = [
    { accessorKey: "display_order", header: "#", size: 40, cell: ({ row }) => <span className="text-slate-400 text-xs">{row.original.display_order}</span> },
    {
      accessorKey: "applied_at", header: "申込日", size: 110,
      cell: ({ row }) => <EditableDateCell value={getCellValue(row.original, "applied_at")} onChange={(v) => updateCell(row.original.id, "applied_at", v)} disabled={row.original.is_closed} />,
    },
    {
      accessorKey: "employee_id", header: "社員名", size: 100,
      cell: ({ row }) => <EditableTextCell value={String(getCellValue(row.original, "employee_id") ?? "")} onChange={(v) => updateCell(row.original.id, "employee_id", v ? Number(v) : null)} disabled={row.original.is_closed} />,
    },
    {
      accessorKey: "customer_name", header: "顧客名", size: 120,
      cell: ({ row }) => <EditableTextCell value={getCellValue(row.original, "customer_name")} onChange={(v) => updateCell(row.original.id, "customer_name", v)} disabled={row.original.is_closed} />,
    },
    {
      accessorKey: "property_name", header: "物件名", size: 180,
      cell: ({ row }) => <EditableTextCell value={getCellValue(row.original, "property_name")} onChange={(v) => updateCell(row.original.id, "property_name", v)} disabled={row.original.is_closed} className="text-blue-600 hover:underline" />,
    },
    {
      accessorKey: "brokerage_fee", header: "仲介手数料", size: 100,
      cell: ({ row }) => <EditableNumberCell value={getCellValue(row.original, "brokerage_fee")} onChange={(v) => updateCell(row.original.id, "brokerage_fee", v)} disabled={row.original.is_closed} />,
    },
    {
      accessorKey: "ad_fee", header: "広告料", size: 90,
      cell: ({ row }) => <EditableNumberCell value={getCellValue(row.original, "ad_fee")} onChange={(v) => updateCell(row.original.id, "ad_fee", v)} disabled={row.original.is_closed} />,
    },
    {
      accessorKey: "payment_fee", header: "支払手数料", size: 100,
      cell: ({ row }) => <EditableNumberCell value={getCellValue(row.original, "payment_fee")} onChange={(v) => updateCell(row.original.id, "payment_fee", v)} disabled={row.original.is_closed} />,
    },
    { accessorKey: "total_sales", header: "合計売上", size: 100, cell: ({ row }) => <EditableNumberCell value={row.original.total_sales} onChange={() => {}} disabled /> },
    {
      accessorKey: "received_at", header: "入金日", size: 110,
      cell: ({ row }) => <EditableDateCell value={getCellValue(row.original, "received_at")} onChange={(v) => updateCell(row.original.id, "received_at", v)} disabled={row.original.is_closed} />,
    },
    {
      accessorKey: "is_white_flow", header: "白流れ", size: 60,
      cell: ({ row }) => <EditableCheckboxCell value={getCellValue(row.original, "is_white_flow")} onChange={(v) => updateCell(row.original.id, "is_white_flow", v)} disabled={row.original.is_closed} danger={getCellValue(row.original, "is_white_flow")} />,
    },
    { accessorKey: "fee_calculation", header: "手数料計算", size: 100, cell: ({ row }) => <EditableNumberCell value={row.original.fee_calculation} onChange={() => {}} disabled /> },
    {
      accessorKey: "delivered_at", header: "お届日", size: 110,
      cell: ({ row }) => <EditableDateCell value={getCellValue(row.original, "delivered_at")} onChange={(v) => updateCell(row.original.id, "delivered_at", v)} disabled={row.original.is_closed} />,
    },
    {
      accessorKey: "is_delivery_flow", header: "お届流れ", size: 70,
      cell: ({ row }) => <EditableCheckboxCell value={getCellValue(row.original, "is_delivery_flow")} onChange={(v) => updateCell(row.original.id, "is_delivery_flow", v)} disabled={row.original.is_closed} />,
    },
    { accessorKey: "ad_calculation", header: "広告計算", size: 90, cell: ({ row }) => <EditableNumberCell value={row.original.ad_calculation} onChange={() => {}} disabled /> },
    { accessorKey: "total_summary", header: "合計総計", size: 100, cell: ({ row }) => <EditableNumberCell value={row.original.total_summary} onChange={() => {}} disabled /> },
  ];

  const table = useReactTable({ data: rows, columns, getCoreRowModel: getCoreRowModel() });

  if (isLoading) return <div className="flex items-center justify-center py-20 text-slate-400">読み込み中...</div>;

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="bg-slate-50 border-b-2 border-slate-200">
              {hg.headers.map((h) => (
                <th key={h.id} className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wide whitespace-nowrap" style={{ width: h.getSize() }}>
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className={cn(
                "border-b border-slate-100 hover:bg-slate-50 transition-colors",
                dirtyIds.has(row.original.id) && "bg-yellow-50 hover:bg-yellow-100",
                resolveRowClass(row.original.status_flag)
              )}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-3 py-1.5">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <DataTableFooter
            rows={rows}
            columns={[
              { key: "display_order", label: "合計" },
              { key: "applied_at", label: "" },
              { key: "employee_id", label: "" },
              { key: "customer_name", label: "" },
              { key: "property_name", label: "" },
              { key: "brokerage_fee", isSum: true, align: "right" },
              { key: "ad_fee", isSum: true, align: "right" },
              { key: "payment_fee", isSum: true, align: "right" },
              { key: "total_sales", isSum: true, align: "right" },
              { key: "received_at", label: "" },
              { key: "is_white_flow", label: "" },
              { key: "fee_calculation", isSum: true, align: "right" },
              { key: "delivered_at", label: "" },
              { key: "is_delivery_flow", label: "" },
              { key: "ad_calculation", isSum: true, align: "right" },
              { key: "total_summary", isSum: true, align: "right" },
            ]}
          />
        </tfoot>
      </table>
      {rows.length === 0 && (
        <div className="text-center py-12 text-slate-400">データがありません</div>
      )}
    </div>
  );
}
```

- [ ] **ステップ 2: SalesRentSummaryBar を実装する**

`frontend/src/components/sales/sales-rent-summary-bar.tsx`:
```typescript
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils";
import type { SalesRentRow } from "@/types/sales-rent";

interface Props {
  rows: SalesRentRow[];
  className?: string;
}

export function SalesRentSummaryBar({ rows, className }: Props) {
  const totalSales = rows.reduce((sum, r) => sum + r.total_sales, 0);
  return (
    <div className={cn("px-4 py-1.5 text-xs text-slate-600 bg-slate-50 border-b flex items-center gap-4", className)}>
      <span>{rows.length} 件</span>
      <span>合計売上: <strong className="text-slate-800">{formatCurrency(totalSales)}</strong></span>
    </div>
  );
}
```

- [ ] **ステップ 3: コミット**

```bash
git add frontend/src/components/sales/
git commit -m "feat: add SalesRentTable with inline editing and SalesRentSummaryBar"
```

---

## タスク 14: ページ組み立てと動作確認

**ファイル:**
- 作成: `frontend/src/app/sales/rent/entry/page.tsx`
- 変更: `frontend/src/app/page.tsx`（ダッシュボードの仮ページ）

- [ ] **ステップ 1: 売上入力ページを実装する**

新規行は**ローカル状態**（`newRows` state）で管理し、保存時に API へ送信する。負のIDを持つ行はサーバー未保存の識別子として使う。

`frontend/src/app/sales/rent/entry/page.tsx`:
```typescript
"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { SalesRentHeader } from "@/components/sales/sales-rent-header";
import { SalesRentTable } from "@/components/sales/sales-rent-table";
import { SalesRentSummaryBar } from "@/components/sales/sales-rent-summary-bar";
import { useSalesRentData } from "@/hooks/use-sales-rent-data";
import { useTableEditing } from "@/hooks/use-table-editing";
import { useExcelExport } from "@/hooks/use-excel-export";
import { api } from "@/lib/api-client";
import type { SalesRentFilter, SalesRentRow } from "@/types/sales-rent";
import type { Store, Employee } from "@/types/master";

function makeEmptyRow(filter: SalesRentFilter, tempId: number): SalesRentRow {
  return {
    id: tempId, // 負のIDで未保存を識別
    display_order: 0,
    applied_at: new Date().toISOString().slice(0, 10),
    employee_id: null,
    customer_name: "",
    property_name: "",
    brokerage_fee: 0,
    ad_fee: 0,
    payment_fee: 0,
    total_sales: 0,
    received_at: null,
    is_white_flow: false,
    fee_calculation: 0,
    delivered_at: null,
    is_delivery_flow: false,
    ad_calculation: 0,
    total_summary: 0,
    status_flag: null,
    store_id: filter.store_id,
    closing_month: filter.closing_month,
    category: "",
    is_closed: false,
  };
}

export default function SalesRentEntryPage() {
  const { toast } = useToast();
  const [filter, setFilter] = useState<SalesRentFilter>({
    store_id: 1,
    closing_month: "2026-02",
  });
  // 未保存の新規行をローカル状態で管理（負のID）
  const [localNewRows, setLocalNewRows] = useState<SalesRentRow[]>([]);

  const storesQuery = useQuery({ queryKey: ["stores"], queryFn: () => api.get<Store[]>("/api/master/stores") });
  const employeesQuery = useQuery({
    queryKey: ["employees", filter.store_id],
    queryFn: () => api.get<Employee[]>(`/api/master/employees?store_id=${filter.store_id}`),
  });
  const { query, createMutation, batchUpdateMutation, closingMutation } = useSalesRentData(filter);
  const editing = useTableEditing<SalesRentRow>();
  const { exportExcel } = useExcelExport();

  // サーバーデータ + ローカル新規行を結合してテーブルに表示
  const serverRows = query.data ?? [];
  const allRows = [...serverRows, ...localNewRows];

  const handleSave = async () => {
    // 1. 新規行（負のID）を POST で送信
    const newRowsToSave = localNewRows;
    // 2. 既存行の変更（正のID）を PATCH /batch で送信
    const editedRows = editing.getEditedRows(serverRows);

    try {
      for (const row of newRowsToSave) {
        const { id, ...payload } = row; // id（負の仮ID）を除いて送信
        await createMutation.mutateAsync(payload);
      }
      if (editedRows.length > 0) {
        await batchUpdateMutation.mutateAsync(editedRows.map((r) => ({ id: r.id, ...r })));
      }
      editing.clearDirty();
      setLocalNewRows([]); // 新規行のローカル状態をクリア
      toast({ title: "保存しました", description: `${editedRows.length + newRowsToSave.length} 件を更新しました` });
    } catch (e) {
      toast({ title: "保存に失敗しました", description: String(e), variant: "destructive" });
    }
  };

  const handleAddRow = () => {
    const tempId = -(Date.now()); // 負のIDで未保存を識別
    const newRow = makeEmptyRow(filter, tempId);
    setLocalNewRows((prev) => [...prev, newRow]);
    // 新規行も editing フックで追跡できるよう dirty マーク
    editing.updateCell(tempId, "id", tempId);
  };

  const hasDirty = editing.hasDirty || localNewRows.length > 0;

  return (
    <div className="flex flex-col h-screen">
      <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
        <Breadcrumb items={[{ label: "賃貸" }, { label: "売上入力" }]} />
        <span className="text-xs text-slate-400">{new Date().toLocaleString("ja-JP")}</span>
      </div>
      <SalesRentHeader
        stores={storesQuery.data ?? []}
        employees={employeesQuery.data ?? []}
        filter={filter}
        onFilterChange={(partial) => {
          setFilter((prev) => ({ ...prev, ...partial }));
          setLocalNewRows([]); // フィルター変更時に未保存新規行をクリア
          editing.clearDirty();
        }}
        onSave={handleSave}
        onAddRow={handleAddRow}
        onExcelExport={() => exportExcel(filter)}
        onClosingProcess={() => closingMutation.mutate({ store_id: filter.store_id, closing_month: filter.closing_month })}
        hasDirty={hasDirty}
        isSaving={batchUpdateMutation.isPending || createMutation.isPending}
      />
      <SalesRentSummaryBar rows={allRows} />
      <div className="flex-1 overflow-auto">
        <SalesRentTable rows={allRows} editing={editing} isLoading={query.isLoading} />
      </div>
    </div>
  );
}
```

- [ ] **ステップ 2: ダッシュボードの仮ページを作成する**

`frontend/src/app/page.tsx`:
```typescript
export default function HomePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800">ダッシュボード</h1>
      <p className="text-slate-500 mt-2">Housing E-Kintai へようこそ</p>
    </div>
  );
}
```

- [ ] **ステップ 3: E2E 動作確認を行う**

以下をすべて確認する:

```bash
# 1. バックエンドを起動
cd backend && uvicorn app.main:app --reload --port 8000

# 2. マスタデータを投入（別ターミナル）
curl -s http://localhost:8000/api/master/stores  # 空配列が返ること

# psql でシードデータを挿入
psql postgresql://kintai:kintai@localhost:5432/kintai_dev -c "
INSERT INTO stores (name) VALUES ('本店'), ('仙台支店');
INSERT INTO employees (name, store_id) VALUES ('田中 一郎', 1), ('鈴木 花子', 1);
INSERT INTO sales_rent (store_id, closing_month, applied_at, customer_name, property_name, brokerage_fee, ad_fee, payment_fee, total_sales, display_order)
VALUES (1, '2026-02', '2026-02-13', '小林 由美', 'リバーサイド小鶴新田 508', 80000, 200000, 0, 280000, 1);
"

# 3. フロントエンドを起動
cd frontend && npm run dev

# 4. ブラウザで確認
# http://localhost:3000/sales/rent/entry を開く
```

確認チェックリスト:
- [ ] テーブルにデータが表示される
- [ ] セルをクリックすると編集モードになる
- [ ] 数値を変更すると行が黄色くなる（未保存ハイライト）
- [ ] 「保存」ボタンが有効になる
- [ ] 保存後にハイライトが消える
- [ ] 「Excel」ボタンでダウンロードが始まる
- [ ] サイドバーの「売上入力」がアクティブ表示される

- [ ] **ステップ 4: 全テストを実行する**

```bash
# バックエンドテスト
cd backend && pytest --cov=app -v

# フロントエンドテスト
cd frontend && npx vitest run
```
期待結果: 全テスト PASSED

- [ ] **ステップ 5: コミット**

```bash
git add frontend/src/app/
git commit -m "feat: assemble sales rent entry page with all components integrated"
```

---

## 完了基準

- [ ] `docker compose up -d` で PostgreSQL が起動する
- [ ] `pytest` でバックエンドテストが全通過する
- [ ] `npx vitest run` でフロントエンドテストが全通過する
- [ ] `http://localhost:3000/sales/rent/entry` で売上入力画面が表示される
- [ ] テーブルのインライン編集・保存・Excel出力が動作する
- [ ] サイドバーのナビゲーションが機能する
