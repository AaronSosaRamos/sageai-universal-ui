"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, LogOut, Settings, Bell, MessageSquare, Bot } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { useMemo } from "react";

interface ChatHeaderProps {
  token: string;
}

export function ChatHeader({ token }: ChatHeaderProps) {
  const pathname = usePathname();
  const userName = useMemo(() => {
    try {
      const decoded = jwtDecode<{ nombre: string; apellido: string }>(token);
      return `${decoded.nombre} ${decoded.apellido}`;
    } catch {
      return 'Usuario';
    }
  }, [token]);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('sessionInfo');
    window.location.reload();
  };

  return (
    <header
      className="w-full border-b shadow-lg relative overflow-hidden"
      style={{ 
        background: "linear-gradient(135deg, #005E44 0%, #047857 50%, #059669 100%)",
      }}
    >
      <div className="relative mx-auto w-full px-4 sm:px-6 h-16 flex items-center justify-between sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-6xl">
        <div className="flex items-center gap-6 text-white">
          <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <Image
              src="/logo.png"
              alt="Logo"
              width={140}
              height={42}
              className="h-9 w-auto object-contain drop-shadow-lg"
              priority
            />
            <div className="leading-tight hidden sm:block">
              <p className="font-bold text-sm">Asistente AI</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <p className="text-xs opacity-90">En línea</p>
              </div>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                pathname === "/" ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm font-medium">Chat</span>
            </Link>
            <Link
              href="/assistants"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                pathname?.startsWith("/assistants") ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              <Bot className="w-4 h-4" />
              <span className="text-sm font-medium">Asistentes</span>
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            className="relative p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
            title="Notificaciones"
          >
            <Bell className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-white bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20">
            <User className="w-4 h-4" />
            <span className="text-sm font-semibold">
              {userName}
            </span>
          </div>

          <Link
            href="/settings"
            className={`p-2 rounded-lg transition-colors ${
              pathname === "/settings" ? "bg-white/20" : "text-white hover:bg-white/20"
            }`}
            title="Configuración"
          >
            <Settings className="w-5 h-5" />
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-lg text-white hover:bg-red-500/20 transition-colors border border-white/10"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
