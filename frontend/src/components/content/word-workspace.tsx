"use client"

import { FileText, Download, MessageSquarePlus, CheckCircle2, ZoomIn, ZoomOut, Loader2 } from "lucide-react"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import mammoth from "mammoth"
import { BACKEND_URL } from "@/lib/api"

interface WordWorkspaceProps {
  video: {
    id: string
    title: string
    source_ref?: string
    transcript?: any
    status?: string
  }
}

export function WordWorkspace({ video }: WordWorkspaceProps) {
  const [copied, setCopied] = useState(false)
  const [fontSize, setFontSize] = useState(15)
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [convertError, setConvertError] = useState<string | null>(null)

  const docUrl = video.source_ref ? `${BACKEND_URL}/api/uploads/${video.source_ref}` : null

  // Process raw text for AI Chat
  const pages = useMemo(() => {
    if (Array.isArray(video.transcript)) {
      return video.transcript as { start?: number; page?: number; text: string }[]
    } else if (typeof video.transcript === "string" && video.transcript) {
      return [{ page: 1, text: video.transcript }]
    }
    return []
  }, [video.transcript])

  // Convert DOCX to HTML using Mammoth
  useEffect(() => {
    if (!docUrl) return

    let mounted = true
    setIsConverting(true)
    setConvertError(null)

    fetch(docUrl)
      .then(res => {
        if (!res.ok) throw new Error("Không thể tải file gốc")
        return res.arrayBuffer()
      })
      .then(arrayBuffer => {
        return mammoth.convertToHtml({ arrayBuffer })
      })
      .then(result => {
        if (mounted) {
          setHtmlContent(result.value)
          setIsConverting(false)
        }
      })
      .catch(err => {
        if (mounted) {
          console.error("Mammoth conversion error:", err)
          setConvertError("Đã có lỗi xảy ra khi hiển thị file Word. Vui lòng tải file gốc về máy để xem.")
          setIsConverting(false)
        }
      })

    return () => { mounted = false }
  }, [docUrl])


  const handleAddToChat = () => {
    const fullText = pages.map(p => p.text).join("\n\n")
    if (!fullText) return
    window.dispatchEvent(new CustomEvent("add-to-chat", {
      detail: {
        content: `Hãy phân tích và tóm tắt ngắn gọn nội dung chính của tài liệu này:\n\n${fullText.substring(0, 1500)}${fullText.length > 1500 ? "..." : ""}`,
        action: "analyze"
      }
    }))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isProcessing = video.status === "transcribing" || isConverting

  return (
    <div className="flex flex-col h-full bg-[#f7f8fa] overflow-hidden">
      {/* Toolbar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2.5 bg-white border-b border-neutral-100 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <FileText className="size-4" />
          </div>
          <div>
            <p className="text-[13px] font-bold text-neutral-800 leading-tight max-w-[240px] truncate" title={video.title}>
              {video.title}
            </p>
            <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wider">Word Document</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Font size controls */}
          {htmlContent && (
            <div className="flex items-center gap-0.5 bg-neutral-100 p-0.5 rounded-lg">
              <button onClick={() => setFontSize(s => Math.max(12, s - 1))} className="p-1.5 hover:bg-white rounded-md transition-colors text-neutral-500">
                <ZoomOut className="size-3.5" />
              </button>
              <span className="text-[11px] font-medium w-8 text-center text-neutral-600">{fontSize}</span>
              <button onClick={() => setFontSize(s => Math.min(22, s + 1))} className="p-1.5 hover:bg-white rounded-md transition-colors text-neutral-500">
                <ZoomIn className="size-3.5" />
              </button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-[11px] font-bold border-blue-200 hover:bg-blue-50 text-blue-700 bg-white"
            onClick={handleAddToChat}
            disabled={pages.length === 0}
          >
            {copied ? (
              <><CheckCircle2 className="size-3.5 text-emerald-500" /> Đã gửi</>
            ) : (
              <><MessageSquarePlus className="size-3.5" /> Hỏi AI</>
            )}
          </Button>

          {docUrl && (
            <a href={docUrl} download title="Tải xuống tài liệu gốc"
              className="flex size-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 transition-all">
              <Download className="size-4" />
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto py-6 px-4 sm:px-8 flex justify-center custom-scrollbar">
        {isProcessing ? (
          <div className="w-full max-w-[800px] bg-white rounded-xl border border-neutral-200 shadow-sm p-10 flex flex-col items-center justify-center gap-4 min-h-[500px] text-center">
            <div className="size-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Loader2 className="animate-spin size-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-700">Đang render tài liệu Word...</p>
              <p className="text-xs text-neutral-400 mt-1">Đang xử lý hình ảnh và định dạng</p>
            </div>
          </div>
        ) : convertError ? (
          <div className="w-full max-w-[800px] bg-white rounded-xl border border-rose-200 shadow-sm p-10 flex flex-col items-center justify-center gap-4 min-h-[500px] text-center">
            <div className="size-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
              <FileText className="size-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-rose-700">Lỗi hiển thị</p>
              <p className="text-xs text-rose-500 mt-1">{convertError}</p>
            </div>
            {docUrl && (
              <a href={docUrl} download className="mt-2 flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 transition-all">
                <Download className="size-3.5" /> Tải bản gốc
              </a>
            )}
          </div>
        ) : htmlContent ? (
          <div className="w-full max-w-[850px]">
            <div
              className="bg-white rounded-xl border border-neutral-200/70 shadow-[0_2px_8px_rgba(0,0,0,0.06)] p-10 sm:p-14 transition-all duration-300 mammoth-document"
              style={{ fontSize: `${fontSize}px` }}
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
            {/* Inject minimal styles for mammoth output */}
            <style dangerouslySetInnerHTML={{
              __html: `
              .mammoth-document h1 { font-size: 2em; font-weight: bold; margin-bottom: 0.5em; color: #111; }
              .mammoth-document h2 { font-size: 1.5em; font-weight: bold; margin-top: 1.5em; margin-bottom: 0.5em; color: #222; }
              .mammoth-document h3 { font-size: 1.25em; font-weight: bold; margin-top: 1.2em; margin-bottom: 0.4em; color: #333; }
              .mammoth-document p { margin-bottom: 1em; line-height: 1.6; color: #374151; }
              .mammoth-document ul { margin-bottom: 1em; padding-left: 2em; list-style-type: disc; }
              .mammoth-document ol { margin-bottom: 1em; padding-left: 2em; list-style-type: decimal; }
              .mammoth-document li { margin-bottom: 0.5em; line-height: 1.6; color: #374151; }
              .mammoth-document img { max-width: 100%; height: auto; border-radius: 8px; margin: 1em auto; display: block; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
              .mammoth-document table { width: 100%; border-collapse: collapse; margin-bottom: 1.5em; }
              .mammoth-document th, .mammoth-document td { border: 1px solid #e5e7eb; padding: 8px 12px; }
              .mammoth-document th { background-color: #f9fafb; font-weight: 600; }
              .mammoth-document a { color: #2563eb; text-decoration: underline; }
            `}} />
            <div className="h-12" />
          </div>
        ) : (
          <div className="m-auto flex flex-col items-center text-center max-w-xs p-8 bg-white rounded-2xl border border-neutral-200">
            <div className="size-14 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 mb-4">
              <FileText className="size-7" />
            </div>
            <p className="text-sm font-semibold text-neutral-700">Chưa có nội dung</p>
          </div>
        )}
      </div>
    </div>
  )
}