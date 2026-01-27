"use client";
import { useState } from "react";
import { MarketingDocument } from "@/types/documents";
import { supabase } from "@/lib/supabase-client";
import {
  Search,
  Loader2,
  FileText,
  Zap,
  XCircle,
  ExternalLink,
  Folder,
} from "lucide-react";

export default function DocumentSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MarketingDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllDocs = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setResults(data || []);
    } catch (err: any) {
      console.error("Fetch Error:", err.message);
      setError("Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const searchQuery = query.trim();

    if (!searchQuery) {
      setResults([]);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .textSearch("tsv_content, category, file_name", searchQuery, {
          type: "websearch"
        })
        .limit(50);
      if (error) throw error;

      setResults(data || []);

      if (data?.length === 0) {
        setError(
          "No documents matched your search query. Try different keywords.",
        );
      }
    } catch (error: any) {
      console.error("Search API Error:", error);
      setError(
        error.message || "An error occurred during search. Check console.",
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setError(null);
  };

  return (
    <div className="p-6 rounded-xl shadow-2xl bg-white max-w-2xl mx-auto font-sans">
      <div className="flex items-center space-x-2 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
          <Zap className="w-6 h-6 fill-current" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800">
          Internal Document Search
        </h3>
      </div>

      {/* Search Input Form */}
      <form className="flex space-x-2 mb-6">
        <div className="relative grow">
          <input
            type="text"
            placeholder="Search keywords (e.g., 'Q4 sales report' or 'marketing budget 2025')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-800"
            disabled={loading}
          />
          {query && (
            //Clear Button
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
        </div>
        {/* Search Button */}
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="p-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:bg-gray-300 disabled:shadow-none flex items-center hover:cursor-pointer"
          onClick={handleSearch}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Search className="h-5 w-5" />
          )}
        </button>

        {/* Fetch All */}
        <button
          type="button"
          onClick={fetchAllDocs}
          disabled={loading}
          className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-150 disabled:bg-gray-400 flex items-center cursor-pointer"
          title="fetch all"
        >
          All Docs
        </button>
      </form>

      {/* Status Messages */}
      {loading && (
        <div className="flex items-center justify-center py-8 text-blue-600 space-x-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="font-medium">Querying database...</span>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Results Display */}
      {loading && (
        <p className="text-center text-blue-600 flex items-center justify-center mt-4">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Searching...
        </p>
      )}
      {error && <p className="text-center text-red-600 mt-4">{error}</p>}

      {!loading && results.length > 0 && (
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
              {results.length} Result{results.length !== 1 ? "s" : ""} Found
            </h4>
            <button
              onClick={handleClear}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:cursor-pointer"
            >
              Clear Results
            </button>
          </div>

          <ul className="space-y-4">
            {results.map((doc) => (
              <li
                key={doc.id}
                className="group p-4 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all bg-white hover:border-blue-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                      <FileText className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                    </div>
                    <div>
                      <h5 className="text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {doc.file_name}
                      </h5>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="flex items-center text-sm text-gray-700">
                          <Folder className="w-3 h-3 mr-1 text-green-600" />
                          {doc.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="View Original"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>

                <div className="mt-3">
                  <p className="text-md text-gray-800 leading-relaxed line-clamp-2 italic bg-gray-50 p-2 rounded-lg border-l-2 border-blue-200">
                    "...{doc.content.substring(0, 150)}..."
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {!loading && results.length === 0 && !error && query && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            No documents found matching "{query}"
          </p>
        </div>
      )}
    </div>
  );
}
