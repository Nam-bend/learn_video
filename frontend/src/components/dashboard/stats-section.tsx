"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api"
import { BookOpen, CheckCircle2, Award, FileVideo, FileText, File } from "lucide-react"

export function StatsSection() {
  const [stats, setStats] = useState({
    total: 0,
    videos: 0,
    pdfs: 0,
    words: 0,
    completed: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.videos.list()
        
        let videosCount = 0
        let pdfsCount = 0
        let wordsCount = 0
        let completedCount = 0

        data.forEach((item: any) => {
          if (item.status === "completed") completedCount++
          
          const title = (item.title || "").toLowerCase()
          if (title.endsWith(".pdf")) {
            pdfsCount++
          } else if (title.endsWith(".docx")) {
            wordsCount++
          } else {
            // Mặc định hoặc có đuôi video / youtube
            videosCount++
          }
        })

        setStats({
          total: data.length,
          videos: videosCount,
          pdfs: pdfsCount,
          words: wordsCount,
          completed: completedCount
        })
      } catch (error) {
        console.error("Failed to fetch stats for dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="w-full max-w-2xl animate-pulse">
        <div className="h-4 w-24 bg-neutral-200 rounded mb-4" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-20 bg-white rounded-2xl border border-neutral-100" />
          <div className="h-20 bg-white rounded-2xl border border-neutral-100" />
          <div className="h-20 bg-white rounded-2xl border border-neutral-100" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl animate-fade-in-up animate-delay-300">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-[15px] font-semibold text-foreground">Tổng quan học tập</h2>
        <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
          Số liệu thực tế
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Card 1: Tổng số tài liệu */}
        <div className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_-2px_rgba(0,0,0,0.05)]">
          <div className="absolute -right-2 -bottom-2 opacity-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <BookOpen className="size-16 text-neutral-900" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <BookOpen className="size-4.5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Tài liệu học</p>
              <p className="text-lg font-bold text-foreground leading-none mt-0.5">{stats.total}</p>
            </div>
          </div>
        </div>

        {/* Card 2: Hoàn thành xử lý */}
        <div className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_-2px_rgba(0,0,0,0.05)]">
          <div className="absolute -right-2 -bottom-2 opacity-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <CheckCircle2 className="size-16 text-neutral-900" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-4.5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Đã xử lý</p>
              <p className="text-lg font-bold text-foreground leading-none mt-0.5">{stats.completed}</p>
            </div>
          </div>
        </div>

        {/* Card 3: Phân loại định dạng */}
        <div className="group relative overflow-hidden rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04),inset_0_0_0_1px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_16px_-2px_rgba(0,0,0,0.05)]">
          <div className="absolute -right-2 -bottom-2 opacity-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
            <Award className="size-16 text-neutral-900" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Award className="size-4.5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">Định dạng</p>
              <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
                <span className="flex items-center gap-0.5 bg-blue-50 text-blue-700 px-1 rounded">
                  {stats.videos}V
                </span>
                <span className="flex items-center gap-0.5 bg-rose-50 text-rose-700 px-1 rounded">
                  {stats.pdfs}P
                </span>
                <span className="flex items-center gap-0.5 bg-sky-50 text-sky-700 px-1 rounded">
                  {stats.words}W
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
