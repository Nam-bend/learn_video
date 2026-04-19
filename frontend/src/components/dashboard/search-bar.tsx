"use client"

import { ArrowUp, Sparkles } from "lucide-react"

export function SearchBar() {
  return (
    <div className="group relative w-full max-w-2xl animate-fade-in-up animate-delay-200">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-200/0 via-teal-200/0 to-cyan-200/0 transition-all duration-500 group-focus-within:from-emerald-200/20 group-focus-within:via-teal-100/10 group-focus-within:to-cyan-200/20" />
        <div className="relative flex h-12 items-center rounded-2xl border border-neutral-200/80 bg-white px-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-300 group-focus-within:border-emerald-200 group-focus-within:shadow-[0_4px_16px_-2px_rgba(16,185,129,0.12)]">
          <Sparkles className="mr-3 size-4 shrink-0 text-neutral-300 transition-colors duration-300 group-focus-within:text-emerald-400" />
          <input
            type="text"
            placeholder="Học bất cứ điều gì..."
            className="flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-neutral-400"
          />
          <button className="ml-2 flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm transition-all duration-200 hover:shadow-md hover:brightness-110">
            <ArrowUp className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
