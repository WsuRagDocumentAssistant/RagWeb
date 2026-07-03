import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import "./index.css";
import { router } from "@/routes/router";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <Toaster theme="dark" position="top-right" />
  </React.StrictMode>,
);
