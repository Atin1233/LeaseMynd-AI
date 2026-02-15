"use client";

import dynamic from "next/dynamic";

const DeploymentContent = dynamic(() => import("./DeploymentContent"), {
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

export default function DeploymentPage() {
  return <DeploymentContent />;
}
