"use client"

import { useState } from "react"
import { ChevronDown, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

const transcriptData = [
  {
    time: "00:00",
    title: "Giới thiệu về Dịch vụ Web của Amazon",
    body: "Amazon Web Services (AWS) là nền tảng đám mây toàn diện nhất, cung cấp hơn 200 dịch vụ đầy đủ tính năng từ các trung tâm dữ liệu trên toàn cầu. Cho dù bạn là startup hay doanh nghiệp lớn, AWS đều có giải pháp phù hợp.",
  },
  {
    time: "00:26",
    title: "EC2 - Dịch vụ Máy tính Đám mây",
    body: "Amazon EC2 cung cấp khả năng điện toán có thể thay đổi quy mô trong đám mây. Bạn có thể khởi tạo máy chủ ảo, cấu hình bảo mật và mạng, quản lý lưu trữ mà không cần phần cứng vật lý.",
  },
  {
    time: "01:15",
    title: "S3 - Dịch vụ Lưu trữ Đối tượng",
    body: "Amazon S3 là dịch vụ lưu trữ đối tượng cung cấp khả năng mở rộng, tính sẵn sàng của dữ liệu, bảo mật và hiệu suất hàng đầu. Khách hàng của mọi quy mô và ngành nghề sử dụng S3 để lưu trữ và bảo vệ dữ liệu.",
  },
  {
    time: "02:03",
    title: "Lambda - Điện toán Không máy chủ",
    body: "AWS Lambda cho phép bạn chạy mã mà không cần cung cấp hoặc quản lý máy chủ. Bạn chỉ trả tiền cho thời gian tính toán tiêu thụ và không phải trả gì khi mã của bạn không chạy.",
  },
  {
    time: "03:10",
    title: "RDS - Cơ sở dữ liệu Quan hệ",
    body: "Amazon RDS giúp bạn dễ dàng thiết lập, vận hành và mở rộng cơ sở dữ liệu quan hệ trong đám mây. Nó cung cấp khả năng mở rộng theo yêu cầu cho 6 cơ sở dữ liệu phổ biến.",
  },
  {
    time: "04:22",
    title: "DynamoDB - Cơ sở dữ liệu NoSQL",
    body: "Amazon DynamoDB là cơ sở dữ liệu NoSQL managed chủ yếu cung cấp hiệu suất nhanh và có thể dự đoán được với khả năng mở rộng liền mạch. Ideal cho các ứng dụng yêu cầu độ trễ thấp.",
  },
]

export function TranscriptSection() {
  const [activeTab, setActiveTab] = useState<"chapters" | "copy">("chapters")
  const [autoScroll, setAutoScroll] = useState(false)

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setActiveTab("chapters")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
              activeTab === "chapters"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-neutral-100 hover:text-foreground"
            )}
          >
            Chương
          </button>
          <button
            onClick={() => setActiveTab("copy")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
              activeTab === "copy"
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-neutral-100 hover:text-foreground"
            )}
          >
            Bản sao
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors",
              autoScroll
                ? "bg-emerald-50 text-emerald-700"
                : "text-muted-foreground hover:bg-neutral-100 hover:text-foreground"
            )}
          >
            <Eye className="size-3" />
            Tự động cuộn
          </button>
          <button className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground">
            <ChevronDown className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-6">
        {transcriptData.map((block, i) => (
          <div
            key={block.time}
            className="group relative flex gap-4 rounded-xl p-3 transition-colors hover:bg-white"
          >
            <div className="flex flex-col items-center pt-0.5">
              <span className="inline-flex shrink-0 rounded-md bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] font-medium text-neutral-500 tabular-nums shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
                {block.time}
              </span>
              {i < transcriptData.length - 1 && (
                <div className="mt-2 h-full w-px bg-neutral-100" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-[14px] font-semibold text-foreground leading-snug">
                {block.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {block.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
