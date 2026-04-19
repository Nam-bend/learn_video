"use client"

import Link from "next/link"
import {
  Plus,
  Search,
  Clock,
  ChevronRight,
  Box,
  EllipsisVertical,
  ThumbsUp,
  BookOpen,
  Smartphone,
  Sparkles,
  ChevronsLeft,
  ChevronDown,
  Globe,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const menuItemClass =
  "flex h-fit w-full items-center justify-start truncate rounded-lg p-2 text-sm font-medium text-primary/70 hover:bg-primary/5 hover:text-primary dark:text-primary/80 transition-colors"

const sectionLabelClass =
  "group mb-[1px] flex h-fit w-full items-center gap-0.5 rounded-md px-2 py-1 text-sm font-normal text-primary/60 hover:bg-primary/5 hover:text-primary/80 dark:text-primary/70 transition-colors"

function NavItem({
  icon: Icon,
  label,
  badge,
  greenDot,
}: {
  icon: React.ElementType
  label: string
  badge?: string
  greenDot?: boolean
}) {
  return (
    <button className={cn(menuItemClass, "group underline-none text-left w-full")}>
      <Icon className="mr-2 size-4 shrink-0 group-hover:text-primary" />
      <span className="text-sm font-medium group-hover:text-primary">
        {label}
        {greenDot && (
          <sup>
            <span className="ml-1 inline-block size-2 rounded-full bg-green-500" />
          </sup>
        )}
        {badge && (
          <span className="ml-1 rounded bg-blue-50 px-1 py-0.5 text-[10px] text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            {badge}
          </span>
        )}
      </span>
    </button>
  )
}

function WorkspaceItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className="group flex items-center">
      <button
        className={cn(
          menuItemClass,
          "relative justify-between",
          active && "text-primary dark:text-primary"
        )}
      >
        <div className="flex min-w-0 flex-1 items-center">
          <span className="mr-2 shrink-0">
            <Box className="hidden size-4 shrink-0 group-hover:hidden" />
            <ChevronRight className="hidden size-4 shrink-0 group-hover:block" />
          </span>
          <span className="block w-full truncate text-sm font-medium group-hover:text-primary">
            {label}
          </span>
        </div>
        <span className="absolute right-2 flex items-center opacity-0 group-hover:opacity-100">
          <EllipsisVertical className="size-3.5 shrink-0 text-primary" />
        </span>
      </button>
    </div>
  )
}

function PromoCard() {
  return (
    <div className="relative mx-auto flex h-[210px] w-full cursor-pointer flex-col rounded-lg border bg-card p-3 pb-2 text-card-foreground shadow-sm">
      <div className="flex flex-1 flex-col justify-center">
        <div className="mb-0.5 flex items-center justify-between gap-2">
          <h3 className="line-clamp-1 flex-1 text-sm font-medium leading-tight">
            Tải ứng dụng YouLearn
          </h3>
          <span className="rounded bg-blue-50 px-1 py-0.5 text-[10px] text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">
            Mới
          </span>
        </div>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          Truy cập YouLearn mọi nơi và mọi lúc.
        </p>
      </div>
      <div className="group relative mt-4 flex h-16 w-full items-center justify-center overflow-hidden rounded-lg bg-muted/20">
        <Smartphone className="size-8 text-muted-foreground/40" />
      </div>
      <div className="mt-4 flex justify-between gap-2">
        <button className="rounded-lg p-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          Miễn phí
        </button>
        <button className="rounded-lg p-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          Tìm hiểu thêm
        </button>
      </div>
    </div>
  )
}

