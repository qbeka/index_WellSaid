"use client";

import { useState, useRef, useCallback } from "react";
import { LANG_TO_BCP47 } from "@wellsaid/shared";

type UseTranscriptionOptions = {
  language?: string;
  maxRetries?: number;
};

/**
 * Unified transcription hook. Tries AssemblyAI real-time streaming first,
 * falls back to the browser Web Speech API if the token endpoint returns 503
 * (i.e. ASSEMBLYAI_API_KEY is not configured).
 *
 * Includes automatic retry on AssemblyAI WebSocket disconnection (up to maxRetries).
 */
export const useTranscription = (options: UseTranscriptionOptions = {}) => {
  const { language = "en", maxRetries = 2 } = options;
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const modeRef = useRef<"assemblyai" | "webspeech" | null>(null);
  const transcriptRef = useRef("");
  const retriesRef = useRef(0);
  const intentionalStopRef = useRef(false);

  const cleanup = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
    processorRef.current?.disconnect();
    processorRef.current = null;
    contextRef.current?.close();
    contextRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    modeRef.current = null;
  }, []);

  const startWebSpeech = useCallback(() => {
    const SR =
      typeof window !== "undefined"
        ? (window as unknown as Record<string, unknown>).SpeechRecognition ||
          (window as unknown as Record<string, unknown>).webkitSpeechRecognition
        : null;
    if (!SR) {
      setError("Speech recognition not supported in this browser.");
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SR as any)();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = LANG_TO_BCP47[language] || "en-US";

    let final = "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) {
          final += r[0].transcript + " ";
        } else {
          interim += r[0].transcript;
        }
      }
      transcriptRef.current = final + interim;
      setTranscript(final + interim);
    };

    recognition.onerror = () => {
      setIsListening(false);
      modeRef.current = null;
    };

    recognition.onend = () => {
      if (modeRef.current === "webspeech" && !intentionalStopRef.current) {
        try {
          recognition.start();
        } catch {
          /* already stopped */
        }
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    modeRef.current = "webspeech";
    setIsListening(true);
  }, [language]);

  const startAssemblyAI = useCallback(
    async (token: string) => {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      const ctx = new AudioContext({ sampleRate: 16000 });
      contextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const ws = new WebSocket(
        `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`
      );
      socketRef.current = ws;

      let final = transcriptRef.current;

      ws.onopen = () => {
        source.connect(processor);
        processor.connect(ctx.destination);

        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const pcm = e.inputBuffer.getChannelData(0);
          const int16 = new Int16Array(pcm.length);
          for (let i = 0; i < pcm.length; i++) {
            int16[i] = Math.max(-1, Math.min(1, pcm[i])) * 0x7fff;
          }
          const base64 = btoa(
            String.fromCharCode(...new Uint8Array(int16.buffer))
          );
          ws.send(JSON.stringify({ audio_data: base64 }));
        };
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.message_type === "FinalTranscript" && msg.text) {
          final += msg.text + " ";
          transcriptRef.current = final;
          setTranscript(final);
        } else if (msg.message_type === "PartialTranscript" && msg.text) {
          transcriptRef.current = final + msg.text;
          setTranscript(final + msg.text);
        }
      };

      ws.onerror = async () => {
        if (intentionalStopRef.current) return;

        processorRef.current?.disconnect();
        processorRef.current = null;
        contextRef.current?.close();
        contextRef.current = null;
        socketRef.current = null;

        if (retriesRef.current < maxRetries) {
          retriesRef.current++;
          try {
            const res = await fetch("/api/assemblyai-token", {
              method: "POST",
            });
            if (res.ok) {
              const { token: newToken } = await res.json();
              await startAssemblyAI(newToken);
              return;
            }
          } catch {
            /* fall through */
          }
        }

        cleanup();
        setIsListening(false);
        setError("Connection lost. Please try again.");
      };

      ws.onclose = () => {
        if (modeRef.current === "assemblyai" && !intentionalStopRef.current) {
          setIsListening(false);
          modeRef.current = null;
        }
      };

      modeRef.current = "assemblyai";
      setIsListening(true);
    },
    [cleanup, maxRetries]
  );

  const start = useCallback(async () => {
    setError(null);
    setTranscript("");
    transcriptRef.current = "";
    retriesRef.current = 0;
    intentionalStopRef.current = false;

    try {
      const res = await fetch("/api/assemblyai-token", { method: "POST" });
      if (res.ok) {
        const { token } = await res.json();
        await startAssemblyAI(token);
        return;
      }
    } catch {
      /* fall through to Web Speech */
    }

    startWebSpeech();
  }, [startAssemblyAI, startWebSpeech]);

  const stop = useCallback(() => {
    intentionalStopRef.current = true;
    if (modeRef.current === "assemblyai") {
      try {
        socketRef.current?.send(JSON.stringify({ terminate_session: true }));
      } catch {
        /* socket may be closed */
      }
    }
    cleanup();
    setIsListening(false);
  }, [cleanup]);

  const getTranscript = useCallback(() => transcriptRef.current, []);

  return { transcript, isListening, error, start, stop, getTranscript };
};
