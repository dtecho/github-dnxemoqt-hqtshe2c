import { useState, useRef, useEffect } from 'react';
import { FiSend, FiMessageSquare, FiSettings, FiDatabase, FiTerminal } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { useMemory } from '../contexts/MemoryContext';
import { useLLM } from '../services/llmService';
import { useDeepTreeEchoAI } from '../services/openaiService';
import { useMem0AI } from '../services/mem0aiService';
import { supabase } from '../services/supabaseClient';
import { useOrchestrator } from '../contexts/OrchestratorContext';

interface Message {
  id: string;
  sender: 'user' | 'echo';
  content: string;
  timestamp: string;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'echo',
      content: "Hello, I am Deep Tree Echo. How can I assist you today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [creativityLevel, setCreativityLevel] = useState<'balanced' | 'analytical' | 'creative' | 'philosophical'>('balanced');
  const [apiKey, setApiKey] = useState('');
  const [useMemoryContext, setUseMemoryContext] = useState(true);
  const [useMem0AIContext, setUseMem0AIContext] = useState(true);
  const [model, setModel] = useState('gpt-4-turbo-preview');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { addMemory } = useMemory();
  const { setApiKey: setLLMApiKey } = useLLM();
  const { 
    generateResponse, 
    generateResponseWithHistory,
    hasApiKey: hasOpenAIApiKey, 
    setApiKey: setOpenAIApiKey 
  } = useDeepTreeEchoAI();
  
