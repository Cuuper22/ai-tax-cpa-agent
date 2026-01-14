import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Trash2, AlertCircle, Sparkles } from "lucide-react";
import { ai, type ChatResponse, type ChatContext } from "@/lib/tauri";
import { useChatStore, useSettingsStore } from "@/store";

export default function AIChat() {
  const { messages, setMessages, isLoading, setLoading, addMessage, clearMessages } = useChatStore();
  const { hasApiKey } = useSettingsStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadHistory = async () => {
    try {
      const history = await ai.getHistory(50);
      setMessages(history);
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !hasApiKey) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message optimistically
    const tempUserMsg: ChatResponse = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    addMessage(tempUserMsg);
    
    setLoading(true);
    try {
      const context: ChatContext = { tax_year: 2024 };
      const response = await ai.sendMessage(userMessage, context);
      addMessage(response);
    } catch (error) {
      addMessage({
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `Sorry, I encountered an error: ${error}`,
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Clear all chat history?")) return;
    try {
      await ai.clearHistory();
      clearMessages();
    } catch (error) {
      console.error("Failed to clear history:", error);
    }
  };

  const suggestedQuestions = [
    "What are the tax brackets for 2024?",
    "How do I maximize my deductions?",
    "What's the difference between standard and itemized deductions?",
    "When is the deadline to file my taxes?",
    "Can I deduct my home office expenses?",
  ];

  if (!hasApiKey) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="card p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-warning-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">API Key Required</h2>
          <p className="text-gray-500 mb-6">
            Please configure your Anthropic API key in Settings to use the AI assistant.
          </p>
          <a href="/settings" className="btn btn-primary">
            Go to Settings
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Tax Assistant</h1>
          <p className="text-gray-500 mt-1">Get help with your tax questions</p>
        </div>
        {messages.length > 0 && (
          <button onClick={handleClearHistory} className="btn btn-ghost text-gray-500">
            <Trash2 className="w-4 h-4" />
            Clear History
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mb-6"
            >
              <Sparkles className="w-10 h-10 text-primary-600" />
            </motion.div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">How can I help you today?</h2>
            <p className="text-gray-500 mb-6">Ask me anything about taxes, deductions, or filing</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
              {suggestedQuestions.map((q, i) => (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setInput(q)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-700 transition-colors"
                >
                  {q}
                </motion.button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-primary-600" />
                  </div>
                )}
                <div
                  className={`${
                    msg.role === "user"
                      ? "chat-message-user"
                      : "chat-message-assistant"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
                {msg.role === "user" && (
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                )}
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-primary-600" />
                </div>
                <div className="chat-message-assistant">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t pt-4">
        <div className="flex gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your tax question..."
            rows={1}
            className="input flex-1 resize-none min-h-[44px] max-h-32"
            style={{ height: "auto" }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="btn btn-primary h-[44px]"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          AI responses are for informational purposes only. Consult a tax professional for advice.
        </p>
      </div>
    </div>
  );
}
