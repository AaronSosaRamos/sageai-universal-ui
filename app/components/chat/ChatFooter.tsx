"use client";

export function ChatFooter() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 w-full border-t border-slate-700 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 z-20 h-12 shadow-2xl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-full text-xs text-slate-300 flex items-center justify-center text-center">
        <span className="font-medium">
          © {new Date().getFullYear()} UNCP • Todos los derechos reservados
        </span>
      </div>
    </footer>
  );
}
