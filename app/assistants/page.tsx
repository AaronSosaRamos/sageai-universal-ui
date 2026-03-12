"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Bot, Edit, Trash2, ArrowLeft, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { ChatHeader } from "@/app/components/chat/ChatHeader";
import { ChatFooter } from "@/app/components/chat/ChatFooter";
import { SystemPromptPreview } from "@/app/components/assistants/SystemPromptPreview";
import Link from "next/link";

interface Assistant {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  created_at: string;
  updated_at: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function AssistantsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: ITEMS_PER_PAGE,
    total: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const t = sessionStorage.getItem("token");
      if (!t) {
        window.location.href = "/";
        return;
      }
      setToken(t);
    }
  }, []);

  const loadAssistants = useCallback(async (page: number = 1) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/assistants?page=${page}&limit=${ITEMS_PER_PAGE}`, {
        headers: { Token: token },
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Error al cargar");
      }
      const data = await res.json();
      setAssistants(data.items || []);
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    loadAssistants(1);
  }, [token, loadAssistants]);

  const handleDelete = async (id: string) => {
    if (!token || !confirm("¿Eliminar este asistente?")) return;
    try {
      const res = await fetch(`/api/assistants/${id}`, {
        method: "DELETE",
        headers: { Token: token },
      });
      if (!res.ok) throw new Error("Error al eliminar");
      // Recargar la página actual o ir a la anterior si esta queda vacía
      const currentPage = pagination.page;
      await loadAssistants(currentPage);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      loadAssistants(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (!token) return null;

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex flex-col overflow-hidden">
      <div className="flex-shrink-0">
        <ChatHeader token={token} />
      </div>

      <main className="flex-1 min-h-0 px-4 py-8 pb-20 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Volver al chat"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <Bot className="w-6 h-6 text-emerald-600" />
              <h1 className="text-2xl font-bold text-gray-900">Asistentes Personalizados</h1>
            </div>
            <Link
              href="/assistants/new"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Nuevo Asistente
            </Link>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <p className="text-gray-600 mb-6">
            Crea asistentes con system prompts personalizados. Sube documentos (PDF, DOCX, imágenes) para generar el prompt automáticamente o escríbelo manualmente.
          </p>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
              <p className="mt-4 text-gray-600">Cargando asistentes...</p>
            </div>
          ) : assistants.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No tienes asistentes aún.</p>
              <Link
                href="/assistants/new"
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Crear tu primer asistente
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {assistants.map((a) => (
                  <div
                    key={a.id}
                    className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{a.name}</h3>
                        {a.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{a.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Actualizado: {new Date(a.updated_at).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4 flex-shrink-0">
                        <Link
                          href={`/assistants/${a.id}/chat`}
                          className="p-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                          title="Usar asistente"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/assistants/${a.id}/edit`}
                          className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <SystemPromptPreview content={a.system_prompt} maxLines={3} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación - Siempre visible cuando hay datos */}
              {!loading && assistants.length > 0 && (
                <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span>
                      Mostrando {assistants.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} -{" "}
                      {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} asistentes
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.has_prev || loading}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                        let pageNum: number;
                        if (pagination.total_pages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.total_pages - 2) {
                          pageNum = pagination.total_pages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            disabled={loading}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              pagination.page === pageNum
                                ? "bg-emerald-600 text-white"
                                : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.has_next || loading}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <div className="flex-shrink-0">
        <ChatFooter />
      </div>
    </div>
  );
}
