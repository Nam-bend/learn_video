"use client"

import { Upload, Loader2 } from "lucide-react"
import { useState, useRef } from "react"
import { api } from "@/lib/api"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export function UploadZone() {
  const [isDragActive, setIsDragActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleUpload = async (file: File) => {
    // Validate file extension
    const ext = "." + file.name.split(".").pop()?.toLowerCase()
    const allowed = [".mp4", ".mkv", ".avi", ".mov", ".webm", ".pdf", ".docx"]
    if (!allowed.includes(ext)) {
      alert("Định dạng file không được hỗ trợ. Vui lòng chọn Video, PDF hoặc Word.")
      return
    }

    setLoading(true)
    setUploadProgress(10) // Giả lập bắt đầu
    
    try {
      // Giả lập thanh tiến trình chạy dần
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval)
            return 90
          }
          return prev + 10
        })
      }, 300)

      const result = await api.upload.file(file)
      clearInterval(interval)
      setUploadProgress(100)

      if (result.id) {
        // Chờ hiệu ứng hoàn tất rồi chuyển trang
        setTimeout(() => {
          router.push(`/content?id=${result.id}`)
        }, 300)
      }
    } catch (error) {
      console.error("Upload failed:", error)
      alert("Tải lên thất bại. Vui lòng thử lại.")
      setUploadProgress(0)
    } finally {
      setLoading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true)
    } else if (e.type === "dragleave") {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUpload(e.target.files[0])
    }
  }

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="w-full max-w-2xl animate-fade-in-up animate-delay-200">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="video/*,.pdf,.docx"
        onChange={handleFileChange}
        disabled={loading}
      />

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={loading ? undefined : onButtonClick}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 cursor-pointer",
          isDragActive
            ? "border-emerald-500 bg-emerald-50/50 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.15)]"
            : "border-neutral-200 bg-white hover:border-emerald-300 hover:bg-neutral-50/30",
          loading && "pointer-events-none border-emerald-200 bg-emerald-50/10"
        )}
      >
        {loading ? (
          <div className="flex flex-col items-center py-4">
            <div className="relative flex items-center justify-center">
              <Loader2 className="size-10 text-emerald-500 animate-spin" />
              <span className="absolute text-[11px] font-semibold text-emerald-700">
                {uploadProgress}%
              </span>
            </div>
            <p className="mt-4 text-[14px] font-semibold text-foreground">
              Đang xử lý tài liệu của bạn...
            </p>
            <p className="mt-1 text-[12px] text-muted-foreground">
              Đang phân tích cú pháp và trích xuất nội dung
            </p>
            {/* Thanh tiến trình mini */}
            <div className="mt-4 h-1.5 w-48 overflow-hidden rounded-full bg-neutral-100">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Icons group */}
            <div className="relative mb-4 flex items-center justify-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-100">
                <Upload className="size-5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[14px] font-semibold text-foreground">
                Kéo thả tài liệu vào đây hoặc <span className="text-emerald-600 underline">chọn từ thiết bị</span>
              </p>
              <p className="text-[12px] text-muted-foreground">
                Hỗ trợ tải lên nhanh Video, tài liệu PDF hoặc Word
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
