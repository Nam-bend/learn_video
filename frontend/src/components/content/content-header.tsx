"use client"

import { RefreshCw, Share2, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ContentHeader() {
  return (
    <div className="flex items-center gap-2 min-w-0 flex-1">
      <h1 className="truncate text-[15px] font-semibold text-foreground">
        Top 50+ AWS Services Expla...
      </h1>
      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        <span className="inline-flex h-6 items-center gap-1 rounded-lg bg-muted/70 px-2 text-[11px] font-semibold tabular-nums text-muted-foreground shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
          1/2
        </span>
        <Button
          size="sm"
          className="h-7 gap-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 px-3 text-[11px] font-semibold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110 border-0"
        >
          Nâng cấp
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 rounded-lg border-neutral-200/80 bg-white px-2.5 text-[12px] font-medium text-foreground shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] hover:bg-neutral-50"
        >
          <RefreshCw className="mr-1.5 size-3" />
          Kỳ thi mới
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 rounded-lg border-neutral-200/80 bg-white px-2.5 text-[12px] font-medium text-foreground shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] hover:bg-neutral-50"
        >
          <Share2 className="mr-1.5 size-3" />
          Chia sẻ
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-neutral-100"
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </div>
    </div>
  )
}
