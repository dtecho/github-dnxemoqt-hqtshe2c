import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";

const MermaidDiagram = ({
  chart,
  className = "",
  config = {},
}: {
  chart: string;
  className?: string;
  config?: Record<string, any>;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Initialize mermaid with default config
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
      fontFamily: "monospace",
      ...config,
    });
  }, [config]);

  useEffect(() => {
    const renderDiagram = async () => {
      if (!chart) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Generate a unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
        
        // Render the diagram
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
      } catch (err) {
        console.error("Error rendering mermaid diagram:", err);
        setError(err instanceof Error ? err.message : "Failed to render diagram");
      } finally {
        setIsLoading(false);
      }
    };

    renderDiagram();
  }, [chart]);

  return (
    <div className={`mermaid-diagram ${className}`} ref={containerRef}>
      {isLoading && (
        <div className="flex justify-center items-center p-8 text-primary">
          <div className="animate-spin mr-2">↻</div>
          <span>Rendering diagram...</span>
        </div>
      )}
      
      {error && (
        <div className="bg-destructive/20 text-destructive p-4 rounded-md">
          <h3 className="font-medium mb-2">Error rendering diagram</h3>
          <pre className="text-sm overflow-auto p-2 bg-card/50 rounded">{error}</pre>
          <div className="mt-2 text-sm">
            Check your Mermaid syntax and try again.
          </div>
        </div>
      )}
      
      {!isLoading && !error && (
        <div 
          className="mermaid-content overflow-auto bg-card/30 p-4 rounded-md"
          dangerouslySetInnerHTML={{ __html: svg }} 
        />
      )}
    </div>
  );
};

export default MermaidDiagram;