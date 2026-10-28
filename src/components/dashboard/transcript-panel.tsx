"use client";

import { Edit, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { SessionLog, SessionSource } from "@/types";

const STORAGE_KEY = "signbridge_sessions";

export function TranscriptPanel() {
  const [transcript, setTranscript] = useState("");
  const [gloss, setGloss] = useState("");
  const [recentSessions, setRecentSessions] = useState<SessionLog[]>([]);
  const [isEditingGloss, setIsEditingGloss] = useState(false);

  useEffect(() => {
    const refreshHistory = () => setRecentSessions(readSessions());
    const initialLoad = window.setTimeout(refreshHistory, 0);
    window.addEventListener("sessionLogChanged", refreshHistory);

    const handleTranscriptUpdate = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const text = typeof customEvent.detail.text === "string"
        ? customEvent.detail.text.trim()
        : "";
      const source: SessionSource | "session" =
        customEvent.detail.source || "microphone";
      const startedAt = performance.now();
      const savedGloss = typeof customEvent.detail.gloss === "string"
        ? customEvent.detail.gloss
        : "";
      if (!text) return;

      setTranscript(text);
      try {
        const glossText = savedGloss || await getGloss(text);
        setGloss(glossText);
        window.dispatchEvent(new CustomEvent("glossUpdate", { detail: { gloss: glossText } }));
        saveSession(text, glossText, source, performance.now() - startedAt);
      } catch {
        const glossText = text.toUpperCase().replace(/[.,!?]/g, "").split(/\s+/).filter(Boolean).join(" ");
        setGloss(glossText);
        window.dispatchEvent(new CustomEvent("glossUpdate", { detail: { gloss: glossText } }));
        saveSession(text, glossText, source, performance.now() - startedAt);
      }
    };

    window.addEventListener("transcriptUpdate", handleTranscriptUpdate);
    return () => {
      window.removeEventListener("sessionLogChanged", refreshHistory);
      window.removeEventListener("transcriptUpdate", handleTranscriptUpdate);
      window.clearTimeout(initialLoad);
    };
  }, []);

  const copyTranslation = async () => {
    const text = `Transcript: ${transcript}\nGloss: ${gloss}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      console.error("Unable to copy translation.");
    }
  };

  const exportFile = (extension: "srt" | "txt") => {
    if (!transcript && !gloss) return;

    const content = extension === "srt"
      ? `1\n00:00:00,000 --> 00:00:05,000\n${transcript || gloss}\n\n`
      : `Transcript: ${transcript}\nGloss: ${gloss}\n`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `signbridge-${new Date().toISOString().slice(0, 10)}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      <div>
        <h2 className="text-sm font-semibold mb-3">LIVE TRANSCRIPT & GLOSS</h2>
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1">
            Transcript (EN-US):
          </div>
          <div className="border border-border rounded-md p-3 min-h-[60px] bg-muted/20 text-sm">
            {transcript || "Listening..."}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            This box shows the words detected from your voice or uploaded audio.
          </p>
        </div>
        <div className="mb-3">
          <div className="text-xs text-muted-foreground mb-1">
            Gloss Output (ASL):
          </div>
          {isEditingGloss ? (
            <textarea
              value={gloss}
              onChange={(e) => setGloss(e.target.value.toUpperCase())}
              aria-label="Edit ASL gloss"
              className="w-full border border-border rounded-md p-3 min-h-[60px] bg-muted/20 text-sm font-mono resize-y"
            />
          ) : (
            <div className="border border-border rounded-md p-3 min-h-[60px] bg-muted/20 text-sm font-mono">
              {gloss || "Processing..."}
            </div>
          )}
          <p className="mt-1 text-[11px] text-muted-foreground">
            This box shows the ASL gloss that the avatar uses to choose animations.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const nextEditingState = !isEditingGloss;
              setIsEditingGloss(nextEditingState);
              if (!nextEditingState && gloss) {
                window.dispatchEvent(
                  new CustomEvent("glossUpdate", { detail: { gloss } }),
                );
              }
            }}
          >
            <Edit className="h-3 w-3 mr-1" />
            {isEditingGloss ? "Done Editing" : "Edit Gloss"}
          </Button>
          <Button variant="outline" size="sm" onClick={copyTranslation}>
            <Copy className="h-3 w-3 mr-1" />
            Copy Text
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportFile("srt")}>
            <Download className="h-3 w-3 mr-1" />
            Export .SRT
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportFile("txt")}>
            <Download className="h-3 w-3 mr-1" />
            Export .TXT
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Edit the ASL gloss, copy both text results, or download them as subtitle or text files.
        </p>
      </div>

      <div className="mt-auto">
        <h3 className="text-sm font-medium mb-2">History:</h3>
        {recentSessions.length === 0 ? (
          <p className="text-xs italic text-muted-foreground">No recent history</p>
        ) : (
          <ul className="space-y-1 text-xs">
            {recentSessions.slice(0, 3).map((session) => (
              <li key={session.id}>
                <button
                  type="button"
                  className="text-left text-muted-foreground hover:text-foreground hover:underline"
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("transcriptUpdate", {
                        detail: {
                          text: session.transcript,
                          gloss: session.gloss,
                          source: "session",
                        },
                      }),
                    );
                  }}
                >
                  • {getSessionTitle(session.transcript)} ({formatRelativeTime(session.timestamp)})
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function readSessions(): SessionLog[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (session): session is SessionLog =>
        typeof session === "object" &&
        session !== null &&
        typeof session.id === "string" &&
        typeof session.timestamp === "string" &&
        typeof session.transcript === "string" &&
        typeof session.gloss === "string" &&
        (session.source === "microphone" ||
          session.source === "upload" ||
          session.source === "preset"),
    );
  } catch {
    return [];
  }
}

async function getGloss(text: string): Promise<string> {
  const response = await fetch("/api/gloss", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  const data = await response.json();
  return typeof data.gloss === "string" && data.gloss
    ? data.gloss
    : text.toUpperCase().replace(/[.,!?]/g, "").split(/\s+/).filter(Boolean).join(" ");
}

function getSessionTitle(transcript: string) {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const title = words.slice(0, 5).join(" ");
  return words.length > 5 ? `${title}...` : title;
}

function formatRelativeTime(timestamp: string) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;

  const elapsedMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (elapsedMinutes < 1) return "Just now";
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
  if (elapsedMinutes < 1440) return `${Math.floor(elapsedMinutes / 60)}h ago`;
  if (elapsedMinutes < 2880) return "Yesterday";
  return date.toLocaleDateString();
}

function saveSession(
  transcript: string,
  gloss: string,
  source: SessionSource | "session",
  latencyMs: number,
) {
  if (source === "session") return;

  const session: SessionLog = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toLocaleString(),
    transcript,
    gloss,
    source,
    latencyMs: Math.round(latencyMs),
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const existing: unknown = stored ? JSON.parse(stored) : [];
    const sessions = Array.isArray(existing) ? existing : [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify([session, ...sessions]));
    window.dispatchEvent(new Event("sessionLogChanged"));
  } catch {
    console.error("Unable to save session log.");
  }
}
