"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { PREFERENCES_CHANGED_EVENT } from "./preferences-sync";
import { SessionLog } from "@/types";

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [fontSize, setFontSize] = useState("medium");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [averageLatency, setAverageLatency] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const loadPreferences = window.setTimeout(() => {
      setTheme(localStorage.getItem("signbridge_theme") === "dark" ? "dark" : "light");
      setFontSize(localStorage.getItem("signbridge_font_size") || "medium");
      setReducedMotion(localStorage.getItem("signbridge_reduced_motion") === "true");

      try {
        const parsed: unknown = JSON.parse(localStorage.getItem("signbridge_sessions") || "[]");
        const latencies = Array.isArray(parsed)
          ? parsed
              .filter((session): session is SessionLog =>
                typeof session === "object" &&
                session !== null &&
                typeof (session as SessionLog).latencyMs === "number",
              )
              .map((session) => session.latencyMs as number)
          : [];
        setAverageLatency(
          latencies.length
            ? `${Math.round(latencies.reduce((total, latency) => total + latency, 0) / latencies.length)}ms`
            : null,
        );
      } catch {
        setAverageLatency(null);
      }
    }, 0);

    return () => window.clearTimeout(loadPreferences);
  }, [open]);

  const updatePreference = (key: string, value: string) => {
    localStorage.setItem(key, value);
    window.dispatchEvent(new Event(PREFERENCES_CHANGED_EVENT));
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-80 bg-background border-l border-border z-50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Accessibility & System</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-medium mb-2">Theme</h3>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                const nextTheme = theme === "dark" ? "light" : "dark";
                setTheme(nextTheme);
                updatePreference("signbridge_theme", nextTheme);
              }}
            >
              {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            </Button>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Font Size</h3>
            <select
              value={fontSize}
              onChange={(event) => {
                setFontSize(event.target.value);
                updatePreference("signbridge_font_size", event.target.value);
              }}
              className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          <div>
            <label className="flex items-center justify-between gap-3 text-sm font-medium">
              <span>Reduce motion</span>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(event) => {
                  const enabled = event.target.checked;
                  setReducedMotion(enabled);
                  updatePreference("signbridge_reduced_motion", String(enabled));
                }}
              />
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              Minimizes interface transitions and animation effects.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Latency Stats</h3>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Translation average</span>
                <span>{averageLatency || "Not measured"}</span>
              </div>
              <div className="flex justify-between">
                <span>Gloss Processing</span>
                <span>Not measured</span>
              </div>
              <div className="flex justify-between">
                <span>3D Rendering</span>
                <span>Not measured</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Timing is collected from completed translations saved on this device.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
