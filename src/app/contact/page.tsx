"use client";

import dynamic from "next/dynamic";

const ContactContent = dynamic(() => import("./ContactContent"), {
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

export default function ContactPage() {
  return <ContactContent />;
}
