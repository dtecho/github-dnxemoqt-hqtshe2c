import sdk from '@stackblitz/sdk';
import { FileData } from '../store/appStore';

export interface StackBlitzProject {
  title: string;
  description: string;
  files: Record<string, string>;
  dependencies: Record<string, string>;
  settings?: {
    template?: string;
  };
}

export const extractProjectDependencies = (): Record<string, string> => {
  try {
    // Try to load package.json to extract dependencies
    // In a real app, this would be more sophisticated
    return {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "monaco-editor": "^0.39.0",
      "@uiw/react-split": "^5.9.1",
      "tailwindcss": "^3.3.5",
      "react-icons": "^4.12.0"
    };
  } catch (error) {
    console.error('Failed to extract dependencies:', error);
    return {};
  }
};

export const prepareFilesForStackBlitz = (files: FileData[]): Record<string, string> => {
  const result: Record<string, string> = {};
  
  // Convert our file structure to StackBlitz format
  files.forEach(file => {
    if (file.type === 'file') {
      // Remove leading slash if present
      const path = file.path.startsWith('/') ? file.path.substring(1) : file.path;
      result[path] = file.content;
    }
  });
  
  // Add essential files if they don't exist
  if (!result['index.html']) {
    result['index.html'] = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Deep Tree Echo Project</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./src/main.tsx"></script>
  </body>
</html>
    `;
  }
  
  // Add package.json if it doesn't exist
  if (!result['package.json']) {
    const dependencies = extractProjectDependencies();
    result['package.json'] = JSON.stringify({
      name: "deep-tree-echo-project",
      private: true,
      version: "0.1.0",
      type: "module",
      scripts: {
        "dev": "vite",
        "build": "tsc && vite build",
        "preview": "vite preview"
      },
      dependencies
    }, null, 2);
  }
  
  return result;
};

export const openInStackBlitz = async (files: FileData[], options?: {
  newWindow?: boolean;
  openFile?: string;
  title?: string;
  description?: string;
}): Promise<any> => {
  const projectFiles = prepareFilesForStackBlitz(files);
  const dependencies = extractProjectDependencies();
  
  try {
    return await sdk.openProject({
      title: options?.title || "Deep Tree Echo Project",
      description: options?.description || "Created with Monaco Editor",
      template: "node",
      files: projectFiles,
      dependencies
    }, {
      newWindow: options?.newWindow ?? true,
      openFile: options?.openFile
    });
  } catch (error) {
    console.error('Failed to open project in StackBlitz:', error);
    throw error;
  }
};

export const embedStackBlitzProject = async (
  node: HTMLElement,
  files: FileData[],
  options?: {
    openFile?: string;
    hideNavigation?: boolean;
    hideExplorer?: boolean;
    height?: string | number;
    width?: string | number;
    title?: string;
    description?: string;
  }
): Promise<any> => {
  const projectFiles = prepareFilesForStackBlitz(files);
  const dependencies = extractProjectDependencies();
  
  try {
    return await sdk.embedProject(
      node,
      {
        title: options?.title || "Deep Tree Echo Project",
        description: options?.description || "Created with Monaco Editor",
        template: "node",
        files: projectFiles,
        dependencies
      },
      {
        openFile: options?.openFile,
        hideNavigation: options?.hideNavigation,
        hideExplorer: options?.hideExplorer,
        height: options?.height || '100%',
        width: options?.width || '100%'
      }
    );
  } catch (error) {
    console.error('Failed to embed StackBlitz project:', error);
    throw error;
  }
};