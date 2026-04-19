"use client"

import { Play } from "lucide-react"

export function VideoPlayer() {
  return (
    <div className="group relative aspect-video overflow-hidden rounded-2xl bg-neutral-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,185,129,0.08)_0%,transparent_50%,rgba(20,184,166,0.05)_100%)]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="flex size-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/20 group-hover:scale-105 cursor-pointer">
            <Play className="size-6 text-white fill-white ml-0.5" />
          </div>
          <p className="text-[12px] font-medium text-white/50 transition-colors group-hover:text-white/70">
            Nhấn để phát
          </p>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  )
}
