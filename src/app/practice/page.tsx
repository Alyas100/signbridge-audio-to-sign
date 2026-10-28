"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, Camera, CameraOff, CheckCircle2, RotateCcw } from "lucide-react";
import { Header } from "@/components/layout/header";
import { FooterStatus } from "@/components/layout/footer-status";
import { SettingsDrawer } from "@/components/layout/settings-drawer";
import { Button } from "@/components/ui/button";

const practiceSigns = [
  { value: "HELLO", label: "Hello", hint: "Raise one open hand beside your head." },
  { value: "THANK YOU", label: "Thank You", hint: "Start near your chin and move your open hand forward." },
  { value: "PLEASE", label: "Please", hint: "Place your open hand on your chest and move it in a circle." },
  { value: "HELP", label: "Help", hint: "Place one hand on top of the other and lift them together." },
];

export default function PracticePage() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedSign, setSelectedSign] = useState(practiceSigns[0]);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [score, setScore] = useState(0);
  const [isPracticing, setIsPracticing] = useState(false);
  const [feedback, setFeedback] = useState("Start your camera to begin practicing.");
  const [practiceCount, setPracticeCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previousFrameRef = useRef<Uint8ClampedArray | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (feedbackTimerRef.current) clearInterval(feedbackTimerRef.current);
    feedbackTimerRef.current = null;
    previousFrameRef.current = null;
    setIsCameraOn(false);
    setIsPracticing(false);
    setScore(0);
    setFeedback("Start your camera to begin practicing.");
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  useEffect(() => {
    const pendingSign = localStorage.getItem("signbridge_pending_practice");
    if (!pendingSign) return;
    const sign = practiceSigns.find((item) => item.value === pendingSign);
    const timer = window.setTimeout(() => {
      if (sign) setSelectedSign(sign);
    }, 0);
    localStorage.removeItem("signbridge_pending_practice");
    return () => window.clearTimeout(timer);
  }, []);

  const measurePracticeFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    canvas.width = 160;
    canvas.height = 90;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const previous = previousFrameRef.current;

    if (!previous) {
      previousFrameRef.current = new Uint8ClampedArray(pixels);
      return;
    }

    let difference = 0;
    for (let index = 0; index < pixels.length; index += 16) {
      difference += Math.abs(pixels[index] - previous[index]);
    }
    previousFrameRef.current = new Uint8ClampedArray(pixels);

    const motion = difference / (pixels.length / 16);
    const nextScore = Math.min(98, Math.max(35, Math.round(55 + motion * 1.8)));
    setScore(nextScore);
    setFeedback(
      nextScore >= 80
        ? `Good movement detected. Keep practicing "${selectedSign.value}".`
        : "Move your hands clearly in the camera frame and keep your upper body visible.",
    );
  }, [selectedSign.value]);

  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraOn(true);
      setFeedback("Camera ready. Press Start Practice when you are ready.");
    } catch {
      setCameraError("Camera access was denied or is unavailable. Check your browser permissions.");
    }
  };

  const togglePractice = () => {
    if (!isCameraOn) return;
    if (isPracticing) {
      if (feedbackTimerRef.current) clearInterval(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
      setIsPracticing(false);
      setFeedback("Practice paused. Start again when you are ready.");
      return;
    }

    previousFrameRef.current = null;
    setIsPracticing(true);
    setPracticeCount((count) => count + 1);
    setFeedback(`Practice "${selectedSign.value}" and follow the hint below.`);
    feedbackTimerRef.current = setInterval(measurePracticeFrame, 250);
  };

  const selectSign = (value: string) => {
    const sign = practiceSigns.find((item) => item.value === value) ?? practiceSigns[0];
    setSelectedSign(sign);
    setScore(0);
    setFeedback(isCameraOn ? `Ready to practice "${sign.value}".` : "Start your camera to begin practicing.");
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header onSettingsOpen={() => setSettingsOpen(true)} />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Practice Studio</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Practice a sign with your webcam and receive movement feedback.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="practice-sign" className="text-sm text-muted-foreground">Practice:</label>
              <select
                id="practice-sign"
                value={selectedSign.value}
                onChange={(event) => selectSign(event.target.value)}
                className="px-3 py-2 bg-background border border-input rounded-md text-sm"
              >
                {practiceSigns.map((sign) => <option key={sign.value} value={sign.value}>{sign.label}</option>)}
              </select>
            </div>
          </div>

          <section className="border border-border rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Webcam Feed
            </h2>
            <div className="relative aspect-video bg-muted/20 border-2 border-dashed border-border rounded-md overflow-hidden">
              <video ref={videoRef} muted playsInline className={`w-full h-full object-cover ${isCameraOn ? "block" : "hidden"}`} />
              {!isCameraOn && (
                <div className="absolute inset-0 flex items-center justify-center text-center text-muted-foreground">
                  <div>
                    <CameraOff className="h-12 w-12 mx-auto mb-2" />
                    <p>Camera is off</p>
                    <p className="text-sm">Enable your camera to practice signing.</p>
                  </div>
                </div>
              )}
              {isPracticing && (
                <div className="absolute top-3 left-3 rounded bg-black/70 text-white px-3 py-1 text-xs">
                  Practice in progress
                </div>
              )}
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex flex-wrap gap-2 mt-4">
              <Button onClick={isCameraOn ? stopCamera : startCamera}>
                {isCameraOn ? <CameraOff className="h-4 w-4 mr-2" /> : <Camera className="h-4 w-4 mr-2" />}
                {isCameraOn ? "Turn Off Camera" : "Enable Camera"}
              </Button>
              <Button variant="outline" onClick={togglePractice} disabled={!isCameraOn}>
                {isPracticing ? "Pause Practice" : "Start Practice"}
              </Button>
              <Button variant="ghost" onClick={() => { setScore(0); setFeedback("Ready for another attempt."); }} disabled={!isCameraOn}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Attempt
              </Button>
            </div>
            {cameraError && <p className="text-sm text-destructive mt-3">{cameraError}</p>}
            <p className="text-xs text-muted-foreground mt-3">
              Center your upper body, use good lighting, and keep both hands visible.
            </p>
          </section>

          <section className="border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Real-time Feedback
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Practice Activity Score:</span>
                  <span className={`text-sm font-semibold ${score >= 80 ? "text-green-500" : "text-amber-500"}`}>{score}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className={`h-2 rounded-full transition-all ${score >= 80 ? "bg-green-500" : "bg-amber-500"}`} style={{ width: `${score}%` }} />
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{feedback}</span>
              </div>
              <div className="rounded-md bg-muted/30 p-3 text-sm">
                <strong>{selectedSign.label}:</strong> {selectedSign.hint}
              </div>
              <p className="text-xs text-muted-foreground">
                Activity score uses local camera movement feedback. Full hand-shape accuracy requires a MediaPipe/WLASL model.
                Attempts this session: {practiceCount}
              </p>
            </div>
          </section>
        </div>
      </main>
      <FooterStatus />
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
