import Link from "next/link";
import Image from "next/image";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Check,
  Star,
  Shield,
  Zap,
  FileText,
  MessageSquare,
  Clock,
  ChevronDown,
  Brain,
  Lock,
  BadgeCheck,
  BarChart3,
  Scale,
  Sparkles,
} from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/disputes");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8faff] via-[#eef2ff] to-[#e0e7ff] text-slate-900 overflow-hidden">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl mt-4 px-6 h-16 flex items-center justify-between border border-slate-200/60 shadow-soft">
            <div className="flex items-center gap-3">
              <img src="/logo-200.png" alt="DisputeHub" className="w-9 h-9 rounded-xl" />
              <span className="text-lg font-bold text-slate-900">DisputeHub</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">Features</a>
              <a href="#how-it-works" className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">How It Works</a>
              <a href="#pricing" className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">Pricing</a>
              <a href="#faq" className="text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">FAQ</a>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login" className="text-slate-600 hover:text-slate-900 transition-colors text-sm font-medium px-4 py-2 rounded-xl hover:bg-slate-100">
                Login
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 transition-all shadow-sm hover:shadow-md hover:shadow-blue-200"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-36 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
              Resolve Disputes
              <span className="block text-gradient-blue">
                With AI Precision
              </span>
            </h1>

            <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              AI platform that generates professional, court-ready legal documents. 
              From parking tickets to employment disputes, get expert-level documents in minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              >
                Start Your Free Case
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl border border-slate-200 bg-white text-slate-700 font-semibold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                See How It Works
              </a>
            </div>

            {/* Social Proof */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-blue-400 to-indigo-500 shadow-sm"
                    />
                  ))}
                </div>
                <span className="text-slate-500">
                  <span className="text-slate-900 font-semibold">2,500+</span> cases resolved
                </span>
              </div>
              <div className="flex items-center gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
                <span className="text-slate-500 ml-2">4.9/5 rating</span>
              </div>
            </div>
          </div>

          {/* Floating Cards Section - Like the Lucio reference */}
          <div className="relative max-w-5xl mx-auto">
            {/* Central Chat Card */}
            <div className="relative mx-auto max-w-lg card-elevated p-6 z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
                  New chat
                </div>
                <Sparkles className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-blue">
                  <Scale className="h-6 w-6 text-white" />
                </div>
              </div>
              <p className="text-center text-slate-600 text-sm mb-4">
                Describe your dispute and get AI-generated legal documents ready for court.
              </p>
              <div className="bg-slate-50 rounded-xl p-3 text-center text-sm text-slate-500 border border-slate-100">
                Analyzed 238 related rulings across 3 jurisdictions
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-3 bg-white rounded-full border border-slate-200 px-4 py-3 shadow-sm">
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <Scale className="h-3 w-3 text-white" />
                  </div>
                  <span className="text-slate-400 text-sm">Ask or search for anything...</span>
                </div>
              </div>
            </div>

            {/* Floating stat cards around the main card */}
            {/* Top-left: Success Rate */}
            <div className="absolute -left-4 top-4 card-elevated p-4 w-48 animate-float hidden lg:block" style={{ animationDelay: '0s' }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
                <span className="text-xs text-slate-400">...</span>
              </div>
              <div className="text-3xl font-bold text-slate-900">94%</div>
              <div className="text-xs text-slate-500">Success Rate</div>
            </div>

            {/* Top-right: Cases Won */}
            <div className="absolute -right-4 top-8 card-elevated p-4 w-52 animate-float hidden lg:block" style={{ animationDelay: '1s' }}>
              <div className="text-xs text-slate-500 mb-2">Case Resolution Rate</div>
              <div className="flex items-center gap-3">
                {/* Semi-circular gauge */}
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#2563eb" strokeWidth="3" strokeDasharray="78, 100" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-slate-900">78%</span>
                  </div>
                </div>
                <div className="text-xs text-slate-500">Clients</div>
              </div>
            </div>

            {/* Bottom-left: Risk Analysis */}
            <div className="absolute -left-8 bottom-12 card-elevated p-4 w-52 animate-float hidden lg:block" style={{ animationDelay: '2s' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-red-500" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-900">27</span>
                <span className="text-xs text-slate-500">Risk Factors<br/>Detected</span>
              </div>
            </div>

            {/* Bottom-right: Document Clarity */}
            <div className="absolute -right-4 bottom-4 card-elevated p-4 w-48 animate-float hidden lg:block" style={{ animationDelay: '3s' }}>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center">
                  <Check className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-xs text-slate-500">Document Clarity</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-900">54%</span>
                <span className="text-xs text-green-600">↑ 12%</span>
              </div>
              <span className="text-[10px] text-slate-400">since last year</span>
            </div>
          </div>

          {/* Book a Demo Button */}
          <div className="text-center mt-12">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all shadow-lg"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="relative z-10 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-slate-400 text-sm mb-8">Trusted by thousands across the UK</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            {['Consumer Rights', 'Employment Law', 'Landlord Disputes', 'Parking Appeals', 'Contract Issues'].map((item) => (
              <div key={item} className="text-lg font-semibold text-slate-300">{item}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-6">
              <Shield className="h-4 w-4" />
              Powerful Features
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Everything You Need to
              <span className="text-gradient-blue"> Win Your Case</span>
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Our AI-powered platform handles the complexities of legal disputes so you can focus on what matters.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "AI Case Analysis", desc: "Advanced AI analyzes your situation and identifies the strongest legal arguments for your case.", color: "blue" },
              { icon: FileText, title: "Professional Documents", desc: "Generate court-ready letters, complaints, and legal notices with proper formatting and legal language.", color: "indigo" },
              { icon: Clock, title: "Deadline Tracking", desc: "Never miss a response deadline with automatic reminders and timeline management.", color: "violet" },
              { icon: MessageSquare, title: "AI Legal Assistant", desc: "Chat with our AI to get guidance on your case, understand your rights, and plan your strategy.", color: "sky" },
              { icon: Lock, title: "Bank-Level Security", desc: "Your data is encrypted with AES-256 and never shared. Complete privacy guaranteed.", color: "emerald" },
              { icon: BadgeCheck, title: "UK Law Expertise", desc: "Trained on UK legislation including Consumer Rights Act, Employment Law, and more.", color: "amber" },
            ].map((feature, i) => {
              const Icon = feature.icon;
              const colorMap: Record<string, { bg: string; icon: string }> = {
                blue: { bg: "bg-blue-50", icon: "bg-blue-600" },
                indigo: { bg: "bg-indigo-50", icon: "bg-indigo-600" },
                violet: { bg: "bg-violet-50", icon: "bg-violet-600" },
                sky: { bg: "bg-sky-50", icon: "bg-sky-600" },
                emerald: { bg: "bg-emerald-50", icon: "bg-emerald-600" },
                amber: { bg: "bg-amber-50", icon: "bg-amber-600" },
              };
              const c = colorMap[feature.color];
              return (
                <div key={i} className="card-elevated p-8 group">
                  <div className={`w-12 h-12 rounded-2xl ${c.icon} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-sm">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              Simple Process
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              How It Works
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Three simple steps to get your professional legal documents
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Tell Us Your Story", desc: "Describe your dispute in your own words. Our AI assistant will ask the right questions to understand your case fully." },
              { step: "02", title: "AI Builds Your Case", desc: "Our AI analyzes your situation, identifies relevant laws, and creates a winning strategy tailored to your specific dispute." },
              { step: "03", title: "Get Your Documents", desc: "Receive professionally formatted, legally-sound documents ready to send. Track responses and manage deadlines automatically." },
            ].map((item, i) => (
              <div key={i} className="card-elevated p-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-6 shadow-blue">
                  {i + 1}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 border border-amber-100 text-amber-600 text-sm font-medium mb-6">
              <Star className="h-4 w-4" />
              Success Stories
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              What Our Users Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Sarah M.", role: "Consumer Dispute", text: "I got my £800 back from an airline after they cancelled my flight. DisputeHub's letter was incredibly professional and they responded within a week!", rating: 5 },
              { name: "James T.", role: "Landlord Dispute", text: "My landlord was refusing to return my deposit. The Letter Before Action generated by DisputeHub worked perfectly - got my full £1,200 back.", rating: 5 },
              { name: "Emma L.", role: "Parking Appeal", text: "Won my parking ticket appeal thanks to the detailed legal arguments in the letter. Saved me £100 and hours of stress!", rating: 5 },
            ].map((testimonial, i) => (
              <div key={i} className="card-elevated p-8">
                <div className="flex gap-1 mb-4">
                  {Array(testimonial.rating).fill(0).map((_, j) => (
                    <Star key={j} className="h-4 w-4 text-amber-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-600 mb-6 leading-relaxed text-sm">"{testimonial.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500" />
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{testimonial.name}</div>
                    <div className="text-xs text-slate-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-100 text-green-600 text-sm font-medium mb-6">
              <BadgeCheck className="h-4 w-4" />
              Simple Pricing
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Start Free, Pay When Ready
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              No subscriptions. No hidden fees. Just simple, transparent pricing.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free */}
            <div className="card-elevated p-8">
              <div className="text-sm font-semibold text-slate-500 mb-2">Free</div>
              <div className="text-5xl font-bold text-slate-900 mb-4">£0</div>
              <p className="text-slate-500 mb-8">Perfect for trying out DisputeHub</p>
              <div className="space-y-3 mb-8">
                {[
                  "Up to 3 active cases",
                  "AI-guided case creation",
                  "Basic document templates",
                  "Email support",
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-green-600" />
                    </div>
                    <span className="text-slate-600 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/register"
                className="block w-full py-3.5 rounded-xl border border-slate-200 text-center font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro */}
            <div className="card-elevated p-8 relative border-blue-200 ring-1 ring-blue-100">
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold">
                Popular
              </div>
              <div className="text-sm font-semibold text-blue-600 mb-2">Pro</div>
              <div className="text-5xl font-bold text-slate-900 mb-4">£19.99<span className="text-lg text-slate-400">/mo</span></div>
              <p className="text-slate-500 mb-8">For serious dispute resolution</p>
              <div className="space-y-3 mb-8">
                {[
                  "Unlimited cases",
                  "Priority AI generation",
                  "Advanced legal templates",
                  "Lawyer review option",
                  "Phone support",
                  "Case analytics dashboard",
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-blue-600" />
                    </div>
                    <span className="text-slate-600 text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/register"
                className="block w-full py-3.5 rounded-xl bg-blue-600 text-center font-semibold text-white hover:bg-blue-700 transition-all shadow-sm"
              >
                Start Pro Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {[
              { q: "What types of disputes can DisputeHub help with?", a: "DisputeHub handles consumer rights, employment issues, landlord-tenant disputes, parking tickets, contract disputes, and most civil matters under UK law." },
              { q: "Are the generated documents legally valid?", a: "Yes! Our documents follow UK legal standards and are suitable for sending to opposing parties. They serve as strong foundations for your case." },
              { q: "How long does it take to generate documents?", a: "Most documents are generated within 5-10 minutes. Complex cases may take slightly longer as our AI ensures thorough analysis." },
              { q: "Is my data secure?", a: "Absolutely. We use bank-level AES-256 encryption and never share your data with third parties. We're fully GDPR compliant." },
              { q: "Can I get a refund if I'm not satisfied?", a: "Yes, we offer a 30-day money-back guarantee for all Pro subscriptions. If you're not happy, we'll refund you." },
            ].map((faq, i) => (
              <details key={i} className="group card-elevated overflow-hidden">
                <summary className="flex items-center justify-between cursor-pointer list-none p-5">
                  <span className="font-semibold text-slate-900 pr-4 text-sm">{faq.q}</span>
                  <ChevronDown className="h-5 w-5 text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0" />
                </summary>
                <p className="px-5 pb-5 text-slate-500 leading-relaxed text-sm">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="card-elevated p-12 text-center bg-gradient-to-br from-blue-50 to-indigo-50">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-slate-900">
              Ready to Fight Back?
            </h2>
            <p className="text-lg text-slate-500 mb-10">
              Join thousands of UK residents who have successfully resolved their disputes with DisputeHub.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              Start Your Free Case
              <ArrowRight className="h-5 w-5" />
            </Link>
            <p className="mt-6 text-slate-400 text-sm">
              No credit card required · Free forever plan available
            </p>
          </div>
        </div>
      </section>

      {/* Legal Disclaimer */}
      <section className="relative z-10 bg-amber-50 border-y border-amber-100 py-5 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-amber-700 text-sm leading-relaxed">
            <strong>Important:</strong> DisputeHub is an AI document generation tool, not a law firm. 
            We do not provide legal advice. The documents generated are for informational purposes only. 
            For complex legal matters, please consult a qualified solicitor.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-white border-t border-slate-100 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/logo-200.png" alt="DisputeHub" className="w-9 h-9 rounded-xl" />
                <span className="text-lg font-bold text-slate-900">DisputeHub</span>
              </div>
              <p className="text-slate-500 text-sm">
                AI-powered legal document generation for UK residents.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4 text-sm">Product</h4>
              <div className="space-y-2 text-sm text-slate-500">
                <a href="#features" className="block hover:text-slate-900 transition-colors">Features</a>
                <a href="#pricing" className="block hover:text-slate-900 transition-colors">Pricing</a>
                <a href="#faq" className="block hover:text-slate-900 transition-colors">FAQ</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4 text-sm">Legal</h4>
              <div className="space-y-2 text-sm text-slate-500">
                <Link href="/privacy" className="block hover:text-slate-900 transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="block hover:text-slate-900 transition-colors">Terms of Service</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-4 text-sm">Support</h4>
              <div className="space-y-2 text-sm text-slate-500">
                <a href="mailto:support@disputehub.ai" className="block hover:text-slate-900 transition-colors">support@disputehub.ai</a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 text-center text-sm text-slate-400 space-y-2">
            <p>© 2026 DisputeHub. All rights reserved.</p>
            <p className="text-xs">
              DisputeHub is not a law firm and does not provide legal advice. By using our service, you agree to our{" "}
              <Link href="/terms" className="text-slate-500 hover:text-slate-900">Terms of Service</Link>.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
