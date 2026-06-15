"use client"

import { Play, FileText } from "lucide-react"
import { useEffect, useRef } from "react"
import { BACKEND_URL } from "@/lib/api"

export function VideoPlayer({ video }: { video: any }) {
  const isYoutube = video.source_type === "youtube" || video.source_ref?.includes("youtube.com") || video.source_ref?.includes("youtu.be")
  const videoRef = useRef<HTMLVideoElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  const youtubeId = isYoutube ? getYoutubeId(video.source_ref) : null

  useEffect(() => {
    const handler = (e: Event) => {
      const time = (e as CustomEvent).detail;
      if (isYoutube && iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'seekTo',
          args: [time, true]
        }), '*');
      } else if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    };
    window.addEventListener('seek-video', handler);
    return () => window.removeEventListener('seek-video', handler);
  }, [isYoutube]);

  return (
    <div className="group relative aspect-video overflow-hidden rounded-2xl bg-neutral-900 shadow-[0_2px_8px_rgba(0,0,0,0.08)]">
      {isYoutube && youtubeId ? (
        <iframe
          ref={iframeRef}
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      ) : video.source_type === "local" && video.source_ref ? (
        <video
          ref={videoRef}
          controls
          className="h-full w-full"
          src={`${BACKEND_URL}/api/uploads/${video.source_ref}`}
        />
      ) : (video.media_type === "pdf" || video.media_type === "docx") ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="mb-4 flex size-20 items-center justify-center rounded-3xl bg-white shadow-sm ring-1 ring-blue-100">
            <FileText className="size-10 text-blue-500" />
          </div>
          <h3 className="text-[16px] font-bold text-neutral-800">Tài liệu {video.media_type.toUpperCase()}</h3>
          <p className="mt-1 text-[13px] text-neutral-500">{video.title}</p>
        </div>
      ) : (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(16,185,129,0.08)_0%,transparent_50%,rgba(20,184,166,0.05)_100%)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/20 group-hover:scale-105 cursor-pointer">
                <Play className="size-6 text-white fill-white ml-0.5" />
              </div>
              <p className="text-[12px] font-medium text-white/50 transition-colors group-hover:text-white/70">
                {video.status === "pending" ? "Đang xử lý..." : "Nhấn để phát"}
              </p>
            </div>
          </div>
        </>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  )
}

