import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | DisputeHub",
  description: "How DisputeHub collects, uses, and protects your data",
};

export default function PrivacyPage() {
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

        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-slate-400 mb-8">Last updated: February 2026</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-slate-300 leading-relaxed">
              DisputeHub ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-medium mb-3 text-indigo-300">Personal Information</h3>
            <p className="text-slate-300 leading-relaxed mb-4">When you register or use our Service, we may collect:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>Name and contact details (email, phone, address)</li>
              <li>Account credentials</li>
              <li>Payment information (processed securely via Stripe)</li>
              <li>Information you provide about your disputes</li>
            </ul>

            <h3 className="text-xl font-medium mb-3 mt-6 text-indigo-300">Automatically Collected Information</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>Device and browser information</li>
              <li>IP address and location data</li>
              <li>Usage patterns and preferences</li>
              <li>Cookies and similar technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-slate-300 leading-relaxed">We use your information to:</p>
            <ul className="list-disc list-inside text-slate-300 mt-4 space-y-2">
              <li>Provide and improve our document generation services</li>
              <li>Process your disputes and generate relevant documents</li>
              <li>Communicate with you about your account and cases</li>
              <li>Process payments and manage subscriptions</li>
              <li>Ensure security and prevent fraud</li>
              <li>Comply with legal obligations</li>
              <li>Improve our AI models and service quality</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>
            <p className="text-slate-300 leading-relaxed">
              Your data is stored securely using industry-standard encryption. We use trusted third-party 
              services including:
            </p>
            <ul className="list-disc list-inside text-slate-300 mt-4 space-y-2">
              <li><strong>Clerk</strong> - Authentication and identity management</li>
              <li><strong>Supabase</strong> - Database hosting (EU servers available)</li>
              <li><strong>Stripe</strong> - Payment processing (PCI compliant)</li>
              <li><strong>Vercel</strong> - Application hosting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">5. Data Sharing</h2>
            <p className="text-slate-300 leading-relaxed">
              We do not sell your personal information. We may share data with:
            </p>
            <ul className="list-disc list-inside text-slate-300 mt-4 space-y-2">
              <li>Service providers who assist in operating our platform</li>
              <li>Legal authorities when required by law</li>
              <li>Professional advisors (lawyers, accountants) as needed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights (GDPR)</h2>
            <p className="text-slate-300 leading-relaxed">Under UK GDPR, you have the right to:</p>
            <ul className="list-disc list-inside text-slate-300 mt-4 space-y-2">
              <li><strong>Access</strong> - Request a copy of your personal data</li>
              <li><strong>Rectification</strong> - Correct inaccurate data</li>
              <li><strong>Erasure</strong> - Request deletion of your data ("right to be forgotten")</li>
              <li><strong>Portability</strong> - Receive your data in a portable format</li>
              <li><strong>Object</strong> - Object to certain processing activities</li>
              <li><strong>Restrict</strong> - Limit how we use your data</li>
            </ul>
            <p className="text-slate-300 leading-relaxed mt-4">
              To exercise these rights, contact us at{" "}
              <a href="mailto:privacy@disputehub.ai" className="text-indigo-400 hover:text-indigo-300">
                privacy@disputehub.ai
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
            <p className="text-slate-300 leading-relaxed">
              We retain your data for as long as your account is active or as needed to provide services. 
              You can request deletion at any time. Some data may be retained for legal compliance purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">8. Cookies</h2>
            <p className="text-slate-300 leading-relaxed">
              We use essential cookies for authentication and functionality. We may also use analytics cookies 
              to understand how users interact with our Service. You can manage cookie preferences in your browser.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
            <p className="text-slate-300 leading-relaxed">
              Our Service is not intended for users under 18 years of age. We do not knowingly collect 
              information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">10. International Transfers</h2>
            <p className="text-slate-300 leading-relaxed">
              Your data may be transferred to and processed in countries outside the UK. We ensure appropriate 
              safeguards are in place for such transfers in compliance with data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">11. Changes to This Policy</h2>
            <p className="text-slate-300 leading-relaxed">
              We may update this Privacy Policy periodically. We will notify you of significant changes via 
              email or through the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
            <p className="text-slate-300 leading-relaxed">
              For privacy-related inquiries:
            </p>
            <div className="bg-slate-800/50 rounded-xl p-6 mt-4">
              <p className="text-slate-300">
                <strong>Email:</strong>{" "}
                <a href="mailto:privacy@disputehub.ai" className="text-indigo-400 hover:text-indigo-300">
                  privacy@disputehub.ai
                </a>
              </p>
              <p className="text-slate-300 mt-2">
                <strong>Data Protection Officer:</strong> Available upon request
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4">13. Supervisory Authority</h2>
            <p className="text-slate-300 leading-relaxed">
              You have the right to lodge a complaint with the Information Commissioner's Office (ICO) if you 
              believe your data protection rights have been violated:{" "}
              <a href="https://ico.org.uk" className="text-indigo-400 hover:text-indigo-300" target="_blank" rel="noopener noreferrer">
                ico.org.uk
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
