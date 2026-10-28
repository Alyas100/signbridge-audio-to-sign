export type InputMode = "mic" | "file";

export type SessionSource = "microphone" | "upload" | "preset";

export interface SessionLog {
  id: string;
  timestamp: string;
  transcript: string;
  gloss: string;
  source: SessionSource;
  latencyMs?: number;
}

export interface GlossItem {
  text: string;
  timestamp: number;
}
