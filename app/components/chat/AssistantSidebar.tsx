"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Bot,
  Plus,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { canCreateAssistants } from "@/lib/userType";

interface AssistantItem {
  id: string;
  name: string;
  description: string;
  updated_at: string;
  source?: string;
  is_owner?: boolean;
}

interface AssistantSidebarProps {
  token: string;
  currentAssistantId: string | null;
  onAssistantSelect: (assistantId: string) => void;
  onThreadDeleted?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function AssistantSidebar({
  token,
  currentAssistantId,
  onAssistantSelect,
  onThreadDeleted,
  isCollapsed = false,
  onToggleCollapse,
}: AssistantSidebarProps) {
  const [assistants, setAssistants] = useState<AssistantItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredAssistant, setHoveredAssistant] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const allowNewAssistant = canCreateAssistants(token);

  const fetchAssistants = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const [mineRes, catRes] = await Promise.all([
        fetch("/api/assistants?page=1&limit=100&scope=mine", {
          headers: { Token: token },
        }),
        fetch("/api/assistants?page=1&limit=100&scope=catalog", {
          headers: { Token: token },
        }),
      ]);
      const mine = mineRes.ok ? (await mineRes.json()).items || [] : [];
      const catalog = catRes.ok ? (await catRes.json()).items || [] : [];
      const byId = new Map<string, AssistantItem>();
      for (const a of catalog as AssistantItem[]) {
        byId.set(a.id, { ...a, source: a.source || "catalog" });
      }
      for (const a of mine as AssistantItem[]) {
        byId.set(a.id, { ...a, source: "mine" });
      }
      setAssistants(
        Array.from(byId.values()).sort((x, y) => {
          const tx = new Date(x.updated_at).getTime();
          const ty = new Date(y.updated_at).getTime();
          return ty - tx;
        })
      );
    } catch {
      setAssistants([]);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchAssistants();
  }, [token, fetchAssistants]);

  const filteredAssistants = searchQuery.trim()
    ? assistants.filter(
        (a) =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (a.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : assistants;

  const handleDeleteThread = useCallback(
    async (assistantId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setDeleteTarget(assistantId);
      setShowDeleteDialog(true);
    },
    []
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget || !token) return;
    setIsDeleting(true);
    try {
      const threadId = `assistant_${deleteTarget}`;
      const res = await fetch(`/api/threads/${threadId}`, {
        method: "DELETE",
        headers: { Token: token },
      });
      if (res.ok) {
        if (deleteTarget === currentAssistantId) {
          onThreadDeleted?.();
        }
        setDeleteTarget(null);
        setShowDeleteDialog(false);
      }
    } catch (err) {
      console.error("Error deleting thread:", err);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, token, currentAssistantId, onThreadDeleted]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Ahora";
      if (diffMins < 60) return `Hace ${diffMins} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `Hace ${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      return `Hace ${diffDays}d`;
    } catch {
      return "";
    }
  };

  return (
    <div
      className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700 flex flex-col h-full w-full shadow-2xl m-0 p-0 relative"
    >
      {!isCollapsed ? (
        <>
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">Asistentes</h2>
              </div>
              {allowNewAssistant && (
                <Link
                  href="/assistants/new"
                  className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                  title="Nuevo asistente"
                >
                  <Plus className="w-5 h-5" />
                </Link>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar asistentes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
            </div>

            <div className="mt-2">
              <button
                onClick={fetchAssistants}
                disabled={isLoading}
                className="w-full py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "Cargando..." : "Recargar"}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar-dark pb-16">
            <AnimatePresence>
              {filteredAssistants.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full p-6 text-center"
                >
                  <Bot className="w-12 h-12 text-slate-600 mb-3" />
                  <p className="text-slate-400 text-sm mb-2">
                    {searchQuery ? "No se encontraron asistentes" : "No hay asistentes"}
                  </p>
                  {!searchQuery && allowNewAssistant && (
                    <Link
                      href="/assistants/new"
                      className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Crear asistente
                    </Link>
                  )}
                </motion.div>
              ) : (
                filteredAssistants.map((assistant, index) => (
                  <motion.div
                    key={assistant.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`relative group p-3 border-b border-slate-800 cursor-pointer transition-all ${
                      currentAssistantId === assistant.id
                        ? "bg-emerald-900/30 border-l-4 border-l-emerald-500"
                        : "hover:bg-slate-800/50"
                    }`}
                    onMouseEnter={() => setHoveredAssistant(assistant.id)}
                    onMouseLeave={() => setHoveredAssistant(null)}
                    onClick={() => onAssistantSelect(assistant.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                          currentAssistantId === assistant.id ? "bg-emerald-600" : "bg-slate-700"
                        }`}
                      >
                        <Bot
                          className={`w-5 h-5 ${
                            currentAssistantId === assistant.id ? "text-white" : "text-slate-300"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1 gap-1">
                          <p
                            className={`text-sm font-medium truncate ${
                              currentAssistantId === assistant.id ? "text-white" : "text-slate-200"
                            }`}
                          >
                            {assistant.name}
                          </p>
                          {assistant.source === "catalog" && (
                            <span className="text-[10px] uppercase tracking-wide text-emerald-400/90 flex-shrink-0">
                              Catálogo
                            </span>
                          )}
                          <span className="text-xs text-slate-500 flex-shrink-0 ml-1">
                            {formatDate(assistant.updated_at)}
                          </span>
                        </div>
                        {assistant.description && (
                          <p
                            className={`text-xs truncate ${
                              currentAssistantId === assistant.id ? "text-slate-300" : "text-slate-400"
                            }`}
                          >
                            {assistant.description}
                          </p>
                        )}
                      </div>
                      <AnimatePresence>
                        {hoveredAssistant === assistant.id && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={(e) => handleDeleteThread(assistant.id, e)}
                            disabled={isDeleting}
                            className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-colors flex-shrink-0"
                            title="Borrar historial del chat"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          <div className="absolute bottom-4 right-4">
            <button
              onClick={onToggleCollapse}
              className="p-2 bg-slate-800 border border-slate-700 rounded-full shadow-lg hover:bg-slate-700 transition-colors z-30"
              title="Colapsar sidebar"
            >
              <ChevronLeft className="w-4 h-4 text-slate-300" />
            </button>
          </div>

          <ConfirmDialog
            isOpen={showDeleteDialog}
            title="Borrar historial del chat"
            message="¿Eliminar todo el historial de conversación con este asistente? Esta acción no se puede deshacer."
            confirmText="Eliminar"
            cancelText="Cancelar"
            variant="danger"
            onConfirm={confirmDelete}
            onCancel={() => {
              setShowDeleteDialog(false);
              setDeleteTarget(null);
            }}
            isLoading={isDeleting}
          />
        </>
      ) : (
        <div className="flex flex-col items-center py-4 gap-4 h-full">
          {allowNewAssistant && (
            <Link
              href="/assistants/new"
              className="p-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
              title="Nuevo asistente"
            >
              <Plus className="w-5 h-5" />
            </Link>
          )}
          <div className="flex-1 overflow-y-auto custom-scrollbar-dark w-full pb-16">
            {filteredAssistants.slice(0, 10).map((assistant) => (
              <motion.button
                key={assistant.id}
                onClick={() => onAssistantSelect(assistant.id)}
                className={`w-full p-3 flex items-center justify-center transition-all ${
                  currentAssistantId === assistant.id
                    ? "bg-emerald-900/30 border-l-4 border-l-emerald-500"
                    : "hover:bg-slate-800/50"
                }`}
                title={assistant.name}
              >
                <Bot
                  className={`w-5 h-5 ${
                    currentAssistantId === assistant.id ? "text-emerald-400" : "text-slate-400"
                  }`}
                />
              </motion.button>
            ))}
          </div>
          <div className="absolute bottom-4 right-4">
            <button
              onClick={onToggleCollapse}
              className="p-2 bg-slate-800 border border-slate-700 rounded-full shadow-lg hover:bg-slate-700 transition-colors z-30"
              title="Expandir sidebar"
            >
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
