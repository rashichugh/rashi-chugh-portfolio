"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Maximize, Minimize, Pause, Play, Volume2, VolumeX } from "lucide-react";

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function CustomVideoPlayer({ url, poster, title }: { url: string; poster: string; title: string }) {
  const playerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ratio, setRatio] = useState("16 / 9");
  const [portrait, setPortrait] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffering, setBuffering] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const video = videoRef.current;
      setPlaying(false);
      setCurrentTime(0);
      setError("");
      if (video?.videoWidth && video.videoHeight) {
        setRatio(`${video.videoWidth} / ${video.videoHeight}`);
        setPortrait(video.videoHeight > video.videoWidth);
        setDuration(video.duration || 0);
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [url]);

  useEffect(() => {
    const update = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  async function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (video.paused) {
        if (video.ended) video.currentTime = 0;
        await video.play();
      } else {
        video.pause();
      }
    } catch {
      setError("This video could not be played. Try reloading it.");
    }
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await playerRef.current?.requestFullscreen();
    } catch {
      setError("Fullscreen is not available in this browser.");
    }
  }

  const progress = duration ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      ref={playerRef}
      className={`video-frame custom-video-player ${portrait ? "is-portrait" : ""} ${playing ? "is-playing" : "is-paused"} ${buffering ? "is-buffering" : ""}`}
      tabIndex={0}
      role="region"
      aria-label={`${title} video player`}
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return;
        if (event.key === " " || event.key.toLowerCase() === "k") { event.preventDefault(); void togglePlay(); }
        if (event.key.toLowerCase() === "m" && videoRef.current) videoRef.current.muted = !videoRef.current.muted;
        if (event.key.toLowerCase() === "f") void toggleFullscreen();
      }}
    >
      <video
        ref={videoRef}
        src={url}
        poster={poster || undefined}
        style={{ aspectRatio: ratio }}
        onClick={() => void togglePlay()}
        onDoubleClick={() => void toggleFullscreen()}
        onLoadedMetadata={(event) => {
          const video = event.currentTarget;
          setRatio(`${video.videoWidth} / ${video.videoHeight}`);
          setPortrait(video.videoHeight > video.videoWidth);
          setDuration(video.duration || 0);
        }}
        onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => { setPlaying(true); setError(""); }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
        onWaiting={() => setBuffering(true)}
        onCanPlay={() => setBuffering(false)}
        onError={() => setError("This video could not be loaded.")}
        playsInline
        preload="metadata"
      >
        Your browser does not support video.
      </video>

      <button type="button" className="video-center-play" onClick={() => void togglePlay()} aria-label={playing ? "Pause video" : "Play video"}>
        {buffering ? <LoaderCircle className="spin" size={29} /> : playing ? <Pause size={27} fill="currentColor" /> : <Play size={29} fill="currentColor" />}
      </button>
      {error ? <p className="video-error" role="alert">{error}</p> : null}

      <div className="video-controls">
        <button type="button" onClick={() => void togglePlay()} aria-label={playing ? "Pause" : "Play"}>{playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button>
        <span className="video-time">{formatTime(currentTime)}</span>
        <input
          className="video-timeline"
          type="range"
          min={0}
          max={duration || 0}
          step={0.01}
          value={Math.min(currentTime, duration || 0)}
          disabled={!duration}
          style={{ "--video-progress": `${progress}%` } as React.CSSProperties}
          aria-label="Seek video"
          aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (videoRef.current) videoRef.current.currentTime = next;
            setCurrentTime(next);
          }}
        />
        <span className="video-time video-duration">{formatTime(duration)}</span>
        <button type="button" onClick={() => { if (videoRef.current) videoRef.current.muted = !videoRef.current.muted; }} aria-label={muted ? "Unmute" : "Mute"}>{muted ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
        <button type="button" onClick={() => void toggleFullscreen()} aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}>{fullscreen ? <Minimize size={17} /> : <Maximize size={17} />}</button>
      </div>
    </div>
  );
}
