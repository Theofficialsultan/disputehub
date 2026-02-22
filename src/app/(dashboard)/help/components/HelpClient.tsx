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
  Download,
  Scale,
  Shield,
  Clock,
  CheckCircle,
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
        a: "DisputeHub specializes in consumer rights, employment disputes, landlord-tenant issues, contract disputes, noise complaints, neighbour disputes, and general civil matters. Our AI is trained on UK law and can assist with most non-criminal legal disputes.",
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
        a: "Our AI analyzes your case details and automatically generates professional, legally-compliant documents. The AI considers UK legal standards, proper formatting, and includes all necessary legal language. Documents are reviewed for accuracy before delivery.",
      },
      {
        q: "What types of documents can be generated?",
        a: "We generate Letters Before Action (LBA), formal complaints, legal notices, response letters, follow-up correspondence, and tribunal/court form guidance. Each document type is tailored to your specific dispute and jurisdiction.",
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
    icon: Clock,
    questions: [
      {
        q: "How are deadlines calculated?",
        a: "Deadlines are automatically calculated based on UK legal standards (typically 14 days for responses). The system tracks these and sends reminders. You can view all deadlines on the Dashboard calendar.",
      },
      {
        q: "What happens when a deadline is missed?",
        a: "The system automatically generates a follow-up letter and sets a new deadline. You'll be notified, and the timeline will show the missed deadline event.",
      },
      {
        q: "Will I get reminders?",
        a: "Yes! You'll receive email notifications before deadlines. You can customize notification preferences in Settings > Notifications.",
      },
    ],
  },
  {
    id: "legal",
    title: "Legal Information",
    icon: Scale,
    questions: [
      {
        q: "Is DisputeHub a law firm?",
        a: "No, DisputeHub is an AI-powered legal technology platform. We help you understand your rights and generate documents, but we are not a law firm and do not provide legal advice. For complex cases, we recommend consulting with a qualified solicitor.",
      },
      {
        q: "Are the generated documents legally valid?",
        a: "Yes, our documents follow UK legal standards and are suitable for sending to opposing parties. However, court submissions may require additional steps. The documents serve as a strong foundation for your case.",
      },
      {
        q: "Can I use these documents in court?",
        a: "Our documents can be used as evidence and correspondence in legal proceedings. However, formal court submissions often have specific requirements. We recommend reviewing court guidelines or consulting a solicitor for tribunal/court cases.",
      },
    ],
  },
];

const DOCUMENTATION = [
  {
    title: "User Guide",
    description: "Complete guide to using DisputeHub",
    icon: BookOpen,
    type: "PDF",
    size: "2.4 MB",
  },
  {
    title: "Letter Before Action Guide",
    description: "Understanding LBAs and their importance",
    icon: FileText,
    type: "PDF",
    size: "1.1 MB",
  },
  {
    title: "UK Consumer Rights Overview",
    description: "Your rights under the Consumer Rights Act 2015",
    icon: Shield,
    type: "PDF",
    size: "1.8 MB",
  },
  {
    title: "Small Claims Court Guide",
    description: "How to pursue claims under £10,000",
    icon: Scale,
    type: "PDF",
    size: "2.1 MB",
  },
  {
    title: "Employment Tribunal Guide",
    description: "Employment disputes and ACAS process",
    icon: FileText,
    type: "PDF",
    size: "1.5 MB",
  },
  {
    title: "Landlord-Tenant Disputes",
    description: "Deposit disputes and housing rights",
    icon: FileText,
    type: "PDF",
    size: "1.3 MB",
  },
];

