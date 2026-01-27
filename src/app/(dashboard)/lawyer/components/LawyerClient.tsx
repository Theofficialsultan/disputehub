"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Scale,
  MessageCircle,
  Calendar,
  Star,
  CheckCircle,
  Clock,
  FileText,
  Video,
  Phone,
  Mail,
  Badge,
  Award,
  TrendingUp,
  Users,
  Send,
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { CaseLifecycleStatus, DisputeType } from "@prisma/client";

interface LawyerData {
  disputes: Array<{
    id: string;
    title: string;
    type: DisputeType;
    lifecycleStatus: CaseLifecycleStatus;
    createdAt: Date;
    documentPlan: {
      documents: Array<{
        status: string;
      }>;
    } | null;
  }>;
}

const MOCK_LAWYER = {
  name: "Sarah Miller",
  title: "Senior Legal Advisor",
  specialization: "Consumer Rights & Employment Law",
  experience: "12 years",
  rating: 4.9,
  reviews: 156,
  casesWon: 243,
  responseTime: "< 2 hours",
  availability: "Available Now",
  avatar: "SM",
  bio: "Specialized in consumer rights, employment disputes, and contract law. Expert in UK legal system with a proven track record of successful case resolutions.",
  expertise: ["Consumer Rights", "Employment Law", "Contract Disputes", "Landlord-Tenant", "Civil Litigation"],
  languages: ["English", "French", "Spanish"],
  qualifications: [
    "LLB (Hons) - University of Oxford",
    "Solicitor of England and Wales",
    "Member of Law Society",
  ],
};

const MOCK_MESSAGES = [
  {
    id: "1",
    from: "lawyer",
    message: "Hello! I've reviewed your case #1234. The documentation looks solid and we have strong grounds for proceeding.",
    time: "2 hours ago",
    read: true,
  },
  {
    id: "2",
    from: "user",
    message: "Thank you! What are the next steps?",
    time: "1 hour ago",
    read: true,
  },
  {
    id: "3",
    from: "lawyer",
    message: "I'll prepare the formal response letter. It should be ready within 24 hours. I'll also schedule a call to discuss strategy.",
    time: "45 minutes ago",
    read: false,
  },
];

const MOCK_MEETINGS = [
  {
    id: "1",
    title: "Case Strategy Discussion",
    date: "Jan 28, 2026",
    time: "10:00 AM",
    duration: "30 min",
    type: "video",
    status: "upcoming",
  },
  {
    id: "2",
    title: "Document Review",
    date: "Jan 26, 2026",
    time: "2:00 PM",
    duration: "45 min",
    type: "phone",
    status: "completed",
  },
];

