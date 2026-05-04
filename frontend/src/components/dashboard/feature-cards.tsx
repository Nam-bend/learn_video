"use client"

import { Upload, Link2, ClipboardPaste, Mic, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRef, useState } from "react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"

const features = [
  {
    icon: Upload,
    label: "Tải lên",
    description: "Tập tin, âm thanh,...",
    badge: "Phổ biến",
    bgGlow: "group-hover:shadow-blue-200/60",
    iconBg: "bg-blue-50 group-hover:bg-gradient-to-br group-hover:from-blue-100 group-hover:to-indigo-100",
    type: "upload"
  },
  {
    icon: Link2,
    label: "Liên kết",
    description: "YouTube, Trang...",
    bgGlow: "group-hover:shadow-violet-200/60",
    iconBg: "bg-violet-50 group-hover:bg-gradient-to-br group-hover:from-violet-100 group-hover:to-purple-100",
    type: "link"
  },
  {
    icon: ClipboardPaste,
    label: "Dán",
    description: "Đã sao chép văn...",
    bgGlow: "group-hover:shadow-amber-200/60",
    iconBg: "bg-amber-50 group-hover:bg-gradient-to-br group-hover:from-amber-100 group-hover:to-orange-100",
    type: "paste"
  },
  {
    icon: Mic,
    label: "Ghi",
    description: "Ghi lại bài giảng",
    bgGlow: "group-hover:shadow-rose-200/60",
    iconBg: "bg-rose-50 group-hover:bg-gradient-to-br group-hover:from-rose-100 group-hover:to-pink-100",
    type: "record"
  },
]

interface FeatureCardProps {
  icon: any
  label: string
  description: string
  badge?: string
  bgGlow: string
  iconBg: string
  onClick?: () => void
  loading?: boolean
}

function FeatureCard({
  icon: Icon,
  label,
  description,
  badge,
  bgGlow,
  iconBg,
  onClick,
  loading
}: FeatureCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative cursor-pointer rounded-2xl border border-transparent bg-white p-5 text-center",
        "shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.05)]",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1 hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.08),inset_0_0_0_1px_rgba(0,0,0,0.06)]",
        bgGlow,
        loading && "opacity-70 pointer-events-none"
      )}
    >
      <div className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-2xl bg-gradient-to-t from-neutral-50/80 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative flex flex-col items-center gap-3">
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-xl transition-all duration-300",
            iconBg
          )}
        >
          {loading ? (
            <Loader2 className="size-5 text-neutral-600 animate-spin" />
          ) : (
            <Icon className="size-5 text-neutral-600 transition-colors duration-300 group-hover:text-neutral-800" />
          )}
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <p className="text-[13px] font-semibold text-foreground">{label}</p>
            {badge && (
              <span className="inline-flex h-[18px] items-center rounded-md bg-gradient-to-r from-emerald-50 to-teal-50 px-1.5 text-[9px] font-bold text-emerald-700 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.15)]">
                {badge}
              </span>
            )}
          </div>
          <p className="text-[12px] leading-snug text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </div>
  )
}

export function FeatureCards() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const result = await api.upload.file(file)
      // Result should contain video id
      if (result.id) {
        router.push(`/content?id=${result.id}`)
      }
    } catch (error) {
      console.error("Upload failed:", error)
      alert("Tải lên thất bại. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  const handleCardClick = (type: string) => {
    if (type === "upload") {
      fileInputRef.current?.click()
    } else if (type === "link") {
      // Focus on search bar or show specialized link input
      document.querySelector("input")?.focus()
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 w-full max-w-2xl">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="video/*"
        onChange={handleFileChange}
      />
      {features.map((feature, i) => (
        <div
          key={feature.label}
          className={cn("animate-fade-in-up", i === 1 && "animate-delay-100", i === 2 && "animate-delay-200", i === 3 && "animate-delay-300")}
        >
          <FeatureCard
            {...feature}
            onClick={() => handleCardClick(feature.type)}
            loading={feature.type === "upload" && loading}
          />
        </div>
      ))}
    </div>
  )
}

