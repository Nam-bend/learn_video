"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { BookOpen, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api.auth.login({ username, password });
      login(data.user_id, data.username);
    } catch (err: any) {
      setError(err.message || "Tên đăng nhập hoặc mật khẩu không đúng.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#fafafa] relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-200/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-200/30 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-[440px] z-10 px-6">
        <div className="animate-fade-in-up bg-white/80 backdrop-blur-xl rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden">
          
          {/* Top Gradient Accent */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />

          <div className="flex flex-col items-center mb-10">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/20 mb-5">
              <BookOpen className="size-7" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-800">Mừng trở lại</h1>
            <p className="text-neutral-500 mt-2 text-center text-sm">Đăng nhập vào không gian học tập thông minh của bạn.</p>
          </div>
          
          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 border border-red-100 flex items-center gap-2 animate-fade-in-up">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5 animate-fade-in-up animate-delay-100">
              <label className="block text-sm font-semibold text-neutral-700">Tên đăng nhập</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                className="w-full rounded-xl border-0 bg-neutral-100/70 px-4 py-3.5 text-neutral-800 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner"
                required 
              />
            </div>
            <div className="space-y-1.5 animate-fade-in-up animate-delay-200">
              <label className="block text-sm font-semibold text-neutral-700">Mật khẩu</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border-0 bg-neutral-100/70 px-4 py-3.5 text-neutral-800 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner"
                required 
              />
            </div>
            <div className="animate-fade-in-up animate-delay-300">
              <button 
                type="submit" 
                disabled={loading}
                className="group relative mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3.5 font-semibold text-white transition-all hover:bg-emerald-600 disabled:opacity-70 disabled:hover:bg-neutral-900 overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? <Loader2 className="size-5 animate-spin" /> : "Đăng nhập ngay"}
                  {!loading && <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />}
                </span>
              </button>
            </div>
          </form>
          
          <div className="mt-8 text-center animate-fade-in-up animate-delay-400">
            <p className="text-sm text-neutral-500">
              Người mới đến? <Link href="/register" className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700 hover:underline underline-offset-4">Tạo tài khoản</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
