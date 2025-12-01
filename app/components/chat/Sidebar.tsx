"use client";

import { useState, useMemo } from "react";
import { 
  MessageSquare, 
  Plus, 
  Search, 
  RefreshCw, 
  Trash2, 
  Clock,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useThreads } from "@/app/hooks/useThreads";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ConfirmDialog } from "../common/ConfirmDialog";

interface SidebarProps {
  token: string;
  currentThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({ token, currentThreadId, onThreadSelect, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const { threads, isLoading, fetchThreads, createThread, deleteThread, deleteThreadsBatch } = useThreads(token);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredThread, setHoveredThread] = useState<string | null>(null);
  const [selectedThreads, setSelectedThreads] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'multiple' | 'all'; ids?: string[] } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [loadingThreadId, setLoadingThreadId] = useState<string | null>(null);

  const filteredThreads = useMemo(() => {
    if (!searchQuery.trim()) return threads;
    const query = searchQuery.toLowerCase();
    return threads.filter(thread => 
      thread.last_message.toLowerCase().includes(query) ||
      thread.thread_id.toLowerCase().includes(query)
    );
  }, [threads, searchQuery]);

  const handleCreateThread = async () => {
    const newThread = await createThread();
    if (newThread) {
      onThreadSelect(newThread.inner_uuid);
    }
  };

