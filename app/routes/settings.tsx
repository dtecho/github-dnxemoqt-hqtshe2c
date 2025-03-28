import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { FiSave, FiRefreshCw, FiTrash2 } from "react-icons/fi";

export async function loader() {
  return json({
    apiKeyConfigured: process.env.OPENAI_API_KEY ? true : false,
    theme: "dark",
    memoryStats: {
      total: 42,
      recentlyAdded: 7
    }
  });
}

export default function SettingsPage() {
  const { apiKeyConfigured, theme: savedTheme, memoryStats } = useLoaderData<typeof loader>();
  const [theme, setTheme] = useState(savedTheme);
  const [apiKey, setApiKey] = useState("");
  const [editorPreference, setEditorPreference] = useState("monaco");
  
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Configure Deep Tree Echo to your preferences</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          {/* API Configuration */}
          <section className="bg-card p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">API Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="openai-api-key" className="block text-sm font-medium mb-1">
                  OpenAI API Key
                </label>
                <div className="flex">
                  <input
                    type="password"
                    id="openai-api-key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={apiKeyConfigured ? "••••••••••••••••••••••" : "sk-..."}
                    className="flex-1 bg-input border border-border rounded-l-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    type="button"
                    className="bg-primary text-white px-4 py-2 rounded-r-md"
                  >
                    Save
                  </button>
                </div>
                <p className="text-xs mt-1 opacity-70">
                  Required for AI chat and memory embedding generation
                </p>
              </div>
              
              <div>
                <label htmlFor="supabase-url" className="block text-sm font-medium mb-1">
                  Supabase URL
                </label>
                <input
                  type="text"
                  id="supabase-url"
                  placeholder="https://example.supabase.co"
                  className="w-full bg-input border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  disabled
                />
                <p className="text-xs mt-1 opacity-70">
                  Set in environment variables
                </p>
              </div>
              
              <div>
                <label htmlFor="supabase-key" className="block text-sm font-medium mb-1">
                  Supabase Anon Key
                </label>
                <input
                  type="password"
                  id="supabase-key"
                  placeholder="••••••••••••••••••••••"
                  className="w-full bg-input border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  disabled
                />
                <p className="text-xs mt-1 opacity-70">
                  Set in environment variables
                </p>
              </div>
            </div>
          </section>
          
          {/* Appearance */}
          <section className="bg-card p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Appearance</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Theme
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`p-4 rounded-lg border ${
                      theme === "light" 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="font-medium mb-1">Light</div>
                    <div className="h-10 bg-white border border-gray-200 rounded"></div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`p-4 rounded-lg border ${
                      theme === "dark" 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="font-medium mb-1">Dark</div>
                    <div className="h-10 bg-gray-900 border border-gray-700 rounded"></div>
                  </button>
                </div>
              </div>
              
              <div className="pt-2">
                <button
                  type="button"
                  className="flex items-center px-4 py-2 bg-primary text-white rounded-md"
                >
                  <FiSave className="mr-2" />
                  Save Appearance
                </button>
              </div>
            </div>
          </section>
          
          {/* Editor Preferences */}
          <section className="bg-card p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Editor Preferences</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Editor Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setEditorPreference("monaco")}
                    className={`p-4 rounded-lg border ${
                      editorPreference === "monaco" 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="font-medium">Monaco Editor</div>
                    <div className="text-xs opacity-70 mt-1">VS Code-like experience</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorPreference("codemirror")}
                    className={`p-4 rounded-lg border ${
                      editorPreference === "codemirror" 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="font-medium">CodeMirror</div>
                    <div className="text-xs opacity-70 mt-1">Lightweight editor</div>
                  </button>
                </div>
              </div>
              
              <div>
                <label htmlFor="font-size" className="block text-sm font-medium mb-1">
                  Font Size
                </label>
                <select
                  id="font-size"
                  className="w-full bg-input border border-border rounded-md px-3 py-2"
                >
                  <option value="12">12px</option>
                  <option value="14" selected>14px</option>
                  <option value="16">16px</option>
                  <option value="18">18px</option>
                </select>
              </div>
              
              <div className="pt-2">
                <button
                  type="button"
                  className="flex items-center px-4 py-2 bg-primary text-white rounded-md"
                >
                  <FiSave className="mr-2" />
                  Save Editor Preferences
                </button>
              </div>
            </div>
          </section>
        </div>
        
        <div className="space-y-6">
          {/* Account Status */}
          <section className="bg-card p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Account Status</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Login Status:</span>
                <span className="text-green-400">Signed In</span>
              </div>
              <div className="flex justify-between">
                <span>API Connection:</span>
                <span className={apiKeyConfigured ? "text-green-400" : "text-yellow-400"}>
                  {apiKeyConfigured ? "Connected" : "Not Configured"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Memory Records:</span>
                <span>{memoryStats.total}</span>
              </div>
              <div className="flex justify-between">
                <span>Recent Memories:</span>
                <span>{memoryStats.recentlyAdded}</span>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-border">
              <button 
                className="w-full flex items-center justify-center px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md mb-2"
              >
                <FiRefreshCw className="mr-2" />
                Sync Memory
              </button>
              <button 
                className="w-full flex items-center justify-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md"
              >
                <FiTrash2 className="mr-2" />
                Clear Memory
              </button>
            </div>
          </section>
          
          {/* About */}
          <section className="bg-card p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">About</h2>
            <p className="text-sm opacity-70 mb-4">
              Deep Tree Echo is an advanced AI workspace with integrated memory systems and interactive components.
            </p>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Version:</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span>April 15, 2025</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}