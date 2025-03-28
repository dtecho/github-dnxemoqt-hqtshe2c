import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export async function loader() {
  return json({
    title: "About Deep Tree Echo",
    version: "1.0.0",
    description: "Advanced AI workspace environment with integrated memory systems and interactive components"
  });
}

export default function AboutPage() {
  const { title, version, description } = useLoaderData<typeof loader>();
  
  return (
    <div className="container mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-xl opacity-70">{description}</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Overview</h2>
          <p className="mb-4">
            Deep Tree Echo is a unique AI-powered workspace environment designed to explore cognitive architectures and creative development. It combines several key technologies:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Echo State Networks for temporal pattern recognition</li>
            <li>Advanced vector-based memory systems</li>
            <li>Supabase database integration for persistent storage</li>
            <li>React and Remix for a responsive user interface</li>
            <li>OpenAI integration for enhanced AI capabilities</li>
          </ul>
        </section>
        
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">Core Features</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-1">Echo Home Map</h3>
              <p className="text-sm opacity-80">Spatial interface with specialized rooms for different functionalities</p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Memory System</h3>
              <p className="text-sm opacity-80">Store and retrieve information using vector embeddings and semantic search</p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">AI Chat</h3>
              <p className="text-sm opacity-80">Interact with Deep Tree Echo's AI capabilities through a conversational interface</p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-1">Code Editor</h3>
              <p className="text-sm opacity-80">Development environment for coding and experimenting</p>
            </div>
          </div>
        </section>
        
        <section className="bg-card p-6 rounded-lg shadow-md md:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">Technical Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Frontend</h3>
              <ul className="space-y-1 text-sm">
                <li>React</li>
                <li>Remix</li>
                <li>Tailwind CSS</li>
                <li>Framer Motion</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Backend</h3>
              <ul className="space-y-1 text-sm">
                <li>Node.js</li>
                <li>Supabase</li>
                <li>Vector Embeddings</li>
                <li>Netlify Deployment</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">AI Integration</h3>
              <ul className="space-y-1 text-sm">
                <li>OpenAI API</li>
                <li>Echo State Networks</li>
                <li>Self-Morphing Stream Networks</li>
                <li>Hypergraph Knowledge Representation</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
      
      <footer className="mt-12 text-center opacity-70">
        <p>Deep Tree Echo • Version {version}</p>
        <p className="text-sm mt-1">© 2025 Deep Tree Echo Project</p>
      </footer>
    </div>
  );
}