import asyncio
import json
import logging
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

logger = logging.getLogger(__name__)

RECORDINGS_BUCKET = "recordings"
LIST_PAGE = 100


class AccountDeletionFailed(Exception):
    pass


class SupabaseAdmin:
    def __init__(self, project_url: str, secret_key: str) -> None:
        self.project = project_url.rstrip("/")
        self.secret_key = secret_key

    def _send(self, path: str, method: str, body: dict | None = None) -> bytes | None:
        headers = {"apikey": self.secret_key}
        data = None
        if body is not None:
            headers["Content-Type"] = "application/json"
            data = json.dumps(body).encode()
        request = Request(f"{self.project}{path}", data=data, method=method, headers=headers)
        try:
            with urlopen(request, timeout=10) as response:
                if response.status >= 300:
                    raise AccountDeletionFailed
                return response.read()
        except HTTPError as error:
            if error.code == 404:
                return None
            logger.error("Supabase admin request failed: path=%s status=%s", path, error.code)
            raise AccountDeletionFailed from error
        except URLError as error:
            logger.error("Supabase admin request failed: %s", type(error).__name__)
            raise AccountDeletionFailed from error

    def _delete_recordings(self, user_id: str) -> None:
        folder = quote(user_id, safe="")
        while True:
            listed = self._send(
                f"/storage/v1/object/list/{RECORDINGS_BUCKET}",
                "POST",
                {"prefix": folder, "limit": LIST_PAGE, "offset": 0},
            )
            names = [item["name"] for item in json.loads(listed or b"[]")]
            if not names:
                return
            self._remove([f"{folder}/{name}" for name in names])

    def _remove(self, paths: list[str]) -> None:
        self._send(f"/storage/v1/object/{RECORDINGS_BUCKET}", "DELETE", {"prefixes": paths})

    def _delete_user(self, user_id: str) -> None:
        self._send(f"/auth/v1/admin/users/{quote(user_id, safe='')}", "DELETE")

    async def delete_recordings(self, user_id: str) -> None:
        await asyncio.to_thread(self._delete_recordings, user_id)

    async def remove_recordings(self, paths: list[str]) -> None:
        await asyncio.to_thread(self._remove, paths)

    async def delete_user(self, user_id: str) -> None:
        await asyncio.to_thread(self._delete_user, user_id)
