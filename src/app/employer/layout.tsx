"use client";

import dynamic from "next/dynamic";

const EmployerLayoutInner = dynamic(() => import("./EmployerLayoutInner"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--stone-50, #fafaf9)",
      }}
    >
      <p>Loading...</p>
    </div>
  ),
});

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EmployerLayoutInner>{children}</EmployerLayoutInner>;
}
