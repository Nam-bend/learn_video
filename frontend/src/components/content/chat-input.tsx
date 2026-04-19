"use client"

import { Mic, ArrowUp } from "lucide-react"

export function ChatInput() {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center pb-5 pr-[300px]">
      <div className="pointer-events-auto w-full max-w-2xl px-5">
        <div className="flex items-center gap-2 rounded-2xl border border-neutral-200/80 bg-white px-4 py-2.5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)] backdrop-blur-sm transition-shadow focus-within:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] focus-within:border-emerald-200">
          <input
            type="text"
            placeholder="Hãy hỏi bất cứ điều gì"
            className="flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-neutral-400"
          />
          <button className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground">
            <Mic className="size-4" />
          </button>
          <button className="flex size-7 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm transition-all hover:shadow-md hover:brightness-110">
            <ArrowUp className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
