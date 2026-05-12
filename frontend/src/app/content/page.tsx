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
import { useEffect, useState } from "react"
import { api } from "@/lib/api"

export default function ContentPage() {
  const searchParams = useSearchParams()
  const videoId = searchParams.get("id")
  const [video, setVideo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!videoId) {
      setLoading(false)
      return
    }

    const fetchVideo = async () => {
      setLoading(true)
      try {
        const data = await api.videos.get(videoId)
        setVideo(data)
      } catch (error) {
        console.error("Failed to fetch video:", error)
        setVideo(null)
      } finally {
        setLoading(false)
      }
    }
    fetchVideo()
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
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex h-full items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                </div>
              ) : video ? (
                <div className="h-full">
                  {(() => {
                    const isPdf = video?.media_type === "pdf" || 
                                  video?.source_ref?.toLowerCase().endsWith(".pdf") ||
                                  video?.title?.toLowerCase().endsWith(".pdf");
                    const isWord = video?.media_type === "docx" || 
                                   video?.source_ref?.toLowerCase().endsWith(".docx") ||
                                   video?.title?.toLowerCase().endsWith(".docx");

                    if (isPdf) return <PdfWorkspace video={video} />;
                    if (isWord) return <WordWorkspace video={video} />;
                    
                    return (
                      <div className="px-6 py-6">
                        <VideoPlayer video={video} />
                        <TranscriptSection videoId={video.id} initialTranscript={video.transcript} />
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

