"use client";

import { X, Loader2, Check, FileText } from "lucide-react";
import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios";

export interface FileInfo {
  id: string;
  file: File;
  name: string;
  size: number;
  preview?: string;
  uploadedPath?: string;
  status: 'pending' | 'uploading' | 'uploaded' | 'error' | 'deleting';
  type: 'image' | 'audio' | 'video' | 'document' | 'other';
}

interface FilePreviewProps {
  files: FileInfo[];
  token: string | null;
  onRemoveFile: (file: FileInfo) => void;
  onClearAll: () => void;
}

function FilePreviewComponent({ files, onRemoveFile, onClearAll }: FilePreviewProps) {
  if (files.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-xl bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 shadow-lg max-h-[30vh] flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-white/50">
        <div className="text-xs font-semibold text-slate-700">
          Archivos seleccionados ({files.length})
        </div>
        <motion.button
          onClick={onClearAll}
          className="text-xs text-slate-600 hover:text-red-600 font-medium transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Limpiar todo
        </motion.button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3 custom-scrollbar">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          <AnimatePresence>
            {files.map((file, index) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                className={`p-2 rounded-lg border-2 relative group hover:shadow-md transition-all ${
                  file.status === 'error' ? 'border-red-300 bg-red-50' :
                  file.status === 'uploading' ? 'border-blue-300 bg-blue-50' :
                  file.status === 'deleting' ? 'border-yellow-300 bg-yellow-50' :
                  file.status === 'uploaded' ? 'border-green-300 bg-green-50' :
                  'border-slate-200 bg-white'
                }`}
                whileHover={{ scale: 1.05 }}
              >
                <motion.button
                  type="button"
                  onClick={() => onRemoveFile(file)}
                  className="absolute -top-1 -right-1 p-1 bg-white hover:bg-red-100 rounded-full shadow-md transition-colors opacity-0 group-hover:opacity-100 z-10"
                  aria-label="Eliminar archivo"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-3 h-3 text-red-600" />
                </motion.button>
                <div className="flex flex-col gap-2">
                  <div className="w-full aspect-square rounded-md overflow-hidden bg-slate-100 flex items-center justify-center">
                    {file.type === 'image' && file.preview && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    )}
                    {file.type === 'audio' && (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2">
                        <div className="w-2 h-2 rounded-full bg-slate-200 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-1.5 h-1.5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18V5l12-2v13" />
                            <circle cx="5" cy="18" r="3" />
                            <circle cx="21" cy="16" r="3" />
                          </svg>
                        </div>
                        {file.status === 'uploaded' && file.uploadedPath && (
                          <div className="w-full mt-1">
                            <audio
                              controls
                              controlsList="nodownload noplaybackrate"
                              style={{
                                width: '100%',
                                height: '30px',
                                minWidth: '150px'
                              }}
                              src={api.defaults.baseURL + file.uploadedPath}
                              preload="metadata"
                            >
                              Tu navegador no soporta el elemento de audio.
                            </audio>
                          </div>
                        )}
                      </div>
                    )}
                    {file.type === 'video' && (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-2 h-2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                      </div>
                    )}
                    {(file.type === 'document' || file.type === 'other') && (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className={`w-2 h-2 ${
                          file.status === 'error' ? 'text-red-400' :
                          file.status === 'uploading' ? 'text-blue-400' :
                          file.status === 'deleting' ? 'text-yellow-400' :
                          file.status === 'uploaded' ? 'text-green-400' :
                          'text-slate-400'
                        }`} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-medium truncate" title={file.name}>
                      {file.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="text-[10px] text-slate-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                      {file.status === 'uploading' && (
                        <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                      )}
                      {file.status === 'deleting' && (
                        <Loader2 className="w-3 h-3 text-yellow-500 animate-spin" />
                      )}
                      {file.status === 'uploaded' && (
                        <Check className="w-3 h-3 text-green-500" />
                      )}
                      {file.status === 'error' && (
                        <X className="w-3 h-3 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export const FilePreview = memo(FilePreviewComponent);
