"use client";

import { X, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { SessionLog } from "@/types";

const STORAGE_KEY = "signbridge_sessions";

interface SessionLogDrawerProps {
  open: boolean;
  onClose: () => void;
}

function readSessions(): SessionLog[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
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

export function SessionLogDrawer({ open, onClose }: SessionLogDrawerProps) {
  const [sessions, setSessions] = useState<SessionLog[]>([]);

  useEffect(() => {
    const refreshSessions = () => setSessions(readSessions());
    window.addEventListener("sessionLogChanged", refreshSessions);
    return () => window.removeEventListener("sessionLogChanged", refreshSessions);
  }, []);

  const reloadSession = (session: SessionLog) => {
    window.dispatchEvent(
      new CustomEvent("transcriptUpdate", {
        detail: { text: session.transcript, source: "session" },
      }),
    );
    onClose();
  };

  const clearSessions = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSessions([]);
    window.dispatchEvent(new Event("sessionLogChanged"));
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" onClick={onClose} />
      <aside className="fixed right-0 top-0 h-full w-full max-w-md bg-background border-l border-border z-50 p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Saved Sessions</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Stored on this device only.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close session log">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No saved sessions yet. Complete a translation to add one.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="border border-border rounded-md p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {session.timestamp} · {session.source}
                      </p>
                      <p className="text-sm font-medium mt-1 break-words">
                        {session.transcript}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground mt-1 break-words">
                        {session.gloss}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => reloadSession(session)}
                      title="Reload session"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reload
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-5" onClick={clearSessions}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Session Log
            </Button>
          </>
        )}
      </aside>
    </>
  );
}
