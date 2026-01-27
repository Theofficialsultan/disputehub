"use client";

import { useState } from "react";
import {
  HelpCircle,
  BookOpen,
  MessageCircle,
  Video,
  FileText,
  Mail,
  Phone,
  Search,
  ChevronDown,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FAQ_CATEGORIES = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Sparkles,
    questions: [
      {
        q: "How do I create my first dispute case?",
        a: "Click the 'New Dispute' button on the dashboard, choose your dispute type, and our AI will guide you through the process step by step. You'll provide details about your situation, and we'll help generate the necessary legal documents.",
      },
      {
        q: "What types of disputes can DisputeHub help with?",
        a: "DisputeHub specializes in consumer rights, employment disputes, landlord-tenant issues, contract disputes, and general civil matters. Our AI is trained on UK law and can assist with most non-criminal legal disputes.",
      },
      {
        q: "Is my information secure?",
        a: "Yes! We use bank-level encryption (AES-256) for all data. Your case information is stored securely and never shared with third parties without your explicit consent. We're fully GDPR compliant.",
      },
    ],
  },
  {
    id: "documents",
    title: "Documents & Generation",
    icon: FileText,
    questions: [
      {
        q: "How does AI document generation work?",
        a: "Our AI analyzes your case details and automatically generates professional, court-ready documents. The AI considers UK legal standards, proper formatting, and includes all necessary legal language. Documents are reviewed for accuracy before delivery.",
      },
      {
        q: "Can I edit generated documents?",
        a: "Currently, documents are generated as final PDFs. If you need changes, you can regenerate the document with updated information or contact support for manual adjustments.",
      },
      {
        q: "What happens if document generation fails?",
        a: "The system automatically retries up to 2 times. If it still fails, you'll see a 'Retry' button. If issues persist, contact our support team who can manually assist.",
      },
    ],
  },
  {
    id: "deadlines",
    title: "Deadlines & Timeline",
    icon: BookOpen,
    questions: [
      {
        q: "How are deadlines calculated?",
        a: "Deadlines are automatically calculated based on UK legal standards (typically 14 days for responses). The system tracks these and sends reminders. You can view all deadlines on the Timeline page.",
      },
      {
        q: "What happens when a deadline is missed?",
        a: "The system automatically generates a follow-up letter and sets a new deadline. You'll be notified, and the timeline will show the missed deadline event.",
      },
      {
        q: "Can I change deadline dates?",
        a: "Deadlines are system-calculated for legal accuracy. If you need to extend or modify a deadline, contact support.",
      },
    ],
  },
  {
    id: "billing",
    title: "Billing & Plans",
    icon: MessageCircle,
    questions: [
      {
        q: "How much does DisputeHub cost?",
        a: "We offer a free tier with basic features, and paid plans starting at £9.99/month. Professional plans include unlimited cases, priority AI generation, and lawyer review options.",
      },
      {
        q: "Can I upgrade or downgrade my plan?",
        a: "Yes! You can change your plan anytime from Settings > Subscription. Changes take effect immediately, and billing is prorated.",
      },
      {
        q: "Do you offer refunds?",
        a: "We offer a 30-day money-back guarantee for new subscriptions. If you're not satisfied, contact support for a full refund.",
      },
    ],
  },
];

