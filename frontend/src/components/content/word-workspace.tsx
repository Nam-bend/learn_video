"use client"

import { FileText, Download, MessageSquarePlus, CheckCircle2, ZoomIn, ZoomOut } from "lucide-react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"

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

  const pages = useMemo(() => {
    if (Array.isArray(video.transcript)) {
      return video.transcript as { start?: number; page?: number; text: string }[]
    } else if (typeof video.transcript === "string" && video.transcript) {
      return [{ page: 1, text: video.transcript }]
    }
    return []
  }, [video.transcript])

  const wordCount = useMemo(() =>
    pages.reduce((acc, p) => acc + (p.text?.split(/\s+/).filter(Boolean).length ?? 0), 0),
    [pages]
  )

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

  const docUrl = video.source_ref ? `http://localhost:8000/api/uploads/${video.source_ref}` : null
  const isProcessing = video.status === "transcribing" || (!pages.length && video.status !== "done" && video.status !== "error")

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
          {pages.length > 0 && (
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
            disabled={isProcessing || pages.length === 0}
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
          <div className="w-full max-w-[760px] bg-white rounded-xl border border-neutral-200 shadow-sm p-10 flex flex-col items-center justify-center gap-4 min-h-[400px] text-center">
            <div className="size-12 rounded-full bg-blue-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-700">Đang trích xuất văn bản...</p>
              <p className="text-xs text-neutral-400 mt-1">AI đang phân tích cấu trúc tài liệu</p>
            </div>
          </div>
        ) : pages.length > 0 ? (
          <div className="w-full max-w-[760px] space-y-px">
            {/* Meta info strip */}
            <div className="flex items-center gap-4 mb-4 px-1">
              <span className="text-[11px] text-neutral-400">{pages.length} trang</span>
              <span className="text-neutral-200">·</span>
              <span className="text-[11px] text-neutral-400">{wordCount.toLocaleString("vi-VN")} từ</span>
              <span className="text-neutral-200">·</span>
              <span className="text-[11px] text-neutral-400">~{Math.ceil(wordCount / 220)} phút đọc</span>
            </div>

            {/* Pages */}
            {pages.map((p, idx) => {
              const pageNum = (p as any).start ?? (p as any).page ?? idx + 1
              return (
                <div
                  key={pageNum}
                  id={`doc-page-${pageNum}`}
                  className="bg-white rounded-xl border border-neutral-200/70 shadow-[0_1px_4px_rgba(0,0,0,0.04)] p-8 sm:p-10 relative transition-all duration-300"
                >
                  {/* Page number badge */}
                  <div className="absolute top-3.5 right-4 text-[10px] font-bold text-neutral-300 select-none">
                    {pageNum}
                  </div>

                  {/* Title on first page */}
                  {idx === 0 && (
                    <h1 className="text-xl font-bold text-neutral-900 mb-6 pb-4 border-b border-neutral-100 leading-snug">
                      {video.title}
                    </h1>
                  )}

                  {/* Content blocks */}
                  <div className="space-y-3" style={{ fontSize: `${fontSize}px` }}>
                    {p.text.split(/\n\n+/).map((block: string, bIdx: number) => {
                      const b = block.trim()
                      if (!b) return null

                      // Heading
                      const headingMatch = b.match(/^(#+)\s+(.+)$/)
                      if (headingMatch) {
                        const level = headingMatch[1].length
                        const text = headingMatch[2]
                        if (level === 1) return <h2 key={bIdx} className="text-base font-bold text-neutral-800 mt-5 mb-1">{text}</h2>
                        if (level === 2) return <h3 key={bIdx} className="text-sm font-bold text-neutral-700 mt-4 mb-1">{text}</h3>
                        return <h4 key={bIdx} className="text-sm font-semibold text-neutral-600 mt-3 mb-0.5">{text}</h4>
                      }

                      // Markdown table
                      if (b.includes("|") && b.includes("\n")) {
                        const lines = b.split("\n").map(l => l.trim()).filter(Boolean)
                        const rows = lines.filter(l => l.startsWith("|") && !l.match(/^\|[-:\s|]+\|$/))
                        if (rows.length > 0) {
                          return (
                            <div key={bIdx} className="overflow-x-auto rounded-lg border border-neutral-200 my-3">
                              <table className="min-w-full text-xs">
                                <tbody className="divide-y divide-neutral-100">
                                  {rows.map((row, ri) => {
                                    const cells = row.split("|").map(c => c.trim()).filter((_, ci, arr) => ci > 0 && ci < arr.length - 1)
                                    return (
                                      <tr key={ri} className={ri === 0 ? "bg-neutral-50 font-semibold" : "hover:bg-neutral-50/50"}>
                                        {cells.map((cell, ci) => (
                                          <td key={ci} className="px-3 py-2 border-r border-neutral-100 last:border-0 text-neutral-700">{cell}</td>
                                        ))}
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )
                        }
                      }

                      // Bullet list
                      if (b.startsWith("- ")) {
                        const items = b.split("\n").map(l => l.trim()).filter(l => l.startsWith("- "))
                        return (
                          <ul key={bIdx} className="pl-5 space-y-1 my-2">
                            {items.map((li, li_i) => (
                              <li key={li_i} className="text-neutral-700 list-disc leading-relaxed">{li.slice(2)}</li>
                            ))}
                          </ul>
                        )
                      }

                      // Context prefix from RAG (strip "[Context >]: " pattern)
                      const cleaned = b.replace(/^\[.+?\]:\s*/, "")

                      return (
                        <p key={bIdx} className="text-neutral-700 leading-[1.75] text-justify">
                          {cleaned}
                        </p>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {/* Bottom spacer */}
            <div className="h-8" />
          </div>
        ) : (
          <div className="m-auto flex flex-col items-center text-center max-w-xs p-8 bg-white rounded-2xl border border-neutral-200">
            <div className="size-14 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 mb-4">
              <FileText className="size-7" />
            </div>
            <p className="text-sm font-semibold text-neutral-700">Không tìm thấy nội dung</p>
            <p className="text-xs text-neutral-400 mt-1">Tài liệu chưa được trích xuất thành công.</p>
            {docUrl && (
              <a href={docUrl} download className="mt-5 flex items-center gap-1.5 h-9 px-4 rounded-xl bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 transition-all">
                <Download className="size-3.5" /> Tải bản gốc
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}