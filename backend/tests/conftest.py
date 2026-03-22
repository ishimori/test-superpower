import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

TEST_DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://kintai_app:password@localhost:25432/kintai_test")

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
