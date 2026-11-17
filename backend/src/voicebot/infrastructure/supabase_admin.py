import asyncio
import logging
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen

logger = logging.getLogger(__name__)


class AccountDeletionFailed(Exception):
    pass


class SupabaseAdmin:
    def __init__(self, project_url: str, secret_key: str) -> None:
        self.base = f"{project_url.rstrip('/')}/auth/v1/admin/users"
        self.secret_key = secret_key

    def _delete(self, user_id: str) -> None:
        request = Request(
            f"{self.base}/{quote(user_id, safe='')}",
            method="DELETE",
            headers={"apikey": self.secret_key},
        )
        try:
            with urlopen(request, timeout=10) as response:
                if response.status >= 300:
                    raise AccountDeletionFailed
        except HTTPError as error:
            if error.code == 404:
                return
            logger.error("Account deletion failed: status=%s", error.code)
            raise AccountDeletionFailed from error
        except URLError as error:
            logger.error("Account deletion failed: %s", type(error).__name__)
            raise AccountDeletionFailed from error

    async def delete_user(self, user_id: str) -> None:
        await asyncio.to_thread(self._delete, user_id)
