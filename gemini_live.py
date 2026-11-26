import os
import wave
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key,http_options=types.HttpOptions(
        api_version="v1alpha"))

MODEL="gemini-3.8-live"
LIVE_CONFIG = {
    "response_modalities": ["AUDIO"],
    "output_audio_transcription": {}
}


# This function is for testing
async def test_connection():

    async with client.aio.live.connect(
        model=MODEL,
        config=LIVE_CONFIG
    ) as session:
        print("Gemini Live connected successfully!")

        audio_chunks = []

        # Send a text message to Gemini
        await session.send_realtime_input(
            text="Hello Gemini! How are you?"
        )

        # Receive Gemini's response
        async for response in session.receive():

            content = response.server_content
            if content:
                if content.output_transcription:
                    print("Gemini:", content.output_transcription.text)

                if content.model_turn:
                    for part in content.model_turn.parts:
                        if part.inline_data:
                            audio_chunks.append(part.inline_data.data)

                if content.turn_complete:
                    break

        with wave.open("gemini_response.wav", "wb") as audio_file:

            audio_file.setnchannels(1)
            audio_file.setsampwidth(2)
            audio_file.setframerate(24000)

            audio_file.writeframes(b"".join(audio_chunks))
        print("Audio saved successfully.")

import asyncio

if __name__ == "__main__":
    asyncio.run(test_connection())