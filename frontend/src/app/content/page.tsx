"use client"

import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { ContentHeader } from "@/components/content/content-header"
import { VideoPlayer } from "@/components/content/video-player"
import { TranscriptSection } from "@/components/content/transcript-section"
import { AiToolsSidebar } from "@/components/content/ai-tools-sidebar"
import { ChevronsRight } from "lucide-react"
import { HeaderActions } from "@/components/dashboard/header-actions"
import { PdfWorkspace } from "@/components/content/pdf-workspace"
import { WordWorkspace } from "@/components/content/word-workspace"

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

function SidebarAwareHeader() {
  const { open } = useSidebar()
  if (!open) return null
  return <HeaderActions />
}

import { useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { api } from "@/lib/api"

function ContentPageInner() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get("id")
  const [video, setVideo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const isPdf = video?.media_type === "pdf" ||
    video?.source_ref?.toLowerCase().endsWith(".pdf") ||
    video?.title?.toLowerCase().endsWith(".pdf");
  const isWord = video?.media_type === "docx" ||
    video?.source_ref?.toLowerCase().endsWith(".docx") ||
    video?.title?.toLowerCase().endsWith(".docx");
  const isDoc = isPdf || isWord;

  useEffect(() => {
    if (!videoId) {
      setLoading(false)
      return
    }

    let pollInterval: ReturnType<typeof setInterval> | undefined = undefined

    const fetchVideo = async (showLoading = true) => {
      if (showLoading) setLoading(true)
      try {
        const data = await api.videos.get(videoId)
        setVideo(data)

        const isDoc = data.media_type === "pdf" || data.media_type === "docx" ||
          data.title?.toLowerCase().endsWith(".pdf") || data.title?.toLowerCase().endsWith(".docx") ||
          data.source_ref?.toLowerCase().endsWith(".pdf") || data.source_ref?.toLowerCase().endsWith(".docx")

        let currentStatus = data.status
        const shouldTranscribe = isDoc &&
          !data.transcript &&
          data.status !== "transcribing" &&
          data.status !== "error" &&
          data.status !== "done"

        // Tự động kích hoạt trích xuất văn bản (nếu chưa chạy)
        if (shouldTranscribe) {
          try {
            await api.transcript.generate(videoId)
            currentStatus = "transcribing"
            // Cập nhật trạng thái tạm thời trên UI trước khi poll lần sau
            setVideo((prev: any) => prev ? { ...prev, status: "transcribing" } : null)
          } catch (e) {
            console.error("Auto-transcribe generation failed:", e)
          }
        }

        // Bắt đầu poll nếu đang trích xuất
        if (currentStatus === "transcribing") {
          if (!pollInterval) {
            pollInterval = setInterval(() => {
              fetchVideo(false)
            }, 3000)
          }
        } else {
          if (pollInterval) {
            clearInterval(pollInterval)
            pollInterval = undefined
          }
        }
      } catch (error) {
        console.error("Failed to fetch video:", error)
        setVideo(null)
      } finally {
        if (showLoading) setLoading(false)
      }
    }

    fetchVideo(true)

    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [videoId])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#fafafa] flex flex-col h-screen">
        <CollapsedHeader />
        <div className="flex-1 grid grid-cols-2 min-h-0 overflow-hidden">
          <div className="flex flex-col overflow-hidden border-r border-neutral-100">
            <div className="flex shrink-0 items-center justify-between px-5 py-3 border-b border-neutral-100">
              <ContentHeader title={video?.title} />
              <SidebarAwareHeader />
            </div>
            <div className={`flex-1 ${isDoc ? "flex flex-col min-h-0 overflow-hidden" : "overflow-y-auto"}`}>
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
              ) : video ? (
                <div className={isDoc ? "flex-1 min-h-0 flex flex-col" : "h-full"}>
                  {(() => {
                    if (isPdf) return <PdfWorkspace video={video} />;
                    if (isWord) return <WordWorkspace video={video} />;

                    return (
                      <div className="px-6 py-6">
                        <VideoPlayer video={video} />
                        <TranscriptSection
                          videoId={video.id}
                          initialTranscript={video.transcript}
                          initialTranslatedTranscript={video.translated_transcript}
                        />
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Không tìm thấy video
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col overflow-hidden bg-white min-h-0">
            <AiToolsSidebar videoId={videoId || ""} />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function ContentPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[#fafafa]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    }>
      <ContentPageInner />
    </Suspense>
  )
}

