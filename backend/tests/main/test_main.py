from main import app, fake_users_db
from fastapi.testclient import TestClient
import pytest

client = TestClient(app)

@pytest.fixture(autouse=True)
def clear_db():
    fake_users_db.clear()

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"Hello": "World"}

def test_signup():
    response = client.post("/signup", json={"username": "testuser",
                                            "email": "test@example.com",
                                            "password": "testpassword"})
    assert response.status_code == 200
    assert "token" in response.json()

def test_signup_existing_username():
    client.post("/signup", json={"username": "testuser",
                                 "email": "test@example.com", "password": "testpassword"})
    response = client.post("/signup", json={"username": "testuser",
                                            "email": "another@example.com",
                                            "password": "testpassword"})
    assert response.status_code == 400
    assert response.json() == {"detail": "Username already registered"}

def test_signup_existing_email():
    client.post("/signup", json={"username": "testuser",
                                 "email": "test@example.com", "password": "testpassword"})
    response = client.post("/signup", json={"username": "anotheruser",
                                            "email": "test@example.com",
                                            "password": "testpassword"})
    assert response.status_code == 400
    assert response.json() == {"detail": "Email already registered"}

def test_login():
    client.post("/signup", json={"username": "testuser",
                                 "email": "test@example.com", "password": "testpassword"})

    # Test login with username
    response = client.post("/login", json={"username": "testuser", "password": "testpassword"})
    assert response.status_code == 200
    assert "token" in response.json()

    # Test login with email
    response = client.post("/login",
                           json={"username": "test@example.com", "password": "testpassword"})
    assert response.status_code == 200
    assert "token" in response.json()

def test_login_incorrect_password():
    client.post("/signup", json={"username": "testuser",
                                 "email": "test@example.com",
                                 "password": "testpassword"})
    response = client.post("/login", json={"username": "testuser",
                                           "password": "wrongpassword"})
    assert response.status_code == 401
    assert response.json() == {"detail": "Incorrect username or password"}

def test_read_users_me():
    response = client.post("/signup",
                           json={"username": "testuser",
                                 "email": "test@example.com",
                                 "password": "testpassword"})
    token = response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    response = client.get("/users/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"

def test_read_user():
    client.post("/signup", json={"username": "testuser",
                                 "email": "test@example.com",
                                 "password": "testpassword"})
    response = client.get("/users/testuser")
    assert response.status_code == 200
    assert response.json()["username"] == "testuser"

def test_read_user_not_found():
    response = client.get("/users/nonexistentuser")
    assert response.status_code == 404
    assert response.json() == {"detail": "User not found"}
