"use client";

import { Edit, Trash2, Power, PowerOff } from "lucide-react";

interface CustomSpace {
  id: string;
  title: string;
  custom_memories: string;
  agent_instructions: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CustomSpaceCardProps {
  space: CustomSpace;
  onEdit: (space: CustomSpace) => void;
  onDelete: (spaceId: string) => void;
  onToggleActive: (spaceId: string, isActive: boolean) => void;
}

export function CustomSpaceCard({
  space,
  onEdit,
  onDelete,
  onToggleActive
}: CustomSpaceCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className={`border rounded-lg p-4 ${space.is_active ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900">{space.title}</h3>
            {space.is_active && (
              <span className="px-2 py-0.5 text-xs font-medium bg-emerald-600 text-white rounded">
                Activo
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Creado: {formatDate(space.created_at)} • Actualizado: {formatDate(space.updated_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onToggleActive(space.id, !space.is_active)}
            className={`p-2 rounded-lg transition-colors ${
              space.is_active
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={space.is_active ? "Desactivar" : "Activar"}
          >
            {space.is_active ? (
              <Power className="w-4 h-4" />
            ) : (
              <PowerOff className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => onEdit(space)}
            className="p-2 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
            title="Editar"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (confirm("¿Estás seguro de que deseas eliminar este espacio?")) {
                onDelete(space.id);
              }
            }}
            className="p-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {space.custom_memories && (
        <div className="mb-3">
          <p className="text-xs font-medium text-gray-600 mb-1">Memorias:</p>
          <p className="text-sm text-gray-700 line-clamp-2">
            {space.custom_memories}
          </p>
        </div>
      )}

      {space.agent_instructions && (
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1">Instrucciones:</p>
          <p className="text-sm text-gray-700 line-clamp-2">
            {space.agent_instructions}
          </p>
        </div>
      )}
    </div>
  );
}
