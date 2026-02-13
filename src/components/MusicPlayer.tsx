"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
} from "lucide-react";

// ====================
// TYPES & CONSTANTS
// ====================
type PlayerState = "paused" | "loading" | "playing";

// Requirement: Loading delay 500ms
const LOADING_DELAY = 500;

// ====================
// MAIN COMPONENT
// ====================
export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ====================
  // STATES
  // ====================
  const [state, setState] = useState<PlayerState>("paused"); // player state
  const [currentTime, setCurrentTime] = useState(0); // current audio time
  const [duration, setDuration] = useState(0); // total duration
  const [volume, setVolume] = useState(0.7); // volume level

  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const volumeBarRef = useRef<HTMLDivElement | null>(null);

  // ====================
  // EFFECTS
  // ====================
  // Sync audio volume with state
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
  }, [volume]);

  // ====================
  // HELPER FUNCTIONS
  // ====================
  const getPercent = (clientX: number, bar: HTMLDivElement) => {
    const rect = bar.getBoundingClientRect();
    let percent = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, percent));
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ====================
  // PLAY TOGGLE
  // ====================
  const togglePlay = () => {
    if (state === "loading") return;
    const audio = audioRef.current;
    if (!audio) return;

    // Enter loading state first
    setState("loading");

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Simulate async loading delay
    timeoutRef.current = setTimeout(async () => {
      if (audio.paused) {
        await audio.play();
        setState("playing");
      } else {
        audio.pause();
        setState("paused");
      }
    }, LOADING_DELAY);
  };

  // ====================
  // PROGRESS BAR HANDLER
  // ====================
  const handleProgressPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const bar = progressBarRef.current;
    if (!audio || !bar) return;

    bar.setPointerCapture(e.pointerId);

    const update = (clientX: number) => {
      const percent = getPercent(clientX, bar);
      const newTime = percent * (audio.duration || 0);
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    };

    update(e.clientX);

    const move = (ev: PointerEvent) => update(ev.clientX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // ====================
  // VOLUME BAR HANDLER
  // ====================
  const handleVolumePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    const bar = volumeBarRef.current;
    if (!audio || !bar) return;

    bar.setPointerCapture(e.pointerId);

    const update = (clientX: number) => {
      const percent = getPercent(clientX, bar);
      audio.volume = percent;
      setVolume(percent);
    };

    update(e.clientX);

    const move = (ev: PointerEvent) => update(ev.clientX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  // ====================
  // CALCULATED VALUES
  // ====================
  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  // ====================
  // RENDER
  // ====================
  return (
    <div className="relative w-full px-4 sm:px-6 md:px-8 max-w-md md:max-w-2xl mx-auto">
      {/* Background Glow */}
      <div className="absolute -inset-4 rounded-3xl bg-indigo-500/20 blur-3xl pointer-events-none" />

      <motion.div
        animate={state}
        variants={{
          // Container shadow & background per state
          playing: {
            boxShadow: "0 0 40px rgba(99,102,241,0.45)",
            backgroundColor: "#171717",
          },
          paused: {
            boxShadow: "0 0 0 rgba(0,0,0,0)",
            backgroundColor: "#171717",
          },
          loading: {
            boxShadow: "0 0 20px rgba(99,102,241,0.25)",
            backgroundColor: "#1f1f1f",
          },
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-neutral-900 rounded-3xl w-full p-6 pb-10 md:p-10 md:pb-14 text-white shadow-2xl"
      >
        {/* AUDIO ELEMENT */}
        <audio
          ref={audioRef}
          src="/music.mp3"
          preload="auto"
          onTimeUpdate={(e) => {
            const audio = e.currentTarget;
            setCurrentTime(audio.currentTime);
            if (!isNaN(audio.duration) && audio.duration > 0) {
              setDuration(audio.duration);
            }
          }}
          onEnded={() => {
            const audio = audioRef.current;
            if (!audio) return;
            audio.currentTime = 0;
            setCurrentTime(0);
            setState("paused");
          }}
        />

        {/* TOP SECTION: ARTWORK + EQUALIZER */}
        <div className="flex gap-6">
          {/* Album Artwork */}
          <motion.div
            animate={
              state === "playing"
                ? { rotate: 360, scale: 1 }
                : state === "paused"
                ? { scale: 0.95 }
                : { scale: 0.9 }
            }
            transition={
              state === "playing"
                ? {
                    rotate: { repeat: Infinity, duration: 20, ease: "linear" },
                    scale: { type: "spring", stiffness: 120, damping: 15 },
                  }
                : { scale: { type: "spring", stiffness: 120, damping: 15 } }
            }
            className="w-28 h-28 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-xl"
          >
            <Image src="/music.svg" alt="music" width={50} height={50} />
          </motion.div>

          {/* Song Info & Equalizer */}
          <div className="flex-1">
            <p className="font-semibold text-xl">Awesome Song</p>
            <p className="text-sm text-neutral-400">Amazing Artist</p>

            {/* Equalizer Bars */}
            <div className="flex items-end gap-1 mt-4 h-8">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-full bg-indigo-400 rounded origin-bottom"
                  variants={{
                    loading: { scaleY: 0.5, opacity: 0.5 },
                    paused: { scaleY: 0.2, opacity: 1 },
                    playing: { scaleY: [0.2, 1], opacity: 1 },
                  }}
                  animate={state}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    repeatType: "mirror",
                    ease: "easeInOut",
                    delay: i * 0.1, // stagger 100ms
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-neutral-400 mb-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          <div
            ref={progressBarRef}
            className="h-2 bg-neutral-700 rounded relative cursor-pointer overflow-hidden"
            onPointerDown={handleProgressPointerDown}
          >
            <div
              className={`absolute left-0 top-0 h-full rounded transition-all duration-300
                ${state === "playing" ? "bg-indigo-500" : "bg-neutral-400"}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex items-center justify-center gap-8 mt-10">
          {/* Shuffle */}
          <motion.button
            whileHover={{ color: "#ffffff" }}
            whileTap={{ scale: 0.9 }}
            className="text-neutral-400"
          >
            <Shuffle size={18} />
          </motion.button>

          {/* Skip Back */}
          <motion.button
            whileHover={{ color: "#ffffff" }}
            whileTap={{ scale: 0.9 }}
            className="text-neutral-400"
          >
            <SkipBack size={20} />
          </motion.button>

          {/* Play/Pause */}
          <motion.button
            onClick={togglePlay}
            whileHover={state !== "loading" ? { scale: 1.05 } : {}}
            whileTap={state !== "loading" ? { scale: 0.95 } : {}}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            disabled={state === "loading"}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg
              ${state === "loading"
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-gradient-to-br from-indigo-500 to-blue-500"}`}
          >
            {state === "playing" ? <Pause /> : <Play />}
          </motion.button>

          {/* Skip Forward */}
          <motion.button
            whileHover={{ color: "#ffffff" }}
            whileTap={{ scale: 0.9 }}
            className="text-neutral-400"
          >
            <SkipForward size={20} />
          </motion.button>

          {/* Repeat */}
          <motion.button
            whileHover={{ color: "#ffffff" }}
            whileTap={{ scale: 0.9 }}
            className="text-neutral-400"
          >
            <Repeat size={18} />
          </motion.button>
        </div>

        {/* VOLUME BAR */}
        <div className="flex items-center gap-3 mt-10">
          <Volume2 size={16} className="text-neutral-400" />
          <div
            ref={volumeBarRef}
            className="h-2 flex-1 bg-neutral-700 rounded cursor-pointer relative group"
            onPointerDown={handleVolumePointerDown}
          >
            <div
              className={`absolute h-full rounded transition-colors duration-200
                ${state === "loading"
                  ? "bg-gray-400"
                  : "bg-neutral-400 group-hover:bg-purple-500"}`}
              style={{ width: `${volume * 100}%` }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
