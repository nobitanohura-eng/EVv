import { NavLink, Outlet, useLocation } from "react-router-dom";
import { MessageSquare, Users, User, ScrollText, Settings, LogIn, Power, Brain, Menu, X, Cpu } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DashboardLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { name: "Home", path: "/", icon: Power },
    { name: "Contacts", path: "/contacts", icon: Users },
    { name: "Persona", path: "/persona", icon: User },
    { name: "Memory", path: "/memory", icon: Brain },
    { name: "Logs", path: "/logs", icon: ScrollText },
    { name: "Settings", path: "/settings", icon: Settings },
    { name: "Telegram Module", path: "/login", icon: LogIn },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-transparent text-cyan-50">
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
      </div>
      <div className="scanline"></div>

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between glass-panel border-b-0 p-4 absolute top-0 w-full z-20">
        <div className="flex items-center gap-2">
          <Cpu className="w-6 h-6 text-cyan-400" />
          <h1 className="text-lg font-semibold tracking-widest uppercase holo-text">E.V.</h1>
        </div>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 -mr-2 text-cyan-400">
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-30 md:hidden" 
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={cn(
        "fixed md:relative z-40 w-64 h-full glass-panel border-t-0 border-b-0 border-l-0 border-r-cyan-500/30 flex flex-col transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 flex items-center gap-4 border-b border-cyan-500/20">
          <div className="relative">
            <Cpu className="w-7 h-7 text-cyan-400 relative z-10" />
            <div className="absolute inset-0 bg-cyan-400/30 blur-md rounded-full animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold tracking-widest holo-text uppercase">E.V.</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="text-xs uppercase tracking-widest text-cyan-500/70 mb-4 px-2 font-semibold">System Modules</div>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 border border-transparent",
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    : "text-cyan-100/70 hover:bg-cyan-950/40 hover:text-cyan-300 hover:border-cyan-500/20"
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive ? "text-cyan-400" : "text-cyan-600")} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-cyan-500/20">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-cyan-950/40 border border-cyan-900/50">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse" />
            <span className="text-xs font-mono text-cyan-300/80">SYSTEM ONLINE</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full pt-[64px] md:pt-0 relative z-10">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
