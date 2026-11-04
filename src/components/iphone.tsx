import { Play, RotateCcw } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";

export function PhoneFrame({
  children,
  aspectRatio = 402 / 874,
  native = false,
}: {
  children: ReactNode;
  aspectRatio?: number;
  native?: boolean;
}) {
  return (
    <div className={native ? "iphone native-phone" : "iphone"}>
      <span className="phone-button phone-button-left" />
      <span className="phone-button phone-button-right" />
      <div className="iphone-screen" style={{ aspectRatio }}>
        {children}
        <span className="dynamic-island" aria-hidden="true" />
      </div>
    </div>
  );
}

export function IPhone({
  name,
  title,
  priority = false,
  playable = false,
}: {
  name: string;
  title: string;
  priority?: boolean;
  playable?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const poster = `/native/${name}.webp`;
  async function play() {
    setError(false);
    if (video.current) {
      video.current.currentTime = 0;
      try {
        await video.current.play();
      } catch {
        setError(true);
      }
    } else {
      setPlaying(true);
    }
  }
  return (
    <div className="device-preview">
      <PhoneFrame>
        <img
          src={poster}
          width={1206}
          height={2622}
          alt={`${title}, rendered by SwiftUI on an iPhone simulator`}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
        />
        {playing && !error && (
          <video
            ref={video}
            controls
            autoPlay
            muted
            playsInline
            preload="none"
            poster={poster}
            aria-label={`${title} native animation demonstration`}
            onError={() => setError(true)}
          >
            <source src={`/native/${name}.mp4`} type="video/mp4" />
            <track
              kind="captions"
              srcLang="en"
              label="Demo description"
              src={`/native/${name}.vtt`}
            />
          </video>
        )}
      </PhoneFrame>
      {playable && (
        <div className="native-playback">
          <button
            type="button"
            className="button-secondary"
            aria-label={`Play ${title.toLowerCase()} demo`}
            onClick={() => {
              void play();
            }}
          >
            {playing ? <RotateCcw size={14} /> : <Play size={14} />}
            {playing ? "Replay native demo" : "Watch native demo"}
          </button>
          <span aria-live="polite">
            {error ? "Unable to play. Try the native gallery." : "Recorded in the iOS simulator"}
          </span>
        </div>
      )}
    </div>
  );
}
