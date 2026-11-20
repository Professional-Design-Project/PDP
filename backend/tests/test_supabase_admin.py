import json
from io import BytesIO
from urllib.error import HTTPError

import pytest

from voicebot.infrastructure import supabase_admin
from voicebot.infrastructure.supabase_admin import AccountDeletionFailed, SupabaseAdmin

PROJECT = "https://example.supabase.co"
USER = "3f1c2b8e-5d4a-4f6b-9c7d-1a2b3c4d5e6f"


class Response(BytesIO):
    status = 200

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False


class FakeStorage:
    def __init__(self, files: list[str]) -> None:
        self.files = files
        self.requests: list[tuple[str, str, dict | None]] = []

    def __call__(self, request, timeout):
        body = json.loads(request.data) if request.data else None
        self.requests.append((request.get_method(), request.full_url, body))
        assert request.get_header("Apikey") == "sb_secret_test"
        if request.full_url.endswith("/object/list/recordings"):
            page = self.files[: body["limit"]]
            return Response(json.dumps([{"name": name} for name in page]).encode())
        if request.full_url.endswith("/object/recordings"):
            removed = {prefix.split("/", 1)[1] for prefix in body["prefixes"]}
            self.files = [name for name in self.files if name not in removed]
        return Response(b"[]")


async def test_deletes_every_recording_in_the_user_folder(monkeypatch):
    storage = FakeStorage([f"session-{index}" for index in range(150)])
    monkeypatch.setattr(supabase_admin, "urlopen", storage)

    await SupabaseAdmin(PROJECT, "sb_secret_test").delete_recordings(USER)

    assert storage.files == []
    deletions = [body for method, _, body in storage.requests if method == "DELETE"]
    assert len(deletions) == 2
    assert deletions[0]["prefixes"][0] == f"{USER}/session-0"
    listing = storage.requests[0]
    assert listing[1] == f"{PROJECT}/storage/v1/object/list/recordings"
    assert listing[2]["prefix"] == USER


async def test_missing_bucket_means_nothing_to_delete(monkeypatch):
    def missing(request, timeout):
        raise HTTPError(request.full_url, 404, "Not Found", {}, None)

    monkeypatch.setattr(supabase_admin, "urlopen", missing)
    await SupabaseAdmin(PROJECT, "sb_secret_test").delete_recordings(USER)


async def test_storage_failure_stops_account_deletion(monkeypatch):
    def broken(request, timeout):
        raise HTTPError(request.full_url, 500, "Server Error", {}, None)

    monkeypatch.setattr(supabase_admin, "urlopen", broken)
    with pytest.raises(AccountDeletionFailed):
        await SupabaseAdmin(PROJECT, "sb_secret_test").delete_recordings(USER)
