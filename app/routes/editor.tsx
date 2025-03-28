import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";
import { FiCode, FiSave, FiDownload, FiCopy, FiSettings } from "react-icons/fi";
import MonacoEditor from "~/components/MonacoEditor";

export async function loader() {
  return json({
    title: "Code Editor",
    editorType: "monaco"
  });
}

export default function EditorPage() {
  const { title, editorType } = useLoaderData<typeof loader>();
  const [code, setCode] = useState("// Start coding here\n\nfunction hello() {\n  console.log('Hello from Deep Tree Echo!');\n}\n\nhello();");
  const [language, setLanguage] = useState("typescript");
  const [theme, setTheme] = useState("vs-dark");
  
  return (
    <div className="h-full flex flex-col">
      <header className="bg-card text-card-foreground px-6 py-3 border-b border-border flex justify-between items-center">
        <div className="flex items-center">
          <FiCode className="mr-2" />
          <h1 className="font-medium">{title}</h1>
        </div>
        <div className="flex space-x-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-card/50 border border-border rounded px-2 py-1 text-sm"
          >
            <option value="typescript">TypeScript</option>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="json">JSON</option>
          </select>
          <button className="p-2 hover:bg-primary/20 rounded-md" title="Copy code">
            <FiCopy size={18} />
          </button>
          <button className="p-2 hover:bg-primary/20 rounded-md" title="Save code">
            <FiSave size={18} />
          </button>
          <button className="p-2 hover:bg-primary/20 rounded-md" title="Download file">
            <FiDownload size={18} />
          </button>
          <button className="p-2 hover:bg-primary/20 rounded-md" title="Editor settings">
            <FiSettings size={18} />
          </button>
        </div>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <MonacoEditor
          value={code}
          onChange={setCode}
          language={language}
          theme={theme}
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true
          }}
        />
      </div>
      
      <footer className="bg-card text-card-foreground px-6 py-2 border-t border-border">
        <div className="flex justify-between items-center">
          <div className="text-xs opacity-70">
            Editor Type: {editorType}
          </div>
          <div className="text-xs opacity-70">
            Language: {language}
          </div>
        </div>
      </footer>
    </div>
  );
}