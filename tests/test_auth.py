def test_health(client):
    response = client.get("/api/health")
    assert response.status_code == 200


def test_register_and_login(client):
    response = client.post("/api/register", json={
        "name": "Test Resident",
        "email": "resident@example.com",
        "password": "password123",
    })
    assert response.status_code == 201

    response = client.post("/api/login", json={
        "email": "resident@example.com",
        "password": "password123",
    })
    assert response.status_code == 200
    assert response.get_json()["token"]

    token = response.get_json()["token"]
    me = client.get("/api/user", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
