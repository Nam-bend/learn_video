"use client"

import { useState } from "react"
import {
  X,
  Plus,
  Headphones,
  Video,
  FileText,
  HelpCircle,
  Layers,
  StickyNote,
  CalendarRange,
  ChevronRight,
} from "lucide-react"

const tools = [
  { icon: Headphones, label: "Podcast" },
  { icon: Video, label: "Video" },
  { icon: FileText, label: "Tóm tắt" },
  { icon: HelpCircle, label: "Câu hỏi trắc nghiệm" },
  { icon: Layers, label: "Thẻ flashcard" },
  { icon: StickyNote, label: "Ghi chú" },
  { icon: CalendarRange, label: "Kế hoạch bài học", badge: "Mới" },
]

export function AiToolsSidebar() {
  const [open, setOpen] = useState(true)

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-l-xl bg-white px-3 py-2 shadow-[-2px_0_8px_rgba(0,0,0,0.04)] text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground border border-r-0 border-neutral-100"
      >
        <ChevronRight className="size-4" />
        <span>Tab Học</span>
      </button>
    )
  }

  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-l border-neutral-100 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-50 px-4 py-3">
        <span className="text-[14px] font-semibold text-foreground">Tab Học</span>
        <div className="flex items-center gap-1">
          <button className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground">
            <Plus className="size-4" />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="mb-3 text-[13px] font-semibold text-foreground">Tạo ra</p>
        <div className="grid grid-cols-2 gap-2">
          {tools.map((tool) => (
            <button
              key={tool.label}
              className="group flex items-center gap-2.5 rounded-xl border border-neutral-100 bg-white p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:border-neutral-200"
            >
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.1)] transition-colors group-hover:from-emerald-100 group-hover:to-teal-100">
                <tool.icon className="size-4 text-emerald-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="truncate text-[12px] font-medium text-foreground">
                    {tool.label}
                  </span>
                  {tool.badge && (
                    <span className="inline-flex shrink-0 rounded bg-blue-50 px-1 py-px text-[9px] font-bold text-blue-700">
                      {tool.badge}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
