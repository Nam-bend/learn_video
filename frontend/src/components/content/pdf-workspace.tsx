"use client"

import { FileText, Search, ZoomIn, ZoomOut, MousePointer2, ExternalLink, Download, MessageSquarePlus, CheckCircle2 } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PdfWorkspaceProps {
  video: {
    id: string
    title: string
    source_ref?: string
    transcript?: any
    status?: string
  }
}

export function PdfWorkspace({ video }: PdfWorkspaceProps) {
  const [zoom, setZoom] = useState(100)
  const [copied, setCopied] = useState(false)
  const [currentPage, setCurrentPage] = useState<number | null>(null)

  useEffect(() => {
    const handleSeekPage = (e: any) => {
      const page = e.detail
      if (typeof page === 'number') {
        setCurrentPage(page)
      }
    }
    window.addEventListener('seek-page', handleSeekPage)
    return () => window.removeEventListener('seek-page', handleSeekPage)
  }, [])

  const transcriptText = Array.isArray(video.transcript)
    ? video.transcript.map((item: any) => item.text).join("\n\n")
    : typeof video.transcript === "string"
      ? video.transcript
      : ""

  const handleAddToChat = () => {
    if (!transcriptText) return
    window.dispatchEvent(new CustomEvent("add-to-chat", {
      detail: {
        content: `Tôi vừa gửi tài liệu PDF này vào Chat. Hãy phân tích và tóm tắt ngắn gọn nội dung chính:\n\n${transcriptText.substring(0, 1500)}${transcriptText.length > 1500 ? "..." : ""}`,
        action: "summarize"
      }
    }))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pdfUrlBase = video.source_ref ? `http://localhost:8000/api/uploads/${video.source_ref}` : null
  const pdfUrl = pdfUrlBase
    ? (currentPage
        ? `${pdfUrlBase}#page=${currentPage}&toolbar=0&view=FitH`
        : `${pdfUrlBase}#toolbar=0&view=FitH`)
    : null

  const isProcessing = video.status === "transcribing" || (!transcriptText && video.status !== "done" && video.status !== "error")

  return (
    <div className="flex flex-col h-full bg-neutral-50 overflow-hidden">
      {/* Workspace Header/Toolbar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-white border-b border-neutral-200/60 shadow-sm">
        <div className="flex items-center gap-2 px-1">
          <div className="flex size-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
            <FileText className="size-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-neutral-800 leading-tight">{video.title}</span>
            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider">PDF Document</span>
          </div>
          {isProcessing && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600 border border-amber-200 animate-pulse">
              AI Đang Phân Tích...
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 border-r border-neutral-200 pr-3">
            <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1.5 text-muted-foreground hover:bg-neutral-100 rounded-md transition-colors">
              <ZoomOut className="size-4" />
            </button>
            <span className="text-[11px] font-medium w-10 text-center text-muted-foreground">{zoom}%</span>
            <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="p-1.5 text-muted-foreground hover:bg-neutral-100 rounded-md transition-colors">
              <ZoomIn className="size-4" />
            </button>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-[11px] font-semibold border-neutral-200 hover:bg-neutral-50 text-neutral-700"
              onClick={handleAddToChat}
              disabled={isProcessing}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  Đã gửi vào Chat
                </>
              ) : (
                <>
                  <MessageSquarePlus className="size-3.5 text-rose-500" />
                  Phân tích
                </>
              )}
            </Button>
            {pdfUrlBase && (
              <a href={pdfUrlBase} target="_blank" rel="noreferrer" className="p-1.5 text-muted-foreground hover:bg-neutral-100 rounded-md transition-colors" title="Xem bản gốc">
                <ExternalLink className="size-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Workspace Content */}
      <div className="flex-1 overflow-hidden relative">
        <div className="h-full w-full overflow-auto bg-neutral-200/50 p-4 flex justify-center scrollbar-thin">
          {pdfUrl ? (
            <iframe
              key={currentPage} // Force reload of iframe when jumping pages
              src={pdfUrl}
              className="bg-white shadow-xl rounded-sm border border-neutral-300"
              style={{
                width: `${zoom}%`,
                maxWidth: '1000px',
                minHeight: '100%',
                height: 'fit-content'
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <div className="p-4 rounded-full bg-neutral-100">
                <FileText className="size-10 opacity-20" />
              </div>
              <p className="text-[13px]">Không thể tải bản xem trước PDF</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}