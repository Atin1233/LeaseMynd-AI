"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });
import "swagger-ui-react/swagger-ui.css";

export default function ApiDocsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <Link
        href="/dashboard/help"
        className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Help Center
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-900 heading-font">
          REST API Reference
        </h1>
        <p className="text-stone-500 mt-1">
          Full OpenAPI documentation for programmatic access. Use API keys from Settings.
        </p>
      </div>
      <div className="border border-stone-200 rounded-lg overflow-hidden bg-white">
        <SwaggerUI url="/openapi.json" />
      </div>
    </div>
  );
}
