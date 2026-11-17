import time

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric import ec
from fastapi.testclient import TestClient
from jwt import PyJWK

from voicebot.infrastructure.auth import InvalidToken, SupabaseAuth
from voicebot.main import create_app
from voicebot.settings import Settings

PROJECT = "https://example.supabase.co"
USER = "3f1c2b8e-5d4a-4f6b-9c7d-1a2b3c4d5e6f"
CONSENT = {"version": "test", "voice": True, "transcripts": True, "outside_eu": True}


class StaticJwks:
    def __init__(self, public_key) -> None:
        jwk = jwt.algorithms.ECAlgorithm.to_jwk(public_key, as_dict=True)
        self.key = PyJWK({**jwk, "kid": "test-key", "alg": "ES256"})

    def get_signing_key_from_jwt(self, token: str) -> PyJWK:
        if jwt.get_unverified_header(token).get("kid") != "test-key":
            raise jwt.PyJWKClientError("Unknown key")
        return self.key


@pytest.fixture(scope="module")
def keys():
    private = ec.generate_private_key(ec.SECP256R1())
    return private, SupabaseAuth(PROJECT, jwks=StaticJwks(private.public_key()))


def token(private, **overrides) -> str:
    now = int(time.time())
    claims = {
        "iss": f"{PROJECT}/auth/v1",
        "aud": "authenticated",
        "sub": USER,
        "role": "authenticated",
        "email": "student@example.com",
        "iat": now,
        "exp": now + 600,
        "is_anonymous": False,
    }
    claims.update(overrides)
    return jwt.encode(claims, private, algorithm="ES256", headers={"kid": "test-key"})


async def test_valid_tokens_become_principals(keys):
    private, auth = keys
    principal = await auth.verify(token(private))
    assert principal.user_id == USER
    assert principal.email == "student@example.com"


@pytest.mark.parametrize(
    "overrides",
    [
        {"exp": int(time.time()) - 10},
        {"aud": "anon"},
        {"iss": "https://other.supabase.co/auth/v1"},
        {"role": "anon"},
        {"is_anonymous": True},
    ],
)
async def test_invalid_tokens_are_rejected(keys, overrides):
    private, auth = keys
    with pytest.raises(InvalidToken):
        await auth.verify(token(private, **overrides))


async def test_tokens_signed_by_another_key_are_rejected(keys):
    _, auth = keys
    stranger = ec.generate_private_key(ec.SECP256R1())
    with pytest.raises(InvalidToken):
        await auth.verify(token(stranger))


def test_sign_in_is_required_when_supabase_is_configured(tmp_path, keys):
    private, auth = keys
    settings = Settings(
        _env_file=None, database_path=tmp_path / "test.sqlite3", supabase_url=PROJECT
    )
    with TestClient(create_app(settings, auth=auth)) as client:
        body = {"scenario_id": "job-interview", "consent": CONSENT}
        assert client.get("/v1/health").json()["auth_required"] is True
        anonymous = client.post("/v1/sessions", json=body)
        assert anonymous.status_code == 401
        assert anonymous.json()["detail"] == "Sign in required"
        bad = client.post("/v1/sessions", json=body, headers={"Authorization": "Bearer nope"})
        assert bad.status_code == 401
        headers = {"Authorization": f"Bearer {token(private)}"}
        created = client.post("/v1/sessions", json=body, headers=headers)
        assert created.status_code == 201
        session = client.app.state.sessions
        stored = client.portal.call(session.get, created.json()["id"])
        assert stored.owner_id == USER
        files = {"file": ("notes.txt", b"Topics")}
        assert client.post("/v1/documents/extract", files=files).status_code == 401
        extracted = client.post("/v1/documents/extract", files=files, headers=headers)
        assert extracted.status_code == 200


class RecordingAdmin:
    def __init__(self) -> None:
        self.deleted: list[str] = []

    async def delete_user(self, user_id: str) -> None:
        self.deleted.append(user_id)


def test_users_can_delete_only_their_own_account(tmp_path, keys):
    private, auth = keys
    admin = RecordingAdmin()
    settings = Settings(
        _env_file=None, database_path=tmp_path / "test.sqlite3", supabase_url=PROJECT
    )
    with TestClient(create_app(settings, auth=auth, admin=admin)) as client:
        assert client.delete("/v1/account").status_code == 401
        headers = {"Authorization": f"Bearer {token(private)}"}
        assert client.delete("/v1/account", headers=headers).status_code == 204
        assert admin.deleted == [USER]


def test_account_deletion_needs_the_secret_key(tmp_path, keys):
    private, auth = keys
    settings = Settings(
        _env_file=None, database_path=tmp_path / "test.sqlite3", supabase_url=PROJECT
    )
    with TestClient(create_app(settings, auth=auth)) as client:
        headers = {"Authorization": f"Bearer {token(private)}"}
        response = client.delete("/v1/account", headers=headers)
        assert response.status_code == 503
