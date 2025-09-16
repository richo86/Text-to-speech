from main import app, fake_users_db
from fastapi.testclient import TestClient
import pytest
import os
from unittest.mock import patch

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

def test_synthesize():
    # 1. Create a test user
    response = client.post("/signup", json={"username": "testuser",
                                            "email": "test@example.com",
                                            "password": "testpassword"})
    token = response.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create a dummy voice sample file
    uploads_dir = os.path.join(os.getcwd(), "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    dummy_file_path = os.path.join(uploads_dir, "testuser.wav")
    with open(dummy_file_path, "w") as f:
        f.write("dummy audio data")

    # 3. Mock the tts.tts_to_file function
    with patch("main.tts.tts_to_file") as mock_tts:
        # 4. Call the /synthesize endpoint
        response = client.post("/synthesize", headers=headers, json={"text": "Hello world"})

        # 5. Assert that the response status code is 200
        assert response.status_code == 200

        # 6. Assert that the tts.tts_to_file function was called with the correct parameters
        mock_tts.assert_called_once()
        args, kwargs = mock_tts.call_args
        assert kwargs["text"] == "Hello world"
        assert kwargs["speaker_wav"] == dummy_file_path
        assert kwargs["language"] == "en"
        assert "testuser_synthesis" in kwargs["file_path"]

    # Clean up the dummy file
    os.remove(dummy_file_path)
