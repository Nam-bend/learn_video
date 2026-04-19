"use client"

import { SidebarProvider, SidebarInset, useSidebar } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { ContentHeader } from "@/components/content/content-header"
import { VideoPlayer } from "@/components/content/video-player"
import { TranscriptSection } from "@/components/content/transcript-section"
import { AiToolsSidebar } from "@/components/content/ai-tools-sidebar"
import { ChatInput } from "@/components/content/chat-input"
import { ChevronsRight } from "lucide-react"
import { HeaderActions } from "@/components/dashboard/header-actions"

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

export default function ContentPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#fafafa]">
        <CollapsedHeader />
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100">
              <ContentHeader />
              <SidebarAwareHeader />
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-4xl px-5 py-5">
                <VideoPlayer />
                <TranscriptSection />
              </div>
            </div>
          </div>
          <AiToolsSidebar />
        </div>
        <ChatInput />
      </SidebarInset>
    </SidebarProvider>
  )
}
