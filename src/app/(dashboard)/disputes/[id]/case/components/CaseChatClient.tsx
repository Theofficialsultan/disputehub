"use client";
// Force recompile - v5.0 - Always show DocumentsPreview in GENERATING/COMPLETED phase
import { BUILD_ID } from "@/lib/build-id";
import { useState, useEffect, useRef, memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft, AlertCircle, CheckCircle, Loader2, Clock, FileText, HelpCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Message, CaseStrategy } from "@/types/chat";
import type { CaseMode, ConversationStatus } from "@prisma/client";
import { toast } from "sonner";
import { StrategySummaryPanel } from "./StrategySummaryPanel";
import { CaseControlCenter } from "@/components/case/CaseControlCenter";
import { EvidenceSection } from "@/components/evidence/EvidenceSection";
import { DocumentStatus } from "@/components/documents/DocumentStatus";
import { useGuidanceAssistant } from "@/hooks/useGuidanceAssistant";
import { DocumentsPreview } from "./DocumentsPreview";
import { SummaryGate } from "@/components/case/SummaryGate";
import { InboxThread } from "@/components/email/InboxThread";

type DisputeData = {
  id: string;
  title: string;
  mode: CaseMode;
  conversationStatus: ConversationStatus | null;
  lifecycleStatus: any; // CaseLifecycleStatus
  strategyLocked: boolean; // Phase 8.2.5
  phase?: string; // Phase 8.5-8.7: GATHERING, ROUTING, GENERATING, COMPLETED, BLOCKED
  chatLocked?: boolean; // Phase 8.5-8.7: One-way control flow
  lockReason?: string | null; // Phase 8.5-8.7: Why chat is locked
  chatState?: string; // NEW: Chat state for 4-layer system
  caseSummary?: any; // NEW: Extracted facts from System B
  summaryConfirmed?: boolean; // NEW: Has user confirmed summary
};

type CaseChatClientProps = {
  dispute: DisputeData;
};

// Mode-aware initial greeting (client-only, NOT persisted)
const createInitialGreeting = (mode: CaseMode): Message => ({
  id: "initial-greeting",
  role: "AI",
  content:
    mode === "GUIDED"
      ? "Hello! I'm your AI case assistant. I'm here to help you build a strong dispute case step-by-step. Let's start by understanding your situation. What type of dispute are you dealing with?"
      : "Hello! How can I help you today?",
  intent: "ANSWER",
  timestamp: new Date(),
});

