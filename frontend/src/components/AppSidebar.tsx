import {
  LayoutDashboard,
  BrainCircuit,
  Settings,
  History,
  TrendingUp,
  Activity,
  LogOut,
  Target,
  Monitor
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

const mainMenu = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, color: "text-blue-400" },
  { title: "Live View", url: "/live", icon: Monitor, color: "text-emerald-400" },
  { title: "Advanced Mode", url: "/advanced", icon: BrainCircuit, color: "text-purple-400" },
];

const bottomMenu = [
  // Future settings
];

interface AppSidebarProps {
  onClose?: () => void;
}

import { useUI } from "@/store/uiStore";

export function AppSidebar({ onClose }: AppSidebarProps) {
  const location = useLocation();
  const { isSidebarOpen } = useUI();

  return (
    <aside className={`flex h-screen flex-col border-r border-border/40 bg-sidebar/95 backdrop-blur-xl shadow-2xl transition-all duration-300 ${isSidebarOpen ? 'w-[260px]' : 'w-0 lg:w-[80px]'}`}>
      {/* Logo Area */}
      <div className={`flex h-20 items-center gap-3 px-6 border-b border-border/30 overflow-hidden ${!isSidebarOpen && 'lg:px-4'}`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 shadow-inner">
          <span className="text-xl font-black text-primary text-center">B</span>
        </div>
        {isSidebarOpen && (
          <div className="flex flex-col whitespace-nowrap">
            <h1 className="text-sm font-black tracking-wider text-foreground uppercase">Bac Bo Pro</h1>
            <span className="text-[10px] font-bold text-primary tracking-widest uppercase opacity-80">Cataloguer</span>
          </div>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2 custom-scrollbar overflow-x-hidden">
        {isSidebarOpen && <div className="mb-2 px-3 text-[10px] font-bold tracking-widest text-muted-foreground uppercase whitespace-nowrap">Principal</div>}
        {mainMenu.map((item) => {
          const isActive = item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url);
          return (
            <NavLink
              key={item.title}
              to={item.url}
              onClick={onClose}
              end={item.url === "/"}
              className={`group flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 relative overflow-hidden ${
                isActive ? "bg-white/10 text-white shadow-md border border-white/10" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              } ${!isSidebarOpen && 'lg:px-0 lg:justify-center'}`}
              activeClassName=""
            >
              {isActive && isSidebarOpen && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full shadow-[0_0_10px_var(--primary)]" />}
              <item.icon className={`h-[18px] w-[18px] shrink-0 transition-all duration-300 ${isActive ? item.color : "opacity-60 group-hover:opacity-100 group-hover:scale-110"}`} />
              {isSidebarOpen && <span className="tracking-wide whitespace-nowrap">{item.title}</span>}
            </NavLink>
          );
        })}

        <div className="mt-8 mb-2 px-3 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Sistema</div>
        {bottomMenu.map((item) => {
          const isActive = location.pathname.startsWith(item.url);
          return (
            <NavLink
              key={item.title}
              to={item.url}
              onClick={onClose}
              className={`group flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 ${
                isActive ? "bg-white/10 text-white" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }`}
              activeClassName=""
            >
              <item.icon className={`h-[18px] w-[18px] transition-all duration-300 ${isActive ? item.color : "opacity-60 group-hover:opacity-100"}`} />
              <span className="tracking-wide">{item.title}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="p-4 border-t border-border/30 bg-black/20">
        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-400 group border border-transparent hover:border-red-500/20">
          <LogOut className="h-[18px] w-[18px] opacity-60 group-hover:opacity-100" />
          <span className="tracking-wide">Desconectar</span>
        </button>
      </div>
    </aside>
  );
}
