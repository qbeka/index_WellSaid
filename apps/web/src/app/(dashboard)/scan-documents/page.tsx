"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ScanDocumentsPage = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch {
      setError("Could not access camera. Please allow camera permissions.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current || capturing) return;
    setCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    try {
      const res = await fetch("/api/scan-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });

      if (res.ok) {
        stream?.getTracks().forEach((t) => t.stop());
        router.push("/documents");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to process document.");
        setCapturing(false);
      }
    } catch {
      setError("Failed to process document. Please try again.");
      setCapturing(false);
    }
  };

  if (error && !stream) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-center text-sm text-[var(--color-danger)]">
          {error}
        </p>
        <Link
          href="/documents"
          tabIndex={0}
          className="text-sm font-medium text-[var(--color-accent)]"
        >
          Go to Documents
        </Link>
      </div>
    );
  }

  return (
    <div className="-mx-4 -my-6 flex min-h-[calc(100vh-3.5rem)] flex-col bg-black">
      <div className="absolute left-4 top-[4.5rem] z-10">
        <Link
          href="/documents"
          aria-label="Back to documents"
          tabIndex={0}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
        >
          <ArrowLeft size={18} />
        </Link>
      </div>

      <div className="relative flex-1">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {error && (
        <p className="bg-[var(--color-danger)] px-4 py-2 text-center text-sm text-white">
          {error}
        </p>
      )}

      <div className="flex items-center justify-center bg-black py-6">
        <button
          type="button"
          onClick={handleCapture}
          disabled={capturing || !stream}
          aria-label="Capture document"
          tabIndex={0}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[var(--color-foreground)] shadow-lg transition-all active:scale-90 disabled:opacity-50"
        >
          {capturing ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <Camera size={24} />
          )}
        </button>
      </div>
    </div>
  );
};

export default ScanDocumentsPage;
