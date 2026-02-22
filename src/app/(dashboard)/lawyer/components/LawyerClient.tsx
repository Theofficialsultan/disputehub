"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Scale,
  Star,
  CheckCircle,
  FileText,
  Award,
  ArrowRight,
  Briefcase,
  Sparkles,
  Clock,
  Shield,
  MessageSquare,
  Phone,
  Video,
  Users,
  Search,
  ChevronRight,
  ChevronDown,
  Plus,
  ArrowUpRight,
  MapPin,
  Gavel,
  Home,
  CreditCard,
  Car,
  Baby,
  Landmark,
  HeartHandshake,
  GraduationCap,
  Building2,
  Banknote,
  AlertTriangle,
  Send,
  X,
  Loader2,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";

interface LawyerData {
  disputes: Array<{
    id: string;
    title: string;
    type: string;
    lifecycleStatus: string;
    createdAt: Date;
    updatedAt: Date;
    description: string;
    caseStrategy: {
      disputeType: string | null;
      desiredOutcome: string | null;
    } | null;
    documentPlan: {
      complexity: string;
      documents: Array<{ status: string }>;
    } | null;
  }>;
}

const SPECIALIZATIONS = [
  { id: "employment", label: "Employment", icon: Briefcase, color: "bg-blue-50 text-blue-600 border-blue-100", desc: "Unfair dismissal, unpaid wages, discrimination, redundancy" },
  { id: "housing", label: "Housing & Property", icon: Home, color: "bg-amber-50 text-amber-600 border-amber-100", desc: "Disrepair, eviction, deposits, tenancy disputes" },
  { id: "consumer", label: "Consumer Rights", icon: CreditCard, color: "bg-emerald-50 text-emerald-600 border-emerald-100", desc: "Faulty goods, mis-selling, refunds, contracts" },
  { id: "debt", label: "Debt & Finance", icon: Banknote, color: "bg-purple-50 text-purple-600 border-purple-100", desc: "County court claims, CCJs, enforcement, insolvency" },
  { id: "contract", label: "Contract Disputes", icon: FileText, color: "bg-indigo-50 text-indigo-600 border-indigo-100", desc: "Breach of contract, payment disputes, freelancer claims" },
  { id: "family", label: "Family Law", icon: Baby, color: "bg-pink-50 text-pink-600 border-pink-100", desc: "Divorce, custody, child support, domestic abuse" },
  { id: "immigration", label: "Immigration", icon: Landmark, color: "bg-sky-50 text-sky-600 border-sky-100", desc: "Visa appeals, asylum, settlement, deportation" },
  { id: "personal_injury", label: "Personal Injury", icon: HeartHandshake, color: "bg-red-50 text-red-600 border-red-100", desc: "Accidents, workplace injuries, medical negligence" },
];

const HOW_IT_WORKS = [
  { step: 1, title: "Select Your Case", desc: "Choose the case you need legal help with from your DisputeHub dashboard" },
  { step: 2, title: "Describe Your Needs", desc: "Tell us what kind of help you need - review, consultation, or full representation" },
  { step: 3, title: "Get Matched", desc: "We match you with a qualified solicitor specialising in your dispute type" },
  { step: 4, title: "Fixed-Fee Quote", desc: "Receive a transparent, fixed-fee quote before committing to anything" },
];

const PRICING = [
  {
    name: "Document Review",
    price: "From £49",
    desc: "Have a qualified solicitor review your AI-generated documents",
    features: ["Professional review of all case documents", "Written feedback & suggestions", "Confidence your documents are court-ready", "48-hour turnaround"],
    popular: false,
  },
  {
    name: "Consultation",
    price: "From £99",
    desc: "30-minute video or phone call with a specialist solicitor",
    features: ["Expert legal advice on your case", "Strategy recommendations", "Assessment of case strength", "Follow-up summary email", "Option to proceed with representation"],
    popular: true,
  },
  {
    name: "Full Representation",
    price: "Custom",
    desc: "End-to-end legal representation for your dispute",
    features: ["Dedicated solicitor assigned", "All court filings handled", "Negotiation on your behalf", "Regular case updates", "No win, no fee options*"],
    popular: false,
  },
];

const FAQ = [
  { q: "How are lawyers vetted?", a: "All lawyers on our platform are regulated by the Solicitors Regulation Authority (SRA) and have been verified by our team. We check qualifications, practising certificates, insurance, and client reviews." },
  { q: "What does 'No win, no fee' mean?", a: "Also known as a Conditional Fee Agreement (CFA), this means you only pay your lawyer's fees if your case is successful. If you lose, you won't owe legal fees. Terms and conditions apply." },
  { q: "Can I use my AI-generated documents?", a: "Yes! Your DisputeHub documents are automatically shared with your matched lawyer. They can review, enhance, and file them on your behalf." },
  { q: "How quickly will I be matched?", a: "Most users are matched with a suitable lawyer within 24 hours. Urgent cases can be fast-tracked for same-day matching." },
  { q: "What if I'm not happy with my lawyer?", a: "You can request a different lawyer at any time. We'll re-match you free of charge and ensure a smooth handover of your case files." },
];

