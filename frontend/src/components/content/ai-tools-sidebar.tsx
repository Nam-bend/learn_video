"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import {
  X, Plus, Headphones, FileText, HelpCircle, Layers, StickyNote,
  CalendarRange, ChevronRight, ChevronLeft, MessageSquare, ArrowUp,
  Mic, Loader2, User, Bot, History, CheckCircle2, XCircle, Trophy,
  RefreshCw, BarChart3, Download
} from "lucide-react"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

const tools = [
  { id: "export", icon: Download, label: "Xuất PDF", description: "Lưu tài liệu học tập" },
  { id: "history", icon: History, label: "Lịch sử Quiz", description: "Xem kết quả lần trước" },
  { id: "summary", icon: FileText, label: "Tóm tắt nội dung", description: "Tóm tắt các ý chính" },
  { id: "quiz", icon: HelpCircle, label: "Câu hỏi trắc nghiệm", description: "Kiểm tra kiến thức" },
  { id: "flashcard", icon: Layers, label: "Thẻ Flashcard", description: "Ghi nhớ từ vựng, khái niệm" },
  { id: "notes", icon: StickyNote, label: "Ghi chú cá nhân", description: "Soạn thảo văn bản và dán ảnh" },
  { id: "plan", icon: CalendarRange, label: "Kế hoạch bài học", description: "Lộ trình học tập cá nhân", badge: "Mới" },
  { id: "chat", icon: MessageSquare, label: "Trò chuyện AI", description: "Hỏi đáp về nội dung video" },
]

interface Message { role: "user" | "assistant"; content: string }

interface QuizQuestion {
  question: string
  options: string[]
  answer: number
  explanation: string
}

interface QuizAttempt {
  id: string
  score: number
  total: number
  wrong_answers: { question: string; user_answer: number; correct_answer: number; explanation: string }[]
  created_at: string
}

// ── sub-views ──────────────────────────────────────────────────────────────

