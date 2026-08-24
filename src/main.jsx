import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import "./index.css";
import { router } from "@/routes/router";
import { useAppState } from "@/core/AppState";

// 브라우저가 드롭된 파일을 새 탭에서 열거나 다운로드하는 기본 동작을 전역에서 차단.
// 드롭 지점이 앱의 지정된 드롭존을 벗어나면 이 기본 동작이 발동해 파일이 다운로드된다.
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => e.preventDefault());

function AppToaster() {
  const theme = useAppState((s) => s.theme);
  return <Toaster theme={theme} position="top-right" richColors closeButton />;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <AppToaster />
  </React.StrictMode>,
);
