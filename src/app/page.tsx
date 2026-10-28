"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { FooterStatus } from "@/components/layout/footer-status";
import { SettingsDrawer } from "@/components/layout/settings-drawer";
import { AudioInputPanel } from "@/components/dashboard/audio-input-panel";
import { TranscriptPanel } from "@/components/dashboard/transcript-panel";
import { AvatarViewport } from "@/components/dashboard/avatar-viewport";

export default function Home() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header onSettingsOpen={() => setSettingsOpen(true)} />
      <main className="flex-1 overflow-hidden p-4">
        <div className="h-full grid grid-cols-12 gap-4">
          <div className="col-span-3 border border-border rounded-lg p-4 overflow-auto">
            <AudioInputPanel />
          </div>
          <div className="col-span-5 border border-border rounded-lg p-4 overflow-auto">
            <TranscriptPanel />
          </div>
          <div className="col-span-4 border border-border rounded-lg p-4 overflow-auto">
            <AvatarViewport />
          </div>
        </div>
      </main>
      <FooterStatus />
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
