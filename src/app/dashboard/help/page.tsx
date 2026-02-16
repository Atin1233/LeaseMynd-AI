"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  FileText,
  Code2,
  Users,
  BarChart3,
  Upload,
  Search,
  HelpCircle,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";

const helpCategories = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: BookOpen,
    description: "Learn the basics of LeaseAI",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    id: "upload-analysis",
    title: "Upload & Analysis",
    icon: Upload,
    description: "How to upload and analyze leases",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
  },
  {
    id: "collaboration",
    title: "Team Collaboration",
    icon: Users,
    description: "Working with your team",
    color: "text-violet-600",
    bgColor: "bg-violet-50",
  },
  {
    id: "market-comparison",
    title: "Market Comparison",
    icon: BarChart3,
    description: "Understanding market benchmarks",
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  {
    id: "api",
    title: "API Documentation",
    icon: Code2,
    description: "REST API for integrations",
    color: "text-sky-600",
    bgColor: "bg-sky-50",
  },
  {
    id: "faq",
    title: "Frequently Asked Questions",
    icon: HelpCircle,
    description: "Common questions and answers",
    color: "text-stone-600",
    bgColor: "bg-stone-50",
  },
];

const gettingStartedGuide = [
  {
    title: "Create Your Account",
    content: "Sign up for LeaseAI using your email address. Once registered, you'll be prompted to create or join an organization.",
  },
  {
    title: "Set Up Your Organization",
    content: "In Settings, add your organization name. This allows you to collaborate with team members and manage leases together.",
  },
  {
    title: "Upload Your First Lease",
    content: "Go to 'New Analysis' and upload a PDF lease document. You can add property details like address and property type to help with analysis.",
  },
  {
    title: "Review Your Analysis",
    content: "Once uploaded, click 'Analyze with AI' to get comprehensive risk scoring, clause-by-clause analysis, and recommendations.",
  },
  {
    title: "Collaborate with Your Team",
    content: "Use comments to discuss specific clauses with your team members. All comments are saved and visible to your organization.",
  },
];

const uploadGuide = [
  {
    title: "Supported File Formats",
    content: "LeaseAI supports PDF and Word documents. The PDF should contain searchable text (OCR supported for scanned documents). Maximum 100 pages, 50MB.",
  },
  {
    title: "Adding Property Details",
    content: "When uploading, you can optionally add property address and property type. This helps improve the accuracy of market comparisons.",
  },
  {
    title: "Understanding Risk Scores",
    content: "Each lease receives a risk score from 0-100. Lower scores indicate more favorable terms. Scores are color-coded: green (low risk), yellow (medium), red (high risk).",
  },
  {
    title: "Clause Analysis",
    content: "The AI analyzes 50+ common lease provisions including rent, CAM charges, renewal options, termination rights, and more. Each clause includes an explanation and risk assessment.",
  },
  {
    title: "Improved Lease Generation",
    content: "Use the 'Generate Improved Lease' feature to get AI-powered recommendations with complete replacement language for problematic clauses.",
  },
];

const collaborationGuide = [
  {
    title: "Inviting Team Members",
    content: "Go to Team Settings to invite members by email. They'll receive an invitation link to join your organization.",
  },
  {
    title: "Roles and Permissions",
    content: "Team members can have different roles: Owner (full access), Admin (manage team), Member (edit & comment), or Viewer (read-only).",
  },
  {
    title: "Commenting on Leases",
    content: "Click on any clause or section to add comments. Team members can reply to comments, creating threaded discussions.",
  },
  {
    title: "Activity Feed",
    content: "View all team activity including new analyses, uploads, and comments in the Team Collaboration page.",
  },
];

const marketComparisonGuide = [
  {
    title: "What is Market Comparison?",
    content: "Market comparison compares your lease terms against regional benchmarks for similar properties. This helps you understand if your terms are favorable.",
  },
  {
    title: "How to Generate Comparison",
    content: "On any analyzed lease, scroll to the Market Comparison section and click 'Generate Comparison'. The system will extract financial terms and compare them to market data.",
  },
  {
    title: "Understanding the Results",
    content: "Comparisons show your lease value vs. market average for metrics like rent per SF, CAM charges, TI allowances, and more. Green (low risk) indicates favorable terms, amber (medium) suggests review, red (high/critical) indicates areas for negotiation.",
  },
  {
    title: "Negotiation Opportunities",
    content: "The comparison highlights specific areas where you might negotiate better terms based on market standards.",
  },
];

