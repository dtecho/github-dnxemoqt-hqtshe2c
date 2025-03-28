import { useState } from "react";
import { FiMenu, FiX } from "react-icons/fi";
import Sidebar from "./Sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>
      
      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-50 bg-black/50 transition-opacity md:hidden ${
        mobileSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`} onClick={() => setMobileSidebarOpen(false)}>
        <div 
          className={`absolute top-0 left-0 bottom-0 w-64 transition-transform ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <Sidebar />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile Header */}
        <header className="flex items-center justify-between p-4 border-b border-border md:hidden">
          <button 
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-primary/10"
          >
            <FiMenu size={24} />
          </button>
          <h1 className="text-xl font-bold text-primary">Deep Tree Echo</h1>
          <div className="w-10"></div> {/* Spacer for centering title */}
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}