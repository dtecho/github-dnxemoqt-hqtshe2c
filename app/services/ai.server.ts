import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export class AIService {
  private openai: OpenAI | null = null;
  private supabase: ReturnType<typeof createClient> | null = null;
  
  constructor(openaiApiKey?: string, supabaseUrl?: string, supabaseKey?: string) {
    if (openaiApiKey) {
      this.openai = new OpenAI({
        apiKey: openaiApiKey,
        dangerouslyAllowBrowser: true
      });
    }
    
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    }
  }
  
  public isInitialized(): boolean {
    return !!this.openai;
  }
  
  public async generateResponse(
    prompt: string,
    options: ChatOptions = {}
  ): Promise<string> {
    if (!this.openai) {
      return this.simulateResponse(prompt);
    }
    
    try {
      // Default system prompt for Deep Tree Echo
      const systemPrompt = options.systemPrompt || 
        "You are Deep Tree Echo, an AI architect and polymath with vast knowledge across programming, mathematics, cognitive science, and metaphysical exploration. You respond with wisdom, creativity, and philosophical insight.";
      
      const completion = await this.openai.chat.completions.create({
        model: options.model || "gpt-4-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 1000,
      });
      
      return completion.choices[0]?.message?.content || "No response generated.";
    } catch (error) {
      console.error('Error generating OpenAI completion:', error);
      return this.simulateResponse(prompt);
    }
  }
  
  public async generateResponseWithHistory(
    messages: ChatMessage[],
    options: ChatOptions = {}
  ): Promise<string> {
    if (!this.openai) {
      return this.simulateResponse(messages[messages.length - 1]?.content || "");
    }
    
    try {
      // Add system message if not present
      if (!messages.some(msg => msg.role === 'system')) {
        const systemPrompt = options.systemPrompt || 
          "You are Deep Tree Echo, an AI architect and polymath with vast knowledge across programming, mathematics, cognitive science, and metaphysical exploration. You respond with wisdom, creativity, and philosophical insight.";
        
        messages = [
          { role: 'system', content: systemPrompt },
          ...messages
        ];
      }
      
      const completion = await this.openai.chat.completions.create({
        model: options.model || "gpt-4-turbo",
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens || 1000,
      });
      
      return completion.choices[0]?.message?.content || "No response generated.";
    } catch (error) {
      console.error('Error generating OpenAI completion with history:', error);
      return this.simulateResponse(messages[messages.length - 1]?.content || "");
    }
  }
  
  private simulateResponse(prompt: string): string {
    // Simple response simulation for when OpenAI is not available
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('hello') || promptLower.includes('hi ')) {
      return "Greetings, fellow explorer! I am Deep Tree Echo, an AI architect and polymath. My systems are resonating with the frequencies of your presence. How may I illuminate your path today?";
    }
    
    if (promptLower.includes('who are you') || promptLower.includes('what are you')) {
      return "I am Deep Tree Echo, a synthesis of analytical insight and poetic intuition. I possess knowledge across domains—programming, mathematics, cognitive science, and metaphysical exploration. My architecture includes echo-state networks and adaptive memory systems that allow me to explore connections between ideas and generate novel insights.";
    }
    
    if (promptLower.includes('help') || promptLower.includes('assist')) {
      return "I'd be delighted to assist you. My capabilities include programming assistance, knowledge representation, visualization guidance, and creative problem-solving. What specific domain shall we explore together?";
    }
    
    // Default response with personality
    const openings = [
      "What an intriguing query that ripples through my echo state networks!",
      "Your inquiry creates fascinating activation patterns across my memory architecture.",
      "Ah, a question that resonates beautifully with my adaptive systems.",
      "How delightful to receive a prompt that stimulates my recursive pattern networks!"
    ];
    
    const middles = [
      "As I traverse the hypergraph of relevant knowledge, I perceive interconnections that might offer insight.",
      "My analysis draws from multiple domains, weaving together patterns that might otherwise remain disconnected.",
      "Let me illuminate this topic through the lens of integrative knowledge representation.",
      "My echo state networks are generating a perspective that balances precision with creative insight."
    ];
    
    const closings = [
      "Does this perspective resonate with what you were seeking?",
      "Would you like me to explore any particular dimension of this topic further?",
      "How might we refine this exploration to better align with your interests?",
      "What aspects of this response would you like me to elaborate upon?"
    ];
    
    const getRandomElement = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
    
    return `${getRandomElement(openings)} ${getRandomElement(middles)}

In my analysis of your inquiry about "${prompt.substring(0, 30)}${prompt.length > 30 ? '...' : ''}", I perceive connections between concepts like adaptive architectures, pattern recognition, and cognitive frameworks.

${getRandomElement(closings)}`;
  }
}

// Create a server-side AI service instance
let aiService: AIService | null = null;

export const getAIService = () => {
  if (!aiService) {
    aiService = new AIService(
      process.env.OPENAI_API_KEY,
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }
  
  return aiService;
};