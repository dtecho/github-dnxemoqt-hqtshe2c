import { NavLink } from "@remix-run/react";
import { 
  FiHome, 
  FiMap, 
  FiMessageSquare, 
  FiDatabase, 
  FiCode, 
  FiSettings, 
  FiUser,
  FiInfo,
  FiTerminal
} from "react-icons/fi";

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  return (
    <div className={`h-full bg-card text-card-foreground border-r border-border transition-all ${
      collapsed ? "w-16" : "w-64"
    }`}>
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <h1 className="text-xl font-bold text-primary">Deep Tree Echo</h1>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            <span className="text-2xl font-bold text-primary">DTE</span>
          </div>
        )}
      </div>
      
      <nav className="p-2">
        <ul className="space-y-1">
          <NavItem to="/" label="Home" icon={<FiHome />} collapsed={collapsed} />
          <NavItem to="/map" label="Echo Map" icon={<FiMap />} collapsed={collapsed} />
          <NavItem to="/chat" label="AI Chat" icon={<FiMessageSquare />} collapsed={collapsed} />
          <NavItem to="/memory" label="Memory System" icon={<FiDatabase />} collapsed={collapsed} />
          <NavItem to="/editor" label="Code Editor" icon={<FiCode />} collapsed={collapsed} />
          <NavItem to="/terminal" label="Terminal" icon={<FiTerminal />} collapsed={collapsed} />
        </ul>
        
        <div className="pt-4 mt-4 border-t border-border">
          <ul className="space-y-1">
            <NavItem to="/login" label="Account" icon={<FiUser />} collapsed={collapsed} />
            <NavItem to="/settings" label="Settings" icon={<FiSettings />} collapsed={collapsed} />
            <NavItem to="/about" label="About" icon={<FiInfo />} collapsed={collapsed} />
          </ul>
        </div>
      </nav>
      
      <div className="absolute bottom-0 w-full p-4 border-t border-border">
        <div className="text-xs opacity-70 text-center">
          {!collapsed && "Deep Tree Echo • v1.0.0"}
          {collapsed && "v1.0"}
        </div>
      </div>
    </div>
  );
}

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ReactNode;
  collapsed?: boolean;
}

function NavItem({ to, label, icon, collapsed = false }: NavItemProps) {
  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) => 
          `flex items-center p-2 rounded-md transition-colors ${
            isActive 
              ? "bg-primary/20 text-primary" 
              : "hover:bg-primary/10"
          }`
        }
      >
        <span className="text-lg">{icon}</span>
        {!collapsed && <span className="ml-3">{label}</span>}
      </NavLink>
    </li>
  );
}