const VIDEO_TUTORIALS = [
  {
    title: "Getting Started with DisputeHub",
    duration: "5:32",
    description: "Learn the basics of creating your first case",
  },
  {
    title: "Creating Your First Case",
    duration: "8:15",
    description: "Step-by-step walkthrough of the case creation process",
  },
  {
    title: "Understanding AI Document Generation",
    duration: "6:48",
    description: "How our AI creates professional legal documents",
  },
  {
    title: "Managing Deadlines and Follow-ups",
    duration: "4:23",
    description: "Track responses and automate follow-up letters",
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-slate-200 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-start gap-3 text-left hover:text-blue-600 transition-colors group"
      >
        {isOpen ? (
          <ChevronDown className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
        ) : (
          <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-blue-600 mt-0.5 shrink-0 transition-colors" />
        )}
        <span className="font-medium text-slate-900">{question}</span>
      </button>
      {isOpen && (
        <div className="pb-4 pl-8 pr-4">
          <p className="text-slate-500 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}

export default function HelpClient() {
  const [searchQuery, setSearchQuery] = useState("");

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
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-600 mb-6">
          <HelpCircle className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-blue-600 mb-3">
          How can we help?
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl mx-auto">
          Find answers, learn about features, or get in touch with our support team
        </p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
          <Input
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-16 rounded-2xl card-elevated border-slate-200 text-slate-900 placeholder:text-slate-500 focus:border-blue-500 text-lg"
          />
        </div>
      </div>

      {/* Contact Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a 
          href="mailto:support@disputehub.ai"
          className="p-6 rounded-3xl card-elevated border border-slate-200 hover:border-slate-300 transition-all text-left group"
        >
          <div className="p-3 rounded-2xl bg-emerald-100 w-fit mb-4">
            <Mail className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">
            Email Support
          </h3>
          <p className="text-sm text-slate-500 mb-3">
            support@disputehub.ai
          </p>
          <span className="text-sm text-emerald-600 font-medium">Send Email →</span>
        </a>

        <button className="p-6 rounded-3xl card-elevated border border-slate-200 hover:border-slate-300 transition-all text-left group">
          <div className="p-3 rounded-2xl bg-blue-100 w-fit mb-4">
            <MessageCircle className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
            Live Chat
          </h3>
          <p className="text-sm text-slate-500 mb-3">
            Available 9am - 6pm GMT
          </p>
          <span className="text-sm text-blue-600 font-medium">Start Chat →</span>
        </button>

        <button className="p-6 rounded-3xl card-elevated border border-slate-200 hover:border-slate-300 transition-all text-left group relative">
          <div className="absolute top-4 right-4 px-2 py-1 rounded-lg bg-orange-50 text-orange-700 border border-orange-200 text-xs font-medium">
            Coming Soon
          </div>
          <div className="p-3 rounded-2xl bg-orange-100 w-fit mb-4">
            <Phone className="h-6 w-6 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-orange-600 transition-colors">
            Phone Support
          </h3>
          <p className="text-sm text-slate-500 mb-3">
            Pro plan feature
          </p>
          <span className="text-sm text-orange-600 font-medium">Upgrade to Pro →</span>
        </button>
      </div>

      {/* Documentation Section */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-blue-600" />
          Documentation & Guides
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DOCUMENTATION.map((doc) => {
            const Icon = doc.icon;
            return (
              <div
                key={doc.title}
                className="p-5 rounded-2xl card-elevated border border-slate-200 hover:border-slate-300 transition-all group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 rounded-xl bg-blue-50">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{doc.type}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500">{doc.size}</span>
                  </div>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                  {doc.title}
                </h3>
                <p className="text-sm text-slate-500 mb-3">{doc.description}</p>
                <div className="flex items-center gap-2 text-blue-600 text-sm font-medium">
                  <Download className="h-4 w-4" />
                  Download PDF
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Video Tutorials */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Video className="h-6 w-6 text-purple-600" />
          Video Tutorials
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {VIDEO_TUTORIALS.map((video) => (
            <div
              key={video.title}
              className="p-5 rounded-2xl card-elevated border border-slate-200 hover:border-slate-300 transition-all group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="p-4 rounded-xl bg-purple-50 shrink-0">
                  <Play className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                      {video.title}
                    </h3>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                      {video.duration}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">{video.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-slate-500 text-sm mt-4">
          Video tutorials coming soon! We're working on comprehensive guides.
        </p>
      </div>

      {/* FAQ */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCategories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.id}
                className="rounded-3xl card-elevated border border-slate-200 overflow-hidden"
              >
                <div className="p-6 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-600">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">
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
            <p className="text-slate-500">No results found for "{searchQuery}"</p>
            <Button
              onClick={() => setSearchQuery("")}
              variant="outline"
              className="mt-4 border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              Clear Search
            </Button>
          </div>
        )}
      </div>

      {/* Quick Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl card-elevated border border-emerald-200">
          <CheckCircle className="h-8 w-8 text-emerald-600 mb-4" />
          <h3 className="font-semibold text-slate-900 mb-2">Be Detailed</h3>
          <p className="text-sm text-slate-500">
            The more details you provide during case creation, the better your AI-generated documents will be.
          </p>
        </div>
        <div className="p-6 rounded-2xl card-elevated border border-slate-200">
          <Clock className="h-8 w-8 text-blue-600 mb-4" />
          <h3 className="font-semibold text-slate-900 mb-2">Meet Deadlines</h3>
          <p className="text-sm text-slate-500">
            Response deadlines are crucial in legal disputes. Keep an eye on your dashboard calendar.
          </p>
        </div>
        <div className="p-6 rounded-2xl card-elevated border border-purple-200">
          <FileText className="h-8 w-8 text-purple-600 mb-4" />
          <h3 className="font-semibold text-slate-900 mb-2">Keep Records</h3>
          <p className="text-sm text-slate-500">
            Upload evidence and keep all correspondence documented. Use the export feature for backups.
          </p>
        </div>
      </div>

      {/* Still need help */}
      <div className="rounded-3xl p-8 card-elevated border border-slate-200 text-center">
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Still need help?</h3>
        <p className="text-slate-500 mb-6">
          Our support team is here to assist you
        </p>
        <Button
          asChild
          size="lg"
          className="bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-2xl"
        >
          <a href="mailto:support@disputehub.ai">
            <Mail className="mr-2 h-5 w-5" />
            Contact Support
          </a>
        </Button>
      </div>
    </div>
  );
}
