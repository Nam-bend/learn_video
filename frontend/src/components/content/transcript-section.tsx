"use client"

import { useState, useEffect } from "react"
import { ChevronDown, Eye, FileText, Loader2, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

interface TranscriptSectionProps {
  videoId: string
  initialTranscript?: any
  initialTranslatedTranscript?: any
}

export function TranscriptSection({ videoId, initialTranscript, initialTranslatedTranscript }: TranscriptSectionProps) {
  const [activeTab, setActiveTab] = useState<"chapters" | "copy">("chapters")
  const [autoScroll, setAutoScroll] = useState(false)
  const [transcript, setTranscript] = useState<any[]>([])
  const [translatedTranscript, setTranslatedTranscript] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [translating, setTranslating] = useState(false)

  // Sync with initialTranscript when it changes or on mount
  useEffect(() => {
    if (initialTranscript && initialTranscript.length > 0) {
      setTranscript(Array.isArray(initialTranscript) ? initialTranscript : [])
    }
  }, [initialTranscript])

  useEffect(() => {
    if (initialTranslatedTranscript && initialTranslatedTranscript.length > 0) {
      setTranslatedTranscript(Array.isArray(initialTranslatedTranscript) ? initialTranslatedTranscript : [])
    }
  }, [initialTranslatedTranscript])

  const handleTabChange = async (tab: "chapters" | "copy") => {
    setActiveTab(tab)
    if (tab === "copy" && translatedTranscript.length === 0 && transcript.length > 0) {
      setTranslating(true)
      try {
        const result = await api.videos.translate(videoId)
        if (result && Array.isArray(result.translated_transcript)) {
          setTranslatedTranscript(result.translated_transcript)
        }
      } catch (error) {
        console.error("Failed to translate transcript:", error)
      } finally {
        setTranslating(false)
      }
    }
  }

  const handleGenerate = async () => {
    if (!videoId) return
    setLoading(true)
    try {
      const result = await api.transcript.generate(videoId)

      if (result && Array.isArray(result.transcript)) {
        setTranscript(result.transcript)
        setLoading(false)
      } else if (result && (result.status === "processing" || result.status === "already_processing")) {
        // Start polling the video status
        let failCount = 0
        const pollInterval = setInterval(async () => {
          try {
            const videoData = await api.videos.get(videoId)
            if (videoData.status === "done" && videoData.transcript) {
              setTranscript(videoData.transcript)
              if (videoData.translated_transcript) {
                setTranslatedTranscript(videoData.translated_transcript)
              }
              setLoading(false)
              clearInterval(pollInterval)
            } else if (videoData.status === "error") {
              console.error("Transcription error:", videoData.error_message)
              setLoading(false)
              clearInterval(pollInterval)
            }
            failCount = 0 // Reset on success
          } catch (e) {
            failCount++
            console.error("Polling error:", e)
            if (failCount > 5) {
              setLoading(false)
              clearInterval(pollInterval)
            }
          }
        }, 3000)

        // Safety timeout (5 mins)
        setTimeout(() => {
          setLoading(false)
          clearInterval(pollInterval)
        }, 300000)
      }

    } catch (error) {
      console.error("Failed to generate transcript:", error)
      setLoading(false)
    }
  }


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const currentDisplayList = activeTab === "chapters" ? transcript : translatedTranscript

  return (
    <div className="mt-6 border-t border-neutral-100 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-1 bg-neutral-100/50 p-1 rounded-xl">
          <button
            onClick={() => handleTabChange("chapters")}
            className={cn(
              "rounded-lg px-4 py-1.5 text-[13px] font-bold transition-all",
              activeTab === "chapters"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Nội dung
          </button>
          <button
            onClick={() => handleTabChange("copy")}
            className={cn(
              "rounded-lg px-4 py-1.5 text-[13px] font-bold transition-all",
              activeTab === "copy"
                ? "bg-white text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Bản dịch (Tiếng Việt)
          </button>
        </div>
        <div className="flex items-center gap-2">
          {(!transcript || transcript.length === 0) && !loading && (
            <button
              onClick={handleGenerate}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-1.5 text-[12px] font-bold text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-95"
            >
              <Sparkles className="size-3.5" />
              Tạo bản ghi
            </button>
          )}
          {loading && (
            <div className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-bold text-emerald-600 bg-emerald-50 rounded-xl">
              <Loader2 className="size-3.5 animate-spin" />
              Đang xử lý...
            </div>
          )}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-1.5 text-[12px] font-bold transition-all",
              autoScroll
                ? "bg-emerald-50 text-emerald-600 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.1)]"
                : "text-muted-foreground bg-neutral-100 hover:bg-neutral-200"
            )}
          >
            <Eye className="size-3.5" />
            Tự động cuộn
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {translating ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="size-8 text-emerald-500 animate-spin mb-3" />
            <p className="text-[14px] text-muted-foreground">
              Đang dịch bản sao sang tiếng Việt...
            </p>
          </div>
        ) : currentDisplayList && currentDisplayList.length > 0 ? (
          <div className="grid gap-1">
            {currentDisplayList.map((block, i) => (
              <div
                key={`${block.start}-${i}`}
                className="group flex gap-4 rounded-xl p-3 transition-all hover:bg-white hover:shadow-sm"
              >
                <button onClick={() => window.dispatchEvent(new CustomEvent('seek-video', { detail: block.start }))} className="flex flex-col items-center pt-0.5 group cursor-pointer">
                  <span className="inline-flex shrink-0 rounded-lg bg-neutral-100 px-2 py-1 font-mono text-[11px] font-bold text-neutral-500 tabular-nums transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                    {formatTime(block.start)}
                  </span>
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] leading-relaxed text-foreground/80 group-hover:text-foreground">
                    {block.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border-2 border-dashed border-neutral-100">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-neutral-50">
              <FileText className="size-7 text-neutral-200" />
            </div>
            <p className="text-[14px] font-medium text-muted-foreground max-w-[200px]">
              {activeTab === "copy" ? "Chưa có bản dịch. Hãy bấm nút tạo bản ghi trước để dịch." : "Chưa có bản ghi nào. Hãy nhấn nút 'Tạo bản ghi' để bắt đầu."}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
