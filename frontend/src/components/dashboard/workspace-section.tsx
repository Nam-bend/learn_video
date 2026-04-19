"use client"

import { Plus, FolderOpen } from "lucide-react"

export function WorkspaceSection() {
  return (
    <div className="w-full max-w-2xl animate-fade-in-up animate-delay-300">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-[15px] font-semibold text-foreground">Không gian</h2>
        <span className="rounded-md bg-muted/60 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
          Mới nhất
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button className="group relative flex items-center gap-3 rounded-2xl border-2 border-dashed border-neutral-200/80 bg-white/50 p-4 transition-all duration-300 hover:border-emerald-300/80 hover:bg-emerald-50/40">
          <div className="flex size-9 items-center justify-center rounded-xl bg-neutral-100 transition-colors duration-300 group-hover:bg-emerald-100">
            <Plus className="size-4 text-neutral-400 transition-colors duration-300 group-hover:text-emerald-600" />
          </div>
          <span className="text-[13px] font-medium text-muted-foreground transition-colors group-hover:text-emerald-700">
            Không gian mới
          </span>
        </button>

        <button className="group relative flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.06),inset_0_0_0_1px_rgba(0,0,0,0.06)]">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.12)]">
            <FolderOpen className="size-4 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="truncate text-[13px] font-medium text-foreground">
              Không gian của Fuoc
            </p>
            <p className="text-[11px] text-muted-foreground">0 mục</p>
          </div>
        </button>
      </div>
    </div>
  )
}
