import { useState, useEffect, useRef } from 'react';
import { Bot, Sparkles, X, Send, RotateCcw, ChevronRight, HelpCircle, ArrowRight } from 'lucide-react';
import axios from 'axios';
import FormattedMarkdownText from './FormattedMarkdownText';

const QUICK_PROMPTS = [
  { label: '📚 How to use Vault?', query: 'How does the Resource Vault and Chat with PDF work?' },
  { label: '💼 Find Placements', query: 'Where can I find placement drives and internships?' },
  { label: '👥 Find Peers by Skill', query: 'How do I find students by tech stack in Campus Network?' },
  { label: '💬 Real-Time Chat', query: 'How does real-time student messaging work?' },
  { label: '🏆 Clubs & Communities', query: 'How do I join clubs and campus communities?' },
  { label: '🗳️ Polls & Surveys', query: 'How do campus polls and student surveys work?' },
  { label: '📅 Campus Calendar', query: 'Where can I check upcoming events and workshops?' },
  { label: '🔍 Lost & Found', query: 'How do I post in the feed or report lost items?' }
];

function PlatformAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: `👋 **Welcome to CampusGrid!**\n\nI'm your **Campus Guide**. I can help you find notes, chat with study materials, discover placement drives, or connect with peers.\n\nClick any topic below or ask me anything!`,
      suggestions: [
        'How does Resource Vault work?',
        'Where are placement drives?',
        'How to find classmates in Network?',
        'How do clubs work?'
      ]
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages, isLoading]);

  const handleSend = async (e, customQuery) => {
    if (e) e.preventDefault();
    const query = customQuery || input;
    if (!query.trim() || isLoading) return;

    const userMessage = { sender: 'user', text: query };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setHasInteracted(true);

    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/assistant/chat`,
        { message: query },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const assistantMessage = {
        sender: 'assistant',
        text: data.reply || "I couldn't process that question. Try asking about Vault, Placements, or Communities!",
        suggestions: data.suggestions || []
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Assistant error:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: `⚠️ **Connection Issue**\nUnable to connect to the assistant service right now. Please check your connection or try again in a moment.`,
          suggestions: ['How to use Vault?', 'Where are placement drives?']
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        sender: 'assistant',
        text: `👋 **Chat reset!**\n\nWhat feature would you like to explore next?`,
        suggestions: [
          'How does Resource Vault work?',
          'Where are placement drives?',
          'How to find classmates in Network?',
          'How do clubs work?'
        ]
      }
    ]);
  };

  return (
    <>
      {/* Floating Toggle Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            aria-label="Open CampusGrid Guide"
            className="group relative flex items-center gap-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white px-4 py-3 rounded-full shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border border-white/20"
          >
            <div className="relative">
              <Bot className="w-5 h-5 transition-transform group-hover:rotate-12" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-indigo-600 animate-pulse" />
            </div>
            <span className="font-extrabold text-xs tracking-wide pr-1 hidden sm:inline-block">
              Campus Guide
            </span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-200 group-hover:scale-110 transition-transform" />
          </button>
        ) : null}
      </div>

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[420px] h-[560px] max-h-[82vh] flex flex-col bg-white dark:bg-[#0f0f11] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden transition-all duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-cyan-700 text-white shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-cyan-200" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-black text-sm tracking-tight leading-none text-white">
                    CampusGrid Guide
                  </h3>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-white/30 animate-pulse" />
                </div>
                <p className="text-[11px] text-indigo-100 font-medium mt-0.5">
                  Instant Platform Help & Walkthroughs
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="Restart Conversation"
                className="p-1.5 text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Guide"
                className="p-1.5 text-indigo-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/60 dark:bg-black/20 text-sm">
            
            {/* Quick Prompt Cards (Shown before extensive conversation) */}
            {!hasInteracted && (
              <div className="mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" /> Quick Topics
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_PROMPTS.slice(0, 6).map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(null, item.query)}
                      className="text-left text-[11px] font-bold px-2.5 py-2 rounded-lg bg-white dark:bg-[#18181b] border border-gray-200/80 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500 text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all shadow-xs hover:shadow-sm cursor-pointer line-clamp-1"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rendered Messages */}
            {messages.map((msg, index) => {
              const isAssistant = msg.sender === 'assistant';
              return (
                <div
                  key={index}
                  className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[88%] ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
                    {isAssistant && (
                      <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    )}
                    
                    <div
                      className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isAssistant
                          ? 'bg-white dark:bg-[#18181b] border border-gray-200/80 dark:border-white/10 text-gray-800 dark:text-gray-200 rounded-tl-xs shadow-xs'
                          : 'bg-indigo-600 text-white rounded-tr-xs shadow-sm font-medium'
                      }`}
                    >
                      {isAssistant ? (
                        <FormattedMarkdownText text={msg.text} />
                      ) : (
                        <p>{msg.text}</p>
                      )}
                    </div>
                  </div>

                  {/* Follow-up suggestions */}
                  {isAssistant && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 ml-8">
                      {msg.suggestions.map((suggestion, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => handleSend(null, suggestion)}
                          className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/70 dark:border-indigo-800/60 rounded-full px-2.5 py-1 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>{suggestion}</span>
                          <ArrowRight className="w-2.5 h-2.5 shrink-0 opacity-70" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="bg-white dark:bg-[#18181b] border border-gray-200 dark:border-white/10 rounded-2xl rounded-tl-xs p-3 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => handleSend(e)}
            className="p-3 bg-white dark:bg-[#121215] border-t border-gray-200 dark:border-white/10 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about CampusGrid..."
              className="flex-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white p-2 rounded-xl transition-all shrink-0 cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

export default PlatformAssistant;
