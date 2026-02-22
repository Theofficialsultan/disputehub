"use client";

import { useState, useEffect } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BookOpen, Loader2 } from "lucide-react";

interface GlossaryTermProps {
  term: string;
  children: React.ReactNode;
}

interface TermDefinition {
  term: string;
  definition: string;
  category?: string;
}

// Cache definitions to avoid repeated API calls
const definitionCache = new Map<string, TermDefinition | null>();

export function GlossaryTerm({ term, children }: GlossaryTermProps) {
  const [definition, setDefinition] = useState<TermDefinition | null>(
    definitionCache.get(term.toLowerCase()) || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && !definition && !definitionCache.has(term.toLowerCase())) {
      loadDefinition();
    }
  }, [isOpen, term]);

  const loadDefinition = async () => {
    const normalizedTerm = term.toLowerCase();
    
    if (definitionCache.has(normalizedTerm)) {
      setDefinition(definitionCache.get(normalizedTerm) || null);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/glossary?term=${encodeURIComponent(normalizedTerm)}`);
      if (response.ok) {
        const data = await response.json();
        definitionCache.set(normalizedTerm, data.term);
        setDefinition(data.term);
      } else {
        definitionCache.set(normalizedTerm, null);
        setDefinition(null);
      }
    } catch (error) {
      console.error("Failed to load term definition:", error);
      definitionCache.set(normalizedTerm, null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip open={isOpen} onOpenChange={setIsOpen}>
        <TooltipTrigger asChild>
          <span className="border-b border-dashed border-primary/50 cursor-help hover:text-primary transition-colors">
            {children}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm p-4" side="top">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : definition ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                <span className="font-semibold capitalize">{definition.term}</span>
                {definition.category && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    {definition.category}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {definition.definition}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No definition available for "{term}"
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Higher-order component to auto-detect and wrap legal terms
 */
export function AutoGlossary({ children }: { children: string }) {
  const LEGAL_TERMS = [
    "claimant",
    "defendant",
    "particulars of claim",
    "statement of truth",
    "small claims track",
    "fast track",
    "multi-track",
    "breach of contract",
    "quantum meruit",
    "letter before action",
    "pre-action protocol",
    "statutory interest",
    "limitation period",
    "unfair dismissal",
    "constructive dismissal",
    "without prejudice",
  ];

  let result: React.ReactNode[] = [children];

  LEGAL_TERMS.forEach((term) => {
    result = result.flatMap((segment) => {
      if (typeof segment !== "string") return [segment];

      const regex = new RegExp(`\\b(${term})\\b`, "gi");
      const parts = segment.split(regex);

      return parts.map((part, index) => {
        if (part.toLowerCase() === term.toLowerCase()) {
          return (
            <GlossaryTerm key={`${term}-${index}`} term={term}>
              {part}
            </GlossaryTerm>
          );
        }
        return part;
      });
    });
  });

  return <>{result}</>;
}
