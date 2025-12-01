import { useState, useCallback } from "react";
import type { FileInfo } from "../components/chat/FilePreview";
import type { ChatMessage } from "../components/chat/MessageBubble";

interface UseFileUploadProps {
  token: string | null;
  sessionInfo: { session_uuid: string; inner_uuid: string } | null;
  isInitializing: boolean;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setSessionInfo: React.Dispatch<React.SetStateAction<{ session_uuid: string; inner_uuid: string } | null>>;
}

export function useFileUpload({
  token,
  sessionInfo,
  isInitializing,
  setMessages,
  setSessionInfo
}: UseFileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<FileInfo[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const getFileType = (file: File): FileInfo['type'] => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('application/') || file.type.startsWith('text/')) return 'document';
    return 'other';
  };

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const currentToken = token || sessionStorage.getItem('token');
    let currentSession = sessionInfo;
    
    if (!currentSession) {
      const savedSession = sessionStorage.getItem('sessionInfo');
      if (savedSession) {
        try {
          currentSession = JSON.parse(savedSession);
          setSessionInfo(currentSession);
        } catch (e) {
          console.error("Error parsing saved session:", e);
        }
      }
    }

    if (!currentSession && currentToken && !isInitializing) {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Token': currentToken }
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          sender: "bot",
          text: `Error al inicializar la sesión: ${errorData.error || errorData.detail || res.statusText}`,
          timestamp: Date.now(),
        }]);
        return;
      }

      const data = await res.json();
      const newSession = {
        session_uuid: data.session_uuid,
        inner_uuid: data.inner_uuid,
      };
      sessionStorage.setItem('sessionInfo', JSON.stringify(newSession));
      setSessionInfo(newSession);
      return handleFiles(files);
    }
    
    if (!currentToken) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        sender: "bot",
        text: "Error: No hay token de autenticación. Por favor, inicia sesión nuevamente.",
        timestamp: Date.now(),
      }]);
      return;
    }

    if (!currentSession?.session_uuid || !currentSession?.inner_uuid) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        sender: "bot",
        text: "Error: No se pudo recuperar la sesión. Por favor, recarga la página.",
        timestamp: Date.now(),
      }]);
      return;
    }

    const newFiles = files.map(file => {
      const type = getFileType(file);
      const preview = type === 'image' ? URL.createObjectURL(file) : undefined;
      
      return {
        id: crypto.randomUUID(),
        file: file,
        name: file.name,
        size: file.size,
        preview,
        status: 'pending' as const,
        type
      };
    });
    
    setSelectedFiles(prev => [...prev, ...newFiles]);

    setIsUploading(true);
    try {
      for (const fileInfo of newFiles) {
        const formData = new FormData();
        formData.append("files", fileInfo.file);
        
        setSelectedFiles(prev => 
          prev.map(f => f.id === fileInfo.id ? { ...f, status: 'uploading' as const } : f)
        );
        
        const res = await fetch(
          `/api/files/${currentSession.session_uuid}/${currentSession.inner_uuid}`,
          {
            method: 'POST',
            headers: currentToken ? { 'Token': currentToken } : undefined,
            body: formData,
          }
        );
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || errorData.detail || errorData.message || res.statusText);
        }
        
        const data = await res.json();
        
        const uploadedInfo = {
          ...fileInfo,
          status: 'uploaded' as const,
          uploadedPath: data.uploaded[0]
        };

        setSelectedFiles(prev => 
          prev.map(f => f.id === fileInfo.id ? uploadedInfo : f)
        );

        setUploadedFiles(prev => [...prev, uploadedInfo]);
      }
    } catch (error) {
      console.error("Error uploading files:", error);
      setSelectedFiles(prev => 
        prev.map(f => f.status === 'pending' || f.status === 'uploading' 
          ? { ...f, status: 'error' as const }
          : f
        )
      );
      
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        sender: "bot",
        text: "Error al subir los archivos. Por favor, intenta nuevamente.",
        timestamp: Date.now(),
      }]);
    } finally {
      setIsUploading(false);
    }
  }, [token, sessionInfo, isInitializing, setMessages, setSessionInfo]);

  const removeFile = useCallback(async (fileInfo: FileInfo) => {
    setSelectedFiles(prev => 
      prev.map(f => f.id === fileInfo.id ? { ...f, status: 'deleting' as const } : f)
    );

    if (fileInfo.status === 'uploaded' && fileInfo.uploadedPath) {
      try {
        const pathMatch = fileInfo.uploadedPath.match(/\/files\/(.+)/);
        if (!pathMatch) throw new Error('Invalid file path format');
        
        const relativePath = pathMatch[1];
        
        const res = await fetch(`/api/files/delete/${relativePath}`, {
          method: 'DELETE',
          headers: token ? { 'Token': token } : undefined,
        });
        
        if (!res.ok) throw new Error('Failed to delete file from server');

        setUploadedFiles(prev => prev.filter(f => f.id !== fileInfo.id));
      } catch (error) {
        console.error('Error al eliminar archivo del servidor:', error);
        setSelectedFiles(prev => 
          prev.map(f => f.id === fileInfo.id ? { ...f, status: 'error' as const } : f)
        );
        return;
      }
    }

    setSelectedFiles(prev => prev.filter(f => f.id !== fileInfo.id));

    if (fileInfo.preview) {
      URL.revokeObjectURL(fileInfo.preview);
    }
  }, [token]);

  const clearAllFiles = useCallback(async () => {
    setSelectedFiles(prev => 
      prev.map(f => ({ ...f, status: 'deleting' as const }))
    );

    for (const file of selectedFiles) {
      if (file.status === 'uploaded' && file.uploadedPath) {
        try {
          const pathMatch = file.uploadedPath.match(/\/files\/(.+)/);
          if (pathMatch) {
            const relativePath = pathMatch[1];
            await fetch(`/api/files/delete/${relativePath}`, {
              method: 'DELETE',
              headers: token ? { 'Token': token } : undefined,
            });
          }
        } catch (error) {
          console.error(`Error al eliminar archivo ${file.name}:`, error);
        }
      }
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    }

    setSelectedFiles([]);
    setUploadedFiles([]);
  }, [selectedFiles, token]);

  return {
    selectedFiles,
    uploadedFiles,
    isUploading,
    handleFiles,
    removeFile,
    clearAllFiles,
    setUploadedFiles
  };
}

