"use client";

export function FooterStatus() {
  return (
    <footer className="border-t border-border bg-background/95 px-4 py-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>Audio: Ready</span>
          <span>|</span>
          <span>Gloss: Gemini</span>
          <span>|</span>
          <span>Avatar: Ready</span>
        </div>
      </div>
    </footer>
  );
}
