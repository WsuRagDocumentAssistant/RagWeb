import { createBrowserRouter, Navigate } from "react-router-dom";
import { RootLayout, ProtectedRoute } from "@/layout";
import { LoginPage } from "@/features/auth";
import { ChatPage } from "@/features/chat";
import { FileManagementPage } from "@/features/files";
import { DictionaryPage } from "@/features/dictionary";

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
          { path: "files", element: <FileManagementPage /> },
          { path: "dictionary", element: <DictionaryPage /> },
        ],
      },
      { path: "*", element: <Navigate to="/chat" replace /> },
    ],
  },
]);
