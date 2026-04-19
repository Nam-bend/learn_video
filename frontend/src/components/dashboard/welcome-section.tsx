"use client"

export function WelcomeSection() {
  return (
    <div className="text-center space-y-3 animate-fade-in-up">
      <div className="mx-auto mb-1 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-50 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.15)]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-emerald-600">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h1 className="text-[28px] sm:text-[34px] font-bold tracking-tight text-foreground">
        Đã đến lúc học,{" "}
        <span className="relative inline-block">
          <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-500 bg-clip-text text-transparent">
            Fuoc
          </span>
          <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-40" />
        </span>
      </h1>
    </div>
  )
}