function humanizeType(type: string): string {
  return type.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
}

export default function LawyerClient({ disputes }: LawyerData) {
  const [selectedCase, setSelectedCase] = useState<string>("");
  const [selectedSpec, setSelectedSpec] = useState<string>("");
  const [helpType, setHelpType] = useState<string>("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleSubmit = async () => {
    if (!selectedCase) { toast.error("Please select a case"); return; }
    if (!helpType) { toast.error("Please select the type of help you need"); return; }

    setIsSubmitting(true);
    // Simulate submission
    await new Promise((r) => setTimeout(r, 1500));
    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success("Request submitted! We'll match you with a lawyer within 24 hours.");
  };

  const activeCases = disputes.filter((d) => d.lifecycleStatus !== "CLOSED");

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">Find a Lawyer</h1>
          <p className="text-slate-400 text-sm mt-1">Connect with qualified UK solicitors to review, advise, or represent your case.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <BadgeCheck className="h-3.5 w-3.5" /> SRA Regulated
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Shield className="h-3.5 w-3.5" /> Vetted & Verified
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-600 rounded-2xl p-5 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500 rounded-full -translate-y-4 translate-x-4 opacity-30" />
          <div className="relative z-10">
            <p className="text-[13px] font-medium text-blue-100 mb-2">Network Size</p>
            <p className="text-[36px] font-bold leading-none">500+</p>
            <span className="text-[11px] text-blue-200 mt-2 block">Qualified solicitors</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
          <p className="text-[13px] font-medium text-slate-500 mb-2">Avg. Match Time</p>
          <p className="text-[36px] font-bold text-slate-900 leading-none">&lt;24h</p>
          <span className="text-[11px] text-slate-400 mt-2 block">Matched to a lawyer</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
          <p className="text-[13px] font-medium text-slate-500 mb-2">Satisfaction</p>
          <p className="text-[36px] font-bold text-slate-900 leading-none flex items-center gap-1">4.8 <Star className="h-5 w-5 text-amber-400 fill-amber-400" /></p>
          <span className="text-[11px] text-slate-400 mt-2 block">Average rating</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
          <p className="text-[13px] font-medium text-slate-500 mb-2">Success Rate</p>
          <p className="text-[36px] font-bold text-slate-900 leading-none">89%</p>
          <span className="text-[11px] text-slate-400 mt-2 block">Cases resolved</span>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <h2 className="text-[16px] font-bold text-slate-900 mb-5">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HOW_IT_WORKS.map((step) => (
            <div key={step.step} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-[13px] font-bold">{step.step}</div>
              <div>
                <p className="text-[13px] font-bold text-slate-900 mb-0.5">{step.title}</p>
                <p className="text-[12px] text-slate-400 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content: Request Form + Specialisations */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Request Form - 3 cols */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 p-6">
          <h2 className="text-[16px] font-bold text-slate-900 mb-1">Request a Lawyer</h2>
          <p className="text-[12px] text-slate-400 mb-5">Fill in the details below and we'll match you with the right solicitor.</p>

          {isSubmitted ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Request Submitted</h3>
              <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">We'll match you with a qualified solicitor within 24 hours. You'll receive a notification when your match is ready.</p>
              <button onClick={() => { setIsSubmitted(false); setSelectedCase(""); setHelpType(""); setMessage(""); }} className="text-sm text-blue-600 font-semibold hover:text-blue-700">Submit Another Request</button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Select Case */}
              <div>
                <label className="text-[12px] font-semibold text-slate-700 uppercase tracking-wider mb-2 block">1. Select a Case</label>
                {activeCases.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
                    <p className="text-[13px] text-slate-400 mb-2">No active cases</p>
                    <Link href="/disputes/start" className="text-[12px] text-blue-600 font-semibold hover:text-blue-700">Start a New Case</Link>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                    {activeCases.map((dispute) => {
                      const isSelected = selectedCase === dispute.id;
                      const completedDocs = dispute.documentPlan?.documents.filter((d) => d.status === "COMPLETED").length || 0;
                      return (
                        <button
                          key={dispute.id}
                          onClick={() => setSelectedCase(dispute.id)}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${isSelected ? "border-blue-300 bg-blue-50/50 ring-2 ring-blue-100" : "border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/50"}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-blue-600" : "bg-slate-100"}`}>
                                <Scale className={`h-4 w-4 ${isSelected ? "text-white" : "text-slate-500"}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-[13px] font-semibold truncate ${isSelected ? "text-blue-700" : "text-slate-900"}`}>{dispute.title}</p>
                                <p className="text-[11px] text-slate-400 capitalize">{humanizeType(dispute.type)}</p>
                              </div>
                            </div>
                            {completedDocs > 0 && (
                              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex-shrink-0">{completedDocs} docs</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Type of Help */}
              <div>
                <label className="text-[12px] font-semibold text-slate-700 uppercase tracking-wider mb-2 block">2. Type of Help Needed</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: "review", label: "Document Review", icon: FileText, desc: "Review my AI docs" },
                    { id: "consultation", label: "Consultation", icon: Video, desc: "Talk to a lawyer" },
                    { id: "representation", label: "Representation", icon: Gavel, desc: "Full legal help" },
                  ].map((opt) => {
                    const isSelected = helpType === opt.id;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setHelpType(opt.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${isSelected ? "border-blue-300 bg-blue-50/50 ring-2 ring-blue-100" : "border-slate-200/80 hover:border-slate-300"}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${isSelected ? "bg-blue-600" : "bg-slate-100"}`}>
                          <Icon className={`h-4 w-4 ${isSelected ? "text-white" : "text-slate-500"}`} />
                        </div>
                        <p className={`text-[13px] font-semibold ${isSelected ? "text-blue-700" : "text-slate-900"}`}>{opt.label}</p>
                        <p className="text-[11px] text-slate-400">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Additional Message */}
              <div>
                <label className="text-[12px] font-semibold text-slate-700 uppercase tracking-wider mb-2 block">3. Additional Details (Optional)</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe what you need help with, any deadlines, or specific concerns..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedCase || !helpType}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                ) : (
                  <><Send className="h-4 w-4" /> Request a Lawyer</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Specialisations - 2 cols */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
            <h2 className="text-[16px] font-bold text-slate-900 mb-4">Specialisations</h2>
            <div className="space-y-2">
              {SPECIALIZATIONS.map((spec) => {
                const Icon = spec.icon;
                const isSelected = selectedSpec === spec.id;
                return (
                  <button
                    key={spec.id}
                    onClick={() => setSelectedSpec(isSelected ? "" : spec.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${isSelected ? "border-blue-200 bg-blue-50/30" : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${spec.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900">{spec.label}</p>
                        {isSelected && <p className="text-[11px] text-slate-400 mt-0.5">{spec.desc}</p>}
                      </div>
                      <ChevronRight className={`h-4 w-4 text-slate-300 transition-transform ${isSelected ? "rotate-90" : ""}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Trust badges */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <h3 className="text-[14px] font-bold text-slate-900 mb-3">Our Guarantee</h3>
            <div className="space-y-3">
              {[
                { icon: Shield, text: "All lawyers SRA regulated & insured" },
                { icon: BadgeCheck, text: "Vetted with minimum 5 years experience" },
                { icon: Banknote, text: "Transparent fixed-fee pricing" },
                { icon: Users, text: "Free re-matching if unsatisfied" },
                { icon: Clock, text: "24-hour response guarantee" },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-3.5 w-3.5 text-emerald-600" />
                    </div>
                    <p className="text-[12px] text-slate-600">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div>
        <h2 className="text-[18px] font-bold text-slate-900 mb-4">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRICING.map((plan) => (
            <div key={plan.name} className={`bg-white rounded-2xl border p-6 relative ${plan.popular ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-200/80"}`}>
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider">Most Popular</span>
              )}
              <h3 className="text-[15px] font-bold text-slate-900 mb-1">{plan.name}</h3>
              <p className="text-[28px] font-bold text-slate-900 mb-1">{plan.price}</p>
              <p className="text-[12px] text-slate-400 mb-4">{plan.desc}</p>
              <ul className="space-y-2 mb-5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-slate-600">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all ${plan.popular ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
                Get Started
              </button>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-3 text-center">*No win, no fee subject to eligibility. Terms apply.</p>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <h2 className="text-[16px] font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
        <div className="space-y-1">
          {FAQ.map((item, i) => (
            <div key={i} className="border-b border-slate-100 last:border-0">
              <button
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                className="w-full flex items-center justify-between py-3 text-left"
              >
                <p className="text-[13px] font-semibold text-slate-900 pr-4">{item.q}</p>
                <ChevronDown className={`h-4 w-4 text-slate-400 flex-shrink-0 transition-transform ${expandedFaq === i ? "rotate-180" : ""}`} />
              </button>
              {expandedFaq === i && (
                <p className="text-[12px] text-slate-500 pb-3 leading-relaxed pr-8">{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-blue-600 rounded-2xl p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500 rounded-full -translate-y-16 -translate-x-16 opacity-30" />
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-blue-500 rounded-full translate-y-12 translate-x-12 opacity-30" />
        <div className="relative z-10">
          <h3 className="text-2xl font-bold text-white mb-2">Not sure if you need a lawyer?</h3>
          <p className="text-blue-100 text-sm mb-6 max-w-lg mx-auto">Our AI can help you understand your legal position and generate documents. You can always escalate to a lawyer later.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/ai-chat" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-blue-600 font-semibold text-sm hover:bg-blue-50 transition-all">
              <Sparkles className="h-4 w-4" /> Ask AI First
            </Link>
            <Link href="/disputes/start" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 text-white font-semibold text-sm hover:bg-blue-800 border border-blue-500 transition-all">
              <Plus className="h-4 w-4" /> Start a Case
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
