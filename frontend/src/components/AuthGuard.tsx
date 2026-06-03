"use client";

import { useAuth } from "@/contexts/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { userId, showAuthModal } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const publicRoutes = ['/', '/login', '/register'];
      const isPublicRoute = publicRoutes.includes(pathname);
      
      if (!userId && !isPublicRoute) {
        router.push('/');
        showAuthModal('login');
      } else if (userId && (pathname === '/login' || pathname === '/register')) {
        router.push('/');
      }
    }
  }, [userId, pathname, router, mounted]);

  if (!mounted) return null;

  const publicRoutes = ['/', '/login', '/register'];
  if (!userId && !publicRoutes.includes(pathname)) {
    return null; 
  }

  return <>{children}</>;
}