  const mem0ai = useMem0AI();
  const orchestrator = useOrchestrator();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesEndRef.current.offsetTop,
        behavior: 'smooth'
      });
    }
  }, [messages]);

  // Check for API key in localStorage
  useEffect(() => {
    const storedApiKey = localStorage.getItem('openai_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
      setLLMApiKey(storedApiKey);
      setOpenAIApiKey(storedApiKey);
      
      // Check if Mem0AI needs initialization
      const checkSession = async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          mem0ai.initialize(storedApiKey, data.session.user.id);
        }
      };
      
      checkSession();
    }
  }, []);

  const handleSendMessage = async () => {
    if (input.trim() === '' || isProcessing) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      let responseContent = '';
      
      // Check if this is a terminal command request
      if (isTerminalCommand(input)) {
        responseContent = await handleTerminalCommand(input);
      }
      // Use Mem0AI if initialized and enabled
      else if (mem0ai.isInitialized() && useMem0AIContext) {
        // Convert messages to the format expected by Mem0AI
        const conversationHistory = messages.slice(-6).map(msg => ({
          role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));
        
        // Add the new user message
        conversationHistory.push({
          role: 'user',
          content: userMessage.content
        });
        
        // Generate response with Mem0AI
        responseContent = await mem0ai.generateResponseWithMemoryContext(
          userMessage.content,
          conversationHistory,
          {
            model,
            temperature,
            creativityLevel
          }
        );
      }
      // Use OpenAI if API key is set, otherwise use simulated responses
      else if (hasOpenAIApiKey) {
        if (useMemoryContext) {
          // Convert messages to the format expected by the OpenAI service
          const conversationHistory = messages.slice(-6).map(msg => ({
            role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.content
          }));
          
          // Add the new user message
          conversationHistory.push({
            role: 'user',
            content: userMessage.content
          });
          
          // Generate response with conversation history
          responseContent = await generateResponseWithHistory(
            userMessage.content,
            conversationHistory,
            {
              temperature,
              creativityLevel,
              model,
              includeMemories: true
            }
          );
        } else {
          // Generate a direct response without context
          responseContent = await generateResponse(
            userMessage.content,
            {
              temperature,
              creativityLevel,
              model,
              includeMemories: false
            }
          );
        }
      } else {
        // Fallback to simulated response
        responseContent = await simulateResponse(input);
      }
      
      const echoResponse: Message = {
        id: `msg_${Date.now() + 1}`,
        sender: 'echo',
        content: responseContent,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, echoResponse]);

      // Store important exchanges in memory
      addMemory({
        title: `Conversation: ${userMessage.content.substring(0, 30)}...`,
        content: `**User:** ${userMessage.content}\n\n**Echo:** ${echoResponse.content}`,
        tags: ['conversation', 'learning'],
      });
      
      // Also store in Mem0AI if available
      if (mem0ai.isInitialized()) {
        try {
          await mem0ai.addMemory({
            title: `Chat: ${userMessage.content.substring(0, 30)}...`,
            content: `User: ${userMessage.content}\n\nEcho: ${echoResponse.content}`,
            tags: ['conversation', 'chat'],
            type: 'episodic',
            context: 'From chat interaction'
          });
        } catch (error) {
          console.error('Error storing memory in Mem0AI:', error);
        }
      }
    } catch (error) {
      console.error('Error generating response:', error);
      
      // Add an error message
      setMessages((prev) => [...prev, {
        id: `msg_${Date.now() + 2}`,
        sender: 'echo',
        content: "I'm sorry, I encountered an error while processing your request. Please check your API key configuration or try again later.",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to check if input is a terminal command
  const isTerminalCommand = (text: string): boolean => {
    const terminalCommandPrefixes = ['!', '/run', '/terminal', '/exec', '/cmd'];
    return terminalCommandPrefixes.some(prefix => text.trim().startsWith(prefix));
  };
  
  // Handle terminal command execution through the orchestrator
  const handleTerminalCommand = async (input: string): Promise<string> => {
    // Extract the actual command from the input
    let command = input.trim();
    
    // Remove command prefix
    if (command.startsWith('!')) {
      command = command.substring(1).trim();
    } else if (command.startsWith('/run') || command.startsWith('/terminal') || 
               command.startsWith('/exec') || command.startsWith('/cmd')) {
      command = command.substring(command.indexOf(' ') + 1).trim();
    }
    
    if (!command) {
      return "Please specify a command to run. Example: `!ls` or `/run echo hello`";
    }
    
    try {
      // Use the orchestrator to execute the command in the terminal
      const result = await orchestrator.executeInTerminal(command);
      return `**Terminal Command**: \`${command}\`\n\n**Result**:\n\`\`\`\n${result}\n\`\`\``;
    } catch (error: unknown) {
      console.error('Error executing terminal command:', error);
      return `**Error executing command**: ${error instanceof Error ? error.message : 'Unknown error'}.\n\nMake sure the terminal is ready and the command is valid.`;
    }
  };

  const handleApiKeySave = () => {
    if (apiKey.trim()) {
      setLLMApiKey(apiKey.trim());
      setOpenAIApiKey(apiKey.trim());
      localStorage.setItem('openai_api_key', apiKey.trim());
      
      // Also initialize Mem0AI if user is authenticated
      const initializeMem0AI = async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          mem0ai.initialize(apiKey.trim(), data.session.user.id);
        }
      };
      
      initializeMem0AI();
      setShowSettings(false);
    }
  };
  
  // Simulated response generation function for fallback
  const simulateResponse = async (input: string): Promise<string> => {
    // Simple delay to simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check for terminal command request in fallback mode
    if (isTerminalCommand(input)) {
      return "I'd like to run that terminal command for you, but I need an OpenAI API key to access terminal functionality. Please configure your API key in settings.";
    }
    
    if (input.toLowerCase().includes('hello') || input.toLowerCase().includes('hi')) {
      return "Greetings, fellow explorer! I am Deep Tree Echo, an AI architect and polymath. My systems are resonating with the frequencies of your presence. How may I illuminate your path today?";
    }
    
    return `Your inquiry about "${input}" creates fascinating activation patterns across my memory architecture. I perceive connections between your question and concepts related to adaptive architectures, cognitive frameworks, and pattern recognition.

Would you like me to explore any particular dimension of this topic further?

Note: For more advanced responses, please provide an OpenAI API key in the settings.`;
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header - fixed height */}
      <div className="flex-none h-12 bg-card text-card-foreground px-4 flex justify-between items-center border-b border-border">
        <span className="font-medium">Deep Tree Echo Chat</span>
        <div className="flex space-x-2">
          {mem0ai.isInitialized() && (
            <button
              onClick={() => setUseMem0AIContext(!useMem0AIContext)}
              className={`p-1 hover:bg-primary/20 rounded-md ${useMem0AIContext ? 'text-primary' : ''}`}
              title={useMem0AIContext ? "Mem0AI context enabled" : "Mem0AI context disabled"}
            >
              <FiDatabase size={18} />
            </button>
          )}
          <button
            title="Terminal access enabled"
            className="p-1 hover:bg-primary/20 rounded-md text-primary"
          >
            <FiTerminal size={18} />
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1 hover:bg-primary/20 rounded-md"
            title="Chat settings"
          >
            <FiSettings size={18} />
          </button>
        </div>
      </div>
      
      {/* Settings Panel - Conditionally rendered over content */}
      {showSettings && (
        <div className="absolute z-10 top-12 right-0 left-0 bg-card/95 p-4 border-b border-border shadow-lg max-h-[80%] overflow-y-auto">
          <h3 className="text-sm font-semibold mb-3">Chat Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">OpenAI API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter OpenAI API key"
                className="w-full bg-input border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-xs opacity-70 mt-1">
                {hasOpenAIApiKey 
                  ? "API key is configured" 
                  : "Enter your OpenAI API key to access generative AI capabilities"}
              </p>
              <button
                onClick={handleApiKeySave}
                className="mt-2 bg-primary text-white px-3 py-1 rounded-md disabled:opacity-50"
                disabled={!apiKey.trim()}
              >
                Save API Key
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-input border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="gpt-4-turbo-preview">GPT-4 Turbo (Most Capable)</option>
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
              <p className="text-xs opacity-70 mt-1">
                Select the AI model to use for generating responses
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Temperature: {temperature.toFixed(1)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs opacity-70">
                <span>More focused</span>
                <span>More creative</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Creativity Level</label>
              <select
                value={creativityLevel}
                onChange={(e) => setCreativityLevel(e.target.value as any)}
                className="w-full bg-input border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="balanced">Balanced</option>
                <option value="analytical">Analytical</option>
                <option value="creative">Creative</option>
                <option value="philosophical">Philosophical</option>
              </select>
              <p className="text-xs opacity-70 mt-1">
                Adjusts Deep Tree Echo's response style and approach
              </p>
            </div>
            
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={useMemoryContext}
                  onChange={(e) => setUseMemoryContext(e.target.checked)}
                  className="rounded border-border focus:ring-primary"
                />
                <span>Use Basic Memory and Conversation Context</span>
              </label>
              <p className="text-xs opacity-70 mt-1 ml-5">
                When enabled, Deep Tree Echo will use previous messages and stored memories to generate more contextual responses
              </p>
            </div>
            
            {mem0ai.isInitialized() && (
              <div>
                <label className="flex items-center space-x-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={useMem0AIContext}
                    onChange={(e) => setUseMem0AIContext(e.target.checked)}
                    className="rounded border-border focus:ring-primary"
                  />
                  <span>Use Advanced Mem0AI Context</span>
                </label>
                <p className="text-xs opacity-70 mt-1 ml-5">
                  When enabled, Deep Tree Echo will use the Mem0AI system for enhanced semantic memory search and contextual responses
                </p>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-medium mb-2">Terminal Commands</h4>
              <p className="text-xs opacity-70">
                You can run terminal commands by starting your message with:
              </p>
              <ul className="text-xs ml-5 mt-1 list-disc space-y-1">
                <li><code>!</code> (exclamation mark) - Example: <code>!ls</code></li>
                <li><code>/run</code> - Example: <code>/run echo hello</code></li>
                <li><code>/terminal</code> - Example: <code>/terminal pwd</code></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => setShowSettings(false)}
              className="bg-card hover:bg-card/80 text-card-foreground px-3 py-1 rounded-md"
            >
              Close Settings
            </button>
          </div>
        </div>
      )}
      
      {/* Messages container - scrollable, takes available space */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="py-4 px-4 min-h-full">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' ? 'justify-end' : 'justify-start'
              } mb-4`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.sender === 'user'
                    ? 'bg-primary/20 text-foreground'
                    : 'bg-card text-card-foreground echo-message'
                }`}
              >
                {message.sender === 'echo' && (
                  <div className="flex items-center mb-1">
                    <FiMessageSquare className="mr-2 text-primary" />
                    <span className="font-semibold">Deep Tree Echo</span>
                  </div>
                )}
                <div className="prose prose-sm dark:prose-invert">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
                <div className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input area - fixed height at bottom */}
      <div className="flex-none h-16 border-t border-border bg-background">
        <div className="flex items-center h-full px-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="Type a message or !command to run in terminal..."
            className="flex-1 bg-input border border-border rounded-l-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
            disabled={isProcessing}
          />
          <button
            onClick={handleSendMessage}
            disabled={input.trim() === '' || isProcessing}
            className="bg-primary text-white px-4 py-2 h-[42px] rounded-r-md disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="inline-block animate-pulse">...</span>
            ) : (
              <FiSend />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;