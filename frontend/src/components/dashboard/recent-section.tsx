"use client"

import { useEffect, useState } from "react"
import { BookOpen, Sparkles, Play, Clock, MoreHorizontal, FileText, File as FileIcon } from "lucide-react"
import { api } from "@/lib/api"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"

export function RecentSection() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { userId, showAuthModal } = useAuth()

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await api.videos.list()
        setVideos(data)
      } catch (error) {
        console.error("Failed to fetch videos:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchVideos()
  }, [])

  if (loading) {
    return (
      <div className="w-full max-w-2xl animate-pulse">
        <div className="h-4 w-20 bg-neutral-200 rounded mb-4" />
        <div className="h-40 bg-white rounded-2xl border border-neutral-100" />
      </div>
    )
  }

  if (videos.length === 0) {
    return (
      <div className="w-full max-w-2xl animate-fade-in-up animate-delay-400">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-foreground">Gần đây</h2>
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

  return (
    <div className="w-full max-w-2xl animate-fade-in-up animate-delay-400">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-foreground">Gần đây</h2>
        <Link href="/history">
          <button className="text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground">
            Xem tất cả
          </button>
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {videos.map((video) => {
          const isDocx = video.media_type === 'docx'
          const isPdf = video.media_type === 'pdf'
          const HoverIcon = isPdf ? FileIcon : (isDocx ? FileText : Play)
          const sourceLabel = isPdf ? "Tài liệu PDF" : (isDocx ? "Tài liệu Word" : "Video")
          
          return (
          <Link
            key={video.id}
            href={`/content?id=${video.id}`}
            onClick={(e) => {
              if (!userId) {
                e.preventDefault();
                showAuthModal('login');
              }
            }}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white p-3 transition-all hover:border-emerald-200 hover:shadow-[0_8px_20px_-4px_rgba(16,185,129,0.08)]"
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-100">
               <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/5 transition-colors group-hover:bg-neutral-900/0">
                <div className="flex size-10 items-center justify-center rounded-full bg-white/90 shadow-sm opacity-0 scale-90 transition-all group-hover:opacity-100 group-hover:scale-100">
                  <HoverIcon className={`size-4 text-emerald-600 ${!isPdf && !isDocx ? 'fill-emerald-600 ml-0.5' : ''}`} />
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-start justify-between gap-2 px-1">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[14px] font-semibold text-foreground group-hover:text-emerald-700">
                  {video.title || "Chưa có tiêu đề"}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    Đã lưu
                  </span>
                  <span>•</span>
                  <span>{sourceLabel}</span>
                </div>
              </div>
              <button className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-50 hover:text-foreground">
                <MoreHorizontal className="size-4" />
              </button>
            </div>
          </Link>
        )})}
      </div>
    </div>
  )
}

