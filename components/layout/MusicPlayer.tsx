"use client";

export function MusicPlayer() {
  return (
    <div className="fixed bottom-4 right-4 z-50 w-[280px] md:w-[320px] rounded-2xl border border-[#8f3a2a] bg-[#c44632] text-[#fff7f1] shadow-lg p-4">
      <div className="text-xs font-semibold">Music Player (placeholder)</div>

      <div className="mt-3 flex items-center justify-center gap-3">
        <button className="h-8 w-8 rounded-full bg-white/10">⏮</button>
        <button className="h-10 w-10 rounded-full bg-white text-[#c44632] font-bold">
          ▶
        </button>
        <button className="h-8 w-8 rounded-full bg-white/10">⏭</button>
      </div>

      <div className="mt-3 h-1.5 rounded-full bg-white/20 overflow-hidden">
        <div className="h-full w-1/2 bg-white" />
      </div>
    </div>
  );
}
