"use client"

import { FileText, Type, Download, MessageSquarePlus, CheckCircle2, Loader2, AlertCircle, Layout, ExternalLink } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import mammoth from "mammoth"

interface WordWorkspaceProps {
  video: {
    id: string
    title: string
    source_ref?: string
    transcript?: string
  }
}

export function WordWorkspace({ video }: WordWorkspaceProps) {
  const [htmlContent, setHtmlContent] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadDocx = async () => {
      if (!video.source_ref) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`http://localhost:8000${video.source_ref}`)
        const arrayBuffer = await response.arrayBuffer()
        
        const result = await mammoth.convertToHtml({ arrayBuffer })
        setHtmlContent(result.value)
        
        // Handle warnings if any
        if (result.messages.length > 0) {
          console.warn("Mammoth conversion warnings:", result.messages)
        }
      } catch (err) {
        console.error("Failed to render Word document:", err)
        setError("Không thể hiển thị tài liệu Word. Có thể do định dạng không được hỗ trợ.")
      } finally {
        setLoading(false)
      }
    }

    loadDocx()
  }, [video.source_ref])

  const handleAddToChat = () => {
    if (!video.transcript && !htmlContent) return
    // Prefer the database transcript if available, fallback to html text
    const content = video.transcript || containerRef.current?.innerText || ""
    
    window.dispatchEvent(new CustomEvent("add-to-chat", {
      detail: { 
        content: content,
        action: "analyze" 
      }
    }))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const docUrl = video.source_ref ? `http://localhost:8000${video.source_ref}` : null

  return (
    <div className="flex flex-col h-full bg-[#f8f9fb] overflow-hidden">
      {/* Word Toolbar */}
      <div className="shrink-0 flex items-center justify-between px-5 py-2.5 bg-white border-b border-sky-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <FileText className="size-5" />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-neutral-900 leading-none">Microsoft Word</h2>
            <p className="mt-1 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Chế độ soạn thảo</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 gap-2 text-[12px] font-bold border-sky-200 bg-white hover:bg-sky-50 text-sky-700 hover:text-sky-800 transition-all active:scale-95"
            onClick={handleAddToChat}
          >
            {copied ? (
              <>
                <CheckCircle2 className="size-4 text-emerald-500" />
                Đã thêm vào AI
              </>
            ) : (
              <>
                <MessageSquarePlus className="size-4 text-sky-600" />
                Gửi vào Chat
              </>
            )}
          </Button>
          {docUrl && (
            <a 
              href={docUrl} 
              download 
              className="flex items-center justify-center size-9 rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-all shadow-sm"
              title="Tải xuống tài liệu"
            >
              <Download className="size-4" />
            </a>
          )}
        </div>
      </div>

      {/* Word Content Area */}
      <div className="flex-1 overflow-y-auto p-8 flex justify-center scrollbar-thin">
        <div className="max-w-[850px] w-full min-h-[1100px] bg-white shadow-[0_0_50px_rgba(0,0,0,0.06)] border border-neutral-200/60 rounded-sm p-16 relative overflow-hidden">
          
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm z-10">
              <Loader2 className="size-10 animate-spin text-sky-500" />
              <p className="text-[13px] font-semibold text-sky-700 animate-pulse">Đang nạp dữ liệu Word...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
              <div className="p-4 rounded-full bg-red-50">
                <AlertCircle className="size-10 text-red-500" />
              </div>
              <p className="text-[14px] text-red-600 font-medium max-w-[280px]">{error}</p>
              <Button variant="link" className="text-sky-600 font-bold" onClick={() => window.location.reload()}>Thử lại</Button>
            </div>
          ) : (
            <article ref={containerRef} className="prose prose-sky max-w-none prose-headings:text-neutral-900 prose-p:text-neutral-700 prose-p:leading-[1.8] prose-p:text-[15px] prose-li:text-neutral-700">
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
              {!htmlContent && video.transcript && (
                <div className="whitespace-pre-wrap text-neutral-700 text-[15px] leading-[1.8]">
                  {video.transcript}
                </div>
              )}
              {!htmlContent && !video.transcript && (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground italic">
                  Tài liệu không có nội dung văn bản.
                </div>
              )}
            </article>
          )}

          {/* Page Indicator Mock */}
          <div className="absolute bottom-4 left-0 right-0 flex justify-center">
            <span className="text-[10px] text-neutral-300 font-bold uppercase tracking-[0.2em]">End of Document</span>
          </div>
        </div>
      </div>

      {/* Dynamic CSS for rendered content */}
      <style jsx global>{`
        .prose h1 { font-size: 2.2em; border-bottom: 2px solid #f1f5f9; padding-bottom: 0.5em; margin-bottom: 1em; }
        .prose h2 { font-size: 1.5em; margin-top: 1.5em; color: #0369a1; }
        .prose table { border-collapse: collapse; width: 100%; margin: 1.5em 0; }
        .prose table td, .prose table th { border: 1px solid #e2e8f0; padding: 0.75em; }
        .prose table th { background-color: #f8fafc; font-weight: bold; }
        .prose img { max-width: 100%; height: auto; border-radius: 4px; margin: 2em 0; }
      `}</style>
    </div>
  )
}