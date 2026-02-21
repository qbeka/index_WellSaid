"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Upload, Loader2, ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "@/i18n";

const ScanDocumentsPage = () => {
  const { t } = useTranslation();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [cameraFailed, setCameraFailed] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      setCameraFailed(true);
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const processImage = async (dataUrl: string) => {
    setCapturing(true);
    setError("");

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
        setError(data.error || t("scan.failedToProcess"));
        setCapturing(false);
      }
    } catch {
      setError(t("scan.failedToProcess"));
      setCapturing(false);
    }
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || capturing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    processImage(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        processImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  if (cameraFailed && !stream) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-background-muted)]">
          <ImageIcon size={28} className="text-[var(--color-muted)]" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            {t("scan.cameraUnavailable")}
          </h2>
          <p className="max-w-xs text-center text-[15px] text-[var(--color-muted)]">
            {t("scan.uploadInstead")}
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {capturing ? (
          <div className="flex h-14 w-full max-w-xs items-center justify-center gap-3 rounded-2xl bg-[var(--color-accent)] text-[15px] font-medium text-white">
            <Loader2 size={20} className="animate-spin" />
            {t("common.processing")}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label={t("scan.uploadPhoto")}
            tabIndex={0}
            className="flex h-14 w-full max-w-xs items-center justify-center gap-3 rounded-2xl bg-[var(--color-accent)] text-[15px] font-medium text-white transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Upload size={20} aria-hidden="true" />
            {t("scan.uploadPhoto")}
          </button>
        )}

        {error && (
          <p className="text-center text-sm text-[var(--color-danger)]">
            {error}
          </p>
        )}

        <Link
          href="/documents"
          tabIndex={0}
          className="text-[14px] font-medium text-[var(--color-accent)]"
        >
          {t("scan.backToDocuments")}
        </Link>
      </div>
    );
  }

  return (
    <div className="-mx-5 flex min-h-[calc(100vh-3.5rem)] flex-col bg-black">
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
        <p className="bg-[var(--color-danger)] px-4 py-2 text-center text-[15px] text-white">
          {error}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="flex items-center justify-center gap-6 bg-black py-6">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={capturing}
          aria-label={t("scan.uploadFromGallery")}
          tabIndex={0}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 text-white transition-all active:scale-90 disabled:opacity-50"
        >
          <Upload size={20} />
        </button>

        <button
          type="button"
          onClick={handleCapture}
          disabled={capturing || !stream}
          aria-label={t("scan.captureDocument")}
          tabIndex={0}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-[var(--color-foreground)] shadow-lg transition-all active:scale-90 disabled:opacity-50"
        >
          {capturing ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <Camera size={24} />
          )}
        </button>

        <div className="h-12 w-12" />
      </div>
    </div>
  );
};

export default ScanDocumentsPage;
