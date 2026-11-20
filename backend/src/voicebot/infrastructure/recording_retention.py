import asyncio
import logging
from typing import Protocol

import asyncpg

logger = logging.getLogger(__name__)

EXPIRED_RECORDINGS = """
    select name
    from storage.objects
    where bucket_id = 'recordings'
      and created_at <= now() - make_interval(days => $1)
    order by created_at
    limit $2
"""


class RetentionStalled(Exception):
    pass


class RecordingRemover(Protocol):
    async def remove_recordings(self, paths: list[str]) -> None: ...


class RecordingRetention:
    def __init__(
        self,
        pool: asyncpg.Pool,
        remover: RecordingRemover,
        max_age_days: int,
        batch_size: int = 100,
    ) -> None:
        self.pool = pool
        self.remover = remover
        self.max_age_days = max_age_days
        self.batch_size = batch_size

    async def purge(self) -> int:
        removed = 0
        previous: list[str] = []
        while True:
            rows = await self.pool.fetch(EXPIRED_RECORDINGS, self.max_age_days, self.batch_size)
            paths = [row["name"] for row in rows]
            if paths and paths == previous:
                raise RetentionStalled
            previous = paths
            if paths:
                await self.remover.remove_recordings(paths)
                removed += len(paths)
            if len(paths) < self.batch_size:
                return removed

    async def run(self, interval_seconds: int) -> None:
        while True:
            try:
                removed = await self.purge()
                if removed:
                    logger.info("Expired recordings removed: count=%s", removed)
            except Exception:
                logger.error("Recording retention failed")
            await asyncio.sleep(interval_seconds)
