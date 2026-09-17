import { useState } from 'react';
import { Sparkles, Search, BookOpen, Download, FileText, Loader2, ThumbsUp, ArrowRight, CornerDownRight } from 'lucide-react';
import axios from 'axios';
import FormattedMarkdownText from './FormattedMarkdownText';

function ResourceAISearch({ currentSemester, currentBranch }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 4;

  const suggestionPrompts = [
    "Explain OOPS concepts in Java",
    "Binary Search Tree notes",
    "Lab manual algorithms",
    "Data Structures previous year paper"
  ];

  const handleSearch = async (e, customQuery) => {
    if (e) e.preventDefault();
    const q = customQuery !== undefined ? customQuery : query;
    if (!q.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/hub/resources/search-ai`,
        { 
          query: q,
          semester: currentSemester,
          branch: currentBranch
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSearchResult(data);
      setCurrentPage(1);
    } catch (err) {
      console.error('AI Resource Search Failed:', err);
      setError(err.response?.data?.message || 'Failed to search PDF documents.');
    } finally {
      setIsSearching(false);
    }
  };

  const allReferences = searchResult?.references || [];
  const totalPagesCount = Math.ceil(allReferences.length / pageSize);
  const paginatedReferences = allReferences.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="bg-gradient-to-br from-indigo-900/20 via-purple-900/10 to-cyan-900/20 dark:from-[#13141f] dark:to-[#0f1520] border border-indigo-500/20 dark:border-cyan-500/20 rounded-xl p-5 md:p-6 shadow-xl backdrop-blur-md space-y-5">
      
      {/* Header Badge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white rounded-lg shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              AI Vector & Reference Search
              <span className="text-[10px] uppercase font-bold tracking-widest bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                100% Free Tier RAG
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              Search inside raw text chunks across all uploaded PDF study notes & exam papers
            </p>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={(e) => handleSearch(e)} className="relative flex items-center">
        <Search className="w-5 h-5 absolute left-4 text-indigo-500 dark:text-cyan-400 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask AI or search topic inside PDF notes (e.g., 'Polymorphism in C++', 'Data Structures')..."
          className="w-full bg-white dark:bg-black/40 border border-indigo-200 dark:border-cyan-500/30 rounded-xl pl-12 pr-32 py-3 text-xs md:text-sm font-semibold outline-none focus:border-cyan-500 dark:focus:border-cyan-400 text-gray-900 dark:text-white shadow-inner transition-all placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="absolute right-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-white font-extrabold text-xs rounded-lg shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
        >
          {isSearching ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Ask AI</>
          )}
        </button>
      </form>

      {/* Suggestion Chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Try asking:</span>
        {suggestionPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setQuery(prompt);
              handleSearch(null, prompt);
            }}
            className="text-xs font-semibold px-3 py-1 bg-white/60 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-cyan-500/10 border border-gray-200 dark:border-white/10 rounded-full text-indigo-600 dark:text-cyan-300 transition-colors cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs font-semibold text-red-500">
          {error}
        </div>
      )}

      {/* Results Display */}
      {searchResult && (
        <div className="space-y-4 pt-2 border-t border-indigo-500/10 dark:border-white/10 animate-fade-in">
          
          {/* AI Response Card */}
          <div className="bg-white/80 dark:bg-black/50 border border-indigo-500/20 dark:border-cyan-500/20 rounded-xl p-4 md:p-5 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs font-black text-indigo-600 dark:text-cyan-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> AI Answer & Reference Summary
              </span>
              <span className="text-[10px] text-gray-400 font-semibold lowercase">
                {allReferences.length} reference passage(s) matched
              </span>
            </div>
            
            <FormattedMarkdownText text={searchResult.aiAnswer} />
          </div>

          {/* Reference PDF Chunk Cards */}
          {allReferences.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-cyan-500" /> Matched Passage References:
                </h3>
                {totalPagesCount > 1 && (
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, allReferences.length)} of {allReferences.length}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {paginatedReferences.map((ref, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-[#161724] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                              {ref.subject}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                              Sem {ref.semester} • {ref.branch}
                            </span>
                          </div>
                          <h4 className="text-xs md:text-sm font-black text-gray-900 dark:text-white mt-1 line-clamp-1">
                            {ref.title}
                          </h4>
                        </div>

                        {/* Similarity Match Badge */}
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                          {Math.min(99, Math.round(ref.score * 35 + 50))}% match
                        </span>
                      </div>

                      {/* Text Chunk Snippet */}
                      <div className="bg-gray-50 dark:bg-black/30 border border-gray-100 dark:border-white/5 rounded-lg p-2.5 text-xs text-gray-700 dark:text-gray-300 leading-relaxed font-mono relative">
                        <CornerDownRight className="w-3 h-3 text-cyan-500 absolute top-2.5 left-2" />
                        <p className="pl-4 line-clamp-3 italic">
                          "{ref.textSnippet}"
                        </p>
                      </div>
                    </div>

                    {/* Footer: Page Number and Resource Title */}
                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-2 text-[11px]">
                      <span className="font-extrabold text-indigo-600 dark:text-cyan-400 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-cyan-500" /> Page {ref.pageNumber || 1}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 font-semibold truncate max-w-[200px]" title={ref.title}>
                        📄 {ref.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPagesCount > 1 && (
                <div className="flex items-center justify-between border-t border-indigo-500/10 dark:border-white/10 pt-3 mt-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    ← Previous
                  </button>

                  <span className="text-xs font-extrabold text-gray-600 dark:text-gray-300">
                    Page {currentPage} of {totalPagesCount}
                  </span>

                  <button
                    type="button"
                    disabled={currentPage >= totalPagesCount}
                    onClick={() => setCurrentPage(prev => Math.min(totalPagesCount, prev + 1))}
                    className="px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Next →
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}

export default ResourceAISearch;
