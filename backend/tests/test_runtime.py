import asyncio

import pytest
from aiortc import RTCConfiguration, RTCPeerConnection, RTCSessionDescription

from voicebot.application.sessions import Sessions
from voicebot.domain.session import SessionConflict
from voicebot.infrastructure.database import Database
from voicebot.infrastructure.scenarios import load_scenarios
from voicebot.infrastructure.voice.runtime import VoiceRuntime
from voicebot.infrastructure.voice.webrtc import Offer
from voicebot.settings import Settings


async def test_real_webrtc_signaling_and_cleanup(tmp_path, monkeypatch):
    database = await Database.open(tmp_path / "runtime.sqlite3")
    sessions = Sessions(database, load_scenarios(), "test-model")
    runtime = VoiceRuntime(sessions, Settings(_env_file=None, google_api_key="test-key"))

    async def serve(session_id, entry):
        await entry.connection.connect()
        await entry.stop.wait()

    monkeypatch.setattr(runtime, "_serve", serve)
    peer = RTCPeerConnection(RTCConfiguration(iceServers=[]))
    connected = asyncio.Event()

    @peer.on("connectionstatechange")
    def connection_changed():
        if peer.connectionState == "connected":
            connected.set()

    try:
        peer.addTransceiver("audio", direction="sendrecv")
        peer.createDataChannel("rtvi-ai")
        await peer.setLocalDescription(await peer.createOffer())
        session, _ = await sessions.create("salary-negotiation", "pl")
        offer = Offer(sdp=peer.localDescription.sdp, type="offer")
        answer = await runtime.offer(session.id, offer)
        with pytest.raises(SessionConflict):
            await runtime.offer(session.id, offer)
        await peer.setRemoteDescription(RTCSessionDescription(sdp=answer.sdp, type=answer.type))
        async with asyncio.timeout(10):
            await connected.wait()
        ended = await runtime.end(session.id)
        assert ended.status == "ended"
        assert not runtime.active
    finally:
        await runtime.close()
        await peer.close()
        await database.close()
