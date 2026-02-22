import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Terms of Service | DisputeHub",
  description: "Terms and conditions for using DisputeHub",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-slate-400 mb-8">Last updated: February 2026</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-300 leading-relaxed">
              By accessing or using DisputeHub ("the Service"), you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Important Legal Disclaimer</h2>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
              <p className="text-amber-200 font-semibold mb-3">⚠️ NOT LEGAL ADVICE</p>
              <p className="text-slate-300 leading-relaxed">
                DisputeHub is an AI-powered document generation tool. <strong>We do not provide legal advice.</strong> 
                The documents and information provided by our Service are for informational purposes only and should 
                not be construed as legal advice. We strongly recommend consulting with a qualified solicitor or 
                legal professional before taking any legal action.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. Description of Service</h2>
            <p className="text-slate-300 leading-relaxed">
              DisputeHub uses artificial intelligence to help users generate dispute letters and legal documents. 
              The Service includes:
            </p>
            <ul className="list-disc list-inside text-slate-300 mt-4 space-y-2">
              <li>AI-assisted document generation</li>
              <li>Case management tools</li>
              <li>Document templates for various dispute types</li>
              <li>Guidance on dispute resolution processes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. User Responsibilities</h2>
            <p className="text-slate-300 leading-relaxed">You agree to:</p>
            <ul className="list-disc list-inside text-slate-300 mt-4 space-y-2">
              <li>Provide accurate and truthful information</li>
              <li>Use the Service only for lawful purposes</li>
              <li>Not misrepresent yourself or your claims</li>
              <li>Review all generated documents before use</li>
              <li>Seek professional legal advice for complex matters</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
            <p className="text-slate-300 leading-relaxed">
              DisputeHub and its operators shall not be liable for any direct, indirect, incidental, special, 
              consequential, or exemplary damages resulting from your use of the Service, including but not 
              limited to damages for loss of profits, goodwill, data, or other intangible losses, even if we 
              have been advised of the possibility of such damages.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. No Guarantee of Outcomes</h2>
            <p className="text-slate-300 leading-relaxed">
              We do not guarantee any specific outcome from using our document generation services. The success 
              of any dispute depends on many factors beyond our control, including the specific facts of your 
              case, applicable laws, and the decisions of third parties.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
            <p className="text-slate-300 leading-relaxed">
              Documents you create using DisputeHub are yours to use. However, the underlying templates, 
              AI models, and Service technology remain the property of DisputeHub.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Subscription and Payments</h2>
            <p className="text-slate-300 leading-relaxed">
              Some features require a paid subscription. By subscribing, you agree to pay the applicable fees. 
              Subscriptions auto-renew unless cancelled. Refunds are handled on a case-by-case basis.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
            <p className="text-slate-300 leading-relaxed">
              We reserve the right to suspend or terminate your access to the Service at any time for violation 
              of these terms or for any other reason at our discretion.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
            <p className="text-slate-300 leading-relaxed">
              We may update these terms from time to time. Continued use of the Service after changes constitutes 
              acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
            <p className="text-slate-300 leading-relaxed">
              These terms are governed by the laws of England and Wales. Any disputes shall be subject to the 
              exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact</h2>
            <p className="text-slate-300 leading-relaxed">
              For questions about these terms, contact us at{" "}
              <a href="mailto:legal@disputehub.ai" className="text-indigo-400 hover:text-indigo-300">
                legal@disputehub.ai
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
