import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Send, BookOpen, FileText, Download, Loader2, Bot, User, CheckCircle2, CornerDownRight } from 'lucide-react';
import axios from 'axios';
import FormattedMarkdownText from '../components/FormattedMarkdownText';

function DocumentChat() {
  const { resourceId } = useParams();
  const navigate = useNavigate();

  const [documentDetails, setDocumentDetails] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialFetching, setIsInitialFetching] = useState(true);
  const [activePassages, setActivePassages] = useState(null);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    "Summarize this document in 3 main points",
    "What are the key definitions and formulas?",
    "Generate 3 practice exam questions from this note",
    "Explain the main concept in simple terms"
  ];

  useEffect(() => {
    fetchInitialDocument();
  }, [resourceId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const fetchInitialDocument = async () => {
    try {
      const token = localStorage.getItem('token');
      // Perform initial light query to load document details
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/hub/resources/${resourceId}/chat`,
        { question: "overview" },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setDocumentDetails(data.resource);
      setMessages([
        {
          sender: 'ai',
          text: `Hello! I'm your AI Document Assistant for **"${data.resource.title}"** (${data.resource.subject}). Ask me anything about this study note, formulas, or concepts!`,
          referencedPages: [],
          passages: []
        }
      ]);
    } catch (err) {
      console.error('Failed to load document for chat:', err);
    } finally {
      setIsInitialFetching(false);
    }
  };

  const handleSendMessage = async (e, customText) => {
    if (e) e.preventDefault();
    const q = customText !== undefined ? customText : inputQuestion;
    if (!q.trim() || isLoading) return;

    const userMessage = { sender: 'user', text: q };
    setMessages(prev => [...prev, userMessage]);
    setInputQuestion('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/hub/resources/${resourceId}/chat`,
        { question: q },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.resource) {
        setDocumentDetails(data.resource);
      }

      const aiMessage = {
        sender: 'ai',
        text: data.answer || "I parsed the document but couldn't generate a specific response.",
        referencedPages: data.referencedPages || [],
        passages: data.topPassages || []
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      console.error('Document Chat Failed:', err);
      setMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: 'Sorry, I encountered an error searching inside this document. Please try again.',
          referencedPages: [],
          passages: []
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitialFetching) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Initializing Document AI Workspace...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-5 pb-10 animate-fade-in">
      
      {/* Top Navigation & Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-gray-200/60 dark:border-white/10 pb-4">
        <button
          onClick={() => navigate('/hub/vault')}
          className="flex items-center gap-1.5 text-xs font-extrabold text-indigo-600 dark:text-cyan-400 hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Resource Vault
        </button>

        {documentDetails && (
          <a
            href={`${import.meta.env.VITE_API_URL}/api/hub/resources/download/${documentDetails._id}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5" /> Download PDF
          </a>
        )}
      </div>

      {/* Document Information Banner */}
      {documentDetails && (
        <div className="bg-gradient-to-r from-indigo-900/30 via-purple-900/20 to-cyan-900/30 border border-indigo-500/20 dark:border-cyan-500/20 rounded-xl p-4 shadow-md flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white rounded-xl shadow-md">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                  {documentDetails.subject}
                </span>
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                  Sem {documentDetails.semester} • {documentDetails.branch}
                </span>
              </div>
              <h1 className="text-base md:text-lg font-black text-gray-900 dark:text-white mt-0.5">
                {documentDetails.title}
              </h1>
            </div>
          </div>

          {/* Stats Badge */}
          <div className="flex items-center gap-3 text-xs font-bold text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-black/30 border border-gray-200 dark:border-white/10 px-3 py-2 rounded-lg">
            <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400">
              <BookOpen className="w-3.5 h-3.5" /> {documentDetails.totalPages} Page(s)
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" /> {documentDetails.totalChunks} Chunks
            </span>
          </div>
        </div>
      )}

      {/* Quick Prompts */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Quick Prompts:</span>
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(null, prompt)}
            className="text-xs font-semibold px-3 py-1 bg-white dark:bg-white/5 hover:bg-cyan-500/10 border border-gray-200 dark:border-white/10 rounded-full text-indigo-600 dark:text-cyan-300 transition-colors cursor-pointer"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Workspace */}
      <div className="bg-white dark:bg-[#11121c] border border-gray-200 dark:border-white/10 rounded-2xl p-4 md:p-6 shadow-xl flex flex-col h-[520px] justify-between space-y-4">
        
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 shadow-sm ${
                msg.sender === 'user' 
                  ? 'bg-gradient-to-tr from-indigo-600 to-indigo-700' 
                  : 'bg-gradient-to-tr from-cyan-500 to-indigo-600'
              }`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Bubble Content */}
              <div className={`max-w-[80%] rounded-2xl p-4 space-y-2 text-xs md:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white font-medium rounded-tr-none shadow-md'
                  : 'bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 rounded-tl-none shadow-sm'
              }`}>
                {msg.sender === 'user' ? (
                  <p className="whitespace-pre-line">{msg.text}</p>
                ) : (
                  <FormattedMarkdownText text={msg.text} />
                )}

                {/* Page Citations & Passages */}
                {msg.sender === 'ai' && msg.referencedPages && msg.referencedPages.length > 0 && (
                  <div className="pt-2 border-t border-gray-200 dark:border-white/10 flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Sources:</span>
                    {msg.referencedPages.map((pNum, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setActivePassages(msg.passages?.filter(p => p.pageNumber === pNum))}
                        className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors cursor-pointer"
                      >
                        📍 Page {pNum}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl rounded-tl-none px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-500" /> Reading document chunks & thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={(e) => handleSendMessage(e)} className="relative flex items-center pt-2 border-t border-gray-100 dark:border-white/10">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder={`Ask anything about "${documentDetails?.title || 'this document'}"...`}
            className="w-full bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl pl-4 pr-24 py-3 text-xs md:text-sm font-semibold outline-none focus:border-cyan-500 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={isLoading || !inputQuestion.trim()}
            className="absolute right-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-40 text-white font-extrabold text-xs rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        </form>

      </div>

      {/* Active Passage Preview Modal / Drawer */}
      {activePassages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setActivePassages(null)}>
          <div className="bg-white dark:bg-[#161724] border border-gray-200 dark:border-white/10 rounded-xl p-5 max-w-lg w-full space-y-3 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-cyan-400 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-cyan-500" /> Passage Text References
              </h3>
              <button onClick={() => setActivePassages(null)} className="text-xs font-bold text-gray-400 hover:text-white cursor-pointer">
                ✕ Close
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {activePassages.map((p, idx) => (
                <div key={idx} className="bg-gray-50 dark:bg-black/40 border border-gray-100 dark:border-white/5 rounded-lg p-3 text-xs text-gray-700 dark:text-gray-300 font-mono relative">
                  <CornerDownRight className="w-3 h-3 text-cyan-500 absolute top-3 left-2" />
                  <p className="pl-4">"{p.text}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default DocumentChat;
