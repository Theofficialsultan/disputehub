"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { BookOpen, Search, X, ExternalLink } from "lucide-react";

interface GlossaryTerm {
  term: string;
  definition: string;
  shortDefinition: string;
  category: string;
  relatedTerms: string[];
  example?: string;
  ukSpecific: boolean;
}

interface LegalGlossaryProps {
  // Optional: initial terms to show
  initialTerms?: GlossaryTerm[];
}

export function LegalGlossary({ initialTerms }: LegalGlossaryProps) {
  const [terms, setTerms] = useState<GlossaryTerm[]>(initialTerms || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  const [loading, setLoading] = useState(!initialTerms);
  const [categories, setCategories] = useState<
    Array<{ category: string; label: string; count: number }>
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch terms on mount
  useEffect(() => {
    if (!initialTerms) {
      fetchTerms();
    }
  }, [initialTerms]);

  const fetchTerms = async (search?: string, category?: string) => {
    setLoading(true);
    try {
      let url = "/api/glossary";
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category) params.set("category", category);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();
      setTerms(data.terms);
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error("Error fetching glossary:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const searchTimeout = useRef<NodeJS.Timeout>();
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchTerms(query, selectedCategory || undefined);
    }, 300);
  }, [selectedCategory]);

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    fetchTerms(searchQuery || undefined, category || undefined);
  };

  const categoryLabels: Record<string, string> = {
    general: "General Legal",
    court: "Court & Litigation",
    contracts: "Contracts",
    employment: "Employment",
    property: "Property & Housing",
    data_protection: "Data Protection",
    consumer: "Consumer Rights",
    procedure: "Court Procedure",
  };

  return (
    <div className="rounded-2xl glass-strong border border-indigo-500/20 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-indigo-500/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white">Legal Glossary</h3>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search legal terms..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            onClick={() => handleCategorySelect(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              selectedCategory === null
                ? "bg-indigo-500 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category}
              onClick={() => handleCategorySelect(cat.category)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat.category
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700"
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* Terms List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-r-transparent" />
            <p className="mt-2 text-sm text-slate-400">Loading terms...</p>
          </div>
        ) : terms.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <p>No terms found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {terms.map((term) => (
              <button
                key={term.term}
                onClick={() => setSelectedTerm(term)}
                className="w-full p-4 text-left hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {term.term}
                      {term.ukSpecific && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                          UK
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {term.shortDefinition}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 capitalize whitespace-nowrap">
                    {categoryLabels[term.category] || term.category}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Term Detail Modal */}
      {selectedTerm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setSelectedTerm(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl glass-strong border border-indigo-500/20 p-6 animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedTerm.term}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500 capitalize">
                    {categoryLabels[selectedTerm.category] || selectedTerm.category}
                  </span>
                  {selectedTerm.ukSpecific && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                      UK-specific
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedTerm(null)}
                className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            <p className="text-slate-300 leading-relaxed mb-4">
              {selectedTerm.definition}
            </p>

            {selectedTerm.example && (
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700 mb-4">
                <p className="text-xs text-indigo-400 uppercase tracking-wide mb-1">
                  Example
                </p>
                <p className="text-sm text-slate-300">{selectedTerm.example}</p>
              </div>
            )}

            {selectedTerm.relatedTerms.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                  Related Terms
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedTerm.relatedTerms.map((related) => (
                    <button
                      key={related}
                      onClick={() => {
                        const term = terms.find((t) => t.term === related);
                        if (term) setSelectedTerm(term);
                      }}
                      className="px-3 py-1 rounded-full text-xs bg-slate-800 text-slate-300 hover:bg-indigo-500/20 hover:text-indigo-400 transition-colors"
                    >
                      {related}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Tooltip component for inline glossary terms
 */
export function GlossaryTooltip({
  term,
  children,
}: {
  term: string;
  children: React.ReactNode;
}) {
  const [definition, setDefinition] = useState<string | null>(null);
  const [show, setShow] = useState(false);

  const fetchDefinition = async () => {
    if (definition) return;
    try {
      const response = await fetch(`/api/glossary?term=${encodeURIComponent(term)}`);
      const data = await response.json();
      if (data.term) {
        setDefinition(data.term.shortDefinition);
      }
    } catch (error) {
      console.error("Error fetching term:", error);
    }
  };

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => {
        setShow(true);
        fetchDefinition();
      }}
      onMouseLeave={() => setShow(false)}
    >
      <span className="border-b border-dashed border-indigo-400 cursor-help">
        {children}
      </span>
      {show && definition && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-sm text-slate-300 shadow-xl whitespace-nowrap max-w-xs">
          {definition}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
        </span>
      )}
    </span>
  );
}
