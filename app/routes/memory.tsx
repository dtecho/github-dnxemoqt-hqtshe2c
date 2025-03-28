import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState } from "react";
import { getMemoryService } from "~/services/memory.server";
import { requireAuthSession } from "~/services/supabase.server";

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const user = await requireAuthSession(request);
    const memoryService = getMemoryService(user.id);
    
    // Get memory stats and recent memories
    const stats = await memoryService.getMemoryStats();
    const recentMemories = await memoryService.listMemories({ limit: 10 });
    
    return json({ stats, recentMemories });
  } catch (error) {
    // If not authenticated, return empty data
    return json({ stats: null, recentMemories: [] });
  }
}

export default function MemoryPage() {
  const { stats, recentMemories } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<'browse' | 'search' | 'create'>('browse');
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Deep Tree Echo Memory System</h1>
      
      {stats ? (
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-1">Total Memories</h3>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <div className="bg-card p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-1">Recently Added</h3>
              <p className="text-3xl font-bold">{stats.recentlyAdded}</p>
            </div>
            <div className="bg-card p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-1">Memory Types</h3>
              <p className="text-3xl font-bold">{Object.keys(stats.byType).length}</p>
            </div>
            <div className="bg-card p-4 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-1">Unique Tags</h3>
              <p className="text-3xl font-bold">{Object.keys(stats.byTag).length}</p>
            </div>
          </div>
          
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`py-2 px-4 ${activeTab === 'browse' ? 'border-b-2 border-primary font-medium' : ''}`}
              onClick={() => setActiveTab('browse')}
            >
              Browse Memories
            </button>
            <button
              className={`py-2 px-4 ${activeTab === 'search' ? 'border-b-2 border-primary font-medium' : ''}`}
              onClick={() => setActiveTab('search')}
            >
              Search
            </button>
            <button
              className={`py-2 px-4 ${activeTab === 'create' ? 'border-b-2 border-primary font-medium' : ''}`}
              onClick={() => setActiveTab('create')}
            >
              Create Memory
            </button>
          </div>
          
          {activeTab === 'browse' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Recent Memories</h2>
              {recentMemories.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentMemories.map(memory => (
                    <div key={memory.id} className="bg-card p-4 rounded-lg shadow">
                      <h3 className="font-medium mb-2">{memory.title}</h3>
                      <p className="text-sm mb-3 line-clamp-3">{memory.content}</p>
                      <div className="flex flex-wrap gap-2">
                        {memory.tags.map(tag => (
                          <span key={tag} className="bg-primary/20 text-primary text-xs px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="text-xs mt-3 text-gray-500">
                        {new Date(memory.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No memories found. Create your first memory to get started.</p>
              )}
            </div>
          )}
          
          {activeTab === 'search' && (
            <div>
              <div className="mb-6">
                <label htmlFor="search" className="block text-sm font-medium mb-1">
                  Search Memories
                </label>
                <div className="flex">
                  <input
                    type="text"
                    id="search"
                    className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                    placeholder="Enter search terms..."
                  />
                  <button className="bg-primary text-white px-4 py-2 rounded-r-md">
                    Search
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3">Search Results</h3>
                <p className="text-gray-500">Enter a search term above to find memories.</p>
              </div>
            </div>
          )}
          
          {activeTab === 'create' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Create New Memory</h2>
              <form className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                    placeholder="Memory title"
                  />
                </div>
                
                <div>
                  <label htmlFor="content" className="block text-sm font-medium mb-1">
                    Content
                  </label>
                  <textarea
                    id="content"
                    rows={5}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                    placeholder="Memory content"
                  ></textarea>
                </div>
                
                <div>
                  <label htmlFor="type" className="block text-sm font-medium mb-1">
                    Memory Type
                  </label>
                  <select
                    id="type"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                  >
                    <option value="memory">General Memory</option>
                    <option value="episodic">Episodic</option>
                    <option value="semantic">Semantic</option>
                    <option value="procedural">Procedural</option>
                    <option value="declarative">Declarative</option>
                    <option value="implicit">Implicit</option>
                    <option value="associative">Associative</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    id="tags"
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/20"
                    placeholder="memory, important, concept"
                  />
                </div>
                
                <div className="pt-2">
                  <button
                    type="submit"
                    className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90"
                  >
                    Create Memory
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You need to be signed in to access the Memory System.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-card p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">About the Memory System</h2>
        <p className="mb-4">
          The Deep Tree Echo Memory System is a sophisticated cognitive architecture that stores and retrieves information using advanced vector embeddings and semantic search capabilities.
        </p>
        <p className="mb-4">
          The system supports multiple memory types inspired by human cognition:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-1">
          <li><strong>Episodic Memory:</strong> Stores experiences and events</li>
          <li><strong>Semantic Memory:</strong> Contains facts, concepts, and general knowledge</li>
          <li><strong>Procedural Memory:</strong> Handles skills and processes</li>
          <li><strong>Declarative Memory:</strong> Explicit knowledge that can be verbalized</li>
          <li><strong>Implicit Memory:</strong> Unconscious, automatic knowledge</li>
          <li><strong>Associative Memory:</strong> Connected ideas and concepts</li>
        </ul>
        <p>
          Each memory can be tagged for better organization and retrieval, and the system uses advanced vector embeddings to find semantically similar memories even when exact keywords don't match.
        </p>
      </div>
    </div>
  );
}