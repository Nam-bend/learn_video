"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { HeaderActions } from "@/components/dashboard/header-actions"
import {
  Clock,
  Search,
  Trash2,
  Video as VideoIcon,
  FileText,
  Play,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronsRight,
  ArrowRight,
  Plus
} from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

function CollapsedHeader() {
  const { open, toggleSidebar } = useSidebar()

  if (open) return null

  return (
    <div className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-primary/5 bg-[#fafafa] px-4">
      <button
        onClick={toggleSidebar}
        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground"
      >
        <ChevronsRight className="size-5" />
      </button>
      <div className="flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-lg bg-[#3CB371] text-white">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </div>
        <span className="text-sm font-semibold tracking-tight text-foreground">YouLearn</span>
      </div>
      <div className="ml-auto">
        <HeaderActions />
      </div>
    </div>
  )
}

function HeaderSidebarAwareActions() {
  const { open } = useSidebar()
  if (!open) return null
  return <HeaderActions />
}

export default function HistoryPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#fafafa] flex flex-col h-screen overflow-hidden">
        <CollapsedHeader />
        <HistoryContent />
      </SidebarInset>
    </SidebarProvider>
  )
}

function HistoryContent() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<"all" | "video" | "document">("all")

  const fetchVideos = async () => {
    setLoading(true)
    try {
      const data = await api.videos.list()
      setVideos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to fetch videos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm("Bạn có chắc chắn muốn xóa tài liệu học tập này? Mọi dữ liệu bản dịch, ghi chú, flashcard liên quan cũng sẽ bị xóa bỏ.")) {
      try {
        await api.videos.delete(id)
        setVideos(prev => prev.filter(v => v.id !== id))
      } catch (err) {
        alert("Không thể xóa tài liệu")
      }
    }
  }

  // Lọc tài liệu theo từ khóa tìm kiếm và tab phân loại
  const filteredVideos = videos.filter(video => {
    const matchesSearch = (video.title || "Chưa có tiêu đề").toLowerCase().includes(searchQuery.toLowerCase())

    const isDoc = video.media_type === "pdf" || video.media_type === "docx" ||
      video.title?.toLowerCase().endsWith(".pdf") || video.title?.toLowerCase().endsWith(".docx") ||
      video.source_ref?.toLowerCase().endsWith(".pdf") || video.source_ref?.toLowerCase().endsWith(".docx")

    if (activeFilter === "video") {
      return matchesSearch && !isDoc
    }
    if (activeFilter === "document") {
      return matchesSearch && isDoc
    }
    return matchesSearch
  })

  // Thống kê số lượng
  const totalCount = videos.length
  const completedCount = videos.filter(v => v.status === "done").length
  const processingCount = videos.filter(v => v.status === "transcribing" || v.status === "pending").length

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
      <div className="flex justify-end mb-4">
        <HeaderSidebarAwareActions />
      </div>

      <div className="mx-auto max-w-4xl space-y-6 pb-12">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[#3CB371]">
            <Clock className="size-5" />
            <span className="text-[12px] font-bold uppercase tracking-wider">Lịch sử của bạn</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Lịch sử học tập</h1>
          <p className="text-[13px] text-muted-foreground">
            Quản lý và tiếp tục ôn luyện tất cả các bài giảng, video và tài liệu bạn đã tải lên hệ thống.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tổng tài liệu</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{totalCount}</p>
          </div>
          <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Đã xử lý</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">{completedCount}</p>
          </div>
          <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Đang xử lý</p>
            <p className="mt-1 text-2xl font-bold text-amber-500">{processingCount}</p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-1 bg-neutral-100/60 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveFilter("all")}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-[12px] font-bold transition-all",
                activeFilter === "all"
                  ? "bg-white text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Tất cả ({totalCount})
            </button>
            <button
              onClick={() => setActiveFilter("video")}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-[12px] font-bold transition-all",
                activeFilter === "video"
                  ? "bg-white text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Video
            </button>
            <button
              onClick={() => setActiveFilter("document")}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-[12px] font-bold transition-all",
                activeFilter === "document"
                  ? "bg-white text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Tài liệu
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm kiếm tài liệu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white py-1.5 pl-10 pr-4 text-[13px] outline-hidden transition-all placeholder:text-muted-foreground/60 focus:border-neutral-300 focus:ring-1 focus:ring-neutral-200"
            />
          </div>
        </div>

        {/* Content list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-emerald-500 mb-3" />
            <p className="text-[13px] text-muted-foreground">Đang tải lịch sử học tập...</p>
          </div>
        ) : filteredVideos.length > 0 ? (
          <div className="grid gap-3">
            {filteredVideos.map((video) => {
              const isPdf = video.media_type === "pdf" || video.title?.toLowerCase().endsWith(".pdf") || video.source_ref?.toLowerCase().endsWith(".pdf")
              const isWord = video.media_type === "docx" || video.title?.toLowerCase().endsWith(".docx") || video.source_ref?.toLowerCase().endsWith(".docx")
              const isDoc = isPdf || isWord

              return (
                <div
                  key={video.id}
                  className="group relative flex items-center justify-between rounded-2xl border border-neutral-100 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
                >
                  <Link href={`/content?id=${video.id}`} className="flex flex-1 items-center gap-4 min-w-0 pr-12">
                    {/* Icon type */}
                    <div className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                      isDoc
                        ? "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                        : "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100"
                    )}>
                      {isDoc ? <FileText className="size-5" /> : <VideoIcon className="size-5" />}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0 space-y-0.5">
                      <p className="truncate text-[14px] font-semibold text-foreground group-hover:text-emerald-600 transition-colors">
                        {video.title || "Chưa có tiêu đề"}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                        <span className="capitalize">{video.source_type || "local"}</span>
                        <span>•</span>
                        {video.status === "done" && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
                            <CheckCircle className="size-3" /> Sẵn sàng học
                          </span>
                        )}
                        {video.status === "transcribing" && (
                          <span className="inline-flex items-center gap-1 text-amber-500 font-medium animate-pulse">
                            <Loader2 className="size-3 animate-spin" /> Đang chuyển ngữ...
                          </span>
                        )}
                        {video.status === "error" && (
                          <span className="inline-flex items-center gap-1 text-rose-500 font-medium">
                            <AlertCircle className="size-3" /> Lỗi xử lý
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 z-10">
                    <button
                      onClick={(e) => handleDelete(e, video.id)}
                      className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-500 active:scale-95 transition-all"
                      title="Xóa tài liệu"
                    >
                      <Trash2 className="size-4" />
                    </button>

                    <Link href={`/content?id=${video.id}`}>
                      <button className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white active:scale-95 transition-all">
                        <ArrowRight className="size-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-100 py-16 text-center">
            <Clock className="size-12 text-neutral-200 mb-4" />
            <h3 className="text-[14px] font-semibold text-foreground">Không tìm thấy tài liệu nào</h3>
            <p className="mt-1 text-[12px] text-muted-foreground max-w-[280px]">
              {searchQuery
                ? "Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc để hiển thị kết quả."
                : "Bắt đầu hành trình học tập bằng cách tải lên video hoặc tài liệu đầu tiên."}
            </p>
            {!searchQuery && (
              <Link href="/">
                <button className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-95">
                  <Plus className="size-4" /> Thêm bài học mới
                </button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
