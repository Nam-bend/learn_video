"use client"

import { FileText, Search, ZoomIn, ZoomOut, MousePointer2, Type, ExternalLink, Download, MessageSquarePlus, CheckCircle2 } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface PdfWorkspaceProps {
  video: {
    id: string
    title: string
    source_ref?: string
    transcript?: string
  }
}

export function PdfWorkspace({ video }: PdfWorkspaceProps) {
  const [viewMode, setViewMode] = useState<"pdf" | "text">("pdf")
  const [zoom, setZoom] = useState(100)
  const [copied, setCopied] = useState(false)

  const handleAddToChat = () => {
    if (!video.transcript) return
    window.dispatchEvent(new CustomEvent("add-to-chat", {
      detail: { 
        content: video.transcript,
        action: "summarize" 
      }
    }))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const pdfUrl = video.source_ref ? `http://localhost:8000${video.source_ref}` : null

  return (
    <div className="flex flex-col h-full bg-neutral-50 overflow-hidden">
      {/* Workspace Header/Toolbar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-white border-b border-neutral-200/60 shadow-sm">
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode("pdf")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-md transition-all",
              viewMode === "pdf" ? "bg-white text-rose-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText className="size-3.5" />
            Bản gốc PDF
          </button>
          <button
            onClick={() => setViewMode("text")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-md transition-all",
              viewMode === "text" ? "bg-white text-rose-600 shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Type className="size-3.5" />
            Văn bản
          </button>
        </div>

        <div className="flex items-center gap-3">
          {viewMode === "pdf" && (
            <div className="flex items-center gap-1 border-r border-neutral-200 pr-3">
              <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="p-1.5 text-muted-foreground hover:bg-neutral-100 rounded-md transition-colors">
                <ZoomOut className="size-4" />
              </button>
              <span className="text-[11px] font-medium w-10 text-center text-muted-foreground">{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="p-1.5 text-muted-foreground hover:bg-neutral-100 rounded-md transition-colors">
                <ZoomIn className="size-4" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 gap-1.5 text-[11px] font-semibold border-neutral-200 hover:bg-neutral-50 text-neutral-700"
              onClick={handleAddToChat}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="size-3.5 text-emerald-500" />
                  Đã gửi vào Chat
                </>
              ) : (
                <>
                  <MessageSquarePlus className="size-3.5 text-rose-500" />
                  Gửi vào Chat
                </>
              )}
            </Button>
            {pdfUrl && (
              <a href={pdfUrl} target="_blank" rel="noreferrer" className="p-1.5 text-muted-foreground hover:bg-neutral-100 rounded-md transition-colors">
                <ExternalLink className="size-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Workspace Content */}
      <div className="flex-1 overflow-hidden relative">
        {viewMode === "pdf" ? (
          <div className="h-full w-full overflow-auto bg-neutral-200/50 p-4 flex justify-center scrollbar-thin">
            {pdfUrl ? (
              <iframe
                src={`${pdfUrl}#toolbar=0&view=FitH`}
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
        ) : (
          <div className="h-full w-full overflow-y-auto bg-white p-10 flex justify-center scrollbar-thin">
            <div className="max-w-2xl w-full">
              <div className="mb-8 pb-4 border-b border-neutral-100">
                <h1 className="text-2xl font-bold text-neutral-900 leading-tight">{video.title}</h1>
                <p className="mt-2 text-[12px] text-muted-foreground flex items-center gap-2">
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-medium">
                    <FileText className="size-3" /> PDF Document
                  </span>
                  • {video.transcript ? `${video.transcript.split(/\s+/).length} từ` : 'Đang xử lý nội dung...'}
                </p>
              </div>
              
              <div className="prose prose-neutral max-w-none">
                {video.transcript ? (
                  <div className="text-[15px] leading-[1.8] text-neutral-700 whitespace-pre-wrap selection:bg-rose-100 selection:text-rose-900">
                    {video.transcript}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
                    <p className="text-[13px] text-muted-foreground italic">Đang trích xuất dữ liệu văn bản...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}