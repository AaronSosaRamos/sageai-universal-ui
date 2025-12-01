import { useState, useEffect, useCallback } from "react";

export interface Thread {
  thread_id: string;
  last_message_at: string;
  last_role: "AI" | "Human";
  last_message: string;
}

export function useThreads(token: string | null) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThreads = useCallback(async () => {
    if (!token) {
      setThreads([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/threads', {
        method: 'GET',
        headers: {
          'Token': token,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch threads');
      }

      const data = await res.json();
      // Manejar tanto la nueva estructura (con threads, total, etc.) como la antigua
      setThreads(data.threads || data || []);
    } catch (err) {
      console.error("Error fetching threads:", err);
      setError(err instanceof Error ? err.message : "Error al cargar threads");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const createThread = useCallback(async (): Promise<{ session_uuid: string; inner_uuid: string } | null> => {
    if (!token) return null;

    try {
      const res = await fetch('/api/threads', {
        method: 'POST',
        headers: {
          'Token': token,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to create thread');
      }

      const data = await res.json();
      await fetchThreads(); // Refresh threads list
      return data;
    } catch (err) {
      console.error("Error creating thread:", err);
      setError(err instanceof Error ? err.message : "Error al crear thread");
      return null;
    }
  }, [token, fetchThreads]);

  const deleteThread = useCallback(async (threadId: string): Promise<boolean> => {
    if (!token) return false;

    try {
      const res = await fetch(`/api/threads/${threadId}`, {
        method: 'DELETE',
        headers: {
          'Token': token,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to delete thread');
      }

      await fetchThreads(); // Refresh threads list
      return true;
    } catch (err) {
      console.error("Error deleting thread:", err);
      setError(err instanceof Error ? err.message : "Error al eliminar thread");
      return false;
    }
  }, [token, fetchThreads]);

  const deleteThreadsBatch = useCallback(async (threadIds: string[]): Promise<{ deleted: number; failed: number }> => {
    if (!token) return { deleted: 0, failed: threadIds.length };

    try {
      const res = await fetch('/api/threads/batch-delete', {
        method: 'POST',
        headers: {
          'Token': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ thread_ids: threadIds }),
      });

      if (!res.ok) {
        throw new Error('Failed to delete threads');
      }

      const data = await res.json();
      await fetchThreads(); // Refresh threads list
      return { deleted: data.deleted || 0, failed: data.failed || 0 };
    } catch (err) {
      console.error("Error deleting threads batch:", err);
      setError(err instanceof Error ? err.message : "Error al eliminar threads");
      return { deleted: 0, failed: threadIds.length };
    }
  }, [token, fetchThreads]);

  useEffect(() => {
    if (token) {
      fetchThreads();
    }
  }, [token, fetchThreads]);

  return {
    threads,
    isLoading,
    error,
    fetchThreads,
    createThread,
    deleteThread,
    deleteThreadsBatch,
  };
}

