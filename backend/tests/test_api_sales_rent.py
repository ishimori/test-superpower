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