  const handleDeleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget({ type: 'single', ids: [threadId] });
    setShowDeleteDialog(true);
  };

  const handleToggleSelection = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedThreads.size === filteredThreads.length) {
      setSelectedThreads(new Set());
    } else {
      setSelectedThreads(new Set(filteredThreads.map(t => t.thread_id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedThreads.size === 0) return;
    setDeleteTarget({ type: 'multiple', ids: Array.from(selectedThreads) });
    setShowDeleteDialog(true);
  };

  const handleDeleteAll = () => {
    setDeleteTarget({ type: 'all', ids: filteredThreads.map(t => t.thread_id) });
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'single' && deleteTarget.ids) {
        const success = await deleteThread(deleteTarget.ids[0]);
        if (success && currentThreadId === deleteTarget.ids[0]) {
          // If deleted thread was current, select first thread or create new
          if (filteredThreads.length > 1) {
            const nextThread = filteredThreads.find(t => t.thread_id !== deleteTarget.ids![0]);
            if (nextThread) {
              onThreadSelect(nextThread.thread_id);
            }
          } else {
            const newThread = await createThread();
            if (newThread) {
              onThreadSelect(newThread.inner_uuid);
            }
          }
        }
      } else if (deleteTarget.type === 'multiple' && deleteTarget.ids) {
        const result = await deleteThreadsBatch(deleteTarget.ids);
        if (result.deleted > 0) {
          // Clear selection
          setSelectedThreads(new Set());
          setIsSelectionMode(false);
          // If current thread was deleted, select first remaining or create new
          if (deleteTarget.ids.includes(currentThreadId || '')) {
            const remaining = filteredThreads.filter(t => !deleteTarget.ids!.includes(t.thread_id));
            if (remaining.length > 0) {
              onThreadSelect(remaining[0].thread_id);
            } else {
              const newThread = await createThread();
              if (newThread) {
                onThreadSelect(newThread.inner_uuid);
              }
            }
          }
        }
      } else if (deleteTarget.type === 'all' && deleteTarget.ids) {
        const result = await deleteThreadsBatch(deleteTarget.ids);
        if (result.deleted > 0) {
          setSelectedThreads(new Set());
          setIsSelectionMode(false);
          // Create new thread
          const newThread = await createThread();
          if (newThread) {
            onThreadSelect(newThread.inner_uuid);
          }
        }
      }
    } catch (error) {
      console.error("Error deleting threads:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDeleteTarget(null);
    }
  };

  const formatThreadDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: es });
    } catch {
      return "Hace un momento";
    }
  };

  const truncateMessage = (message: string, maxLength: number = 60) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  return (
    <motion.div
      className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-r border-slate-700 flex flex-col h-full shadow-2xl m-0 p-0 relative"
      animate={{ width: isCollapsed ? "64px" : "320px" }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      {!isCollapsed ? (
        <>
          {/* Header */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">Chats</h2>
              </div>
              <div className="flex items-center gap-2">
                {isSelectionMode && (
                  <>
                    {selectedThreads.size > 0 && (
                      <motion.button
                        onClick={handleDeleteSelected}
                        className="p-2 rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title={`Eliminar ${selectedThreads.size} seleccionado${selectedThreads.size > 1 ? 's' : ''}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    )}
                    {filteredThreads.length > 0 && (
                      <motion.button
                        onClick={handleDeleteAll}
                        className="p-2 rounded-lg bg-red-700 hover:bg-red-600 text-white transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Eliminar todos"
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    )}
                    <motion.button
                      onClick={() => {
                        setIsSelectionMode(false);
                        setSelectedThreads(new Set());
                      }}
                      className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Cancelar selección"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                  </>
                )}
                {!isSelectionMode && (
                  <>
                    {filteredThreads.length > 0 && (
                      <motion.button
                        onClick={() => setIsSelectionMode(true)}
                        className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Seleccionar threads"
                      >
                        <CheckSquare className="w-4 h-4" />
                      </motion.button>
                    )}
                    <motion.button
                      onClick={handleCreateThread}
                      className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Nuevo chat"
                    >
                      <Plus className="w-5 h-5" />
                    </motion.button>
                  </>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
              />
            </div>

            {/* Action buttons */}
            <div className="mt-2 flex gap-2">
              {isSelectionMode && filteredThreads.length > 0 && (
                <motion.button
                  onClick={handleSelectAll}
                  className="flex-1 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {selectedThreads.size === filteredThreads.length ? (
                    <>
                      <X className="w-3.5 h-3.5" />
                      Deseleccionar
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-3.5 h-3.5" />
                      Seleccionar todos
                    </>
                  )}
                </motion.button>
              )}
              <motion.button
                onClick={fetchThreads}
                disabled={isLoading}
                className={`py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${isSelectionMode && filteredThreads.length > 0 ? 'flex-1' : 'w-full'}`}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                {isLoading ? "Cargando..." : "Recargar"}
              </motion.button>
            </div>
          </div>

          {/* Threads list */}
          <div className="flex-1 overflow-y-auto custom-scrollbar-dark pb-16">
            <AnimatePresence>
              {filteredThreads.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center h-full p-6 text-center"
                >
                  <MessageCircle className="w-12 h-12 text-slate-600 mb-3" />
                  <p className="text-slate-400 text-sm mb-2">
                    {searchQuery ? "No se encontraron chats" : "No hay chats aún"}
                  </p>
                  {!searchQuery && (
                    <motion.button
                      onClick={handleCreateThread}
                      className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Crear primer chat
                    </motion.button>
                  )}
                </motion.div>
              ) : (
                filteredThreads.map((thread, index) => (
                  <motion.div
                    key={thread.thread_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative group p-3 border-b border-slate-800 cursor-pointer transition-all ${
                      currentThreadId === thread.thread_id
                        ? "bg-emerald-900/30 border-l-4 border-l-emerald-500"
                        : selectedThreads.has(thread.thread_id)
                        ? "bg-blue-900/30 border-l-4 border-l-blue-500"
                        : "hover:bg-slate-800/50"
                    }`}
                    onMouseEnter={() => setHoveredThread(thread.thread_id)}
                    onMouseLeave={() => setHoveredThread(null)}
                    onClick={(e) => {
                      if (isSelectionMode) {
                        handleToggleSelection(thread.thread_id, e);
                      } else if (loadingThreadId !== thread.thread_id && currentThreadId !== thread.thread_id) {
                        setLoadingThreadId(thread.thread_id);
                        onThreadSelect(thread.thread_id);
                        // Reset loading state after a delay
                        setTimeout(() => setLoadingThreadId(null), 1000);
                      }
                    }}
                    onDoubleClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <div className="flex items-start gap-3">
                      {isSelectionMode ? (
                        <button
                          onClick={(e) => handleToggleSelection(thread.thread_id, e)}
                          className="flex-shrink-0 mt-1 p-1 rounded hover:bg-slate-700 transition-colors"
                        >
                          {selectedThreads.has(thread.thread_id) ? (
                            <CheckSquare className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                        </button>
                      ) : (
                        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                          currentThreadId === thread.thread_id
                            ? "bg-emerald-600"
                            : loadingThreadId === thread.thread_id
                            ? "bg-emerald-500"
                            : "bg-slate-700"
                        }`}>
                          {loadingThreadId === thread.thread_id ? (
                            <RefreshCw className="w-5 h-5 text-white animate-spin" />
                          ) : (
                            <MessageSquare className={`w-5 h-5 ${
                              currentThreadId === thread.thread_id ? "text-white" : "text-slate-300"
                            }`} />
                          )}
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-sm font-medium truncate ${
                            currentThreadId === thread.thread_id ? "text-white" : "text-slate-200"
                          }`}>
                            {thread.thread_id.substring(0, 8)}...
                          </p>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span className="text-xs text-slate-500">
                              {formatThreadDate(thread.last_message_at)}
                            </span>
                          </div>
                        </div>
                        
                        <p className={`text-xs truncate ${
                          currentThreadId === thread.thread_id ? "text-slate-300" : "text-slate-400"
                        }`}>
                          {truncateMessage(thread.last_message)}
                        </p>
                      </div>

                      {/* Delete button */}
                      <AnimatePresence>
                        {!isSelectionMode && hoveredThread === thread.thread_id && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={(e) => handleDeleteThread(thread.thread_id, e)}
                            disabled={isDeleting}
                            className="p-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-colors flex-shrink-0"
                            title="Eliminar thread"
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

          {/* Toggle button - Bottom Right */}
          <div className="absolute bottom-4 right-4">
            <button
              onClick={onToggleCollapse}
              className="p-2 bg-slate-800 border border-slate-700 rounded-full shadow-lg hover:bg-slate-700 transition-colors z-30"
              title="Colapsar sidebar"
            >
              <ChevronLeft className="w-4 h-4 text-slate-300" />
            </button>
          </div>

          {/* Confirm Delete Dialog */}
          <ConfirmDialog
            isOpen={showDeleteDialog}
            title={
              deleteTarget?.type === 'single'
                ? 'Eliminar thread'
                : deleteTarget?.type === 'all'
                ? 'Eliminar todos los threads'
                : `Eliminar ${deleteTarget?.ids?.length || 0} threads`
            }
            message={
              deleteTarget?.type === 'single'
                ? '¿Estás seguro de que quieres eliminar este thread? Esta acción no se puede deshacer.'
                : deleteTarget?.type === 'all'
                ? `¿Estás seguro de que quieres eliminar todos los ${filteredThreads.length} threads? Esta acción no se puede deshacer.`
                : `¿Estás seguro de que quieres eliminar ${deleteTarget?.ids?.length || 0} threads seleccionados? Esta acción no se puede deshacer.`
            }
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
          <motion.button
            onClick={handleCreateThread}
            className="p-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Nuevo chat"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar-dark w-full pb-16">
            {filteredThreads.slice(0, 10).map((thread) => (
              <motion.button
                key={thread.thread_id}
                onClick={() => onThreadSelect(thread.thread_id)}
                className={`w-full p-3 flex items-center justify-center transition-all ${
                  currentThreadId === thread.thread_id
                    ? "bg-emerald-900/30 border-l-4 border-l-emerald-500"
                    : "hover:bg-slate-800/50"
                }`}
                title={truncateMessage(thread.last_message)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <MessageSquare className={`w-5 h-5 ${
                  currentThreadId === thread.thread_id ? "text-emerald-400" : "text-slate-400"
                }`} />
              </motion.button>
            ))}
          </div>

          {/* Toggle button - Bottom Right */}
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
    </motion.div>
  );
}