const apiGuide = [
  {
    title: "API Overview",
    content: "LeaseAI provides a REST API for programmatic access (Growth+ plans). Base URL: your app origin + /api. All responses are JSON. Create API keys in Settings → API keys. For full OpenAPI/Swagger documentation, see the API Reference.",
  },
  {
    title: "Authentication",
    content: "Use either (1) Supabase session: include session cookie or Authorization: Bearer <access_token>, or (2) API key: Authorization: Bearer <api_key>. API keys are created in Settings and shown once; store them securely.",
  },
  {
    title: "Key Endpoints",
    content: "POST /api/upload-lease — upload one lease (FormData: file, title, propertyAddress?, propertyType?). POST /api/upload-lease/batch — upload up to 50 leases (FormData: files[], titles[], dueDiligence?). POST /api/analyze-lease — trigger analysis (JSON: { leaseId }). GET /api/analyze-lease?leaseId= — get analysis. GET /api/portfolio — list leases with risk summary. GET /api/export-portfolio — download portfolio CSV. POST /api/share-links — create share link (JSON: leaseId, password?, expiresAt?, label?). GET /api/share-links?leaseId= — list share links. GET /api/templates — list templates. POST /api/templates — create template (JSON: name, description?, content_json?).",
  },
  {
    title: "Errors",
    content: "Responses use standard HTTP status codes: 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 429 (rate limit), 500 (server error). Body: { error: string, details?: string }.",
  },
  {
    title: "Rate Limits",
    content: "Rate limits by plan: Free/Single ~5–10 analyses per 15 min, Team ~20–30, Broker ~100. Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset. On 429, retry after Retry-After seconds.",
  },
  {
    title: "Webhooks",
    content: "Configure webhooks (Settings or API) to receive POST requests when events occur. Event: analysis.completed — payload includes event, lease_id, analysis_id, risk_score, risk_level, created_at. Optional X-LeaseAI-Signature (HMAC-SHA256 of body using your webhook secret) for verification.",
  },
  {
    title: "SDK Examples",
    content: "cURL: curl -X POST -H 'Authorization: Bearer YOUR_API_KEY' -H 'Content-Type: application/json' -d '{\"leaseId\":\"uuid\"}' https://yourapp.com/api/analyze-lease. JavaScript: fetch('/api/analyze-lease', { method: 'POST', headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ leaseId }) }). Python: requests.post('https://yourapp.com/api/analyze-lease', headers={'Authorization': 'Bearer ' + api_key, 'Content-Type': 'application/json'}, json={'leaseId': lease_id}).",
  },
];

const faqs = [
  {
    question: "How accurate is the AI analysis?",
    answer: "Our AI uses advanced language models trained on commercial lease data. While highly accurate, we recommend having a legal professional review critical clauses, especially for high-value leases.",
  },
  {
    question: "What file formats are supported?",
    answer: "Currently, we support PDF files. The PDF should contain searchable text (not just scanned images) for best results.",
  },
  {
    question: "How long does analysis take?",
    answer: "Most lease analyses complete in 2-5 minutes. Longer documents may take slightly longer. You'll see a progress indicator during analysis.",
  },
  {
    question: "Can I export my analysis?",
    answer: "Yes! You can export the full analysis as a PDF from any lease detail page. The export includes risk scores, clause analysis, and recommendations.",
  },
  {
    question: "How does team collaboration work?",
    answer: "Team members in your organization can view and comment on all leases. Comments are threaded and organized by clause, making it easy to discuss specific terms.",
  },
  {
    question: "What happens to my data?",
    answer: "Your lease documents and analyses are stored securely and are only accessible to members of your organization. We use industry-standard encryption and security practices.",
  },
  {
    question: "Can I compare multiple leases?",
    answer: "Currently, each lease is analyzed individually. You can view all your leases in the Library page and compare them manually. Batch comparison features are coming soon.",
  },
  {
    question: "What if the analysis fails?",
    answer: "If analysis fails, try uploading the lease again. Make sure the PDF is readable and not corrupted. If issues persist, contact support.",
  },
  {
    question: "How do pricing tiers work?",
    answer: "We offer Free, Single, Team, and Broker plans with different analysis limits and features. Check the Billing page to see your current plan and upgrade options.",
  },
  {
    question: "Is there a mobile app?",
    answer: "LeaseAI is a web application that works on all devices. The interface is fully responsive and optimized for mobile browsers. Camera upload for document scanning is planned.",
  },
  {
    question: "What's the legal disclaimer?",
    answer: "LeaseAI provides document analysis for informational purposes only. It does not constitute legal advice. Always consult qualified legal counsel for lease decisions.",
  },
  {
    question: "Can I get support?",
    answer: "Email support is included on all plans. Team and Broker plans include priority chat support. Contact us via the Contact page for assistance.",
  },
];

