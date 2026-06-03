"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Sparkles, ArrowRight, Loader2, X } from "lucide-react";

export function AuthModal() {
  const { isAuthModalOpen, hideAuthModal, authView, showAuthModal, login } = useAuth();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthModalOpen) {
      setUsername("");
      setPassword("");
      setError("");
      setLoading(false);
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const isLogin = authView === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (isLogin) {
        const data = await api.auth.login({ username, password });
        login(data.user_id, data.username);
      } else {
        const data = await api.auth.register({ username, password });
        login(data.user_id, data.username);
      }
    } catch (err: any) {
      if (isLogin) {
        setError("Tên đăng nhập hoặc mật khẩu không đúng.");
      } else {
        setError("Tên đăng nhập đã tồn tại hoặc không hợp lệ.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity" 
        onClick={hideAuthModal}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-[440px] animate-fade-in-up">
        {/* Decorative elements */}
        <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-emerald-300/40 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-teal-300/40 blur-[80px] pointer-events-none" />

        <div className="bg-white/90 backdrop-blur-2xl rounded-[2rem] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/60 relative overflow-hidden">
          {/* Close button */}
          <button 
            onClick={hideAuthModal}
            className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-colors z-10"
          >
            <X className="size-5" />
          </button>

          {/* Top Gradient */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />

          <div className="flex flex-col items-center mb-8 pt-2">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-lg shadow-emerald-500/20 mb-5">
              {isLogin ? <BookOpen className="size-7" /> : <Sparkles className="size-7" />}
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-neutral-800">
              {isLogin ? "Mừng trở lại" : "Tạo không gian mới"}
            </h2>
            <p className="text-neutral-500 mt-2 text-center text-sm">
              {isLogin ? "Đăng nhập để tiếp tục học tập." : "Gia nhập YouLearn và bắt đầu hành trình."}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-50 p-3.5 text-sm text-red-600 border border-red-100 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4 shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-neutral-700">Tên đăng nhập</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isLogin ? "Nhập tên đăng nhập" : "Chọn một cái tên độc đáo"}
                className="w-full rounded-xl border-0 bg-neutral-100/70 px-4 py-3 text-neutral-800 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner"
                required 
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[13px] font-semibold text-neutral-700">Mật khẩu</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border-0 bg-neutral-100/70 px-4 py-3 text-neutral-800 transition-all focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner"
                required 
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="group relative mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3.5 font-semibold text-white transition-all hover:bg-emerald-600 disabled:opacity-70 disabled:hover:bg-neutral-900 overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 flex items-center gap-2">
                {loading ? <Loader2 className="size-4 animate-spin" /> : (isLogin ? "Đăng nhập ngay" : "Đăng ký ngay")}
                {!loading && <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />}
              </span>
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[13px] text-neutral-500">
              {isLogin ? "Người mới đến? " : "Đã có tài khoản? "}
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setError("");
                  setUsername("");
                  setPassword("");
                  showAuthModal(isLogin ? 'register' : 'login');
                }}
                className="font-semibold text-emerald-600 transition-colors hover:text-emerald-700 hover:underline underline-offset-4"
              >
                {isLogin ? "Tạo tài khoản" : "Đăng nhập"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
