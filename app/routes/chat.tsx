import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData, useNavigation, Form } from "@remix-run/react";
import { useEffect, useState } from "react";
import ChatInterface, { Message } from "~/components/ChatInterface";
import { getAIService } from "~/services/ai.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const aiService = getAIService();
  
  return json({
    apiKeyConfigured: aiService.isInitialized(),
    initialMessage: {
      id: "welcome",
      role: "assistant" as const,
      content: "Welcome to Deep Tree Echo. How can I assist you today?",
      timestamp: new Date().toISOString()
    }
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const content = formData.get("content") as string;
  const history = JSON.parse(formData.get("history") as string || "[]") as Message[];
  
  if (!content) {
    return json({ error: "Message content is required" });
  }
  
  const aiService = getAIService();
  
  // Add user message to history
  const userMessage: Message = {
    id: `msg_${Date.now()}`,
    role: "user",
    content,
    timestamp: new Date().toISOString()
  };
  
  const updatedHistory = [...history, userMessage];
  
  try {
    // Convert messages to the format expected by the AI service
    const formattedMessages = updatedHistory.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Generate response
    const responseContent = await aiService.generateResponseWithHistory(formattedMessages);
    
    // Create assistant message
    const assistantMessage: Message = {
      id: `msg_${Date.now() + 1}`,
      role: "assistant",
      content: responseContent,
      timestamp: new Date().toISOString()
    };
    
    return json({
      userMessage,
      assistantMessage,
      success: true
    });
  } catch (error) {
    console.error("Error generating response:", error);
    return json({ 
      userMessage,
      error: "Failed to generate response. Please try again."
    });
  }
}

export default function ChatPage() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>([loaderData.initialMessage]);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState("");
  
  // Update messages when action data changes
  useEffect(() => {
    if (actionData?.userMessage) {
      setMessages(prev => [...prev, actionData.userMessage]);
    }
    
    if (actionData?.assistantMessage) {
      setMessages(prev => [...prev, actionData.assistantMessage]);
    }
  }, [actionData]);
  
  const handleSendMessage = (content: string) => {
    // The actual sending happens in the form submission
  };
  
  const isProcessing = navigation.state === "submitting";
  
  return (
    <div className="h-screen flex flex-col">
      <Form method="post" className="h-full">
        <input type="hidden" name="history" value={JSON.stringify(messages)} />
        <input type="hidden" name="content" id="message-content" />
        
        <ChatInterface
          messages={messages}
          onSendMessage={(content) => {
            // Set the content in the hidden input and submit the form
            const input = document.getElementById("message-content") as HTMLInputElement;
            if (input) {
              input.value = content;
              input.form?.requestSubmit();
            }
          }}
          isProcessing={isProcessing}
          apiKeyConfigured={loaderData.apiKeyConfigured}
          onConfigureApiKey={() => setShowApiKeyModal(true)}
        />
      </Form>
      
      {/* API Key Modal */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Configure OpenAI API Key</h2>
            <p className="mb-4 text-sm opacity-80">
              To use the full capabilities of Deep Tree Echo, please provide your OpenAI API key.
              Your key is stored securely and only used for generating AI responses.
            </p>
            
            <div className="mb-4">
              <label htmlFor="api-key" className="block text-sm font-medium mb-1">
                OpenAI API Key
              </label>
              <input
                type="password"
                id="api-key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-input border border-border rounded-md px-3 py-2"
                placeholder="sk-..."
              />
              <p className="text-xs mt-1 opacity-70">
                You can get your API key from the <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="text-primary hover:underline">OpenAI dashboard</a>.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowApiKeyModal(false)}
                className="px-4 py-2 border border-border rounded-md"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  // In a real app, this would save the API key to the server
                  // For now, we'll just close the modal
                  setShowApiKeyModal(false);
                }}
                className="px-4 py-2 bg-primary text-white rounded-md"
                disabled={!apiKey.trim().startsWith('sk-')}
              >
                Save API Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}