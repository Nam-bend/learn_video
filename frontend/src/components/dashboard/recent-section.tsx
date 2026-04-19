"use client"

import { BookOpen, Sparkles } from "lucide-react"

export function RecentSection() {
  return (
    <div className="w-full max-w-2xl animate-fade-in-up animate-delay-400">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-foreground">Gần đây</h2>
        <button className="text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground">
          Xem tất cả
        </button>
      </div>
      <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-white py-14 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.03)_0%,transparent_70%)]" />
        <div className="relative flex flex-col items-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-neutral-50 to-neutral-100 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]">
            <BookOpen className="size-6 text-neutral-300" />
          </div>
          <p className="text-[14px] font-medium text-neutral-400">
            Bắt đầu hành trình học tập của bạn.
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[12px] text-neutral-300">
            <Sparkles className="size-3" />
            <span>Tải lên hoặc dán nội dung để bắt đầu</span>
          </div>
        </div>
      </div>
    </div>
  )
}
