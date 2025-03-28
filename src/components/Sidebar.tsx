import { useState } from 'react';
import { FiSun, FiMoon, FiSettings, FiInfo } from 'react-icons/fi';
import { useAppStore } from '../store/appStore';

const Sidebar = () => {
  const { theme, setTheme } = useAppStore();
  const [showSettings, setShowSettings] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="h-full w-full flex flex-col bg-card border-r border-border">
      <div className="p-4 border-b border-border">
        <h2 className="text-xl font-bold text-primary">Deep Tree Echo</h2>
        <p className="text-sm opacity-70">Personal Workspace</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider opacity-70">Settings</h3>
            <div className="space-y-1">
              <button 
                onClick={toggleTheme}
                className="w-full flex items-center p-2 rounded-md hover:bg-primary/20"
              >
                {theme === 'dark' ? <FiSun className="mr-2" /> : <FiMoon className="mr-2" />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className="w-full flex items-center p-2 rounded-md hover:bg-primary/20"
              >
                <FiSettings className="mr-2" />
                <span>Preferences</span>
              </button>
            </div>
          </div>

          {showSettings && (
            <div className="space-y-2 p-2 bg-background rounded-md">
              <h4 className="text-sm font-medium">Display Settings</h4>
              <div className="space-y-1">
                <label className="flex items-center text-sm">
                  <input 
                    type="checkbox" 
                    className="mr-2" 
                    defaultChecked
                  />
                  Show line numbers
                </label>
                <label className="flex items-center text-sm">
                  <input 
                    type="checkbox" 
                    className="mr-2" 
                    defaultChecked
                  />
                  Enable syntax highlighting
                </label>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider opacity-70">Information</h3>
            <button className="w-full flex items-center p-2 rounded-md hover:bg-primary/20">
              <FiInfo className="mr-2" />
              <span>About Deep Tree Echo</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border">
        <div className="text-xs opacity-70 text-center">
          Deep Tree Echo • v0.1.0
        </div>
      </div>
    </div>
  );
};

export default Sidebar;