function LawyerProfileCard() {
  return (
    <div className="rounded-3xl p-8 glass-strong border border-indigo-500/20">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-4xl font-bold glow-purple">
            {MOCK_LAWYER.avatar}
          </div>
          <div className="absolute -bottom-2 -right-2 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Verified
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="text-3xl font-bold text-white mb-1">{MOCK_LAWYER.name}</h2>
              <p className="text-lg text-slate-400 mb-2">{MOCK_LAWYER.title}</p>
              <p className="text-sm text-slate-500">{MOCK_LAWYER.specialization}</p>
            </div>
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium text-emerald-300">{MOCK_LAWYER.availability}</span>
            </div>
          </div>

          <p className="text-slate-300 mb-4">{MOCK_LAWYER.bio}</p>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-3 rounded-xl glass border border-indigo-500/10">
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-4 w-4 text-yellow-400" />
                <span className="text-2xl font-bold text-white">{MOCK_LAWYER.rating}</span>
              </div>
              <p className="text-xs text-slate-400">{MOCK_LAWYER.reviews} reviews</p>
            </div>
            <div className="p-3 rounded-xl glass border border-indigo-500/10">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-indigo-400" />
                <span className="text-2xl font-bold text-white">{MOCK_LAWYER.casesWon}</span>
              </div>
              <p className="text-xs text-slate-400">Cases won</p>
            </div>
            <div className="p-3 rounded-xl glass border border-indigo-500/10">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-bold text-white">{MOCK_LAWYER.responseTime}</span>
              </div>
              <p className="text-xs text-slate-400">Response time</p>
            </div>
            <div className="p-3 rounded-xl glass border border-indigo-500/10">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
                <span className="text-2xl font-bold text-white">{MOCK_LAWYER.experience}</span>
              </div>
              <p className="text-xs text-slate-400">Experience</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0">
              <MessageCircle className="mr-2 h-4 w-4" />
              Send Message
            </Button>
            <Button variant="outline" className="border-indigo-500/30 text-white hover:bg-indigo-500/10">
              <Video className="mr-2 h-4 w-4" />
              Schedule Call
            </Button>
            <Button variant="outline" className="border-indigo-500/30 text-white hover:bg-indigo-500/10">
              <Phone className="mr-2 h-4 w-4" />
              Call Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpertiseSection() {
  return (
    <div className="rounded-3xl p-6 glass-strong border border-indigo-500/20">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Scale className="h-5 w-5 text-indigo-400" />
        Expertise & Qualifications
      </h3>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-slate-400 mb-2">Areas of Expertise</p>
          <div className="flex flex-wrap gap-2">
            {MOCK_LAWYER.expertise.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-sm text-indigo-300"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-slate-400 mb-2">Languages</p>
          <div className="flex flex-wrap gap-2">
            {MOCK_LAWYER.languages.map((lang) => (
              <span
                key={lang}
                className="px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/30 text-sm text-purple-300"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-slate-400 mb-2">Qualifications</p>
          <ul className="space-y-2">
            {MOCK_LAWYER.qualifications.map((qual, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                {qual}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MessagesSection() {
  const [message, setMessage] = useState("");

  return (
    <div className="rounded-3xl glass-strong border border-indigo-500/20 overflow-hidden">
      <div className="p-6 border-b border-indigo-500/20">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-indigo-400" />
          Messages
        </h3>
      </div>

      {/* Messages */}
      <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
        {MOCK_MESSAGES.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.from === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold shrink-0 ${
                msg.from === "lawyer"
                  ? "bg-gradient-to-br from-emerald-500 to-teal-500"
                  : "bg-gradient-to-br from-indigo-500 to-purple-500"
              }`}
            >
              {msg.from === "lawyer" ? "SM" : "You"}
            </div>
            <div className={`flex-1 ${msg.from === "user" ? "text-right" : ""}`}>
              <div
                className={`inline-block p-4 rounded-2xl ${
                  msg.from === "lawyer"
                    ? "bg-indigo-500/10 border border-indigo-500/20"
                    : "bg-purple-500/10 border border-purple-500/20"
                }`}
              >
                <p className="text-sm text-white">{msg.message}</p>
              </div>
              <p className="text-xs text-slate-500 mt-1">{msg.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-indigo-500/20">
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="glass-strong border-indigo-500/20 text-white placeholder:text-slate-500 resize-none"
            rows={2}
          />
          <div className="flex flex-col gap-2">
            <Button size="icon" variant="outline" className="border-indigo-500/30 text-slate-400 hover:bg-indigo-500/10">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button size="icon" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MeetingsSection() {
  return (
    <div className="rounded-3xl p-6 glass-strong border border-indigo-500/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Calendar className="h-5 w-5 text-indigo-400" />
          Meetings
        </h3>
        <Button size="sm" variant="outline" className="border-indigo-500/30 text-white hover:bg-indigo-500/10">
          Schedule New
        </Button>
      </div>

      <div className="space-y-3">
        {MOCK_MEETINGS.map((meeting) => (
          <div
            key={meeting.id}
            className="p-4 rounded-2xl glass border border-indigo-500/10 hover:border-indigo-500/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">{meeting.title}</h4>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {meeting.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {meeting.time}
                  </span>
                  <span>{meeting.duration}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {meeting.type === "video" ? (
                  <Video className="h-4 w-4 text-indigo-400" />
                ) : (
                  <Phone className="h-4 w-4 text-emerald-400" />
                )}
                {meeting.status === "upcoming" ? (
                  <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0">
                    Join
                  </Button>
                ) : (
                  <span className="text-xs text-slate-500">Completed</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function YourCasesSection({ disputes }: { disputes: LawyerData["disputes"] }) {
  return (
    <div className="rounded-3xl p-6 glass-strong border border-indigo-500/20">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <FileText className="h-5 w-5 text-indigo-400" />
        Your Cases with Lawyer
      </h3>

      {disputes.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No cases assigned yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {disputes.slice(0, 3).map((dispute) => (
            <Link
              key={dispute.id}
              href={`/disputes/${dispute.id}/case`}
              className="block p-4 rounded-2xl glass border border-indigo-500/10 hover:border-indigo-500/30 transition-all group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                    {dispute.title}
                  </h4>
                  <p className="text-sm text-slate-400 capitalize">
                    {dispute.type.toLowerCase().replace(/_/g, " ")}
                  </p>
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(dispute.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LawyerClient({ disputes }: LawyerData) {
  return (
    <div className="space-y-8 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-5xl font-bold text-white mb-3 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
          Your Legal Advisor
        </h1>
        <p className="text-slate-400 text-lg">
          Connect with your assigned lawyer and manage your legal consultation
        </p>
      </div>

      {/* Lawyer Profile */}
      <LawyerProfileCard />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Messages & Meetings */}
        <div className="lg:col-span-2 space-y-6">
          <MessagesSection />
          <MeetingsSection />
        </div>

        {/* Right Column - Expertise & Cases */}
        <div className="space-y-6">
          <ExpertiseSection />
          <YourCasesSection disputes={disputes} />
        </div>
      </div>

      {/* Contact Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="p-4 rounded-2xl glass-strong border border-indigo-500/20 hover:border-emerald-500/40 hover:glow-purple transition-all text-left group">
          <Mail className="h-6 w-6 text-emerald-400 mb-2" />
          <h4 className="font-semibold text-white mb-1">Email</h4>
          <p className="text-sm text-slate-400">sarah.miller@disputehub.ai</p>
        </button>
        <button className="p-4 rounded-2xl glass-strong border border-indigo-500/20 hover:border-emerald-500/40 hover:glow-purple transition-all text-left group">
          <Phone className="h-6 w-6 text-emerald-400 mb-2" />
          <h4 className="font-semibold text-white mb-1">Phone</h4>
          <p className="text-sm text-slate-400">+44 20 7123 4567</p>
        </button>
        <button className="p-4 rounded-2xl glass-strong border border-indigo-500/20 hover:border-emerald-500/40 hover:glow-purple transition-all text-left group">
          <Video className="h-6 w-6 text-emerald-400 mb-2" />
          <h4 className="font-semibold text-white mb-1">Video Call</h4>
          <p className="text-sm text-slate-400">Schedule a meeting</p>
        </button>
      </div>
    </div>
  );
}
