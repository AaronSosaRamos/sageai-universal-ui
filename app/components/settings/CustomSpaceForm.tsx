"use client";

import { useState, useEffect } from "react";
import { Save, X, Trash2 } from "lucide-react";

interface CustomSpace {
  id: string;
  title: string;
  custom_memories: string;
  agent_instructions: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CustomSpaceFormProps {
  token: string;
  space?: CustomSpace | null;
  onSave: () => void;
  onCancel: () => void;
  onDelete?: (spaceId: string) => void;
}

export function CustomSpaceForm({
  token,
  space,
  onSave,
  onCancel,
  onDelete
}: CustomSpaceFormProps) {
  const [title, setTitle] = useState("");
  const [customMemories, setCustomMemories] = useState("");
  const [agentInstructions, setAgentInstructions] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (space) {
      setTitle(space.title);
      setCustomMemories(space.custom_memories);
      setAgentInstructions(space.agent_instructions);
      setIsActive(space.is_active);
    }
  }, [space]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const url = space
        ? `/api/custom-spaces/${space.id}`
        : "/api/custom-spaces";
      
      const method = space ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Token: token,
        },
        body: JSON.stringify({
          title,
          custom_memories: customMemories,
          agent_instructions: agentInstructions,
          is_active: isActive,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Error al guardar espacio");
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!space || !onDelete) return;
    
    if (!confirm("¿Estás seguro de que deseas eliminar este espacio?")) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/custom-spaces/${space.id}`, {
        method: "DELETE",
        headers: {
          Token: token,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Error al eliminar espacio");
      }

      onDelete(space.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Título del Espacio
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Ej: Mi Espacio de Trabajo"
        />
      </div>

      <div>
        <label htmlFor="custom_memories" className="block text-sm font-medium text-gray-700 mb-2">
          Memorias Personalizadas
        </label>
        <textarea
          id="custom_memories"
          value={customMemories}
          onChange={(e) => setCustomMemories(e.target.value)}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Define tus memorias personalizadas aquí. Por ejemplo: 'Soy desarrollador Python. Me gusta trabajar con FastAPI y React. Prefiero código limpio y bien documentado.'"
        />
        <p className="mt-1 text-sm text-gray-500">
          Información sobre ti que quieres que el agente recuerde y use para personalizar sus respuestas.
        </p>
      </div>

      <div>
        <label htmlFor="agent_instructions" className="block text-sm font-medium text-gray-700 mb-2">
          Instrucciones de Comportamiento del Agente
        </label>
        <textarea
          id="agent_instructions"
          value={agentInstructions}
          onChange={(e) => setAgentInstructions(e.target.value)}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Define cómo debe actuar el agente. Por ejemplo: 'Sé conciso y técnico. Usa ejemplos de código cuando sea relevante. Prefiere explicaciones prácticas sobre teóricas.'"
        />
        <p className="mt-1 text-sm text-gray-500">
          Instrucciones específicas sobre cómo quieres que el agente se comporte y responda.
        </p>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_active"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
        />
        <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
          Espacio activo (este espacio se usará para personalizar las respuestas del agente)
        </label>
      </div>

      <div className="flex gap-3 justify-end">
        {space && onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isLoading ? "Guardando..." : "Guardar"}
        </button>
      </div>
    </form>
  );
}
