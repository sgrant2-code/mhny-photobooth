"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./styles.module.css";

type BoothState = "loading" | "ready" | "countdown" | "capturing" | "review" | "blocked" | "error";

const PHOTO_COUNT = 4;
const COUNTDOWN_SECONDS = [3, 2, 1];

const pause = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not prepare the photo strip."));
    image.src = source;
  });
}

function drawCover(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource & { width: number; height: number },
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const sourceRatio = image.width / image.height;
  const targetRatio = width / height;

  let sourceWidth = image.width;
  let sourceHeight = image.height;
  let sourceX = 0;
  let sourceY = 0;

  if (sourceRatio > targetRatio) {
    sourceWidth = image.height * targetRatio;
    sourceX = (image.width - sourceWidth) / 2;
  } else {
    sourceHeight = image.width / targetRatio;
    sourceY = (image.height - sourceHeight) / 2;
  }

  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const stripUrlRef = useRef<string | null>(null);
  const [boothState, setBoothState] = useState<BoothState>("loading");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [captureNumber, setCaptureNumber] = useState(0);
  const [flashVisible, setFlashVisible] = useState(false);
  const [stripUrl, setStripUrl] = useState<string | null>(null);
  const [stripBlob, setStripBlob] = useState<Blob | null>(null);
  const [message, setMessage] = useState("");

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    setBoothState("loading");
    setMessage("");
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "user" },
          height: { ideal: 1920 },
          width: { ideal: 1080 },
        },
      });

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      await video.play();
      setBoothState("ready");
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      if (name === "NotAllowedError" || name === "SecurityError") {
        setBoothState("blocked");
      } else {
        setBoothState("error");
        setMessage("We couldn’t start your camera. Check that another app is not using it, then try again.");
      }
    }
  };

  useEffect(() => {
    void startCamera();

    return () => {
      stopCamera();
      if (stripUrlRef.current) URL.revokeObjectURL(stripUrlRef.current);
    };
  }, []);

  const takePhoto = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      throw new Error("The camera is not ready yet.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser cannot capture a photo.");

    // Mirror the saved image so it matches the familiar mirrored front-camera preview.
    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.92);
  };

  const makePhotoStrip = async (photos: string[]) => {
    const images = await Promise.all(photos.map(loadImage));
    const outerBorder = 42;
    const gap = 20;
    const photoWidth = 876;
    const photoHeight = 1095;
    const canvas = document.createElement("canvas");
    canvas.width = photoWidth + outerBorder * 2;
    canvas.height = outerBorder * 2 + photoHeight * PHOTO_COUNT + gap * (PHOTO_COUNT - 1);

    const context = canvas.getContext("2d");
    if (!context) throw new Error("This browser cannot make the photo strip.");

    context.fillStyle = "#f8f4ee";
    context.fillRect(0, 0, canvas.width, canvas.height);

    images.forEach((image, index) => {
      const y = outerBorder + index * (photoHeight + gap);
      drawCover(context, image, outerBorder, y, photoWidth, photoHeight);
    });

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error("The finished strip could not be saved."));
      }, "image/jpeg", 0.94);
    });

    return blob;
  };

  const triggerFlash = async () => {
    setFlashVisible(true);
    await pause(110);
    setFlashVisible(false);
  };

  const beginSession = async () => {
    if (boothState !== "ready") return;

    try {
      setBoothState("countdown");
      for (const seconds of COUNTDOWN_SECONDS) {
        setCountdown(seconds);
        await pause(850);
      }

      setCountdown(null);
      setBoothState("capturing");
      const photos: string[] = [];

      for (let index = 0; index < PHOTO_COUNT; index += 1) {
        setCaptureNumber(index + 1);
        await triggerFlash();
        photos.push(takePhoto());
        if (index < PHOTO_COUNT - 1) await pause(680);
      }

      const finishedStrip = await makePhotoStrip(photos);
      if (stripUrlRef.current) URL.revokeObjectURL(stripUrlRef.current);
      const nextUrl = URL.createObjectURL(finishedStrip);
      stripUrlRef.current = nextUrl;
      setStripBlob(finishedStrip);
      setStripUrl(nextUrl);
      setBoothState("review");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Something went wrong while taking the photos.");
      setBoothState("error");
    } finally {
      setCountdown(null);
      setCaptureNumber(0);
    }
  };

  const downloadStrip = () => {
    if (!stripUrl) return;
    const link = document.createElement("a");
    link.href = stripUrl;
    link.download = "fourframe-photo-strip.jpg";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const saveStrip = async () => {
    if (!stripBlob) return;

    const file = new File([stripBlob], "fourframe-photo-strip.jpg", { type: "image/jpeg" });
    const phoneLike =
      window.matchMedia("(pointer: coarse)").matches ||
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (phoneLike && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: "My FourFrame photo strip",
        });
      } catch (error) {
        // Closing the share sheet is an expected choice, so there is nothing to show here.
        if (!(error instanceof DOMException && error.name === "AbortError")) downloadStrip();
      }
      return;
    }

    downloadStrip();
  };

  const retake = () => {
    setStripUrl(null);
    setStripBlob(null);
    setCountdown(null);
    setCaptureNumber(0);
    if (streamRef.current && videoRef.current?.readyState && videoRef.current.readyState >= 2) {
      setBoothState("ready");
    } else {
      void startCamera();
    }
  };

  const canTakePhoto = boothState === "ready";
  const showCamera = boothState !== "review";

  return (
    <main className={styles.appShell}>
      {showCamera ? (
        <section className={styles.cameraScreen} aria-label="Camera">
          <video ref={videoRef} className={styles.cameraPreview} autoPlay muted playsInline />
          <div className={styles.cameraShade} aria-hidden="true" />
          <div className={styles.flash} data-visible={flashVisible} aria-hidden="true" />

          <header className={styles.topBar}>
            <p className={styles.brand}>FOURFRAME</p>
            <p className={styles.shotCount}>4 photos</p>
          </header>

          {(boothState === "countdown" || boothState === "capturing") && (
            <div className={styles.captureOverlay} aria-live="assertive">
              {boothState === "countdown" ? (
                <p className={styles.countdown}>{countdown}</p>
              ) : (
                <p className={styles.captureLabel}>Shot {captureNumber} of {PHOTO_COUNT}</p>
              )}
            </div>
          )}

          {boothState === "loading" && (
            <div className={styles.notice} role="status">
              <span className={styles.loader} aria-hidden="true" />
              <p className={styles.noticeText}>Waking up your camera…</p>
            </div>
          )}

          {boothState === "blocked" && (
            <div className={styles.permissionCard} role="alert">
              <p className={styles.eyebrow}>Camera access needed</p>
              <h1 className={styles.permissionTitle}>Let&apos;s see that smile.</h1>
              <p className={styles.permissionText}>
                FourFrame needs your camera to make a strip. In Safari, tap the <strong className={styles.strongText}>aA</strong> button, choose <strong className={styles.strongText}>Website Settings</strong>, then allow Camera.
              </p>
              <button className={styles.primaryButton} type="button" onClick={() => void startCamera()}>
                Try camera again
              </button>
            </div>
          )}

          {boothState === "error" && (
            <div className={styles.permissionCard} role="alert">
              <p className={styles.eyebrow}>Camera hiccup</p>
              <h1 className={styles.permissionTitle}>Almost there.</h1>
              <p className={styles.permissionText}>{message}</p>
              <button className={styles.primaryButton} type="button" onClick={() => void startCamera()}>
                Try again
              </button>
            </div>
          )}

          <footer className={styles.cameraControls}>
            <p className={styles.hint}>
              {canTakePhoto ? "Tap when you’re ready" : "Get ready for your close-up"}
            </p>
            <button
              className={styles.shutter}
              type="button"
              onClick={() => void beginSession()}
              disabled={!canTakePhoto}
              aria-label="Start the four-photo session"
            >
              <span className={styles.shutterCenter} />
            </button>
          </footer>
        </section>
      ) : (
        <section className={styles.resultScreen} aria-label="Your photo strip">
          <header className={styles.resultHeader}>
            <p className={styles.brand}>FOURFRAME</p>
            <p className={styles.resultKicker}>Fresh from the booth</p>
          </header>

          <div className={styles.stripStage}>
            {stripUrl && <img className={styles.photoStrip} src={stripUrl} alt="Your four-photo strip" />}
          </div>

          <footer className={styles.resultControls}>
            <button className={styles.saveButton} type="button" onClick={() => void saveStrip()}>
              Save strip
            </button>
            <button className={styles.retakeButton} type="button" onClick={retake}>
              Retake
            </button>
          </footer>
        </section>
      )}
    </main>
  );
}
