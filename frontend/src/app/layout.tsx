import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/contexts/AuthContext"
import { AuthGuard } from "@/components/AuthGuard"
import { AuthModal } from "@/components/auth/AuthModal"
import "./globals.css"

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "YouLearn - AI Learning Workspace",
  description: "Học thông minh hơn với AI - Chuyển đổi video, âm thanh thành tài liệu học tập",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" className={`${dmSans.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-[var(--font-dm-sans)]">
        <AuthProvider>
          <AuthGuard>
            <TooltipProvider>{children}</TooltipProvider>
            <AuthModal />
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  )
}
