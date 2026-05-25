"use client"

interface ContentHeaderProps {
  title?: string
}

export function ContentHeader({ title }: ContentHeaderProps) {
  return (
    <div className="flex items-center gap-2 min-w-0 flex-1">
      <h1 className="truncate text-[15px] font-semibold text-foreground">
        {title || "Top 50+ AWS Services Explained"}
      </h1>
    </div>
  )
}
