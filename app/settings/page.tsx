"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Settings as SettingsIcon, ArrowLeft } from "lucide-react";
import { CustomSpaceForm } from "@/app/components/settings/CustomSpaceForm";
import { CustomSpaceCard } from "@/app/components/settings/CustomSpaceCard";
import { ChatHeader } from "@/app/components/chat/ChatHeader";
import { ChatFooter } from "@/app/components/chat/ChatFooter";

interface CustomSpace {
  id: string;
  title: string;
  custom_memories: string;
  agent_instructions: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function SettingsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<CustomSpace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSpace, setEditingSpace] = useState<CustomSpace | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = sessionStorage.getItem('token');
      if (!storedToken) {
        window.location.href = '/';
        return;
      }
      setToken(storedToken);
    }
  }, []);

  const loadSpaces = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/custom-spaces", {
        headers: {
          Token: token,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Error al cargar espacios");
      }

      const data = await response.json();
      setSpaces(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadSpaces();
    }
  }, [token, loadSpaces]);

  const handleSave = () => {
    setShowForm(false);
    setEditingSpace(null);
    loadSpaces();
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSpace(null);
  };

  const handleEdit = (space: CustomSpace) => {
    setEditingSpace(space);
    setShowForm(true);
  };

  const handleDelete = async (spaceId: string) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/custom-spaces/${spaceId}`, {
        method: "DELETE",
        headers: {
          Token: token,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Error al eliminar espacio");
      }

      loadSpaces();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  const handleToggleActive = async (spaceId: string, isActive: boolean) => {
    if (!token) return;

    try {
      const response = await fetch(`/api/custom-spaces/${spaceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Token: token,
        },
        body: JSON.stringify({
          is_active: !isActive,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Error al actualizar espacio");
      }

      loadSpaces();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0">
        <ChatHeader token={token} />
      </div>

      {/* Main Content */}
      <main className="flex-1 min-h-0 px-4 py-8 pb-20 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.location.href = '/'}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Volver al chat"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <SettingsIcon className="w-6 h-6 text-emerald-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  Espacios Personalizados
                </h1>
              </div>
              {!showForm && (
                <button
                  onClick={() => {
                    setEditingSpace(null);
                    setShowForm(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Espacio
                </button>
              )}
            </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {showForm ? (
            <div className="border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingSpace ? "Editar Espacio" : "Nuevo Espacio Personalizado"}
              </h2>
              <CustomSpaceForm
                token={token}
                space={editingSpace}
                onSave={handleSave}
                onCancel={handleCancel}
                onDelete={editingSpace ? handleDelete : undefined}
              />
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                Define espacios personalizados donde puedes especificar tus memorias y cómo quieres
                que el agente se comporte. El espacio activo se usará para personalizar todas las
                respuestas del agente.
              </p>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                  <p className="mt-4 text-gray-600">Cargando espacios...</p>
                </div>
              ) : spaces.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <SettingsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No tienes espacios personalizados aún.</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Crear tu primer espacio
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {spaces.map((space) => (
                    <CustomSpaceCard
                      key={space.id}
                      space={space}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </div>
              )}
            </>
          )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <div className="flex-shrink-0">
        <ChatFooter />
      </div>
    </div>
  );
}
