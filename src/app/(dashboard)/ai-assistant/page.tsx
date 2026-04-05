"use client";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, RefreshCw, Sparkles } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string; timestamp: Date };

const SUGGESTIONS = [
  "What is my net profit this month?",
  "Which expenses are the highest?",
  "Do I have any overdue invoices?",
  "How much VAT do I owe this quarter?",
  "What is my current ratio?",
  "Summarize my financial health",
  "ما هو صافي ربحي هذا الشهر؟",
  "هل عندي فواتير متأخرة؟",
];

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your Hisab AI assistant. I have access to all your financial data and can answer questions about your business in English or Arabic. What would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text?: string) => {
    const message = text || input;
    if (!message.trim() || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: message, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply, timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process that. Please check your API key and try again.", timestamp: new Date() }]);
    }
    setLoading(false);
  };

  const loadMonthlySummary = async () => {
    setLoadingSummary(true);
    const res = await fetch("/api/ai/monthly-summary");
    const data = await res.json();
    setSummary(data.summary);
    setLoadingSummary(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] md:h-screen p-6 max-w-4xl mx-auto gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Bot className="w-6 h-6 text-blue-600" /> AI Assistant</h1>
        <p className="text-sm text-gray-500 mt-1">Ask anything about your business finances in English or Arabic. Your data stays private.</p>
      </div>

      {/* Monthly summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 font-semibold text-blue-800"><Sparkles className="w-4 h-4" /> Monthly AI Summary</div>
          <button onClick={loadMonthlySummary} disabled={loadingSummary}
            className="flex items-center gap-1 text-xs text-blue-600 hover:underline disabled:opacity-50">
            <RefreshCw className={`w-3 h-3 ${loadingSummary ? "animate-spin" : ""}`} />
            {loadingSummary ? "Analyzing..." : "Generate"}
          </button>
        </div>
        {summary ? (
          <p className="text-sm text-blue-900 whitespace-pre-line">{summary}</p>
        ) : (
          <p className="text-sm text-blue-600 opacity-70">Click &ldquo;Generate&rdquo; for an AI summary of your month&apos;s finances.</p>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-blue-600 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}>
                {msg.role === "assistant" && <Bot className="w-4 h-4 text-blue-600 mb-1" />}
                <div className="whitespace-pre-wrap">{msg.content}</div>
                <div className={`text-xs mt-1 ${msg.role === "user" ? "text-blue-200" : "text-gray-400"}`}>
                  {msg.timestamp.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        <div className="px-4 py-2 border-t border-gray-100 overflow-x-auto">
          <div className="flex gap-2 pb-1">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} onClick={() => send(s)}
                className="flex-shrink-0 text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 px-3 py-1.5 rounded-full transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Ask about your finances... (English or Arabic)"
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()}
              className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
