import { useEffect, useRef, useState } from 'react';
import sdk from '@stackblitz/sdk';
import { FiExternalLink, FiPlay } from 'react-icons/fi';

interface StackBlitzIntegrationProps {
  projectId?: string;
  files?: Record<string, string>;
  openFile?: string;
  hideNavigation?: boolean;
  hideExplorer?: boolean;
  height?: string | number;
  width?: string | number;
  className?: string;
  title?: string;
  description?: string;
  dependencies?: Record<string, string>;
}

export const StackBlitzIntegration: React.FC<StackBlitzIntegrationProps> = ({
  projectId,
  files,
  openFile,
  hideNavigation = false,
  hideExplorer = false,
  height = '100%',
  width = '100%',
  className = '',
  title = 'Deep Tree Echo Project',
  description = 'Created with Monaco Editor and StackBlitz',
  dependencies = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [embeddedProject, setEmbeddedProject] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Create a new project or embed an existing one
  useEffect(() => {
    const embedProject = async () => {
      if (!containerRef.current) return;
      
      try {
        setIsLoading(true);
        
        let project;
        
        // If projectId is provided, embed that project
        if (projectId) {
          project = await sdk.embedProjectId(
            containerRef.current,
            projectId,
            {
              openFile,
              hideNavigation,
              hideExplorer,
              height,
              width,
            }
          );
        } 
        // Otherwise create a new project from files
        else if (files) {
          project = await sdk.embedProject(
            containerRef.current,
            {
              title,
              description,
              template: 'node',
              files,
              dependencies
            },
            {
              openFile,
              hideNavigation,
              hideExplorer,
              height,
              width,
            }
          );
        }
        
        setEmbeddedProject(project);
        setError(null);
      } catch (err) {
        console.error('StackBlitz embedding failed:', err);
        setError('Failed to load StackBlitz project. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    embedProject();
  }, [projectId, openFile, hideNavigation, hideExplorer]);

  // Function to create a new project from current files
  const createProject = async (currentFiles: Record<string, string>) => {
    if (!currentFiles) return;
    
    try {
      const project = await sdk.openProject(
        {
          title,
          description,
          template: 'node',
          files: currentFiles,
          dependencies
        },
        {
          newWindow: true
        }
      );
      
      return project;
    } catch (err) {
      console.error('Failed to create StackBlitz project:', err);
      setError('Failed to create project. Please try again.');
      return null;
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {error && (
        <div className="bg-destructive/20 text-destructive p-4 text-center">
          {error}
        </div>
      )}
      
      {files && !projectId && (
        <div className="bg-card text-card-foreground px-4 py-2 flex justify-between items-center">
          <span>StackBlitz Integration</span>
          <div className="flex space-x-2">
            <button
              onClick={() => createProject(files)}
              className="flex items-center space-x-1 bg-primary text-white px-3 py-1 rounded-md hover:bg-primary/90"
              title="Open in StackBlitz"
            >
              <FiExternalLink size={16} />
              <span>Open in StackBlitz</span>
            </button>
          </div>
        </div>
      )}
      
      <div 
        ref={containerRef} 
        className="flex-1 relative"
        style={{ height, width }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <div className="text-primary animate-pulse">Loading StackBlitz...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StackBlitzIntegration;