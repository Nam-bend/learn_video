import type { Metadata } from "next"
import { DM_Sans } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
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
    <html lang="vi" className={`${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[var(--font-dm-sans)]">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  )
}
