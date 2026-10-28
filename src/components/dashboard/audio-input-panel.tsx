"use client";

import { Mic, Upload, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { InputMode } from "@/types";
import { SessionLogDrawer } from "./session-log-drawer";

export function AudioInputPanel() {
  const [isActive, setIsActive] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("mic");
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isSessionLogOpen, setIsSessionLogOpen] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const pending = localStorage.getItem("signbridge_pending_gloss");
    if (pending) {
      const timer = window.setTimeout(() => {
      try {
        const { text, gloss } = JSON.parse(pending) as { text?: string; gloss?: string };
        if (text) {
          setTranscript(text);
          window.dispatchEvent(new CustomEvent("transcriptUpdate", {
            detail: { text, gloss, source: "session" },
          }));
        }
      } catch {
        console.error("Unable to load dictionary selection.");
      } finally {
        localStorage.removeItem("signbridge_pending_gloss");
      }
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (isActive && inputMode === "mic") {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100);
      }, 150);
      return () => clearInterval(interval);
    } else {
      const reset = window.setTimeout(() => setAudioLevel(0), 0);
      return () => window.clearTimeout(reset);
    }
  }, [isActive, inputMode]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/wav" });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsActive(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isActive) {
      mediaRecorderRef.current.stop();
      setIsActive(false);
    }
  };

  const transcribeAudio = async (
    audioBlob: Blob,
    source: "microphone" | "upload" = "microphone",
    fileName = "recording.wav",
  ) => {
    setIsTranscribing(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", audioBlob, fileName);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { text?: string; error?: string };
      if (!response.ok) {
        throw new Error(data.error || "The audio could not be transcribed.");
      }
      if (!data.text) {
        throw new Error("No speech was detected in this audio file.");
      }
      setTranscript(data.text);
      window.dispatchEvent(new CustomEvent("transcriptUpdate", {
        detail: { text: data.text, source },
      }));
    } catch (error) {
      console.error("Transcription error:", error);
      setUploadError(error instanceof Error ? error.message : "Unable to transcribe the audio file.");
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleAudioFile = async (file: File) => {
    const allowedExtensions = [".mp3", ".wav", ".m4a"];
    const lowerName = file.name.toLowerCase();
    const isAllowedType = file.type.startsWith("audio/") ||
      allowedExtensions.some((extension) => lowerName.endsWith(extension));

    if (!isAllowedType) {
      setUploadError("Choose an MP3, WAV, or M4A audio file.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setUploadError("Audio files must be 25 MB or smaller.");
      return;
    }

    setSelectedFileName(file.name);
    await transcribeAudio(file, "upload", file.name);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleAudioFile(file);
    e.target.value = "";
  };

  const presets = ["Hello", "Thank You", "Emergency Help", "Repeat"];

  const handlePreset = (preset: string) => {
    setTranscript(preset);
    window.dispatchEvent(
      new CustomEvent("transcriptUpdate", {
        detail: { text: preset, source: "preset" },
      }),
    );
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold mb-3">AUDIO & PRESETS</h2>
        <div className="flex items-center gap-2 mb-2">
          <div
            className={`h-2 w-2 rounded-full ${
              isActive ? "bg-green-500 animate-pulse" : "bg-gray-500"
            }`}
          />
          <span className="text-sm">
            {isActive ? "Microphone Active" : isTranscribing ? "Transcribing..." : "Microphone Inactive"}
          </span>
        </div>
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1">Audio Level:</div>
          <div className="flex gap-0.5 h-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 rounded-sm ${
                  (audioLevel / 100) * 20 > i
                    ? "bg-green-500"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
        <Button
          onClick={isActive ? stopRecording : startRecording}
          className="w-full mb-4"
          variant={isActive ? "destructive" : "default"}
          disabled={isTranscribing}
        >
          <Mic className="h-4 w-4 mr-2" />
          {isActive ? "Stop Recording" : isTranscribing ? "Processing..." : "Start Recording"}
        </Button>
        {transcript && (
          <div className="text-xs p-2 bg-muted/30 rounded mb-2">
            <strong>Last:</strong> {transcript}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Quick Presets:</h3>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <Button
              key={preset}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => handlePreset(preset)}
              disabled={isTranscribing}
            >
              {preset}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Input Mode:</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              checked={inputMode === "mic"}
              onChange={() => setInputMode("mic")}
            />
            <Mic className="h-3 w-3" />
            Mic
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              checked={inputMode === "file"}
              onChange={() => setInputMode("file")}
            />
            <Upload className="h-3 w-3" />
            File Upload
          </label>
        </div>
        {inputMode === "file" && (
          <div className="mt-2">
            <input
              type="file"
              accept=".mp3,.wav,.m4a"
              onChange={handleFileUpload}
              className="hidden"
              id="audio-upload"
              disabled={isTranscribing}
            />
            <label
              htmlFor="audio-upload"
              onDragOver={(event) => {
                event.preventDefault();
                setIsDraggingFile(true);
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDraggingFile(false);
                const file = event.dataTransfer.files[0];
                if (file) void handleAudioFile(file);
              }}
              className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer block ${
                isDraggingFile ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <Upload className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
              <div className="text-xs text-muted-foreground">
                {isTranscribing ? "Transcribing..." : "Drop .mp3 / .wav files"}
              </div>
              {selectedFileName && !isTranscribing && (
                <div className="text-xs text-foreground mt-1 truncate" title={selectedFileName}>
                  Selected: {selectedFileName}
                </div>
              )}
            </label>
            {uploadError && (
              <p role="alert" className="text-xs text-destructive mt-2">
                {uploadError}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-auto">
        <h3 className="text-sm font-medium mb-2">Saved Sessions:</h3>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={() => {
            setIsSessionLogOpen(true);
            window.dispatchEvent(new Event("sessionLogChanged"));
          }}
        >
          <FolderOpen className="h-4 w-4 mr-2" />
          Open Session Log
        </Button>
      </div>
      <SessionLogDrawer
        open={isSessionLogOpen}
        onClose={() => setIsSessionLogOpen(false)}
      />
    </div>
  );
}
