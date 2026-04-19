"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { HeaderActions } from "@/components/dashboard/header-actions"
import { WelcomeSection } from "@/components/dashboard/welcome-section"
import { FeatureCards } from "@/components/dashboard/feature-cards"
import { SearchBar } from "@/components/dashboard/search-bar"
import { WorkspaceSection } from "@/components/dashboard/workspace-section"
import { RecentSection } from "@/components/dashboard/recent-section"
import { useSidebar } from "@/components/ui/sidebar"
import { ChevronsRight } from "lucide-react"

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
        <span className="text-sm font-semibold tracking-tight text-foreground">
          YouLearn
        </span>
      </div>
      <div className="ml-auto">
        <HeaderActions />
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#fafafa]">
        <CollapsedHeader />
        <div className="flex-1 overflow-auto">
          <div className="flex justify-end px-6 pt-4 sm:px-8 has-[+div>div>div.sticky.top-0]:pt-0">
            <HeaderSidebarAwareActions />
          </div>
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 pb-10 pt-4 sm:px-8 sm:pb-14 sm:pt-6">
            <WelcomeSection />
            <FeatureCards />
            <SearchBar />
            <div className="w-full max-w-2xl">
              <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
            </div>
            <WorkspaceSection />
            <RecentSection />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function HeaderSidebarAwareActions() {
  const { open } = useSidebar()

  if (!open) return null

  return <HeaderActions />
}
