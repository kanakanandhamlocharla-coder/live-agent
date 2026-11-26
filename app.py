from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
import asyncio
import os
from dotenv import load_dotenv

import types
from gemini_live import MODEL, LIVE_CONFIG, client

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")


app = FastAPI()

app.mount("/frontend", StaticFiles(directory="frontend", html=True), name="frontend")

@app.get("/")
def home():
    return {"message": "Live Agent is running."}

@app.get("/async-test")
async def async_test():
    await asyncio.sleep(2)
    return {"message": "Asynchronous operation completed."}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    chunk_count = 0
    try:
        async with client.aio.live.connect(
                model=MODEL,
                config=LIVE_CONFIG
        ) as session:
            print("Gemini Live session successfully.")

            async def receive_gemini_audio():
                print("Gemini audio receiver started!")
                while True:
                    async for response in session.receive():
                        content = response.server_content
                        if content and content.interrupted:
                            await websocket.send_text("INTERRUPTED")
                        if content and content.model_turn:
                            for part in content.model_turn.parts:
                                if part.inline_data:
                                    audio_data = part.inline_data.data
                                    print("Gemini audio bytes:", len(audio_data))
                                    await websocket.send_bytes(audio_data)

            receiver_task = asyncio.create_task(receive_gemini_audio())
            try:

                while True:
                    data = await websocket.receive_bytes()
                    chunk_count += 1
                    if chunk_count % 100 == 0:
                        print("Received chunks:", chunk_count)

                    # Forward microphone audio to Gemini
                    await session.send_realtime_input(
                        audio={
                            "data": data,
                            "mime_type": "audio/pcm;rate=16000"
                        }
                    )
            # It executes when the exception raises.
            # Finally block usually executes when the try block and except block fully ran or exited
            finally:
                receiver_task.cancel()

    except WebSocketDisconnect:
        print("Client disconnected.")