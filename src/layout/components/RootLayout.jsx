import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAppState } from "@/core/AppState";

export default function RootLayout() {
  const initializeAuth = useAppState((s) => s.initializeAuth);
  const authInitialized = useAppState((s) => s.authInitialized);

  useEffect(() => { initializeAuth(); }, []);

  if (!authInitialized) return null;

  return <Outlet />;
}
