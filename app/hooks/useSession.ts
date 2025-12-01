import { useState, useEffect } from "react";

type SessionInfo = {
  session_uuid: string;
  inner_uuid: string;
} | null;

let globalSessionInfo: SessionInfo = null;

export function useSession(token: string | null, initialThreadId?: string | null) {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initializeSession = async (threadId?: string | null) => {
    if (!token) {
      setIsInitializing(false);
      return;
    }

      try {
        setIsInitializing(true);
      setError(null);
      
      // If threadId is provided, use it directly
      if (threadId) {
        // Get user_id from token
        try {
          const decoded = JSON.parse(atob(token.split('.')[1]));
          const user_id = decoded.user_id;
          
          const newSession = {
            session_uuid: user_id,
            inner_uuid: threadId,
          };

          sessionStorage.setItem('sessionInfo', JSON.stringify(newSession));
          globalSessionInfo = newSession;
          setSessionInfo(newSession);
          setIsInitializing(false);
          return;
        } catch {
          // Fall through to create new session
        }
      }
      
      // Otherwise create new session
        const res = await fetch('/api/session', {
          method: 'POST',
          headers: token ? { 'Token': token } : undefined
        });
        
        if (!res.ok) throw new Error('Failed to start session');
        const data = await res.json();

        if (!data.session_uuid || !data.inner_uuid) {
          throw new Error('Invalid session data received');
        }

        const newSession = {
          session_uuid: data.session_uuid,
          inner_uuid: data.inner_uuid,
        };

        sessionStorage.setItem('sessionInfo', JSON.stringify(newSession));
        globalSessionInfo = newSession;
        setSessionInfo(newSession);
    } catch (err) {
      console.error("Error initializing session:", err);
      setError(err instanceof Error ? err.message : "Error al inicializar la sesión");
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      if (!token) {
        setIsInitializing(false);
        return;
      }

      // Check if we have a saved session
      const savedSession = sessionStorage.getItem('sessionInfo');
      if (savedSession && initialThreadId) {
        try {
          const parsed = JSON.parse(savedSession);
          if (parsed.inner_uuid === initialThreadId) {
        if (isMounted) {
              setSessionInfo(parsed);
          setIsInitializing(false);
              return;
            }
          }
        } catch {
          // Fall through
        }
      }

      await initializeSession(initialThreadId);
    }

    if (token) {
      initSession();
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, initialThreadId]);

  const changeThread = async (threadId: string) => {
    await initializeSession(threadId);
  };

  return { 
    sessionInfo, 
    setSessionInfo, 
    isInitializing, 
    error, 
    globalSessionInfo,
    changeThread
  };
}
