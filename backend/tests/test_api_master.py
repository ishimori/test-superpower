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
