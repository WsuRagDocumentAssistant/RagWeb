import { createBrowserRouter, Navigate } from "react-router-dom";
import { RootLayout, ProtectedRoute } from "@/layout";
import { LoginPage } from "@/features/auth";
import { ChatPage } from "@/features/chat";
import { FileManagementPage } from "@/features/files";
import { DocumentsPage } from "@/features/documents";
import { PromptPage } from "@/features/prompt";
import { ExternalApiPage } from "@/features/external-api";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/chat" replace /> },
      { path: "login", element: <LoginPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: "chat", element: <ChatPage /> },
          { path: "documents", element: <DocumentsPage /> },
          { path: "prompt", element: <PromptPage /> },
          { path: "external-api", element: <ExternalApiPage /> },
          { path: "files", element: <FileManagementPage /> },
        ],
      },
      { path: "*", element: <Navigate to="/chat" replace /> },
    ],
  },
]);