export function CaseChatClient({ dispute }: CaseChatClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uploadMode = searchParams.get("upload") === "true"; // Phase 8.5: Auto-expand evidence
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRestricted, setIsRestricted] = useState(false);
  const [strategy, setStrategy] = useState<CaseStrategy | null>(null);
  const [isStrategyLoading, setIsStrategyLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Phase 8.6: Routing decision state (MUST be before hooks that might fail)
  const [routingDecision, setRoutingDecision] = useState<any>(null);
  const [isRoutingDecisionLoading, setIsRoutingDecisionLoading] = useState(true);
  
  // Phase 8.6: AI mode state tracking
  const [aiMode, setAiMode] = useState<"INFO_GATHERING" | "WAITING_FOR_UPLOAD" | "PROCESSING" | null>(null);
  
  // 4-LAYER SYSTEM: Summary Gate State
  const [showSummaryGate, setShowSummaryGate] = useState(false);
  const [extractedFacts, setExtractedFacts] = useState<any>(null);
  const [summaryText, setSummaryText] = useState("");
  
  // Phase 8.6: Guidance Assistant for system-controlled phases
  const { askGuidance, isLoading: isGuidanceLoading } = useGuidanceAssistant(dispute.id);
  const isGuidanceMode = ["ROUTING", "GENERATING", "COMPLETED", "BLOCKED"].includes(dispute.phase || "");

  // Load messages on mount - BUT CHECK FOR SUMMARY GATE FIRST
  useEffect(() => {
    console.log("[Chat Mount] dispute.chatState =", dispute.chatState);
    console.log("[Chat Mount] dispute.caseSummary =", dispute.caseSummary ? "EXISTS" : "NULL");
    
    // CRITICAL: If we're in CONFIRMING_SUMMARY state, show the gate IMMEDIATELY
    // Don't load old messages - they're irrelevant now
    if (dispute.chatState === "CONFIRMING_SUMMARY" && dispute.caseSummary) {
      console.log("[Chat] Case is in CONFIRMING_SUMMARY state - showing Summary Gate IMMEDIATELY");
      const summary = typeof dispute.caseSummary === 'string' 
        ? JSON.parse(dispute.caseSummary) 
        : dispute.caseSummary;
      
      setShowSummaryGate(true);
      setExtractedFacts(summary);
      setSummaryText(generateSummaryFromFacts(summary));
      setIsLoading(false); // CRITICAL: Stop loading spinner
      
      // DON'T load messages - gate takes over entire UI
      return;
    }
    
    console.log("[Chat Mount] Not in CONFIRMING_SUMMARY - loading messages normally");
    
    // Only load messages if NOT in summary gate state
    loadMessages();
    loadStrategy();
  }, []);
  
  // Helper to generate summary text from facts
  function generateSummaryFromFacts(facts: any): string {
    const amount = facts.financialAmount || facts.amount || 0;
    const counterparty = facts.parties?.counterparty || facts.counterparty || "the other party";
    const disputeType = facts.disputeType || "this dispute";
    return `You're claiming £${amount} from ${counterparty} for ${disputeType}.`;
  }

  // Phase 8.6: Load routing decision when in ROUTING/GENERATING/COMPLETED phase
  useEffect(() => {
    if (dispute.phase === "ROUTING" || dispute.phase === "GENERATING" || dispute.phase === "COMPLETED") {
      loadRoutingDecision();
      // Poll every 3 seconds while routing/generating
      const interval = setInterval(loadRoutingDecision, 3000);
      return () => clearInterval(interval);
    }
  }, [dispute.phase]);

  // Phase 8.6: Poll for dispute phase changes (to detect ROUTING phase)
  useEffect(() => {
    const pollDisputePhase = async () => {
      try {
        const response = await fetch(`/api/disputes/${dispute.id}`);
        if (response.ok) {
          const data = await response.json();
          // If phase changed, reload the page to get updated server props
          if (data.dispute && data.dispute.phase !== dispute.phase) {
            console.log(`[Chat] Phase changed from ${dispute.phase} to ${data.dispute.phase} - reloading`);
            window.location.reload();
          }
        }
      } catch (err) {
        console.error("[Chat] Failed to poll dispute phase:", err);
      }
    };

    // Poll every 2 seconds to detect phase changes
    const interval = setInterval(pollDisputePhase, 2000);
    return () => clearInterval(interval);
  }, [dispute.id, dispute.phase]);

  // Phase 8.6: Detect evidence uploads and clear waiting mode
  useEffect(() => {
    const checkEvidenceAndClearWaiting = async () => {
      try {
        // Check if evidence exists
        const response = await fetch(`/api/disputes/${dispute.id}/evidence`);
        if (response.ok) {
          const data = await response.json();
          if (data.evidence && data.evidence.length > 0) {
            // Evidence exists - clear waiting mode if active
            if (aiMode === "WAITING_FOR_UPLOAD") {
              console.log("[Chat] Evidence detected - clearing waiting mode");
              setAiMode(null); // Clear waiting mode
            }
          }
        }
      } catch (err) {
        console.error("[Chat] Failed to check evidence:", err);
      }
    };

    // Check on mount and whenever the page is visible
    checkEvidenceAndClearWaiting();

    // Poll every 2 seconds to detect evidence uploads
    const interval = setInterval(checkEvidenceAndClearWaiting, 2000);
    
    return () => clearInterval(interval);
  }, [aiMode, dispute.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/disputes/${dispute.id}/messages`);

      if (!response.ok) {
        throw new Error("Failed to load messages");
      }

      const data = await response.json();

      if (data.messages.length === 0) {
        // No persisted messages, show initial greeting (client-only)
        setMessages([createInitialGreeting(dispute.mode)]);
      } else {
        // Parse dates from server response
        const parsedMessages = data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.createdAt),
        }));
        setMessages(parsedMessages);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
      setError("Failed to load conversation history");
      toast.error("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  };

  const loadStrategy = async () => {
    try {
      setIsStrategyLoading(true);
      const response = await fetch(`/api/disputes/${dispute.id}/strategy`);

      if (!response.ok) {
        throw new Error("Failed to load strategy");
      }

      const data = await response.json();
      setStrategy(data.strategy);
    } catch (err) {
      console.error("Error loading strategy:", err);
      // Don't show error toast for strategy - it's optional
      setStrategy(null);
    } finally {
      setIsStrategyLoading(false);
    }
  };

  const loadRoutingDecision = async () => {
    try {
      setIsRoutingDecisionLoading(true);
      const response = await fetch(`/api/disputes/${dispute.id}/routing-decision`);
      if (!response.ok) {
        setIsRoutingDecisionLoading(false);
        return;
      }
      
      const data = await response.json();
      if (data.routingDecision) {
        setRoutingDecision(data.routingDecision);
      }
      setIsRoutingDecisionLoading(false);
    } catch (err) {
      console.error("Error loading routing decision:", err);
      setIsRoutingDecisionLoading(false);
    }
  };

  // Helper to trigger document status refresh (called after messages)
  const loadDocuments = () => {
    // This triggers a re-render of DocumentStatus component which has its own polling
    // We just need to ensure the component knows to check for updates
    // The DocumentStatus component handles its own data fetching
  };


  const handleSend = async () => {
    if (!input.trim() || isTyping || isRestricted) return;

    console.log("🔥🔥🔥 [CLIENT] handleSend called");
    console.log("🔥🔥🔥 [CLIENT] dispute.phase =", dispute.phase);
    console.log("🔥🔥🔥 [CLIENT] isGuidanceMode =", isGuidanceMode);

    const userContent = input.trim();
    const tempId = `temp-${Date.now()}`;

    // Optimistic update: Add user message immediately
    const optimisticMessage: Message = {
      id: tempId,
      role: "USER",
      content: userContent,
      intent: "QUESTION",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setInput("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Show typing indicator for AI response
    setIsTyping(true);

    try {
      // Phase 8.6: Check if we're in Guidance Assistant mode
      if (isGuidanceMode) {
        console.log("🔥🔥🔥 [CLIENT] Using Guidance Assistant");
        // Use Guidance Assistant (read-only, ephemeral)
        const guidanceResponse = await askGuidance(userContent);
        
        if (guidanceResponse) {
          // Add guidance response to messages (not persisted to DB)
          const guidanceMessage: Message = {
            id: `guidance-${Date.now()}`,
            role: "AI",
            content: guidanceResponse,
            intent: "ANSWER",
            timestamp: new Date(),
          };
          
          setMessages((prev) => [...prev, guidanceMessage]);
        } else {
          toast.error("Guidance Assistant unavailable");
        }
        
        setIsTyping(false);
        return;
      }
      
      console.log("🔥🔥🔥 [CLIENT] Using Main AI - about to POST");
      // Main AI mode (GATHERING phase only)
      // Save user message to database + trigger AI response
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const response = await fetch(`/api/disputes/${dispute.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: userContent,
          intent: "QUESTION",
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json();
        
        // Phase 8.6: Check if we should switch to Guidance Assistant
        if (response.status === 403 && errorData.useGuidanceAssistant) {
          toast.info("Switching to Guidance Assistant mode...");
          // Reload page to get updated phase
          window.location.reload();
          return;
        }
        
        // Phase 8.5-8.7: Handle chat locked state
        if (response.status === 403 && errorData.phase) {
          setIsRestricted(true);
          toast.error(errorData.systemMessage || "Chat is locked");
          return;
        }
        
        throw new Error(errorData.error || "Failed to send message");
      }

      const { userMessage, aiMessage, restricted, conversationState, showSummaryGate: shouldShowGate, extractedFacts: facts, summaryText: summary } = await response.json();
      
      // 4-LAYER SYSTEM: Check if Summary Gate should be displayed
      if (shouldShowGate && facts && summary) {
        console.log("[Chat] Summary Gate triggered - showing confirmation UI");
        setShowSummaryGate(true);
        setExtractedFacts(facts);
        setSummaryText(summary);
        setIsTyping(false);
        return; // Stop here - don't add any messages, show gate instead
      }
      
      // Phase 8.6: Update AI mode state for UI indicators
      if (conversationState) {
        if (conversationState.phase === "WAITING") {
          setAiMode("WAITING_FOR_UPLOAD");
          console.log("[Chat] AI entered WAITING mode - will remain silent until evidence uploaded");
        } else if (conversationState.phase === "GATHERING") {
          setAiMode("INFO_GATHERING");
        } else if (conversationState.phase === "READY") {
          setAiMode("PROCESSING");
        }
      }

      // Replace optimistic user message with real one from server
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? { ...userMessage, timestamp: new Date(userMessage.createdAt) }
            : m
        )
      );

      // Add AI response if generated successfully
      if (aiMessage) {
        setMessages((prev) => [
          ...prev,
          { ...aiMessage, timestamp: new Date(aiMessage.createdAt) },
        ]);

        // Refresh strategy after AI response
        loadStrategy();
        
        // Refresh documents (Phase 8.2.5 may trigger document generation)
        // Poll multiple times to catch async document generation
        setTimeout(() => {
          loadDocuments();
        }, 1000);
        
        // Continue polling to catch document generation
        setTimeout(() => {
          loadDocuments();
        }, 3000);
        
        setTimeout(() => {
          loadDocuments();
        }, 5000);
        
        // Check if documents started generating (no page reload needed)
        setTimeout(async () => {
          try {
            const caseResponse = await fetch(`/api/disputes/${dispute.id}`);
            if (caseResponse.ok) {
              const caseData = await caseResponse.json();
              if (caseData.dispute && caseData.dispute.strategyLocked && !dispute.strategyLocked) {
                // Strategy was just locked! Documents are generating
                toast.success("Documents are being generated! Check the right panel.");
                // Trigger document status refresh
                loadDocuments();
              }
            }
          } catch (e) {
            console.error("Error checking case status:", e);
          }
        }, 2000);
      } else {
        // Phase 8.6: AI is silent (WAITING mode or blocked)
        // This is NORMAL behavior, not an error
        console.log("[Chat] AI is in silent mode (waiting for evidence or blocked)");
        // No toast - silence is intentional
      }

      // Handle case restriction
      if (restricted) {
        setIsRestricted(true);
        toast.error(
          "This case requires professional legal assistance. The conversation has been closed."
        );
      }
    } catch (err) {
      console.error("Error sending message:", err);

      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));

      if (err instanceof Error && err.name === 'AbortError') {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error(
          err instanceof Error ? err.message : "Failed to send message"
        );
      }

      // Restore input
      setInput(userContent);
    } finally {
      setIsTyping(false);

      // Refocus input (unless restricted)
      if (!isRestricted) {
        textareaRef.current?.focus();
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 4-LAYER SYSTEM: Summary Gate Handlers
  const handleConfirmSummary = async (edits?: any) => {
    try {
      const response = await fetch(`/api/disputes/${dispute.id}/summary/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ edits }),
      });

      if (!response.ok) {
        throw new Error("Failed to confirm summary");
      }

      toast.success("Summary confirmed! Analyzing legal route...");
      
      // Reload page to get updated state (ROUTING phase)
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error confirming summary:", error);
      toast.error("Failed to confirm summary");
    }
  };

  const handleRejectSummary = async () => {
    try {
      const response = await fetch(`/api/disputes/${dispute.id}/summary/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to reject summary");
      }

      toast.info("No problem! Let's make corrections.");
      
      // Hide gate and reload messages
      setShowSummaryGate(false);
      await loadMessages();
    } catch (error) {
      console.error("Error rejecting summary:", error);
      toast.error("Failed to reject summary");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center md:h-[calc(100vh-10rem)]">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex h-[calc(100vh-8rem)] items-center justify-center md:h-[calc(100vh-10rem)]">
        <div className="mx-auto max-w-md text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h2 className="mb-2 text-lg font-semibold">Failed to Load</h2>
          <p className="mb-4 text-sm text-muted-foreground">{error}</p>
          <Button onClick={loadMessages}>Try Again</Button>
        </div>
      </div>
    );
  }

  // 4-LAYER SYSTEM: SUMMARY GATE - HARD-BLOCKING UI
  // Shows when readiness >= 60% and user needs to confirm before routing
  if (showSummaryGate && extractedFacts && summaryText) {
    return (
      <SummaryGate
        caseId={dispute.id}
        extractedFacts={extractedFacts}
        caseSummaryText={summaryText}
        onConfirm={handleConfirmSummary}
        onReject={handleRejectSummary}
      />
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-[#f8faff] via-[#eef2ff] to-[#e0e7ff]">

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200/60 bg-white/90 backdrop-blur-xl">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/disputes")}
            className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">{dispute.title || "New Case"}</h1>
            <p className="text-[11px] sm:text-xs text-slate-500 hidden sm:block">AI-Assisted Case Building</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Phase Badge */}
          {dispute.phase && dispute.phase !== "GATHERING" && (
            <Badge 
              variant="outline" 
              className={`text-[10px] sm:text-xs ${
                dispute.phase === "ROUTING" ? "bg-blue-50 text-blue-600 border-blue-200" :
                dispute.phase === "GENERATING" ? "bg-indigo-50 text-indigo-600 border-indigo-200" :
                dispute.phase === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                dispute.phase === "BLOCKED" ? "bg-red-50 text-red-600 border-red-200" :
                "bg-slate-50 text-slate-600 border-slate-200"
              }`}
            >
              {dispute.phase}
            </Badge>
          )}
          
          <Badge 
            variant="outline" 
            className={`text-[10px] sm:text-xs ${
              dispute.conversationStatus === "OPEN" && !dispute.chatLocked
                ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                : "bg-slate-50 text-slate-500 border-slate-200"
            }`}
          >
            {dispute.chatLocked ? "LOCKED" : dispute.conversationStatus || "OPEN"}
          </Badge>
        </div>
      </div>

      {/* Split Layout: Chat Left | Documents + Evidence Right (hidden on mobile) */}
      <div className="relative z-10 flex-1 flex overflow-hidden">
        {/* LEFT: Chat Section */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Phase 8.7: Show DocumentsPreview for ROUTING/GENERATING/COMPLETED phases */}
          {(dispute.phase === "ROUTING" || dispute.phase === "GENERATING" || dispute.phase === "COMPLETED") ? (
            <DocumentsPreview
              forum={routingDecision?.forum || "county_court_small_claims"}
              legalRelationship={routingDecision?.relationship || "complainant"}
              counterparty={routingDecision?.counterparty || "the other party"}
              phase={dispute.phase}
              documents={[
                {
                  name: "Claim Form",
                  description: "Official claim document outlining your case details and legal grounds",
                  whatItDoes: "Formally initiates your legal claim with all necessary information"
                },
                {
                  name: "Particulars of Claim",
                  description: "Detailed statement of facts and the basis of your claim",
                  whatItDoes: "Provides the court/tribunal with comprehensive background and justification"
                },
                {
                  name: "Evidence Bundle & Index",
                  description: "Organized collection of all supporting documents with reference index",
                  whatItDoes: "Makes it easy for the decision-maker to review your evidence"
                },
                {
                  name: "Witness Statement",
                  description: "Your formal account of events and circumstances",
                  whatItDoes: "Presents your perspective and testimony in a legally-compliant format"
                },
                {
                  name: "Schedule of Loss",
                  description: "Detailed breakdown of financial losses and compensation sought",
                  whatItDoes: "Quantifies your claim with clear, itemized figures"
                },
                {
                  name: "Submission & Filing Guide",
                  description: "Step-by-step instructions for submitting your documents",
                  whatItDoes: "Ensures you file correctly and meet all deadlines"
                }
              ]}
            />
          ) : (
            <>
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-8">
                <div className="max-w-3xl mx-auto space-y-4">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}

                  {/* AI Waiting Mode Indicator */}
                  {aiMode === "WAITING_FOR_UPLOAD" && !isTyping && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex gap-3 max-w-[90%] md:max-w-[80%]">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                          <Clock className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl rounded-tl-lg">
                          <p className="text-sm text-amber-800 leading-relaxed">
                            Waiting for evidence upload...
                          </p>
                          <p className="text-xs text-amber-600 mt-1">
                            I'll continue once you've uploaded the evidence using the Evidence section on the right.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isTyping && <TypingIndicator />}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Chat Input - Fixed at bottom of left panel */}
              <ChatInput
                value={input}
                onChange={setInput}
                onSend={handleSend}
                onKeyDown={handleKeyDown}
                isTyping={isTyping}
                isRestricted={isRestricted}
                strategyLocked={dispute.strategyLocked}
                textareaRef={textareaRef}
                dispute={dispute}
                isGuidanceMode={isGuidanceMode}
                aiMode={aiMode}
                routingDecision={routingDecision}
                isRoutingDecisionLoading={isRoutingDecisionLoading}
              />
            </>
          )}
        </div>

        {/* RIGHT: Documents + Evidence Section (hidden on mobile) */}
        <div className="hidden lg:flex w-[480px] flex-col overflow-hidden border-l border-slate-200/60 bg-white/50">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              {/* Document Status */}
              <DocumentStatus caseId={dispute.id} />

              {/* Strategy Summary (Compact) */}
              <StrategySummaryPanel
                strategy={strategy}
                isLoading={isStrategyLoading}
              />

              {/* Evidence Section */}
              <EvidenceSection 
                caseId={dispute.id}
                initialExpanded={uploadMode}
                onEvidenceUploaded={loadMessages}
              />

              {/* Email Thread */}
              <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden">
                <InboxThread disputeId={dispute.id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Chat Header Component
function ChatHeader({
  title,
  status,
  caseId,
  onBack,
}: {
  title: string;
  status: ConversationStatus;
  caseId: string;
  onBack: () => void;
}) {
  const statusColors = {
    OPEN: "bg-green-500/10 text-green-700 border-green-500/20",
    WAITING: "bg-yellow-500/10 text-yellow-700 border-yellow-500/20",
    CLOSED: "bg-gray-500/10 text-gray-700 border-gray-500/20",
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              aria-label="Back to disputes"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{title}</h1>
              <p className="text-xs text-muted-foreground">
                Case #{caseId.slice(0, 8)}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={statusColors[status]}>
            {status}
          </Badge>
        </div>
      </div>
    </div>
  );
}

// Chat Message Component (Memoized for performance)
const ChatMessage = memo(({ message }: { message: Message }) => {
  const isUser = message.role === "USER";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
      <div
        className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} max-w-[90%] md:max-w-[80%]`}
      >
        {/* AI Avatar */}
        {!isUser && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
            <span className="text-sm text-white font-bold">AI</span>
          </div>
        )}

        {/* Message Content */}
        <div className="flex flex-col gap-1">
          <div
            className={`px-4 py-3 ${
              isUser
                ? "bg-blue-600 text-white rounded-2xl rounded-tr-md shadow-sm"
                : "bg-white text-slate-800 rounded-2xl rounded-tl-md border border-slate-200 shadow-sm"
            }`}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </p>
          </div>
          <p className={`text-[11px] ${isUser ? "text-right" : ""} text-slate-400 px-2`}>
            {formatTime(message.timestamp)}
          </p>
        </div>

        {/* User Avatar */}
        {isUser && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-200">
            <span className="text-sm">👤</span>
          </div>
        )}
      </div>
    </div>
  );
});

ChatMessage.displayName = "ChatMessage";

// Typing Indicator Component
function TypingIndicator() {
  return (
    <div className="flex justify-start animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex gap-3 max-w-[90%] md:max-w-[80%]">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-sm">
          <span className="text-sm text-white font-bold">AI</span>
        </div>
        <div className="flex items-center px-4 py-3 bg-white border border-slate-200 rounded-2xl rounded-tl-md shadow-sm">
          <div className="flex gap-1.5">
            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-400 [animation-delay:-0.3s]" />
            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-300 [animation-delay:-0.15s]" />
            <div className="h-2 w-2 animate-bounce rounded-full bg-blue-200" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Chat Input Component
function ChatInput({
  value,
  onChange,
  onSend,
  onKeyDown,
  isTyping,
  isRestricted,
  strategyLocked,
  textareaRef,
  dispute,
  isGuidanceMode,
  aiMode,
  routingDecision,
  isRoutingDecisionLoading,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  isTyping: boolean;
  isRestricted: boolean;
  strategyLocked: boolean; // Phase 8.2.5
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  dispute: DisputeData;
  isGuidanceMode?: boolean; // Phase 8.6
  aiMode?: "INFO_GATHERING" | "WAITING_FOR_UPLOAD" | "PROCESSING" | null; // Phase 8.6
  routingDecision?: any;
  isRoutingDecisionLoading?: boolean;
}) {
  // Phase 8.6: Show Guidance Assistant mode indicator
  if (isGuidanceMode && !dispute.chatLocked) {
    return (
      <div className="border-t border-slate-800 backdrop-blur-xl bg-slate-900/50 px-6 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
            <HelpCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-200">Guidance Assistant Active</p>
            <p className="text-xs text-slate-400">Ask questions about what's happening - no case data will be changed</p>
          </div>
        </div>
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask a question about the current status..."
            className="flex-1 min-h-[44px] max-h-32 px-4 py-3 rounded-lg bg-slate-800/50 border border-slate-700 text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
            disabled={isTyping}
            rows={1}
          />
          <Button
            onClick={onSend}
            disabled={!value.trim() || isTyping}
            className="h-[44px] px-4 bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isTyping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    );
  }
  
  // Phase 8.5-8.7: Handle chat locked state
  if (dispute.chatLocked) {
    // Phase 8.6: Show routing decision details when available
    // Safety check for browser cache issues
    let hasRoutingData = false;
    let isLoadingRouting = true;
    
    try {
      hasRoutingData = routingDecision && typeof routingDecision === 'object';
      isLoadingRouting = isRoutingDecisionLoading !== false;
    } catch (e) {
      // Browser has old cached code - use fallbacks
      hasRoutingData = false;
      isLoadingRouting = true;
    }
    
    if (dispute.phase === "ROUTING" && !isLoadingRouting && hasRoutingData) {
      // Create safe references to prevent race conditions
      const safeRoutingDecision = routingDecision;
      
      return (
        <div className="border-t border-blue-500/20 backdrop-blur-xl bg-slate-900/50 px-6 py-6">
          <div className="max-w-3xl mx-auto">
            <div className="rounded-3xl p-6 glass-strong border border-blue-500/30">
              <div className="p-3 rounded-2xl bg-blue-500/20 border border-blue-500/30 w-14 h-14 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 text-center">
                Legal Route Determined
              </h3>
              
              {/* Routing Details */}
              <div className="mt-4 space-y-3 text-left">
                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Legal Relationship</p>
                  <p className="text-sm font-medium text-white capitalize">
                    {safeRoutingDecision?.legalRelationship || "Worker"}
                  </p>
                </div>

                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Forum / Tribunal</p>
                  <p className="text-sm font-medium text-white">
                    {safeRoutingDecision?.forum || "County Court"}
                  </p>
                </div>

                {safeRoutingDecision?.forumReasoning && (
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-xs text-slate-400 mb-1">Why This Route</p>
                    <p className="text-sm text-slate-300">
                      {safeRoutingDecision.forumReasoning}
                    </p>
                  </div>
                )}

                {safeRoutingDecision?.allowedDocuments && Array.isArray(safeRoutingDecision.allowedDocuments) && safeRoutingDecision.allowedDocuments.length > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                    <p className="text-xs text-slate-400 mb-2">Documents to Generate</p>
                    <div className="space-y-1">
                      {safeRoutingDecision.allowedDocuments.map((doc: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2">
                          <FileText className="w-3 h-3 text-blue-400" />
                          <p className="text-sm text-slate-300">{doc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/30 text-center">
                  <p className="text-sm text-blue-300">
                    Proceeding to document generation...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // For locked chat phases, show standard locked chat message
    const phaseMessages: Record<string, { icon: any; title: string; message: string; color: string }> = {
      ROUTING: {
        icon: Clock,
        title: "Analyzing Legal Route",
        message: "We're determining the best legal pathway for your case. This will take a moment...",
        color: "blue"
      },
      COMPLETED: {
        icon: CheckCircle,
        title: "Documents Ready",
        message: "Your documents are complete! Download them from the Documents section.",
        color: "emerald"
      },
      BLOCKED: {
        icon: AlertCircle,
        title: "Action Required",
        message: dispute.lockReason || "We've identified an issue. Please review the Documents section for details.",
        color: "red"
      }
    };

    const phaseInfo = phaseMessages[dispute.phase || "ROUTING"] || phaseMessages.ROUTING;
    const Icon = phaseInfo.icon;

    return (
      <div className={`border-t border-${phaseInfo.color}-500/20 backdrop-blur-xl bg-slate-900/50 px-6 py-6`}>
        <div className="max-w-3xl mx-auto">
          <div className={`rounded-3xl p-6 glass-strong border border-${phaseInfo.color}-500/30 text-center`}>
            <div className={`p-3 rounded-2xl bg-${phaseInfo.color}-500/20 border border-${phaseInfo.color}-500/30 w-14 h-14 mx-auto mb-4 flex items-center justify-center`}>
              <Icon className={`h-7 w-7 text-${phaseInfo.color}-400`} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {phaseInfo.title}
            </h3>
            <p className="text-sm text-slate-300 mb-3">
              {phaseInfo.message}
            </p>
            <p className="text-xs text-slate-500">
              The chat will remain locked during this process.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isRestricted) {
    return (
      <div className="border-t border-red-500/20 backdrop-blur-xl bg-slate-900/50 px-6 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl p-6 glass-strong border border-red-500/30 text-center">
            <div className="p-3 rounded-2xl bg-red-500/20 border border-red-500/30 w-14 h-14 mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="h-7 w-7 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Professional Legal Assistance Required
            </h3>
            <p className="text-sm text-slate-300 mb-3">
              This case requires expert legal guidance beyond AI assistance.
            </p>
            <p className="text-xs text-slate-500">
              Please contact a qualified solicitor for assistance with this matter.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Phase 8.2.5 - Strategy Locked (but keep chat open)
  // Documents will show in the right panel, chat stays functional

  return (
    <div className="border-t border-slate-200/60 bg-white/90 backdrop-blur-xl px-3 sm:px-6 py-3 sm:py-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-4">
      <div className="max-w-3xl mx-auto">
        {/* AI Waiting Mode Status */}
        {aiMode === "WAITING_FOR_UPLOAD" && (
          <div className="mb-2 sm:mb-3 flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-amber-50 border border-amber-100">
            <Clock className="w-4 h-4 text-amber-600 animate-pulse flex-shrink-0" />
            <p className="text-xs text-amber-700 flex-1">
              AI is waiting for evidence upload
            </p>
          </div>
        )}
        
        <div className="flex gap-2 items-end">
          <div className="flex-1 flex items-end gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-2xl bg-white border border-slate-200 shadow-sm focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={aiMode === "WAITING_FOR_UPLOAD" ? "Upload evidence to continue..." : "Describe your situation..."}
              disabled={isTyping}
              rows={1}
              className="min-h-[40px] sm:min-h-[44px] max-h-[120px] sm:max-h-[140px] flex-1 resize-none bg-transparent px-3 sm:px-4 py-2.5 sm:py-3 text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 text-sm"
              aria-label="Message input"
            />
            <Button
              onClick={onSend}
              disabled={!value.trim() || isTyping}
              size="icon"
              className="h-9 w-9 sm:h-10 sm:w-10 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border-0 shadow-sm mb-0.5"
              aria-label="Send message"
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        <p className="mt-1.5 text-center text-[10px] sm:text-[11px] text-slate-400 hidden sm:block">
          Press <kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 text-[10px]">Enter</kbd> to send · <kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-500 text-[10px]">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}

// Helper function to format timestamp
function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
