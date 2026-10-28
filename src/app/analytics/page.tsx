"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/layout/header";
import { FooterStatus } from "@/components/layout/footer-status";
import { SettingsDrawer } from "@/components/layout/settings-drawer";
import { BarChart3, Clock, FileAudio, Mic, Upload, Zap } from "lucide-react";
import { SessionLog, SessionSource } from "@/types";

const STORAGE_KEY = "signbridge_sessions";
const sources: SessionSource[] = ["microphone", "upload", "preset"];

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
        sources.includes((session as { source?: unknown }).source as SessionSource),
    );
  } catch {
    return [];
  }
}

function getDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatSource(source: SessionSource) {
  return source === "microphone" ? "Microphone" : source === "upload" ? "Uploaded audio" : "Quick preset";
}

export default function AnalyticsPage() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [currentDay, setCurrentDay] = useState<Date | null>(null);

  useEffect(() => {
    const refresh = () => setSessions(readSessions());
    refresh();
    const timeUpdate = window.setTimeout(() => setCurrentDay(new Date()), 0);
    window.addEventListener("sessionLogChanged", refresh);
    return () => {
      window.clearTimeout(timeUpdate);
      window.removeEventListener("sessionLogChanged", refresh);
    };
  }, []);

  const latencyValues = sessions
    .map((session) => session.latencyMs)
    .filter((latency): latency is number => typeof latency === "number" && latency >= 0);
  const averageLatency = latencyValues.length
    ? `${Math.round(latencyValues.reduce((total, latency) => total + latency, 0) / latencyValues.length)}ms`
    : "Not measured";

  const dailyUsage = useMemo(() => {
    if (!currentDay) {
      return Array.from({ length: 7 }, () => ({ label: "—", count: 0 }));
    }

    const today = currentDay;
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setHours(0, 0, 0, 0);
      date.setDate(today.getDate() - (6 - index));
      const count = sessions.filter((session) => {
        const sessionDate = new Date(session.timestamp);
        return !Number.isNaN(sessionDate.getTime()) && getDayKey(sessionDate) === getDayKey(date);
      }).length;
      return {
        label: date.toLocaleDateString(undefined, { weekday: "short" }),
        count,
      };
    });
  }, [currentDay, sessions]);

  const sourceCounts = sources.map((source) => ({
    source,
    count: sessions.filter((session) => session.source === source).length,
  }));
  const maxDailyUsage = Math.max(...dailyUsage.map((day) => day.count), 1);
  return (
    <div className="h-screen flex flex-col bg-background">
      <Header onSettingsOpen={() => setSettingsOpen(true)} />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Analytics</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Total Sessions</span>
              </div>
              <div className="text-2xl font-bold">{sessions.length}</div>
            </div>
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Avg Latency</span>
              </div>
              <div className="text-2xl font-bold text-lg">{averageLatency}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Measured during translation
              </p>
            </div>
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Accuracy</span>
              </div>
              <div className="text-2xl font-bold">Not measured</div>
              <p className="text-xs text-muted-foreground mt-1">
                Hand-sign recognition is not connected
              </p>
            </div>
          </div>
          <div className="border border-border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Usage Overview</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Translation sessions completed over the last seven days.
            </p>
            <div className="h-52 flex items-end gap-3 border-b border-border px-2">
              {dailyUsage.map((day, index) => (
                <div key={`${day.label}-${index}`} className="flex-1 h-full flex flex-col items-center justify-end gap-2">
                  <span className="text-xs text-muted-foreground">{day.count}</span>
                  <div
                    className="w-full max-w-12 rounded-t bg-primary/70 min-h-1 transition-all"
                    style={{ height: `${Math.max((day.count / maxDailyUsage) * 75, day.count ? 8 : 2)}%` }}
                    title={`${day.count} session${day.count === 1 ? "" : "s"} on ${day.label}`}
                  />
                  <span className="text-xs text-muted-foreground">{day.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {sourceCounts.map(({ source, count }) => {
                const Icon = source === "microphone" ? Mic : source === "upload" ? Upload : FileAudio;
                return (
                  <div key={source} className="rounded-md bg-muted/30 p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" />
                      {formatSource(source)}
                    </div>
                    <div className="text-lg font-semibold mt-1">{count}</div>
                  </div>
                );
              })}
            </div>
            {sessions.length === 0 && (
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                Complete a translation to start building analytics.
              </div>
            )}
            <p className="mt-5 text-xs text-muted-foreground">
              Analytics are stored locally in this browser. Accuracy is only available after a real hand-sign recognition model is connected.
            </p>
          </div>
        </div>
      </main>
      <FooterStatus />
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
