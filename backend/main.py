from fastapi import FastAPI, UploadFile, File, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from faster_whisper import WhisperModel
import io
import tempfile
import os

app = FastAPI(title="SignBridge AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None

@app.on_event("startup")
async def load_model():
    global model
    model = WhisperModel("base", device="cpu", compute_type="int8")

@app.get("/health")
async def health():
    return {"status": "ok", "model": "faster-whisper-base"}

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    if model is None:
        return {"error": "Model not loaded"}
    
    audio_bytes = await file.read()
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name
    
    try:
        segments, info = model.transcribe(tmp_path, beam_size=5)
        text = " ".join([segment.text for segment in segments])
        return {
            "text": text.strip(),
            "language": info.language,
            "duration": info.duration
        }
    finally:
        os.unlink(tmp_path)

@app.websocket("/ws/transcribe")
async def websocket_transcribe(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_bytes()
            # For real-time streaming, implement chunk processing
            await websocket.send_json({"status": "received", "bytes": len(data)})
    except Exception as e:
        await websocket.close()
