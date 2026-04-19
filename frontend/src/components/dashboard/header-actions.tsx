"use client"

import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"

export function HeaderActions() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex h-6 items-center gap-1 rounded-lg bg-muted/70 px-2 text-[11px] font-semibold tabular-nums text-muted-foreground shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
        0/2
      </span>
      <Button
        size="sm"
        className="h-7 gap-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 px-3 text-[12px] font-semibold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110 border-0"
      >
        <Zap className="size-3" />
        Nâng cấp
      </Button>
    </div>
  )
}
