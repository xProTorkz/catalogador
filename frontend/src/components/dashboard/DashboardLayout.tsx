import { ReactNode } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Menu, X } from "lucide-react";
import { useUI } from "@/store/uiStore";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isSidebarOpen, setSidebarOpen } = useUI();

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-sidebar border-b border-border/50 flex items-center justify-between px-4 z-50 backdrop-blur-md bg-sidebar/80">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
            <span className="text-primary font-bold text-lg">B</span>
          </div>
          <span className="font-bold tracking-tight text-foreground uppercase text-xs tracking-widest">Bac Bo Pro</span>
        </div>
        <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-foreground/70 hover:text-foreground transition-colors">
          {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar - fixed and responsive */}
      <div className={`fixed inset-y-0 left-0 z-40 transform transition-all duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <AppSidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className={`flex-1 w-full pt-16 lg:pt-0 transition-all duration-300 min-h-screen flex flex-col ${isSidebarOpen ? 'lg:pl-[260px]' : 'lg:pl-[80px]'}`}>
        <div className="p-4 sm:p-6 lg:p-10 flex-1 flex flex-col max-w-[1800px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
