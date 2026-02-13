import MusicPlayer from "@/components/MusicPlayer";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 relative overflow-hidden px-6 py-12">
      {/* Glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.35),transparent_60%)] blur-3xl" />
      {/* Player */}
      <MusicPlayer />
    </div>
  );
}

