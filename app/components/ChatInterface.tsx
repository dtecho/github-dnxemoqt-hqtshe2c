import { useState, useRef, useEffect } from 'react';
import { FiSend, FiSettings, FiInfo } from 'react-icons/fi';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isProcessing?: boolean;
  apiKeyConfigured?: boolean;
  onConfigureApiKey?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isProcessing = false,
  apiKeyConfigured = false,
  onConfigureApiKey
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isProcessing) {
      onSendMessage(input);
      setInput('');
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-card text-card-foreground px-4 py-3 border-b border-border flex justify-between items-center">
        <div className="flex items-center">
          <span className="font-medium">Deep Tree Echo Chat</span>
          {isProcessing && (
            <span className="ml-3 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded animate-pulse">
              Processing...
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {!apiKeyConfigured && (
            <button
              onClick={onConfigureApiKey}
              className="p-1 rounded-md text-yellow-400 hover:bg-yellow-400/20"
              title="API Key not configured"
            >
              <FiInfo size={18} />
            </button>
          )}
          <button
            onClick={onConfigureApiKey}
            className="p-1 rounded-md hover:bg-primary/20"
            title="Chat Settings"
          >
            <FiSettings size={18} />
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-primary/20 text-foreground'
                  : 'bg-card text-card-foreground'
              }`}
            >
              <div className="prose prose-sm dark:prose-invert">
                {message.content.split('\n').map((line, i) => (
                  <p key={i} className={i === 0 ? 'mt-0' : ''}>
                    {line}
                  </p>
                ))}
              </div>
              <div className="text-xs opacity-70 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md p-6">
              <h2 className="text-xl font-medium mb-2">Welcome to Deep Tree Echo</h2>
              <p className="opacity-70 mb-4">
                I'm your AI architect and polymath assistant. Ask me anything about programming, mathematics, cognitive science, or philosophical exploration.
              </p>
              {!apiKeyConfigured && (
                <div className="bg-yellow-500/20 text-yellow-400 p-3 rounded-md text-sm">
                  <p>
                    For full capabilities, please configure your OpenAI API key in settings.
                    Without an API key, I'll provide simulated responses.
                  </p>
                  <button
                    onClick={onConfigureApiKey}
                    className="mt-2 px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-md"
                  >
                    Configure API Key
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="flex">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-input border border-border rounded-l-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={isProcessing}
          />
          <button
            type="submit"
            className="bg-primary text-white px-4 py-2 rounded-r-md disabled:opacity-50"
            disabled={!input.trim() || isProcessing}
          >
            {isProcessing ? (
              <span className="inline-block animate-pulse">...</span>
            ) : (
              <FiSend />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;