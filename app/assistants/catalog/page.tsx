"use client";

import { useState, useEffect, useCallback } from "react";
import { Bot, ArrowLeft, ChevronLeft, ChevronRight, MessageSquare, Library } from "lucide-react";
import { ChatHeader } from "@/app/components/chat/ChatHeader";
import { ChatFooter } from "@/app/components/chat/ChatFooter";
import Link from "next/link";

interface Assistant {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  created_at: string;
  updated_at: string;
  source?: string;
  is_owner?: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

const ITEMS_PER_PAGE = 12;

export default function AssistantCatalogPage() {
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
    if (typeof window !== "undefined") {
      const t = sessionStorage.getItem("token");
      if (!t) {
        window.location.href = "/";
        return;
      }
      setToken(t);
    }
  }, []);

  const loadCatalog = useCallback(
    async (page: number = 1) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/assistants?page=${page}&limit=${ITEMS_PER_PAGE}&scope=catalog`,
          { headers: { Token: token } }
        );
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.detail || "Error al cargar el catálogo");
        }
        const data = await res.json();
        setAssistants(data.items || []);
        if (data.pagination) setPagination(data.pagination);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    if (!token) return;
    loadCatalog(1);
  }, [token, loadCatalog]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.total_pages) {
      loadCatalog(newPage);
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
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title="Volver al chat"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <Library className="w-6 h-6 text-emerald-600" />
              <h1 className="text-2xl font-bold text-gray-900">Catálogo de asistentes</h1>
            </div>
            <Link
              href="/assistants"
              className="text-sm text-emerald-700 hover:text-emerald-800 font-medium"
            >
              Mis asistentes
            </Link>
          </div>

          <p className="text-gray-600 mb-6">
            Todos los asistentes creados en la organización. Puedes abrir una conversación con
            cualquiera; solo el autor puede editarlo.
          </p>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
              <p className="mt-4 text-gray-600">Cargando catálogo...</p>
            </div>
          ) : assistants.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Aún no hay asistentes.</p>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Cuando alguien cree un asistente en &quot;Mis asistentes&quot;, aparecerá aquí para
                todos.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {assistants.map((a) => (
                  <div
                    key={a.id}
                    className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 truncate">{a.name}</h3>
                          {a.is_owner && (
                            <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                              Tuyo
                            </span>
                          )}
                        </div>
                        {a.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-3">{a.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          Actualizado: {new Date(a.updated_at).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                        <Link
                          href={`/assistants/${a.id}/chat`}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Usar
                        </Link>
                        {a.is_owner && (
                          <Link
                            href={`/assistants/${a.id}/edit`}
                            className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Editar
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {pagination.total_pages > 1 && (
                <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                  <span className="text-sm text-gray-700">
                    Página {pagination.page} de {pagination.total_pages} ({pagination.total}{" "}
                    asistentes)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.has_prev || loading}
                      className="flex items-center gap-1 px-3 py-2 text-sm border rounded-lg disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.has_next || loading}
                      className="flex items-center gap-1 px-3 py-2 text-sm border rounded-lg disabled:opacity-50"
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
