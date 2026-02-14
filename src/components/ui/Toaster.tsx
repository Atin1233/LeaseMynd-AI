"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          background: "white",
          border: "1px solid #e7e5e4",
          borderRadius: "0",
        },
        className: "toast",
      }}
    />
  );
}