function QuizView({ videoId, onBack }: { videoId: string; onBack: () => void }) {
  const [phase, setPhase] = useState<"idle" | "loading" | "taking" | "result">("idle")
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [quizId, setQuizId] = useState("")
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [current, setCurrent] = useState(0)
  const [result, setResult] = useState<{ score: number; total: number; wrong_answers: any[] } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const startQuiz = async () => {
    setPhase("loading")
    try {
      const data = await api.quiz.generate(videoId)
      setQuestions(data.questions || [])
      setQuizId(data.id)
      setAnswers(new Array((data.questions || []).length).fill(null))
      setCurrent(0)
      setPhase("taking")
    } catch {
      alert("Không thể tạo câu hỏi. Video cần có bản ghi trước.")
      setPhase("idle")
    }
  }

  const pick = (idx: number) => {
    setAnswers(prev => { const a = [...prev]; a[current] = idx; return a })
  }

  const submit = async () => {
    if (answers.some(a => a === null)) { alert("Hãy trả lời tất cả câu hỏi!"); return }
    setSubmitting(true)
    try {
      const res = await api.quiz.submit(videoId, quizId, answers as number[])
      setResult(res)
      setPhase("result")
    } catch { alert("Nộp bài thất bại.") }
    finally { setSubmitting(false) }
  }

  const restart = () => { setPhase("idle"); setResult(null); setQuestions([]) }

  if (phase === "idle") return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.12)]">
        <HelpCircle className="size-7 text-emerald-600" />
      </div>
      <p className="text-[15px] font-semibold text-foreground">Câu hỏi trắc nghiệm</p>
      <p className="mt-1.5 text-[13px] text-muted-foreground max-w-[220px]">AI sẽ tạo 5 câu hỏi dựa trên nội dung video</p>
      <button onClick={startQuiz} className="mt-6 rounded-xl bg-emerald-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-95">
        Tạo câu hỏi
      </button>
    </div>
  )

  if (phase === "loading") return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-7 animate-spin text-emerald-500" />
        <p className="text-[13px] text-muted-foreground">AI đang tạo câu hỏi...</p>
      </div>
    </div>
  )

  if (phase === "taking" && questions.length > 0) {
    const q = questions[current]
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Progress */}
        <div className="shrink-0 px-5 pt-4 pb-2">
          <div className="mb-2 flex items-center justify-between text-[12px] text-muted-foreground">
            <span>Câu {current + 1} / {questions.length}</span>
            <span>{answers.filter(a => a !== null).length} đã trả lời</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
          </div>
        </div>
        {/* Question */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <p className="text-[14px] font-semibold text-foreground leading-snug">{q.question}</p>
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => pick(i)}
              className={cn("w-full rounded-xl border px-4 py-3 text-left text-[13px] transition-all",
                answers[current] === i
                  ? "border-emerald-400 bg-emerald-50 text-emerald-800 font-semibold"
                  : "border-neutral-100 bg-white text-foreground hover:border-neutral-200 hover:shadow-sm"
              )}>
              <span className="mr-2 font-bold text-emerald-600">{["A", "B", "C", "D"][i]}.</span>{opt}
            </button>
          ))}
        </div>
        {/* Nav */}
        <div className="shrink-0 flex gap-2 border-t border-neutral-100 p-4">
          <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
            className="flex-1 rounded-xl border border-neutral-200 py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-neutral-50 disabled:opacity-40">
            Trước
          </button>
          {current < questions.length - 1
            ? <button onClick={() => setCurrent(c => c + 1)}
              className="flex-1 rounded-xl bg-emerald-500 py-2 text-[13px] font-semibold text-white transition-all hover:bg-emerald-600">
              Tiếp theo
            </button>
            : <button onClick={submit} disabled={submitting}
              className="flex-1 rounded-xl bg-emerald-500 py-2 text-[13px] font-semibold text-white transition-all hover:bg-emerald-600 disabled:opacity-60">
              {submitting ? <Loader2 className="mx-auto size-4 animate-spin" /> : "Nộp bài"}
            </button>
          }
        </div>
      </div>
    )
  }

  if (phase === "result" && result) {
    const pct = Math.round((result.score / result.total) * 100)
    return (
      <div className="flex flex-1 flex-col overflow-y-auto px-5 py-6 space-y-5">
        {/* Score card */}
        <div className="rounded-2xl border border-neutral-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 text-center shadow-sm">
          <Trophy className="mx-auto mb-3 size-8 text-emerald-600" />
          <p className="text-3xl font-bold text-foreground">{result.score}<span className="text-xl text-muted-foreground">/{result.total}</span></p>
          <p className="mt-1 text-[13px] text-muted-foreground">{pct >= 80 ? "Xuất sắc! 🎉" : pct >= 60 ? "Tốt! Tiếp tục cố gắng" : "Cần ôn luyện thêm"}</p>
        </div>
        {/* Wrong answers */}
        {result.wrong_answers.length > 0 && (
          <div className="space-y-3">
            <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Câu sai</p>
            {result.wrong_answers.map((w, i) => {
              const questionObj = questions.find(q => q.question === w.question)
              const userText = questionObj && w.user_answer !== null ? questionObj.options[w.user_answer] : "—"
              const correctText = questionObj ? questionObj.options[w.correct_answer] : ""
              return (
                <div key={i} className="rounded-xl border border-red-100 bg-red-50/50 p-4">
                  <p className="text-[13px] font-semibold text-foreground">{w.question}</p>
                  <p className="mt-2 flex items-center gap-1.5 text-[12px] text-red-600">
                    <XCircle className="size-3.5 shrink-0" /> Bạn chọn: {w.user_answer !== null ? ["A", "B", "C", "D"][w.user_answer] : "—"}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-[12px] text-emerald-700">
                    <CheckCircle2 className="size-3.5 shrink-0" /> Đúng: {["A", "B", "C", "D"][w.correct_answer]}
                  </p>
                  {w.explanation && <p className="mt-2 text-[12px] text-muted-foreground italic">{w.explanation}</p>}

                  <button
                    onClick={() => {
                      const prompt = `Tôi vừa làm sai câu hỏi trắc nghiệm này về video học tập:
Câu hỏi: "${w.question}"
Đáp án tôi chọn: "${["A", "B", "C", "D"][w.user_answer]}. ${userText}"
Đáp án đúng là: "${["A", "B", "C", "D"][w.correct_answer]}. ${correctText}"

Hãy giải thích chi tiết tại sao đáp án của tôi lại sai, đáp án kia mới là chính xác, và liên hệ với các ví dụ, kiến thức thực tế liên quan đến nội dung video học tập này để tôi hiểu sâu và dễ nhớ hơn nhé.`
                      window.dispatchEvent(new CustomEvent("add-to-chat", {
                        detail: { content: prompt }
                      }))
                    }}
                    className="mt-3 flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-[11px] font-bold text-red-700 shadow-sm transition-all hover:bg-red-50 hover:text-red-800 active:scale-95"
                  >
                    <Bot className="size-3.5" /> Hỏi AI giải thích câu này
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {result.wrong_answers.length > 0 && (
          <button
            onClick={() => {
              let prompt = `Tôi vừa làm xong bài trắc nghiệm về video học tập này và làm sai một số câu hỏi. Hãy giải thích chi tiết từng câu tại sao tôi sai, đáp án đúng là gì và liên hệ ví dụ thực tế liên quan đến nội dung bài học để tôi rút kinh nghiệm nhé:\n\n`
              result.wrong_answers.forEach((w, idx) => {
                const questionObj = questions.find(q => q.question === w.question)
                const userText = questionObj && w.user_answer !== null ? questionObj.options[w.user_answer] : "—"
                const correctText = questionObj ? questionObj.options[w.correct_answer] : ""
                prompt += `${idx + 1}. Câu hỏi: "${w.question}"\n`
                prompt += `   - Đáp án tôi chọn: "${["A", "B", "C", "D"][w.user_answer]}. ${userText}"\n`
                prompt += `   - Đáp án đúng: "${["A", "B", "C", "D"][w.correct_answer]}. ${correctText}"\n`
                if (w.explanation) {
                  prompt += `   - Giải thích ngắn gọn từ đề bài: "${w.explanation}"\n`
                }
                prompt += `\n`
              })

              window.dispatchEvent(new CustomEvent("add-to-chat", {
                detail: { content: prompt }
              }))
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-[13px] font-bold text-red-700 shadow-sm transition-all hover:bg-red-100 hover:text-red-800 active:scale-[0.98]"
          >
            <Bot className="size-4" /> Hỏi AI giải thích tất cả câu sai
          </button>
        )}

        <button onClick={restart} className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-emerald-600">
          <RefreshCw className="size-3.5" /> Làm lại
        </button>
      </div>
    )
  }
  return null
}

function HistoryView({ videoId }: { videoId: string }) {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    api.quiz.history(videoId)
      .then(data => setAttempts(Array.isArray(data) ? data : []))
      .catch(() => setAttempts([]))
      .finally(() => setLoading(false))
  }, [videoId])

  if (loading) return <div className="flex flex-1 items-center justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>

  if (attempts.length === 0) return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <BarChart3 className="mb-3 size-8 text-neutral-200" />
      <p className="text-[13px] text-muted-foreground">Chưa có lần làm bài nào</p>
    </div>
  )

  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
      {attempts.map(a => {
        const pct = Math.round((a.score / a.total) * 100)
        const isOpen = expanded === a.id
        return (
          <div key={a.id} className="rounded-xl border border-neutral-100 bg-white overflow-hidden">
            <button onClick={() => setExpanded(isOpen ? null : a.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-neutral-50 transition-colors">
              <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold",
                pct >= 80 ? "bg-emerald-50 text-emerald-700" : pct >= 60 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>
                {pct}%
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground">{a.score}/{a.total} câu đúng</p>
                <p className="text-[11px] text-muted-foreground">{new Date(a.created_at).toLocaleString("vi-VN")}</p>
              </div>
            </button>
            {isOpen && a.wrong_answers && a.wrong_answers.length > 0 && (
              <div className="border-t border-neutral-100 px-4 py-3 space-y-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Câu sai</p>
                {a.wrong_answers.map((w, i) => (
                  <div key={i} className="rounded-lg bg-red-50/50 border border-red-100 px-3 py-2">
                    <p className="text-[12px] font-medium text-foreground">{w.question}</p>
                    {w.explanation && <p className="mt-1 text-[11px] text-muted-foreground italic">{w.explanation}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function SummaryView({ videoId }: { videoId: string }) {
  const [phase, setPhase] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [summary, setSummary] = useState("")
  const [streaming, setStreaming] = useState(false)
  const [isDoc, setIsDoc] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    api.videos.get(videoId).then(v => {
      const doc = v.media_type === "pdf" || v.media_type === "docx" ||
        v.title?.toLowerCase().endsWith(".pdf") || v.title?.toLowerCase().endsWith(".docx") ||
        v.source_ref?.toLowerCase().endsWith(".pdf") || v.source_ref?.toLowerCase().endsWith(".docx");
      setIsDoc(!!doc)
    }).catch(() => {})
  }, [videoId])

  const generate = async (refresh = false) => {
    // Abort any in-flight request
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setPhase("loading")
    setSummary("")
    setStreaming(false)
    try {
      const response = await fetch(`http://localhost:8000/api/summary/${videoId}${refresh ? "?refresh=true" : ""}`, { signal: ctrl.signal })
      if (!response.ok) throw new Error("API failed")

      // Check if response is cached JSON to display instantly
      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json()
        if (data.status === "cached") {
          setSummary(data.summary)
          setPhase("done")
          setStreaming(false)
          return
        }
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No reader")

      let accumulated = ""
      let displayBuffer = ""
      const decoder = new TextDecoder()
      setPhase("done")
      setSummary("AI_THINKING")
      setStreaming(true)

      // Buffer updates to avoid UI stuttering (Update at ~16fps)
      const updateInterval = setInterval(() => {
        if (displayBuffer !== accumulated) {
          displayBuffer = accumulated
          setSummary(displayBuffer)
        }
      }, 60)

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (ctrl.signal.aborted) break

          const chunk = decoder.decode(value, { stream: true })
          if (accumulated === "AI_THINKING") {
            accumulated = chunk
          } else {
            accumulated += chunk
          }
        }
      } finally {
        clearInterval(updateInterval)
        if (!ctrl.signal.aborted) {
          setSummary(accumulated) // Final update to ensure sync
        }
      }
    } catch (e: any) {
      if (e?.name === "AbortError") return // Silently ignore aborted requests
      setSummary(e?.message || "Đã có lỗi xảy ra.")
      setPhase("error")
    } finally {
      if (!ctrl.signal.aborted) setStreaming(false)
    }
  }

  useEffect(() => {
    generate()
    return () => { abortRef.current?.abort() }
  }, [videoId])

  if (phase === "idle" || phase === "loading") return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
      <Loader2 className="size-7 animate-spin text-emerald-500" />
      <p className="text-[13px] text-muted-foreground font-medium">
        {isDoc ? "AI đang đọc tài liệu..." : "AI đang đọc video..."}
      </p>
      <p className="text-[11px] text-muted-foreground opacity-60">Chuẩn bị tóm tắt trong giây lát</p>
    </div>
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {phase === "error" ? (
          <div className="rounded-xl border border-red-50 bg-red-50/30 p-4 text-center">
            <p className="text-[13px] text-red-600">{summary}</p>
            <button onClick={() => generate(true)} className="mt-3 text-[12px] font-semibold text-red-700 underline underline-offset-4">Thử lại</button>
          </div>
        ) : summary === "AI_THINKING" ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500 animate-pulse mb-2">
              <Bot className="size-8" />
            </div>
            <p className="text-[14px] font-semibold text-emerald-600">
              {isDoc ? "AI đang phân tích tài liệu..." : "AI đang phân tích video..."}
            </p>
            <p className="text-[12px] text-muted-foreground">Đang trích xuất các ý chính quan trọng</p>
          </div>
        ) : (
          <MarkdownContent content={summary} id={`${videoId}-summary`} isStreaming={streaming} />
        )}
      </div>

      <div className="shrink-0 border-t border-neutral-100 p-4 bg-neutral-50/50">
        <button onClick={() => generate(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white border border-neutral-200 py-2.5 text-[13px] font-semibold text-foreground transition-all hover:bg-neutral-50 active:scale-[0.98] shadow-sm">
          <RefreshCw className="size-3.5 text-emerald-600" />
          Làm mới tóm tắt
        </button>
      </div>
    </div>
  )
}
// Reusable markdown renderer for AI-generated markdown content
function MarkdownContent({ content, id, isStreaming }: { content: string, id?: string, isStreaming?: boolean }) {
  const [checkedLines, setCheckedLines] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (id) {
      try {
        const saved = localStorage.getItem(`md-check-${id}`)
        if (saved) setCheckedLines(JSON.parse(saved))
      } catch { }
    }
  }, [id, content])

  const toggleCheck = (lineIndex: number) => {
    const next = { ...checkedLines, [lineIndex]: !checkedLines[lineIndex] }
    setCheckedLines(next)
    if (id) localStorage.setItem(`md-check-${id}`, JSON.stringify(next))
  }

  const lines = useMemo(() => content.split("\n"), [content])

  return (
    <div className="space-y-2 text-[13px] leading-relaxed text-foreground">
      {lines.map((line, i) => {
        const isLastLine = i === lines.length - 1

        if (line.startsWith("## ")) return <h2 key={i} className="mt-5 mb-2 text-[15px] font-bold text-foreground">{line.replace("## ", "")}</h2>
        if (line.startsWith("### ")) return <h3 key={i} className="mt-3 mb-1 text-[13px] font-bold text-foreground">{line.replace("### ", "")}</h3>
        if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold text-foreground">{line.replace(/\*\*/g, "")}</p>

        const isTodo = line.startsWith("- [ ] ") || line.startsWith("- [x] ")
        if (isTodo) {
          const isChecked = checkedLines[i] !== undefined ? checkedLines[i] : line.startsWith("- [x] ")
          return (
            <label key={i} className={cn("flex items-start gap-2 cursor-pointer transition-opacity group", isChecked && "opacity-60")}>
              <input type="checkbox" checked={isChecked} onChange={() => toggleCheck(i)} className="mt-1 size-3.5 shrink-0 rounded border-neutral-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer" />
              <span className={cn("text-foreground/80 select-none", isChecked && "line-through text-muted-foreground")}>
                {line.replace(/^- \[[ x]\] /, "")}
                {isLastLine && isStreaming && <span className="inline-block w-1.5 h-3.5 ml-1 bg-emerald-500 animate-pulse align-middle" />}
              </span>
            </label>
          )
        }

        if (line.startsWith("- ") || line.startsWith("* ")) return (
          <p key={i} className="flex gap-2">
            <span className="text-emerald-500 shrink-0 mt-0.5">•</span>
            <span>
              {line.replace(/^[-*] /, "")}
              {isLastLine && isStreaming && <span className="inline-block w-1.5 h-3.5 ml-1 bg-emerald-500 animate-pulse align-middle" />}
            </span>
          </p>
        )

        if (line.match(/^\d+\. /)) return <p key={i} className="text-foreground">{line}{isLastLine && isStreaming && <span className="inline-block w-1.5 h-3.5 ml-1 bg-emerald-500 animate-pulse align-middle" />}</p>
        if (line.trim() === "") return <div key={i} className="h-1" />

        return (
          <p key={i} className="text-foreground/80">
            {line}
            {isLastLine && isStreaming && <span className="inline-block w-1.5 h-3.5 ml-1 bg-emerald-500 animate-pulse align-middle" />}
          </p>
        )
      })}
    </div>
  )
}

function AiContentView({
  videoId, icon: Icon, title, description, dataKey,
}: {
  videoId: string
  icon: any
  title: string
  description: string
  dataKey: string
}) {
  const [phase, setPhase] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [content, setContent] = useState("")
  const [streaming, setStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const generate = async (refresh = false) => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setPhase("loading")
    setContent("")
    setStreaming(false)
    try {
      const endpoint = dataKey === "plan" ? `/study-plan/${videoId}` : `/${dataKey}/${videoId}`
      const response = await fetch(`http://localhost:8000/api${endpoint}${refresh ? "?refresh=true" : ""}`, { signal: ctrl.signal })

      if (!response.ok) throw new Error("API failed")

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No reader")

      let accumulated = ""
      let displayBuffer = ""
      const decoder = new TextDecoder()
      setPhase("done")
      setContent("AI_THINKING")
      setStreaming(true)

      // Buffer updates to avoid UI stuttering (Update at ~16fps)
      const updateInterval = setInterval(() => {
        if (displayBuffer !== accumulated) {
          displayBuffer = accumulated
          setContent(displayBuffer)
        }
      }, 60)

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (ctrl.signal.aborted) break

          const chunk = decoder.decode(value, { stream: true })
          if (accumulated === "AI_THINKING") {
            accumulated = chunk
          } else {
            accumulated += chunk
          }
        }
      } finally {
        clearInterval(updateInterval)
        if (!ctrl.signal.aborted) setContent(accumulated)
      }
    } catch (e: any) {
      if (e?.name === "AbortError") return
      setContent(e?.message || "Đã có lỗi xảy ra.")
      setPhase("error")
    } finally {
      if (!ctrl.signal.aborted) setStreaming(false)
    }
  }

  useEffect(() => {
    generate()
    return () => { abortRef.current?.abort() }
  }, [videoId])

  if (phase === "idle" || phase === "loading") return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
      <Loader2 className="size-7 animate-spin text-emerald-500" />
      <p className="text-[13px] text-muted-foreground font-medium">Đang chuẩn bị {title}...</p>
    </div>
  )

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {phase === "error" ? (
          <div className="rounded-xl border border-red-50 bg-red-50/30 p-4 text-center">
            <p className="text-[13px] text-red-600">{content}</p>
            <button onClick={() => generate(true)} className="mt-3 text-[12px] font-semibold text-red-700 underline underline-offset-4">Thử lại</button>
          </div>
        ) : content === "AI_THINKING" ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 animate-pulse">
              <Icon className="size-9" />
            </div>
            <div>
              <p className="text-[15px] font-bold text-foreground">AI đang xây dựng {title}...</p>
              <p className="mt-1 text-[12px] text-muted-foreground max-w-[200px]">Tối ưu hóa kiến thức từ video để phù hợp nhất với bạn</p>
            </div>
          </div>
        ) : (
          <MarkdownContent content={content} id={`${videoId}-${dataKey}`} isStreaming={streaming} />
        )}
      </div>
      <div className="shrink-0 border-t border-neutral-100 p-4 bg-neutral-50/50">
        <button onClick={() => generate(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-white border border-neutral-200 py-2.5 text-[13px] font-semibold text-foreground transition-all hover:bg-neutral-50 active:scale-[0.98] shadow-sm">
          <RefreshCw className="size-3.5 text-emerald-600" />
          Làm mới nội dung
        </button>
      </div>
    </div>
  )
}
function PersonalNotesView({ videoId }: { videoId: string }) {
  const [isSaving, setIsSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const editorRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let mounted = true
    api.notes.get(videoId).then((res) => {
      if (mounted) {
        if (editorRef.current && res.notes) {
          editorRef.current.innerHTML = res.notes
        }
        setLoading(false)
      }
    })
    return () => { mounted = false }
  }, [videoId])

  const handleInput = () => {
    if (!editorRef.current) return
    const newContent = editorRef.current.innerHTML

    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsSaving(true)
    timeoutRef.current = setTimeout(async () => {
      try {
        await api.notes.save(videoId, newContent)
      } finally {
        setIsSaving(false)
      }
    }, 1000)
  }

  const execFormat = (cmd: string) => {
    document.execCommand(cmd, false)
    editorRef.current?.focus()
    handleInput()
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100 bg-neutral-50/50">
        <div className="flex items-center gap-1">
          <button onClick={() => execFormat('bold')} title="Đậm (Ctrl+B)" className="rounded-md px-2 py-1 text-[12px] font-bold text-neutral-600 hover:bg-neutral-200 transition-colors">B</button>
          <button onClick={() => execFormat('italic')} title="Nghiêng (Ctrl+I)" className="rounded-md px-2 py-1 text-[12px] italic text-neutral-600 hover:bg-neutral-200 transition-colors">I</button>
          <button onClick={() => execFormat('underline')} title="Gạch chân (Ctrl+U)" className="rounded-md px-2 py-1 text-[12px] underline text-neutral-600 hover:bg-neutral-200 transition-colors">U</button>
          <div className="w-px h-4 bg-neutral-200 mx-1" />
          <button onClick={() => execFormat('insertUnorderedList')} title="Danh sách" className="rounded-md px-2 py-1 text-[12px] text-neutral-600 hover:bg-neutral-200 transition-colors">• List</button>
        </div>
        {isSaving
          ? <span className="text-[11px] text-neutral-400">Đang lưu...</span>
          : <span className="text-[11px] text-emerald-600">✓ Đã lưu</span>}
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="size-5 animate-spin text-emerald-500" />
          </div>
        ) : (
          <div
            ref={editorRef}
            className="w-full min-h-full outline-none text-[14px] leading-relaxed text-neutral-800"
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            data-placeholder="Nhập ghi chú hoặc dán ảnh (Ctrl+V) vào đây..."
          />
        )}
      </div>
      <style dangerouslySetInnerHTML={{
        __html: `
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #a3a3a3;
          pointer-events: none;
          display: block;
        }
        [contenteditable] img {
          max-width: 100%;
          border-radius: 6px;
          margin: 8px 0;
        }
      `}} />
    </div>
  )
}

function FlashcardView({ videoId }: { videoId: string }) {
  const [phase, setPhase] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [cards, setCards] = useState<{ front: string; back: string; category: string }[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [error, setError] = useState("")

  const generate = async () => {
    setPhase("loading")
    setCurrentIdx(0)
    setFlipped(false)
    try {
      const data = await api.flashcards.get(videoId)
      setCards(data.cards || [])
      setPhase("done")
    } catch (e: any) {
      setError(e?.message || "Đã có lỗi xảy ra.")
      setPhase("error")
    }
  }

  if (phase === "idle") return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.12)]">
        <Layers className="size-7 text-emerald-600" />
      </div>
      <p className="text-[15px] font-semibold text-foreground">Thẻ Flashcard</p>
      <p className="mt-1.5 text-[13px] text-muted-foreground max-w-[220px]">AI tạo thẻ ôn tập từ nội dung video</p>
      <button onClick={generate} className="mt-6 rounded-xl bg-emerald-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-95">
        Tạo thẻ
      </button>
    </div>
  )

  if (phase === "loading") return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
      <Loader2 className="size-7 animate-spin text-emerald-500" />
      <p className="text-[13px] text-muted-foreground">AI đang tạo flashcard...</p>
    </div>
  )

  if (phase === "error") return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center gap-4">
      <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-[13px] text-red-700 w-full">{error}</div>
      <button onClick={generate} className="rounded-xl bg-emerald-500 px-5 py-2 text-[13px] font-semibold text-white">Thử lại</button>
    </div>
  )

  const card = cards[currentIdx]
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Progress */}
      <div className="shrink-0 px-5 pt-4 pb-2">
        <div className="mb-2 flex items-center justify-between text-[12px] text-muted-foreground">
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium">{card.category}</span>
          <span>{currentIdx + 1} / {cards.length}</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${((currentIdx + 1) / cards.length) * 100}%` }} />
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 px-5 py-4 flex items-center">
        <button onClick={() => setFlipped(f => !f)}
          className="w-full min-h-[200px] rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm transition-all hover:shadow-md active:scale-[0.98] text-left flex flex-col justify-between">
          <div>
            <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{flipped ? "Câu trả lời" : "Câu hỏi"}</p>
            <p className="text-[14px] font-semibold text-foreground leading-snug">{flipped ? card.back : card.front}</p>
          </div>
          <p className="mt-4 text-[11px] text-muted-foreground text-center">Bấm để {flipped ? "xem câu hỏi" : "xem đáp án"}</p>
        </button>
      </div>

      {/* Nav */}
      <div className="shrink-0 flex gap-2 border-t border-neutral-100 p-4">
        <button onClick={() => { setCurrentIdx(i => Math.max(0, i - 1)); setFlipped(false) }} disabled={currentIdx === 0}
          className="flex-1 rounded-xl border border-neutral-200 py-2 text-[13px] font-medium text-muted-foreground disabled:opacity-40 hover:bg-neutral-50">
          ← Trước
        </button>
        {currentIdx < cards.length - 1
          ? <button onClick={() => { setCurrentIdx(i => i + 1); setFlipped(false) }}
            className="flex-1 rounded-xl bg-emerald-500 py-2 text-[13px] font-semibold text-white hover:bg-emerald-600">
            Tiếp →
          </button>
          : <button onClick={generate} className="flex-1 rounded-xl bg-emerald-500 py-2 text-[13px] font-semibold text-white hover:bg-emerald-600">
            Tạo lại
          </button>
        }
      </div>
    </div>
  )
}


function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:700;color:#111">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em style="font-style:italic">$1</em>')
    .replace(/`(.+?)`/g, '<code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;font-family:monospace;font-size:12px">$1</code>')
    .replace(/\[(\d{1,2}:\d{2})\]/g, '<span style="background:#ecfdf5;color:#059669;padding:1px 5px;border-radius:4px;font-size:11px;font-weight:600">▶ [$1]</span>')
}

// Convert markdown string → inline-styled HTML (no Tailwind, safe for html2canvas)
function markdownToHtml(md: string): string {
  const lines = md.split('\n')
  let html = ''
  let inList = false

  for (const raw of lines) {
    const line = raw.trimEnd()

    if (line.startsWith('## ')) {
      if (inList) { html += '</ul>'; inList = false }
      html += `<h2 style="font-size:17px;font-weight:700;color:#111;margin:20px 0 8px;padding-bottom:4px;border-bottom:1px solid #e5e7eb">${line.slice(3)}</h2>`
    } else if (line.startsWith('### ')) {
      if (inList) { html += '</ul>'; inList = false }
      html += `<h3 style="font-size:14px;font-weight:700;color:#374151;margin:14px 0 6px">${line.slice(4)}</h3>`
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) { html += '<ul style="margin:6px 0;padding-left:0;list-style:none">'; inList = true }
      const content = inlineFormat(line.slice(2))
      html += `<li style="display:flex;gap:8px;margin:4px 0;font-size:13px;color:#374151"><span style="color:#059669;flex-shrink:0">•</span><span>${content}</span></li>`
    } else if (line.match(/^\d+\. /)) {
      if (inList) { html += '</ul>'; inList = false }
      const [, num, rest] = line.match(/^(\d+)\. (.*)/) || ['', '', line]
      html += `<p style="font-size:13px;color:#374151;margin:4px 0"><strong style="color:#059669">${num}.</strong> ${inlineFormat(rest)}</p>`
    } else if (line.trim() === '' || line.trim() === '---') {
      if (inList) { html += '</ul>'; inList = false }
      html += '<div style="height:6px"></div>'
    } else if (line.trim() !== '') {
      if (inList) { html += '</ul>'; inList = false }
      html += `<p style="font-size:13px;color:#374151;margin:4px 0;line-height:1.6">${inlineFormat(line)}</p>`
    }
  }

  if (inList) html += '</ul>'
  return html
}


function ExportPdfView({ videoId }: { videoId: string }) {
  const [phase, setPhase] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [includeSummary, setIncludeSummary] = useState(true)
  const [includeNotes, setIncludeNotes] = useState(true)
  const [includeStudyPlan, setIncludeStudyPlan] = useState(false)
  const [summary, setSummary] = useState("")
  const [notes, setNotes] = useState("")
  const [plan, setPlan] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchText = async (url: string) => {
    try {
      const res = await fetch(url)
      if (!res.ok) return ""
      return await res.text()
    } catch (err) {
      console.error(`Error fetching text from ${url}:`, err)
      return ""
    }
  }

  const handleDownloadMarkdown = async () => {
    setPhase("loading")
    try {
      const [summaryText, notesData, planText] = await Promise.all([
        includeSummary ? fetchText(`http://localhost:8000/api/summary/${videoId}`) : Promise.resolve(""),
        includeNotes ? api.notes.get(videoId).catch(() => ({ notes: "" })) : Promise.resolve({ notes: "" }),
        includeStudyPlan ? fetchText(`http://localhost:8000/api/study-plan/${videoId}`) : Promise.resolve(""),
      ])

      let md = `# Tài Liệu Học Tập\n*Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}*\n\n`
      if (includeSummary && summaryText) md += `## 📄 Tóm tắt nội dung\n${summaryText}\n\n`
      if (includeStudyPlan && planText) md += `## 📅 Kế hoạch học tập\n${planText}\n\n`
      if (includeNotes && notesData.notes) {
        // Convert HTML notes to simple MD (strip tags)
        const plainNotes = notesData.notes.replace(/<[^>]*>/g, (tag: string) => {
          if (tag.startsWith('<h')) return '\n### '
          if (tag.startsWith('<li>')) return '\n- '
          if (tag === '<br>' || tag === '</p>') return '\n'
          return ''
        })
        md += `## ✏️ Ghi chú cá nhân\n${plainNotes}\n`
      }

      const blob = new Blob([md], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'tai-lieu-hoc-tap.md'
      a.click()
      setPhase("done")
      setTimeout(() => setPhase("idle"), 3000)
    } catch (err) {
      console.error("Markdown download error:", err)
      setPhase("error")
    }
  }

  const prepareAndDownload = async () => {
    setPhase("loading")
    try {
      const [summaryText, notesData, planText] = await Promise.all([
        includeSummary ? fetchText(`http://localhost:8000/api/summary/${videoId}`) : Promise.resolve(""),
        includeNotes ? api.notes.get(videoId).catch(() => ({ notes: "" })) : Promise.resolve({ notes: "" }),
        includeStudyPlan ? fetchText(`http://localhost:8000/api/study-plan/${videoId}`) : Promise.resolve(""),
      ])
      setSummary(summaryText)
      setNotes(notesData.notes || "")
      setPlan(planText)

      // Give React a moment to render the off-screen container
      setTimeout(async () => {
        if (!containerRef.current) return
        try {
          const element = containerRef.current

          if (!element) return

          // The "Ultimate Secret": Native Print in a hidden iframe
          // This supports 100% CSS, perfect page breaks, and selectable text.
          const iframe = document.createElement('iframe')
          iframe.style.position = 'fixed'
          iframe.style.right = '0'
          iframe.style.bottom = '0'
          iframe.style.width = '0'
          iframe.style.height = '0'
          iframe.style.border = 'none'
          document.body.appendChild(iframe)

          const doc = iframe.contentWindow?.document
          if (!doc) return

          // Prepare the HTML for the print view
          const html = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Tai Lieu Hoc Tap</title>
              <style>
                @page {
                  size: A4;
                  margin: 20mm;
                }
                body {
                  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                  line-height: 1.6;
                  color: #111;
                  background: white;
                  margin: 0;
                  padding: 0;
                }
                * { box-sizing: border-box; }
                h1, h2, h3 { color: #059669; }
                h2 { border-bottom: 2px solid #059669; padding-bottom: 8px; margin-top: 30px; }
                .notes-content { font-size: 14px; }
                img { max-width: 100%; height: auto; border-radius: 8px; }
                /* Smart Page Breaks */
                h1, h2, h3, p, li { page-break-inside: avoid; }
                .section { margin-bottom: 30px; }
              </style>
            </head>
            <body>
              ${element.innerHTML}
              <script>
                window.onload = () => {
                  window.print();
                  setTimeout(() => { window.frameElement.remove(); }, 1000);
                };
              </script>
            </body>
            </html>
          `

          doc.open()
          doc.write(html)
          doc.close()

          setPhase("done")
          setTimeout(() => setPhase("idle"), 3000)
        } catch (err) {
          console.error("Export Error:", err)
          setPhase("error")
        }
      }, 800)
    } catch (err) {
      console.error("Data Fetch Error:", err)
      setPhase("error")
    }
  }





  const sections = [
    { key: "summary", label: "Tóm tắt nội dung AI", sub: "Các ý chính từ video", checked: includeSummary, toggle: () => setIncludeSummary(v => !v) },
    { key: "notes", label: "Ghi chú cá nhân", sub: "Do bạn tự viết", checked: includeNotes, toggle: () => setIncludeNotes(v => !v) },
    { key: "plan", label: "Kế hoạch học tập", sub: "Lịch trình 7 ngày từ AI", checked: includeStudyPlan, toggle: () => setIncludeStudyPlan(v => !v) },
  ]

  const hasSelection = includeSummary || includeNotes || includeStudyPlan

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
            <Download className="size-5 text-purple-600" />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-foreground">Xuất Tài liệu</p>
            <p className="text-[12px] text-muted-foreground">Lưu trữ kiến thức để ôn tập offline</p>
          </div>
        </div>

        {/* Checklist */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nội dung bao gồm</p>
          <div className="grid gap-2">
            {sections.map(s => (
              <label key={s.key} className={cn(
                "flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-all",
                s.checked ? "border-purple-300 bg-purple-50/60" : "border-neutral-100 bg-white hover:border-neutral-200"
              )}>
                <div className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                  s.checked ? "border-purple-500 bg-purple-500" : "border-neutral-300"
                )}>
                  {s.checked && <CheckCircle2 className="size-3.5 text-white" />}
                </div>
                <input type="checkbox" className="sr-only" checked={s.checked} onChange={s.toggle} />
                <div>
                  <p className="text-[13px] font-medium text-foreground">{s.label}</p>
                  <p className="text-[11px] text-muted-foreground">{s.sub}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {phase === "error" && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-[12px] text-red-600 flex gap-2">
            <XCircle className="size-4 shrink-0" />
            <span>Có lỗi xảy ra (có thể do màu sắc Tailwind 4). Hãy thử Xuất Markdown thay thế.</span>
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-neutral-100 p-4 space-y-2">
        <button
          onClick={prepareAndDownload}
          disabled={phase === "loading" || !hasSelection}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-black active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
          {phase === "loading"
            ? <><Loader2 className="size-4 animate-spin" /> Đang xử lý...</>
            : <><Download className="size-4" /> Tải PDF (Ưu tiên format)</>}
        </button>
        <button
          onClick={handleDownloadMarkdown}
          disabled={phase === "loading" || !hasSelection}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 py-2.5 text-[13px] font-semibold text-foreground bg-white transition-all hover:bg-neutral-50 active:scale-[0.98] disabled:opacity-50">
          <FileText className="size-4 text-blue-600" /> Xuất Markdown (.md) - Khuyên dùng
        </button>
      </div>


      {/* Off-screen render container — uses inline styles only, no Tailwind */}
      <div style={{ position: 'absolute', top: -9999, left: -9999, pointerEvents: 'none' }}>
        <div ref={containerRef} style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", padding: 40, background: 'white', width: 800, color: '#111' }}>
          {/* Cover */}
          <div style={{ borderBottom: '3px solid #059669', paddingBottom: 16, marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#059669', margin: 0 }}>Tài Liệu Học Tập</h1>
            <p style={{ fontSize: 12, color: '#6b7280', margin: '6px 0 0' }}>Xuất từ hệ thống AI học tập • {new Date().toLocaleDateString('vi-VN')}</p>
          </div>

          {/* Summary */}
          {includeSummary && summary && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#059669', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                📄 Tóm tắt nội dung
              </h2>
              <div dangerouslySetInnerHTML={{ __html: markdownToHtml(summary) }} />
            </div>
          )}

          {/* Study Plan */}
          {includeStudyPlan && plan && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0284c7', margin: '0 0 12px' }}>
                📅 Kế hoạch học tập
              </h2>
              <div dangerouslySetInnerHTML={{ __html: markdownToHtml(plan) }} />
            </div>
          )}

          {/* Personal Notes */}
          {includeNotes && notes && (
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#d97706', margin: '0 0 12px' }}>
                ✏️ Ghi chú cá nhân
              </h2>
              <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: notes }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


// Parses inline markdown: **bold**, *italic*, [MM:SS] timestamps, and [Trang X] page buttons
function InlineMarkdown({ text }: { text: string }) {
  // Split on timestamps, page citations, and bold/italic
  const tokens = text.split(/(\[\d{1,2}:\d{2}\]|\[Trang \d+\]|\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return (
    <>
      {tokens.map((token, i) => {
        const tsMatch = token.match(/^\[(\d{1,2}):(\d{2})\]$/)
        if (tsMatch) {
          const seconds = parseInt(tsMatch[1]) * 60 + parseInt(tsMatch[2])
          return (
            <button key={i}
              onClick={() => window.dispatchEvent(new CustomEvent('seek-video', { detail: seconds }))}
              className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded-md text-[11px] hover:bg-emerald-100 mx-0.5 transition-colors align-middle">
              ▶ {token}
            </button>
          )
        }
        const pageMatch = token.match(/^\[Trang (\d+)\]$/)
        if (pageMatch) {
          const pageNum = parseInt(pageMatch[1])
          return (
            <button key={i}
              onClick={() => window.dispatchEvent(new CustomEvent('seek-page', { detail: pageNum }))}
              className="inline-flex items-center gap-0.5 text-blue-600 font-semibold bg-blue-50 border border-blue-200/70 px-1.5 py-0.5 rounded-md text-[11px] hover:bg-blue-100 mx-0.5 transition-colors align-middle">
              📖 {token}
            </button>
          )
        }
        if (token.startsWith('**') && token.endsWith('**')) {
          return <strong key={i} className="font-semibold text-foreground">{token.slice(2, -2)}</strong>
        }
        if (token.startsWith('*') && token.endsWith('*')) {
          return <em key={i} className="italic">{token.slice(1, -1)}</em>
        }
        return <span key={i}>{token}</span>
      })}
    </>
  )
}

// Renders a full AI markdown response
function AiMessageContent({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let listBuffer: string[] = []
  let olBuffer: string[] = []

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-2 space-y-1.5 pl-1">
          {listBuffer.map((item, i) => (
            <li key={i} className="flex gap-2 text-foreground/85">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span><InlineMarkdown text={item} /></span>
            </li>
          ))}
        </ul>
      )
      listBuffer = []
    }
    if (olBuffer.length > 0) {
      elements.push(
        <ol key={`ol-${elements.length}`} className="my-2 space-y-1.5 pl-1">
          {olBuffer.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-foreground/85">
              <span className="shrink-0 font-semibold text-emerald-600 text-[11px] mt-0.5 tabular-nums">{i + 1}.</span>
              <span><InlineMarkdown text={item} /></span>
            </li>
          ))}
        </ol>
      )
      olBuffer = []
    }
  }

  lines.forEach((line, i) => {
    if (line.match(/^---+$/)) {
      flushList()
      elements.push(<hr key={`hr-${i}`} className="my-3 border-neutral-100" />)
    } else if (line.startsWith('### ')) {
      flushList()
      elements.push(<p key={i} className="mt-3 mb-1 text-[12px] font-bold uppercase tracking-wider text-emerald-600">{line.replace('### ', '')}</p>)
    } else if (line.startsWith('## ')) {
      flushList()
      elements.push(<p key={i} className="mt-4 mb-1.5 text-[14px] font-bold text-foreground border-b border-neutral-100 pb-1">{line.replace('## ', '')}</p>)
    } else if (line.match(/^[-*] /)) {
      olBuffer.length > 0 && flushList()
      listBuffer.push(line.replace(/^[-*] /, ''))
    } else if (line.match(/^\d+\. /)) {
      listBuffer.length > 0 && flushList()
      olBuffer.push(line.replace(/^\d+\. /, ''))
    } else if (line.trim() === '') {
      flushList()
      if (elements.length > 0) elements.push(<div key={`sp-${i}`} className="h-1.5" />)
    } else {
      flushList()
      elements.push(<p key={i} className="text-foreground/85 leading-relaxed"><InlineMarkdown text={line} /></p>)
    }
  })
  flushList()

  return <div className="space-y-0.5 text-[13px]">{elements}</div>
}

const QUICK_SUGGESTIONS = [
  "Tóm tắt nội dung chính",
  "Tạo sơ đồ tư duy",
  "Giải thích khái niệm khó",
  "Các điểm quan trọng cần nhớ",
]

function ChatView({ videoId }: { videoId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [isDoc, setIsDoc] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.chat.history(videoId)
      .then(d => setMessages(Array.isArray(d) ? d : []))
      .catch(() => { })
      .finally(() => setFetching(false))

    api.videos.get(videoId).then(v => {
      const doc = v.media_type === "pdf" || v.media_type === "docx" ||
        v.title?.toLowerCase().endsWith(".pdf") || v.title?.toLowerCase().endsWith(".docx") ||
        v.source_ref?.toLowerCase().endsWith(".pdf") || v.source_ref?.toLowerCase().endsWith(".docx");
      setIsDoc(!!doc)
    }).catch(() => {})
  }, [videoId])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  useEffect(() => {
    const handleReady = () => {
      const content = localStorage.getItem("pending-chat-content")
      if (content) {
        send(content)
        localStorage.removeItem("pending-chat-content")
      }
    }
    window.addEventListener("chat-content-ready", handleReady)
    return () => window.removeEventListener("chat-content-ready", handleReady)
  }, [loading])

  const send = async (text?: string) => {
    const content = text ?? input
    if (!content.trim() || loading) return
    const userMsg: Message = { role: "user", content }
    setMessages(p => [...p, userMsg])
    setInput("")
    setLoading(true)

    // Thêm message rỗng cho AI với trạng thái "Đang suy nghĩ"
    setMessages(p => [...p, { role: "assistant", content: "AI_THINKING" }])

    try {
      const response = await fetch(`http://localhost:8000/api/chat/${videoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      })

      if (!response.ok) throw new Error("API failed")

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No reader")

      let accumulated = ""
      let displayBuffer = ""
      const decoder = new TextDecoder()
      let firstChunk = true

      const updateInterval = setInterval(() => {
        if (displayBuffer !== accumulated) {
          displayBuffer = accumulated
          setMessages(p => {
            const next = [...p]
            next[next.length - 1] = { role: "assistant", content: displayBuffer }
            return next
          })
        }
      }, 60)

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          if (firstChunk) {
            accumulated = chunk
            firstChunk = false
          } else {
            accumulated += chunk
          }
        }
      } finally {
        clearInterval(updateInterval)
        setMessages(p => {
          const next = [...p]
          next[next.length - 1] = { role: "assistant", content: accumulated }
          return next
        })
      }
    } catch {
      setMessages(p => {
        const next = [...p]
        next[next.length - 1] = { role: "assistant", content: "Đã có lỗi xảy ra, vui lòng thử lại." }
        return next
      })
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {fetching && (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin text-emerald-400" />
          </div>
        )}

        {!fetching && messages.length === 0 && (
          <div className="flex flex-col items-center pt-8 pb-4">
            <div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 shadow-md shadow-emerald-100">
              <Bot className="size-5 text-white" />
            </div>
            <p className="text-[14px] font-semibold text-foreground">Trợ lý học tập AI</p>
            <p className="mt-1 text-[12px] text-muted-foreground text-center max-w-[200px]">
              {isDoc
                ? "Đặt câu hỏi về nội dung tài liệu, AI sẽ trả lời kèm số trang cụ thể"
                : "Đặt câu hỏi về nội dung video, AI sẽ trả lời kèm mốc thời gian"}
            </p>
            <div className="mt-5 flex flex-col gap-2 w-full">
              {QUICK_SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="w-full text-left rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-[12px] text-foreground/70 transition-all hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50/50 hover:shadow-sm active:scale-[0.98]">
                  {s} →
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-2.5", msg.role === "user" ? "flex-row-reverse" : "items-start")}>
            {/* Avatar */}
            <div className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-lg mt-0.5",
              msg.role === "user"
                ? "bg-neutral-800"
                : "bg-gradient-to-br from-emerald-500 to-teal-400 shadow-sm"
            )}>
              {msg.role === "user"
                ? <User className="size-3 text-white" />
                : <Bot className="size-3 text-white" />}
            </div>

            {/* Bubble */}
            {msg.role === "user" ? (
              <div className="max-w-[82%] rounded-2xl rounded-tr-sm bg-neutral-900 px-4 py-2.5 text-[13px] text-white leading-relaxed">
                {msg.content}
              </div>
            ) : (
              <div className="flex-1 min-w-0 rounded-2xl rounded-tl-sm bg-white border border-neutral-100 shadow-sm px-4 py-3">
                {msg.content === "AI_THINKING" ? (
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="size-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="size-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[12px] text-emerald-600 font-medium animate-pulse">AI đang tìm kiếm thông tin...</span>
                  </div>
                ) : (
                  <AiMessageContent content={msg.content} />
                )}
              </div>
            )}
          </div>
        ))}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-neutral-100 p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-neutral-200/80 bg-white px-3.5 py-2.5 shadow-sm transition-all focus-within:border-emerald-300 focus-within:shadow-[0_0_0_3px_rgba(16,185,129,0.08)]">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder={isDoc ? "Hỏi về nội dung tài liệu..." : "Hỏi về nội dung video..."}
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-neutral-400 py-0.5"
            disabled={loading}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm transition-all hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed active:scale-95">
            <ArrowUp className="size-3.5" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-neutral-400">
          {isDoc ? "AI trả lời dựa trên tài liệu gốc" : "AI trả lời dựa trên transcript video"}
        </p>
      </div>
    </>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export function AiToolsSidebar({ videoId }: { videoId: string }) {
  const [open, setOpen] = useState(true)
  const [activeTool, setActiveTool] = useState<(typeof tools)[0] | null>(null)
  const [renderedTools, setRenderedTools] = useState<Set<string>>(new Set())
  const prevVideoIdRef = useRef<string>(videoId)

  // Reset renderedTools khi đổi video → các tool sẽ unmount & remount fresh
  useEffect(() => {
    if (prevVideoIdRef.current !== videoId) {
      prevVideoIdRef.current = videoId
      setRenderedTools(new Set())
    }
  }, [videoId])

  useEffect(() => {
    if (activeTool) {
      setRenderedTools(prev => {
        const next = new Set(prev)
        next.add(activeTool.id)
        return next
      })
    }
  }, [activeTool, videoId])

  useEffect(() => {
    const handleAddToChat = (e: any) => {
      const { content, action } = e.detail
      const chatTool = tools.find(t => t.id === "chat")
      if (chatTool) {
        setActiveTool(chatTool)
        localStorage.setItem("pending-chat-content", content)
        // Delay to allow ChatView to mount
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("chat-content-ready"))
        }, 100)
      }
    }
    const handleOpenTool = (e: any) => {
      const toolId = e.detail
      const tool = tools.find(t => t.id === toolId)
      if (tool) {
        setActiveTool(tool)
      }
    }
    window.addEventListener("add-to-chat", handleAddToChat)
    window.addEventListener("open-tool", handleOpenTool)
    return () => {
      window.removeEventListener("add-to-chat", handleAddToChat)
      window.removeEventListener("open-tool", handleOpenTool)
    }
  }, [])

  if (!open) return (
    <div className="flex h-full items-start pt-4">
      <button onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-l-xl bg-white px-3 py-2 shadow-[-2px_0_8px_rgba(0,0,0,0.04)] text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground border border-r-0 border-neutral-100">
        <ChevronRight className="size-4" /><span>Tab Học</span>
      </button>
    </div>
  )

  return (
    <aside className="flex h-full w-full flex-col bg-white overflow-hidden border-l border-neutral-100">
      {/* Grid View */}
      <div className={cn("flex flex-col h-full", activeTool ? "hidden" : "flex")}>
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-3">
          <span className="text-[14px] font-semibold text-foreground">Tab Học</span>
          <div className="flex items-center gap-1">
            <button className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground"><Plus className="size-4" /></button>
            <button onClick={() => setOpen(false)} className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground"><X className="size-4" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <p className="mb-3 text-[13px] font-semibold text-foreground">Tạo ra</p>
          <div className="grid grid-cols-2 gap-2">
            {tools.map(tool => (
              <button key={tool.id} onClick={() => setActiveTool(tool)}
                className="group flex flex-col gap-3 rounded-xl border border-neutral-100 bg-white p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-neutral-200 hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.1)] transition-colors group-hover:from-emerald-100 group-hover:to-teal-100">
                  <tool.icon className="size-5 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-[13px] font-semibold text-foreground leading-tight">{tool.label}</span>
                    {tool.badge && <span className="inline-flex shrink-0 rounded bg-blue-50 px-1 py-px text-[9px] font-bold text-blue-700">{tool.badge}</span>}
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground leading-snug line-clamp-2">{tool.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tool View */}
      <div className={cn("flex-col h-full", activeTool ? "flex" : "hidden")}>
        {activeTool && (
          <div className="flex shrink-0 items-center gap-2 border-b border-neutral-100 px-4 py-3">
            <button onClick={() => setActiveTool(null)}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-neutral-100 hover:text-foreground">
              <ChevronLeft className="size-4" />Tab Học
            </button>
            <div className="ml-1 flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-md bg-gradient-to-br from-emerald-50 to-teal-50 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.15)]">
                <activeTool.icon className="size-3.5 text-emerald-600" />
              </div>
              <span className="text-[14px] font-semibold text-foreground">{activeTool.label}</span>
            </div>
          </div>
        )}

        {/* Mounted Tools */}
        <div className={cn("flex flex-1 flex-col overflow-hidden", activeTool?.id !== "quiz" && "hidden")}>
          {renderedTools.has("quiz") && <QuizView videoId={videoId} onBack={() => setActiveTool(null)} />}
        </div>
        <div className={cn("flex flex-1 flex-col overflow-hidden", activeTool?.id !== "history" && "hidden")}>
          {activeTool?.id === "history" && <HistoryView videoId={videoId} />}
        </div>
        <div className={cn("flex flex-1 flex-col overflow-hidden", activeTool?.id !== "summary" && "hidden")}>
          {renderedTools.has("summary") && <SummaryView videoId={videoId} />}
        </div>
        <div className={cn("flex flex-1 flex-col overflow-hidden", activeTool?.id !== "flashcard" && "hidden")}>
          {renderedTools.has("flashcard") && <FlashcardView videoId={videoId} />}
        </div>
        <div className={cn("flex flex-1 flex-col overflow-hidden", activeTool?.id !== "notes" && "hidden")}>
          {renderedTools.has("notes") && <PersonalNotesView videoId={videoId} />}
        </div>
        <div className={cn("flex flex-1 flex-col overflow-hidden", activeTool?.id !== "plan" && "hidden")}>
          {renderedTools.has("plan") && <AiContentView videoId={videoId} icon={CalendarRange} title="Kế hoạch 7 ngày" description="Lộ trình học tập cá nhân hoá từ AI" dataKey="plan" />}
        </div>
        <div className={cn("flex flex-1 flex-col overflow-hidden", activeTool?.id !== "export" && "hidden")}>
          {renderedTools.has("export") && <ExportPdfView videoId={videoId} />}
        </div>
        <div className={cn("flex flex-1 flex-col overflow-hidden", activeTool?.id !== "chat" && "hidden")}>
          {renderedTools.has("chat") && <ChatView videoId={videoId} />}
        </div>

        {/* Fallback for unused tools */}
        {!["quiz", "history", "summary", "flashcard", "notes", "plan", "export", "chat"].includes(activeTool?.id || "") && activeTool && (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.12)]">
              <activeTool.icon className="size-7 text-emerald-600" />
            </div>
            <p className="text-[15px] font-semibold text-foreground">{activeTool.label}</p>
            <p className="mt-1.5 text-[13px] text-muted-foreground max-w-[200px]">{activeTool.description}</p>
            <button className="mt-6 rounded-xl bg-emerald-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-emerald-600 active:scale-95">
              Tạo ngay
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