export default function HelpPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const getCategoryContent = (categoryId: string) => {
    switch (categoryId) {
      case "getting-started":
        return gettingStartedGuide;
      case "upload-analysis":
        return uploadGuide;
      case "collaboration":
        return collaborationGuide;
      case "market-comparison":
        return marketComparisonGuide;
      case "api":
        return apiGuide;
      default:
        return [];
    }
  };

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedCategory && selectedCategory !== "faq") {
    const content = getCategoryContent(selectedCategory);
    const category = helpCategories.find((c) => c.id === selectedCategory);
    const Icon = category?.icon || BookOpen;

    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <button
          onClick={() => setSelectedCategory(null)}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Help Center
        </button>

        {selectedCategory === "api" && (
          <div className="mb-6 p-4 bg-sky-50 border border-sky-200 rounded-lg">
            <Link
              href="/dashboard/help/api-docs"
              className="inline-flex items-center gap-2 text-sky-700 font-medium hover:text-sky-800"
            >
              <Code2 className="w-5 h-5" />
              View full OpenAPI / Swagger documentation
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-12 h-12 ${category?.bgColor} flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${category?.color}`} />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-stone-900 heading-font">
                {category?.title}
              </h1>
              <p className="text-stone-500 mt-1">{category?.description}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {content.map((item: { title: string; content: string }, index: number) => (
            <div key={index} className="bg-white border border-stone-200 p-6">
              <h2 className="text-xl font-semibold text-stone-900 mb-3 heading-font">
                {index + 1}. {item.title}
              </h2>
              <p className="text-stone-600 leading-relaxed">{item.content}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (selectedCategory === "faq") {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <button
          onClick={() => setSelectedCategory(null)}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Help Center
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-stone-50 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-stone-600" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-stone-900 heading-font">
                Frequently Asked Questions
              </h1>
              <p className="text-stone-500 mt-1">Find answers to common questions</p>
            </div>
          </div>

          <div className="relative mt-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-stone-200 bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
              <div key={index} className="bg-white border border-stone-200 p-6">
                <h3 className="text-lg font-semibold text-stone-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-stone-600 leading-relaxed">{faq.answer}</p>
              </div>
            ))
          ) : (
            <div className="bg-white border border-stone-200 p-8 text-center">
              <p className="text-stone-500">No FAQs found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-12">
        <h1 className="text-4xl font-semibold text-stone-900 mb-4 heading-font">
          Help Center
        </h1>
        <p className="text-lg text-stone-600">
          Everything you need to know about using LeaseAI
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {helpCategories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className="bg-white border border-stone-200 p-6 text-left hover:border-stone-300 hover:shadow-sm transition-all group"
            >
              <div className={`w-12 h-12 ${category.bgColor} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-6 h-6 ${category.color}`} />
              </div>
              <h3 className="text-xl font-semibold text-stone-900 mb-2 heading-font">
                {category.title}
              </h3>
              <p className="text-stone-500 text-sm mb-4">{category.description}</p>
              <div className="flex items-center text-blue-600 text-sm font-medium">
                Learn more
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-12 bg-blue-50 border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-stone-900 mb-2">
          Still need help?
        </h3>
        <p className="text-stone-600 mb-4">
          Can't find what you're looking for? Contact our support team.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          Contact Support
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
