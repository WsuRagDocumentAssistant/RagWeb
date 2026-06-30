import React from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import "./index.css";
import { MainLayout } from "@/layout";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MainLayout />
    <Toaster theme="dark" position="top-right" />
  </React.StrictMode>,
);