const RESOURCES = [
  {
    title: "Video Tutorials",
    description: "Watch step-by-step guides",
    icon: Video,
    color: "from-purple-500 to-pink-500",
    items: [
      "Getting Started with DisputeHub",
      "Creating Your First Case",
      "Understanding AI Document Generation",
      "Managing Deadlines and Follow-ups",
    ],
  },
  {
    title: "Documentation",
    description: "Detailed guides and references",
    icon: BookOpen,
    color: "from-indigo-500 to-cyan-500",
    items: [
      "User Guide (PDF)",
      "Legal Process Overview",
      "Document Types Explained",
      "API Documentation",
    ],
  },
  {
    title: "Community Forum",
    description: "Connect with other users",
    icon: MessageCircle,
    color: "from-emerald-500 to-teal-500",
    items: [
      "Ask Questions",
      "Share Success Stories",
      "Feature Requests",
      "Best Practices",
    ],
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-indigo-500/10 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-start gap-3 text-left hover:text-indigo-300 transition-colors group"
      >
        {isOpen ? (
          <ChevronDown className="h-5 w-5 text-indigo-400 mt-0.5 shrink-0" />
        ) : (
          <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-indigo-400 mt-0.5 shrink-0 transition-colors" />
        )}
        <span className="font-medium text-white">{question}</span>
      </button>
      {isOpen && (
        <div className="pb-4 pl-8 pr-4">
          <p className="text-slate-400 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredCategories = FAQ_CATEGORIES.map((category) => ({
    ...category,
    questions: category.questions.filter(
      (q) =>
        q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.questions.length > 0);

  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-6 glow-purple">
          <HelpCircle className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-white mb-3 bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
          How can we help?
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto">
          Find answers, learn about features, or get in touch with our support team
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-16 rounded-2xl glass-strong border-indigo-500/20 text-white placeholder:text-slate-500 focus:border-indigo-500/50 text-lg"
          />
        </div>
      </div>

      {/* Contact Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button className="p-6 rounded-3xl glass-strong border border-indigo-500/20 hover:border-indigo-500/40 hover:glow-purple transition-all text-left group">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 w-fit mb-4">
            <MessageCircle className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-300 transition-colors">
            Live Chat
          </h3>
          <p className="text-sm text-slate-400 mb-3">
            Chat with our support team
          </p>
          <span className="text-sm text-indigo-400 font-medium">Start Chat →</span>
        </button>

        <button className="p-6 rounded-3xl glass-strong border border-indigo-500/20 hover:border-indigo-500/40 hover:glow-purple transition-all text-left group">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 w-fit mb-4">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-300 transition-colors">
            Email Support
          </h3>
          <p className="text-sm text-slate-400 mb-3">
            support@disputehub.ai
          </p>
          <span className="text-sm text-emerald-400 font-medium">Send Email →</span>
        </button>

        <button className="p-6 rounded-3xl glass-strong border border-indigo-500/20 hover:border-indigo-500/40 hover:glow-purple transition-all text-left group">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 w-fit mb-4">
            <Phone className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-orange-300 transition-colors">
            Phone Support
          </h3>
          <p className="text-sm text-slate-400 mb-3">
            +44 20 1234 5678
          </p>
          <span className="text-sm text-orange-400 font-medium">Call Us →</span>
        </button>
      </div>

      {/* Resources */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Learning Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {RESOURCES.map((resource) => {
            const Icon = resource.icon;
            return (
              <div
                key={resource.title}
                className="p-6 rounded-3xl glass-strong border border-indigo-500/20 hover:border-indigo-500/40 hover:glow-purple transition-all"
              >
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${resource.color} w-fit mb-4`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {resource.title}
                </h3>
                <p className="text-sm text-slate-400 mb-4">{resource.description}</p>
                <ul className="space-y-2">
                  {resource.items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-300 hover:text-indigo-300 transition-colors cursor-pointer">
                      {resource.icon === Video && <Play className="h-3 w-3" />}
                      {resource.icon === BookOpen && <FileText className="h-3 w-3" />}
                      {resource.icon === MessageCircle && <ExternalLink className="h-3 w-3" />}
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.id}
                className="rounded-3xl glass-strong border border-indigo-500/20 overflow-hidden"
              >
                <div className="p-6 border-b border-indigo-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">
                      {category.title}
                    </h3>
                  </div>
                </div>
                <div className="p-6">
                  <div className="space-y-0">
                    {category.questions.map((q, i) => (
                      <FAQItem key={i} question={q.q} answer={q.a} />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400">No results found for "{searchQuery}"</p>
            <Button
              onClick={() => setSearchQuery("")}
              variant="outline"
              className="mt-4 border-indigo-500/30 text-white hover:bg-indigo-500/10"
            >
              Clear Search
            </Button>
          </div>
        )}
      </div>

      {/* Still need help */}
      <div className="rounded-3xl p-8 glass-strong border border-indigo-500/20 text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Still need help?</h3>
        <p className="text-slate-400 mb-6">
          Our support team is here to assist you
        </p>
        <Button
          size="lg"
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/25 rounded-2xl"
        >
          <MessageCircle className="mr-2 h-5 w-5" />
          Contact Support
        </Button>
      </div>
    </div>
  );
}
