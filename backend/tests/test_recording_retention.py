import pytest

from voicebot.infrastructure.recording_retention import RecordingRetention, RetentionStalled


class FakePool:
    def __init__(self, names: list[str]) -> None:
        self.names = names
        self.queries: list[tuple] = []

    async def fetch(self, query, max_age_days, limit):
        self.queries.append((max_age_days, limit))
        return [{"name": name} for name in self.names[:limit]]


class FakeRemover:
    def __init__(self, pool: FakePool, works: bool = True) -> None:
        self.pool = pool
        self.works = works
        self.batches: list[list[str]] = []

    async def remove_recordings(self, paths: list[str]) -> None:
        self.batches.append(paths)
        if self.works:
            self.pool.names = [name for name in self.pool.names if name not in paths]


async def test_removes_expired_recordings_in_batches():
    pool = FakePool([f"user/session-{index}" for index in range(5)])
    remover = FakeRemover(pool)

    removed = await RecordingRetention(pool, remover, 30, batch_size=2).purge()

    assert removed == 5
    assert [len(batch) for batch in remover.batches] == [2, 2, 1]
    assert pool.queries[0] == (30, 2)


async def test_does_nothing_without_expired_recordings():
    pool = FakePool([])
    remover = FakeRemover(pool)
    assert await RecordingRetention(pool, remover, 30).purge() == 0
    assert remover.batches == []


async def test_stops_when_storage_keeps_the_files():
    pool = FakePool(["user/a", "user/b"])
    remover = FakeRemover(pool, works=False)
    with pytest.raises(RetentionStalled):
        await RecordingRetention(pool, remover, 30, batch_size=2).purge()
    assert len(remover.batches) == 1