function UserProfile() {
  return (
    <div className="mt-2 flex w-full flex-col px-2">
      <div className="flex flex-col items-center justify-center">
        <div className="flex min-w-[200px] justify-center space-x-1 rounded-t-lg border-l-[0.5px] border-r-[0.25px] border-t-[0.5px] border-[#3CB371]/50 bg-gradient-to-b from-[#3CB371]/10 to-[#3CB371]/5 px-6 py-[.5px] text-center text-xs font-normal text-[#3CB371] backdrop-blur-md dark:border-[#3CB371] dark:from-[#3CB371]/20 dark:to-[#3CB371]/5 dark:text-[#3CB371]">
          <p className="capitalize">free</p>
          <p>Kế hoạch</p>
        </div>
        <div className="w-full">
          <button
            className={cn(
              "inline-flex h-fit w-full items-center justify-between truncate rounded-2xl border border-primary/10 bg-white px-3 py-3 text-left shadow-sm transition-colors duration-200 ease-in-out hover:bg-primary/5 dark:border-primary/20 dark:bg-transparent dark:hover:bg-primary/10"
            )}
          >
            <div className="flex min-w-0 flex-1 items-center">
              <Avatar className="size-6 shrink-0 border border-primary/10 dark:border-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-[10px] font-semibold">
                  FF
                </AvatarFallback>
              </Avatar>
              <div className="ml-[-3px] flex min-w-0 flex-1 flex-col">
                <p className="truncate text-sm font-medium leading-tight">
                  Fuoc Faris
                </p>
              </div>
            </div>
            <ChevronDown className="size-4 shrink-0" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function AppSidebar() {
  const { toggleSidebar } = useSidebar()

  return (
    <Sidebar
      collapsible="offcanvas"
      className="border-r border-primary/5 bg-neutral-50 dark:bg-[#1E1E1E]"
    >
      <SidebarHeader className="p-0">
        <div className="mb-3 ml-4 mr-2 flex items-center justify-between pt-4">
          <Link href="/" className="w-fit">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-[#3CB371] text-white">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
              </div>
              <span className="text-[15px] font-semibold tracking-tight text-foreground">
                YouLearn
              </span>
            </div>
          </Link>
          <button
            onClick={toggleSidebar}
            className="rounded-md p-1 text-muted-foreground transition-opacity duration-300 ease-in-out hover:bg-primary/5 hover:text-foreground"
          >
            <ChevronsLeft className="size-5 cursor-pointer" />
          </button>
        </div>

        <div className="mb-2 px-2 pb-1">
          <div className="space-y-[1px]">
            <Link href="/">
              <button className={menuItemClass}>
                <Plus className="mr-2 size-4" />
                <span>Thêm nội dung</span>
              </button>
            </Link>
            <button className={menuItemClass}>
              <Search className="mr-2 size-4" />
              <span>Tìm kiếm</span>
            </button>
            <Link href="/history">
              <button className={menuItemClass}>
                <Clock className="mr-2 size-4" />
                <span>Lịch sử</span>
              </button>
            </Link>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="scrollbar-hide overflow-y-auto overscroll-y-none px-0">
        <nav className="h-full w-full">
          <ul className="flex h-full min-h-[calc(80vh)] flex-col items-start space-y-2 px-2">
            <li className="w-full">
              <button className={sectionLabelClass}>
                <span>Gần đây</span>
                <ChevronRight className="size-3.5 rotate-90 opacity-0 transition-all duration-200 group-hover:opacity-100" />
              </button>
            </li>

            <li className="w-full">
              <button className={sectionLabelClass}>
                <span>Khoảng cách</span>
                <ChevronRight className="size-3.5 rotate-90 opacity-0 transition-all duration-200 group-hover:opacity-100" />
              </button>
              <div className="flex w-full flex-col space-y-[1px]">
                <button className={menuItemClass}>
                  <Plus className="mr-2 size-4" />
                  <span>Không gian mới</span>
                </button>
                <WorkspaceItem label="Không gian của Fuoc" active />
              </div>
            </li>

            <li className="w-full">
              <button className={sectionLabelClass}>
                <span>Thư viện của tôi</span>
                <ChevronRight className="size-3.5 opacity-100 transition-all duration-200" />
              </button>
            </li>

            <li className="pt-2">
              <p className="mb-1 ml-2 text-sm font-normal text-primary/60 dark:text-primary/70">
                Trợ giúp & Công cụ
              </p>
              <div className="flex flex-col space-y-[1px]">
                <NavItem icon={ThumbsUp} label="Nhận xét" />
                <NavItem icon={BookOpen} label="Hướng dẫn nhanh" greenDot />
                <NavItem icon={Smartphone} label="Ứng dụng di động" badge="Mới" greenDot />
                <NavItem icon={Globe} label="Tiện ích mở rộng Chrome" />
                <NavItem icon={Sparkles} label="Tính năng mới" />
              </div>
            </li>

            <li className="w-full grow">
              <PromoCard />
            </li>
          </ul>
        </nav>
      </SidebarContent>

      <SidebarFooter className="p-0 pb-4">
        <UserProfile />
      </SidebarFooter>
    </Sidebar>
  )
}
