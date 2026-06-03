"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import {
  Plus,
  Search,
  Clock,
  ChevronRight,
  Box,
  EllipsisVertical,
  ChevronsLeft,
  ChevronDown,
  Video as VideoIcon,
  FileText,
  File as FileIcon,
  Trash2,
  Edit3,
  MoreHorizontal
} from "lucide-react"
import { api } from "@/lib/api"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

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


function UserProfile() {
  const { userId, username, logout, showAuthModal } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleClickOutside = () => setIsOpen(false)
    window.addEventListener("click", handleClickOutside)
    return () => window.removeEventListener("click", handleClickOutside)
  }, [])

  if (!userId) {
    return (
      <div className="mt-2 flex w-full flex-col px-4 mb-4">
        <button
          onClick={() => showAuthModal('login')}
          className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-[13px] font-semibold text-white transition-all hover:shadow-[0_4px_14px_0_rgba(16,185,129,0.39)] hover:-translate-y-0.5"
        >
          Đăng nhập / Đăng ký
        </button>
      </div>
    )
  }

  return (
    <div className="mt-2 flex w-full flex-col px-2 relative z-50">
      <div className="flex flex-col items-center justify-center relative">
        <div className="flex min-w-[200px] justify-center space-x-1 rounded-t-lg border-l-[0.5px] border-r-[0.25px] border-t-[0.5px] border-[#3CB371]/50 bg-gradient-to-b from-[#3CB371]/10 to-[#3CB371]/5 px-6 py-[.5px] text-center text-xs font-normal text-[#3CB371] backdrop-blur-md dark:border-[#3CB371] dark:from-[#3CB371]/20 dark:to-[#3CB371]/5 dark:text-[#3CB371]">
          <p className="capitalize">free</p>
          <p>Kế hoạch</p>
        </div>
        <div className="w-full relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsOpen(!isOpen)
            }}
            className={cn(
              "inline-flex h-fit w-full items-center justify-between truncate rounded-2xl border border-primary/10 bg-white px-3 py-3 text-left shadow-sm transition-colors duration-200 ease-in-out hover:bg-primary/5 dark:border-primary/20 dark:bg-transparent dark:hover:bg-primary/10"
            )}
          >
            <div className="flex min-w-0 flex-1 items-center">
              <Avatar className="size-6 shrink-0 border border-primary/10 dark:border-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-[10px] font-semibold">
                  {username ? username.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="ml-[-3px] flex min-w-0 flex-1 flex-col">
                <p className="truncate text-sm font-medium leading-tight ml-2">
                  {username || "User"}
                </p>
              </div>
            </div>
            <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
          </button>

          {isOpen && (
            <div
              className="absolute bottom-[calc(100%+8px)] left-0 w-full rounded-xl border bg-white p-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] animate-in fade-in zoom-in-95 duration-100 dark:bg-[#2A2A2A] dark:border-neutral-800"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setIsOpen(false)
                  logout()
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2.5 text-left text-[13px] font-medium text-rose-500 hover:bg-rose-50/50 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function AppSidebar() {
  const { toggleSidebar } = useSidebar()
  const [recentVideos, setRecentVideos] = useState<any[]>([])
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null)
    window.addEventListener("click", handleClickOutside)
    return () => window.removeEventListener("click", handleClickOutside)
  }, [])

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const data = await api.videos.list()
        setRecentVideos(data.slice(0, 5)) // Lấy 5 vdeo gần nhất
      } catch (error) {
        console.error("Failed to fetch sidebar videos:", error)
      }
    }
    fetchRecent()
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm("Bạn có chắc chắn muốn xóa video này?")) {
      try {
        await api.videos.delete(id)
        setRecentVideos(prev => prev.filter(v => v.id !== id))

        // Nếu đang ở trang xem video và vừa xóa chính video đó -> quay về màn hình thêm mới
        const currentUrl = new URL(window.location.href)
        if (currentUrl.pathname === '/content' && currentUrl.searchParams.get('id') === id) {
          window.location.href = '/'
        }
      } catch (err) {
        alert("Không thể xóa video")
      }
    }
  }

  const handleRename = async (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.preventDefault()
    e.stopPropagation()
    const newTitle = prompt("Nhập tiêu đề mới:", currentTitle)
    if (newTitle && newTitle !== currentTitle) {
      try {
        await api.videos.update(id, { title: newTitle })
        setRecentVideos(prev => prev.map(v => v.id === id ? { ...v, title: newTitle } : v))
      } catch (err) {
        alert("Không thể đổi tên video")
      }
    }
  }

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
                <ChevronRight className="size-3.5 rotate-90 opacity-100 transition-all duration-200" />
              </button>
              <div className="mt-1 flex w-full flex-col space-y-[1px] px-1">
                {recentVideos.length > 0 ? (
                  recentVideos.map((video) => {
                    let Icon = VideoIcon
                    if (video.media_type === 'pdf') Icon = FileIcon
                    else if (video.media_type === 'docx') Icon = FileText

                    return (
                    <div key={video.id} className="group relative">
                      <Link href={`/content?id=${video.id}`} className="block w-full">
                        <button className={cn(menuItemClass, "h-9 py-1 pr-10")}>
                          <Icon className="mr-2 size-3.5 shrink-0 text-primary/50 group-hover:text-primary" />
                          <span className="truncate text-[13px]">{video.title || "Chưa có tiêu đề"}</span>
                        </button>
                      </Link>

                      {/* More Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setOpenMenuId(openMenuId === video.id ? null : video.id)
                        }}
                        className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all duration-200 hover:bg-primary/5 hover:text-primary group-hover:opacity-100"
                      >
                        <MoreHorizontal className="size-4" />
                      </button>

                      {/* Custom Dropdown Menu */}
                      {openMenuId === video.id && (
                        <div
                          className="absolute right-1 top-9 z-50 w-32 rounded-xl border bg-white p-1 shadow-xl animate-in fade-in zoom-in-95 duration-100 dark:bg-[#2A2A2A] dark:border-neutral-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => { handleRename(e, video.id, video.title); setOpenMenuId(null); }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-foreground hover:bg-neutral-50 dark:hover:bg-neutral-800"
                          >
                            <Edit3 className="size-3.5 text-emerald-500" />
                            <span>Đổi tên</span>
                          </button>
                          <button
                            onClick={(e) => { handleDelete(e, video.id); setOpenMenuId(null); }}
                            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-rose-500 hover:bg-rose-50/50 dark:hover:bg-rose-950/20"
                          >
                            <Trash2 className="size-3.5" />
                            <span>Xóa video</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )})
                ) : (
                  <p className="px-3 py-2 text-[12px] text-muted-foreground italic">Chưa có video nào</p>
                )}
              </div>
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
