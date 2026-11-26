# Live Voice AI Agent

A real-time AI voice agent built using Python, FastAPI, JavaScript, and Google's Gemini Live API. The application enables users to interact with an AI model through their microphone and receive audio responses in real time.

## Features

- **Real-time Voice Interaction:** Communicate with the AI using your microphone.
- **Live AI Responses:** Receive spoken responses from Gemini in real time.
- **Audio Streaming:** Stream microphone audio from the browser to the backend.
- **Audio Processing:** Process audio using the Web Audio API and AudioWorklet.
- **WebSocket Communication:** Establish real-time, bidirectional communication between frontend and backend.
- **Voice Activity Handling:** Handle interruptions during conversations.
- **Browser-based Interface:** Interact with the voice agent through a simple web interface.

## Technologies Used

- Python
- FastAPI
- Google Gemini Live API
- JavaScript
- HTML
- CSS
- WebSockets
- Web Audio API

## Project Structure

```text
Live-Voice-Agent/
│
├── frontend/
│   ├── audio_processor.js
│   ├── index.html
│   ├── script.js
│   └── style.css
│
├── app.py
├── gemini_live.py
├── requirements.txt
└── .env
```

## Installation and Setup

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd Live-Voice-Agent
```

### 2. Create a Virtual Environment

```bash
python -m venv .venv
```

Activate the environment on Windows:

```bash
.venv\Scripts\activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a `.env` file in the project root and configure your Gemini API key using the environment variable expected by the application.

Keep your `.env` file private and never upload API keys to GitHub.

### 5. Run the Application

Start the FastAPI server:

```bash
uvicorn app:app --reload
```

### 6. Access the Application

Open the local application address configured by the project in your browser.

## Author

Developed as a learning project to explore real-time AI voice interaction, audio streaming, WebSockets, and Gemini Live API integration.