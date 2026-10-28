# SignBridge AI

SignBridge AI is a portfolio project that translates spoken or uploaded audio into ASL-inspired gloss and presents the result through an animated 3D avatar. It is designed to explore accessible user experiences, browser-based media input, AI-assisted text transformation, and real-time 3D animation on the web.

## Why I Built It

As a fresh graduate building a software engineering portfolio, I wanted to create a project that combines practical frontend engineering with AI, accessibility, and interactive graphics. SignBridge AI demonstrates how a product can connect several independent systems into one user workflow:

**audio input → speech transcription → ASL gloss → animation selection → 3D avatar playback**

## Features

### Live Translator

- Record speech through the browser microphone.
- Upload `.mp3`, `.wav`, or `.m4a` audio files.
- Drag and drop audio files into the upload area.
- Transcribe audio with a local FastAPI and faster-whisper service.
- Convert English text into uppercase ASL gloss using Gemini when configured.
- Fall back to normalized uppercase text when Gemini is unavailable.
- Select matching avatar animations from the available animation catalog.
- Skip gloss words that do not have a safe exact or close animation match.
- Control avatar playback speed and pause/play animation sequences.
- Switch between realistic materials and a high-contrast avatar mode.

### Saved Sessions and Quick History

- Save transcript, gloss, timestamp, source, and measured translation latency.
- Store sessions locally in the browser with `localStorage`.
- Reload previous translations and replay their animation sequence.
- Display the three most recent translations in Quick History.
- Export a translation as `.txt` or `.srt`.

### Practice Studio

- Request webcam access through the browser.
- Preview the camera feed while practicing.
- Choose from several practice signs.
- Start, pause, and reset a practice attempt.
- Display a local movement-based activity score.

> The Practice Studio currently provides movement feedback, not verified ASL hand-shape accuracy. A production version would connect a hand-landmark model such as MediaPipe Hands or a trained sign-recognition model.

### Sign Dictionary

- Search signs by name, gloss, or description.
- View signing guidance and animation availability.
- Open sign details in a modal.
- Send a sign directly to the Live Translator.
- Open a selected sign in Practice Studio.
- Clearly distinguish exact animations from closest-available gestures.

### Analytics and Accessibility

- View session totals and seven-day usage.
- Break down sessions by microphone, uploaded audio, and preset source.
- Calculate average translation latency from recorded sessions.
- Configure light/dark theme.
- Choose small, medium, or large font size.
- Enable reduced motion.
- Keep preferences across pages and browser refreshes.

## Technology Stack

### Frontend

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- shadcn/ui-style components
- Lucide React
- Three.js
- React Three Fiber
- Drei

### Backend

- FastAPI
- faster-whisper
- Uvicorn
- Python multipart uploads

### AI and Browser APIs

- Gemini API for English-to-ASL gloss conversion and animation selection
- Web MediaRecorder API for microphone input
- `getUserMedia` for microphone and webcam permissions
- Browser `localStorage` for saved sessions and preferences

## Project Structure

```text
audio-sign-app/
├── backend/
│   ├── main.py                 # FastAPI speech transcription service
│   └── requirements.txt
├── assets/
│   └── common-animation/       # Mixamo-style FBX animation library
├── public/
│   ├── animations/             # Public avatar animation assets
│   └── models/                 # 3D avatar assets
├── src/
│   ├── app/
│   │   ├── api/                # Transcription, gloss, and animation routes
│   │   ├── analytics/          # Usage analytics page
│   │   ├── dictionary/         # Searchable sign dictionary
│   │   └── practice/           # Webcam Practice Studio
│   ├── components/
│   │   ├── dashboard/          # Translator and avatar components
│   │   ├── layout/             # Header, settings, footer, preferences
│   │   └── ui/                 # Reusable UI primitives
│   ├── lib/                    # Animation catalog and shared helpers
│   └── types/                  # Shared TypeScript types
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm
- Python 3.10 or newer
- A browser with microphone and webcam support
- Optional: a Gemini API key

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Configure Gemini

Create a local `.env.local` file:

```env
GEMINI_API=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

The Gemini key is used only by server-side Next.js routes. Do not commit `.env.local` or any API key to GitHub.

If Gemini is not configured, the application uses local fallback logic for gloss normalization and animation matching.

### 3. Install backend dependencies

```bash
cd backend
python -m venv .venv

# Linux/macOS
source .venv/bin/activate

# Windows PowerShell
# .venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

### 4. Start the transcription backend

From the `backend` directory:

```bash
uvicorn main:app --reload --port 8000
```

The backend exposes:

- `GET http://localhost:8000/health`
- `POST http://localhost:8000/transcribe`

The first startup may download the faster-whisper model.

### 5. Start the frontend

From the project root:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How the Translation Pipeline Works

1. The user records speech or selects an audio file.
2. The Next.js `/api/transcribe` route forwards the audio to FastAPI.
3. faster-whisper returns the transcript.
4. The transcript is sent to `/api/gloss`.
5. Gemini converts the sentence into ASL-style gloss tokens.
6. `/api/animations` scans the animation catalog and validates selected filenames.
7. The avatar loads the corresponding FBX clips through `/api/animations/file/[name]`.
8. Three.js `AnimationMixer` plays the clips sequentially.
9. The transcript, gloss, source, and latency are saved locally.

## Local Storage

The application currently stores data in the browser rather than a remote database:

| Key | Purpose |
| --- | --- |
| `signbridge_sessions` | Saved transcripts, glosses, sources, timestamps, and latency |
| `signbridge_theme` | Light or dark theme preference |
| `signbridge_font_size` | Font size preference |
| `signbridge_reduced_motion` | Reduced-motion preference |

This makes the prototype easy to run without authentication or database setup. It also means data is limited to the current browser and device.

## Development Commands

```bash
npm run dev        # Start the Next.js development server
npm run lint       # Run ESLint
npx tsc --noEmit   # Run the TypeScript check
npm run build      # Create a production build
```

## Current Limitations

- The transcription backend must be running locally for microphone and file transcription.
- The animation library does not contain a dedicated clip for every possible English word.
- Unmatched gloss tokens are intentionally skipped instead of being assigned an unrelated animation.
- The Practice Studio score is movement activity feedback, not true sign-language accuracy.
- Saved sessions are local-only and are not synchronized between devices.
- The current streaming WebSocket endpoint is a basic placeholder; transcription is currently processed after recording or upload completes.
- Animation assets should be used only when their licensing permits redistribution in the intended repository or deployment.

## Future Improvements

- Add MediaPipe Hands or a trained sign-recognition model to Practice Studio.
- Add more dedicated ASL animation clips and improve gloss-to-animation coverage.
- Add automated tests for API routes and local-storage workflows.
- Add authentication and optional cloud synchronization for saved sessions.
- Add streaming transcription for lower-latency microphone translation.
- Add user-facing toast notifications and richer error recovery.

## Portfolio Highlights

This project demonstrates:

- Type-safe React and Next.js application development.
- Integration between a Next.js frontend and a Python ML service.
- Browser media APIs for audio and webcam workflows.
- Server-side API key protection.
- Three.js skeletal animation and runtime material switching.
- Local-first data persistence and analytics.
- Accessibility-focused settings and honest product-state communication.
- Graceful fallbacks when AI output or animation assets are unavailable.

## License and Assets

Review the licenses for the 3D model, animation files, and any third-party assets before publishing a public repository or deploying the application. Remove or replace assets that are not licensed for redistribution.
