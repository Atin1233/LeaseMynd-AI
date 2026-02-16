"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Loader2, ArrowLeft, History, ChevronDown, ChevronRight } from "lucide-react";

interface Template {
  id: string;
  name: string;
  description: string | null;
  structure_type: string | null;
  is_prebuilt: boolean;
  created_at: string;
}

interface TemplateVersion {
  id: string;
  version_number: number;
  created_at: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [versionsByTemplate, setVersionsByTemplate] = useState<Record<string, TemplateVersion[]>>({});
  const [loadingVersions, setLoadingVersions] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    setLoading(true);
    try {
      const res = await fetch("/api/templates");
      const data = await res.json();
      setTemplates(data.templates ?? []);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleVersions(templateId: string) {
    if (expandedId === templateId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(templateId);
    if (versionsByTemplate[templateId]) return;
    setLoadingVersions(templateId);
    try {
      const res = await fetch(`/api/templates/${templateId}/versions`);
      const data = await res.json();
      setVersionsByTemplate((prev) => ({ ...prev, [templateId]: data.versions ?? [] }));
    } catch {
      setVersionsByTemplate((prev) => ({ ...prev, [templateId]: [] }));
    } finally {
      setLoadingVersions(null);
    }
  }

  const prebuilt = templates.filter((t) => t.is_prebuilt);
  const custom = templates.filter((t) => !t.is_prebuilt);

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to dashboard
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-stone-900 heading-font mb-2">
          Template Library
        </h1>
        <p className="text-stone-500">
          Pre-built lease structures and your custom templates. Use templates when creating or comparing leases.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-stone-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading templates…
        </div>
      ) : (
        <div className="space-y-8">
          {prebuilt.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-stone-900 mb-4">Pre-built</h2>
              <div className="grid gap-3">
                {prebuilt.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-stone-200 bg-white"
                  >
                    <FileText className="h-8 w-8 text-stone-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-900">{t.name}</p>
                      {t.description && (
                        <p className="text-sm text-stone-500 mt-0.5">{t.description}</p>
                      )}
                    </div>
                    <span className="text-xs text-stone-400">Read-only</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold text-stone-900 mb-4">Your templates</h2>
            {custom.length === 0 ? (
              <div className="rounded-lg border border-stone-200 bg-stone-50 p-8 text-center text-stone-500">
                <p className="mb-2">No custom templates yet.</p>
                <p className="text-sm">Custom templates you create (via API or integrations) will appear here.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {custom.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-lg border border-stone-200 bg-white overflow-hidden"
                  >
                    <div className="flex items-center gap-4 p-4">
                      <FileText className="h-8 w-8 text-stone-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-stone-900">{t.name}</p>
                        {t.description && (
                          <p className="text-sm text-stone-500 mt-0.5">{t.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-stone-400">
                        {new Date(t.created_at).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleVersions(t.id)}
                        className="flex items-center gap-1.5 text-sm text-stone-600 hover:text-stone-900"
                      >
                        {expandedId === t.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <History className="h-4 w-4" />
                        Version history
                      </button>
                    </div>
                    {expandedId === t.id && (
                      <div className="border-t border-stone-100 bg-stone-50 px-4 py-3">
                        {loadingVersions === t.id ? (
                          <div className="flex items-center gap-2 text-stone-500 text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Loading…
                          </div>
                        ) : (versionsByTemplate[t.id]?.length ?? 0) === 0 ? (
                          <p className="text-sm text-stone-500">No version history yet.</p>
                        ) : (
                          <ul className="space-y-2">
                            {(versionsByTemplate[t.id] ?? []).map((v) => (
                              <li
                                key={v.id}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-stone-700">Version {v.version_number}</span>
                                <span className="text-stone-500">
                                  {new Date(v.created_at).toLocaleDateString()}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
