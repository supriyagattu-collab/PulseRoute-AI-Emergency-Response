"""
Pytest configuration and fixtures.
Provides an isolated in-memory test database and FastAPI TestClient.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models import HealthcareFacility, Ambulance, EmergencyReport
from app.auth.jwt import create_access_token
from app.auth.seed import seed_demo_users
from app.auth.rate_limiter import limiter

# In-memory SQLite engine for tests with StaticPool
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """
    Create all tables in memory once for the test session.
    """
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(autouse=True)
def reset_limiter_each_test():
    """
    Reset sliding window rate limiter state between tests so tests do not interfere.
    """
    limiter.reset()
    yield
    limiter.reset()


@pytest.fixture
def db_session():
    """
    Yields an isolated database session per test with automatic rollback.
    """
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    # Seed baseline facilities and ambulance for foreign keys / tests
    facilities = [
        HealthcareFacility(
            id=1,
            object_id=5120,
            facility_name="Osmania General Hospital",
            facility_type="Teaching Hospital",
            district="Hyderabad",
            mandal="Nampally",
            address="Afzal Gunj, Nampally",
            latitude=17.3744,
            longitude=78.4745,
            total_icu_beds=50,
            available_icu_beds=10,
            has_cath_lab=True,
            has_ct_scan=True,
            trauma_level="Level 1 Apex Trauma",
        ),
        HealthcareFacility(
            id=2,
            object_id=5121,
            facility_name="Gandhi Hospital",
            facility_type="Teaching Hospital",
            district="Hyderabad",
            mandal="Secunderabad",
            address="Musheerabad, Secunderabad",
            latitude=17.4243,
            longitude=78.5020,
            total_icu_beds=60,
            available_icu_beds=12,
            has_cath_lab=True,
            has_ct_scan=True,
            trauma_level="Level 1 Apex Trauma",
        ),
        HealthcareFacility(
            id=3,
            object_id=5122,
            facility_name="Niloufer Hospital",
            facility_type="Teaching Hospital",
            district="Hyderabad",
            mandal="Red Hills",
            address="Bazarghat, Red Hills, Hyderabad",
            latitude=17.3988,
            longitude=78.4611,
            total_icu_beds=40,
            available_icu_beds=8,
            has_cath_lab=False,
            has_ct_scan=True,
            trauma_level="Level 2 Trauma Center",
        ),
        HealthcareFacility(
            id=4,
            object_id=5123,
            facility_name="Modern Government Maternity Hospital",
            facility_type="Teaching Hospital",
            district="Hyderabad",
            mandal="Charminar",
            address="Petlaburj, Hyderabad",
            latitude=17.3688,
            longitude=78.4677,
            total_icu_beds=30,
            available_icu_beds=6,
            has_cath_lab=False,
            has_ct_scan=False,
            trauma_level="Maternal Emergency Center",
        ),
        HealthcareFacility(
            id=5,
            object_id=5124,
            facility_name="UPHC Nampally",
            facility_type="UPHC",
            district="Hyderabad",
            mandal="Nampally",
            address="Station Road, Nampally, Hyderabad",
            latitude=17.3980,
            longitude=78.4730,
            total_icu_beds=6,
            available_icu_beds=2,
            has_cath_lab=False,
            has_ct_scan=False,
            trauma_level="Urban 24x7 Emergency Post",
        ),
    ]
    for fac in facilities:
        session.add(fac)

    sample_ambulance = Ambulance(
        id=1,
        ambulance_id="AMB001",
        vehicle_number="TS-09-EA-1081",
        type="ALS",
        status="AVAILABLE",
        latitude=17.3985,
        longitude=78.4735,
        driver_name="Ramesh Yadav",
        driver_contact="+91 98480 11201",
        base_station="Osmania Trauma Hub",
    )
    session.add(sample_ambulance)
    session.commit()
    seed_demo_users(session)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


class PulseRouteTestClient(TestClient):
    """
    Enhanced TestClient that automatically injects a valid Admin Bearer token
    for standard regression requests unless explicit headers or no_auth are specified.
    Does NOT inject tokens into websocket_connect so unauthenticated WS tests remain pure.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._default_admin_token = create_access_token({
            "sub": "test-admin",
            "email": "admin@test.org",
            "role": "ADMIN",
            "name": "Test Admin",
        })

    def request(self, method, url, *args, **kwargs):
        headers = kwargs.get("headers")
        if headers is None:
            kwargs["headers"] = {"Authorization": f"Bearer {self._default_admin_token}"}
        elif isinstance(headers, dict):
            # If explicit no_auth is set, strip Authorization header
            if headers.get("no_auth") or headers.get("Authorization") is None:
                kwargs["headers"] = {k: v for k, v in headers.items() if k not in {"no_auth", "Authorization"} and v is not None}
            elif "Authorization" not in headers and "authorization" not in headers:
                kwargs["headers"]["Authorization"] = f"Bearer {self._default_admin_token}"
        return super().request(method, url, *args, **kwargs)


@pytest.fixture
def client(db_session):
    """
    TestClient with overridden get_db dependency and automatic admin token injection.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with PulseRouteTestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
