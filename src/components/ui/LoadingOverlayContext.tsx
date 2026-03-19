"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type LoadingOverlayContextValue = {
  sessionLoading: boolean;
  setSessionLoading: (value: boolean) => void;
  filesLoading: boolean;
  setFilesLoading: (value: boolean) => void;
};

const LoadingOverlayContext = createContext<LoadingOverlayContextValue | null>(null);

export function LoadingOverlayProvider({ children }: { children: ReactNode }) {
  const [sessionLoading, setSessionLoading] = useState(false);
  const [filesLoading, setFilesLoading] = useState(false);

  const setSession = useCallback((value: boolean) => {
    setSessionLoading(value);
  }, []);

  const setFiles = useCallback((value: boolean) => {
    setFilesLoading(value);
  }, []);

  return (
    <LoadingOverlayContext.Provider
      value={{
        sessionLoading,
        setSessionLoading: setSession,
        filesLoading,
        setFilesLoading: setFiles,
      }}
    >
      {children}
    </LoadingOverlayContext.Provider>
  );
}

export function useLoadingOverlay(): LoadingOverlayContextValue {
  const ctx = useContext(LoadingOverlayContext);
  if (!ctx) {
    return {
      sessionLoading: false,
      setSessionLoading: () => {},
      filesLoading: false,
      setFilesLoading: () => {},
    };
  }
  return ctx;
}
