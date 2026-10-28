"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Info, Search, X } from "lucide-react";
import { Header } from "@/components/layout/header";
import { FooterStatus } from "@/components/layout/footer-status";
import { SettingsDrawer } from "@/components/layout/settings-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SignEntry {
  word: string;
  gloss: string;
  note: string;
  animation: string | null;
  animationNote: string;
}

const signs: SignEntry[] = [
  {
    word: "Hello",
    gloss: "HELLO",
    note: "Wave one open hand near your head.",
    animation: "HELLO.fbx",
    animationNote: "Exact animation available.",
  },
  {
    word: "Thank You",
    gloss: "THANK YOU",
    note: "Touch your fingers near your chin and move your hand forward.",
    animation: null,
    animationNote: "No exact animation has been added yet.",
  },
  {
    word: "Help",
    gloss: "HELP",
    note: "Place a closed fist on an open palm and lift both hands.",
    animation: "Pointing.fbx",
    animationNote: "Closest available gesture: Pointing.",
  },
  {
    word: "Welcome",
    gloss: "WELCOME",
    note: "Move open palms toward your body.",
    animation: "Waving.fbx",
    animationNote: "Closest available gesture: Waving.",
  },
  {
    word: "Class",
    gloss: "CLASS",
    note: "Use both hands to form C shapes.",
    animation: null,
    animationNote: "No exact animation has been added yet.",
  },
];

export default function DictionaryPage() {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedSign, setSelectedSign] = useState<SignEntry | null>(null);

  const filteredSigns = useMemo(
    () =>
      signs.filter((sign) =>
        `${sign.word} ${sign.gloss} ${sign.note}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [search],
  );

  const sendToTranslator = (sign: SignEntry) => {
    localStorage.setItem(
      "signbridge_pending_gloss",
      JSON.stringify({ text: sign.word, gloss: sign.gloss }),
    );
    router.push("/");
  };

  const openPractice = (sign: SignEntry) => {
    localStorage.setItem("signbridge_pending_practice", sign.gloss);
    router.push(`/practice?sign=${encodeURIComponent(sign.gloss)}`);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header onSettingsOpen={() => setSettingsOpen(true)} />
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Sign Dictionary</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Search a sign to view its guidance and available avatar animation.
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              {filteredSigns.length} of {signs.length} signs
            </span>
          </div>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for signs..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-10"
              aria-label="Search signs"
            />
          </div>

          {filteredSigns.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-10 text-center text-sm text-muted-foreground">
              No signs match “{search}”.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSigns.map((sign) => (
                <article
                  key={sign.word}
                  className="border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setSelectedSign(sign)}
                  >
                    <div className="aspect-video bg-muted/20 rounded-md mb-3 flex flex-col items-center justify-center gap-2">
                      {sign.animation ? (
                        <>
                          <CheckCircle2 className="h-8 w-8 text-green-500" />
                          <span className="text-xs text-green-600">Animation available</span>
                        </>
                      ) : (
                        <>
                          <Info className="h-8 w-8 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Guidance only</span>
                        </>
                      )}
                    </div>
                    <h3 className="font-semibold mb-1">{sign.word}</h3>
                    <p className="text-sm text-muted-foreground">{sign.note}</p>
                  </button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => sendToTranslator(sign)}
                  >
                    Use in Translator
                  </Button>
                </article>
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedSign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close sign details"
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedSign(null)}
          />
          <section className="relative z-10 w-full max-w-md bg-background border border-border rounded-lg p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{selectedSign.word}</h2>
                <p className="text-xs font-mono text-muted-foreground mt-1">
                  Gloss: {selectedSign.gloss}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedSign(null)} aria-label="Close">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm mt-4">{selectedSign.note}</p>
            <p className="text-xs text-muted-foreground mt-3">
              {selectedSign.animationNote}
            </p>
            <div className="flex gap-2 mt-6">
              <Button onClick={() => sendToTranslator(selectedSign)}>Use in Translator</Button>
              <Button variant="outline" onClick={() => openPractice(selectedSign)}>
                Practice Sign
              </Button>
            </div>
          </section>
        </div>
      )}

      <FooterStatus />
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
