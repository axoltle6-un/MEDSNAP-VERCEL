"use client";

import * as React from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { triggerHapticFeedback } from "@/lib/native-mobile";

interface VoiceSearchButtonProps {
  onTranscript: (transcript: string) => void;
  className?: string;
}

/**
 * Speech-to-Text Voice Search Button component.
 * Uses Web Speech API (webkitSpeechRecognition) to capture voice queries for medicine lookups.
 */
export function VoiceSearchButton({ onTranscript, className = "" }: VoiceSearchButtonProps) {
  const [listening, setListening] = React.useState(false);

  function startListening() {
    void triggerHapticFeedback();

    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Voice search is not supported on this browser.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setListening(true);
        toast.info("Listening for medicine name…", { duration: 3000 });
      };

      recognition.onresult = (event: any) => {
        const text = event.results?.[0]?.[0]?.transcript;
        if (text) {
          onTranscript(text);
          toast.success(`Recognized: "${text}"`);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn("[VoiceSearch] Error:", err);
        toast.error("Could not recognize voice. Please try typing.");
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error("[VoiceSearch] Startup error:", err);
      setListening(false);
    }
  }

  return (
    <button
      type="button"
      onClick={startListening}
      aria-label="Voice Search"
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
        listening
          ? "bg-danger text-white animate-pulse shadow-glow"
          : "text-muted-foreground hover:bg-primary/10 hover:text-primary active:scale-95"
      } ${className}`}
    >
      {listening ? <Mic className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
    </button>
  );
}
